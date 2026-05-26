"""
Claude agentic brain for SalvaCão.

Runs a tool-use loop until Claude reaches end_turn, then returns the
final text and the updated conversation state.
"""
from __future__ import annotations

import logging
import os
from typing import Any

import anthropic

from .prompts import SYSTEM_PROMPT
from .tools import TOOL_DEFINITIONS, ConvState, execute_tool

logger = logging.getLogger(__name__)

MAX_TURNS = 12
HISTORY_CAP = 30  # keep last N messages to bound DB storage + context
MODEL = "claude-sonnet-4-6"


def _get_client() -> anthropic.AsyncAnthropic:
    return anthropic.AsyncAnthropic(api_key=os.environ["ANTHROPIC_API_KEY"])


async def run(
    state: ConvState,
    new_text: str,
    web_app_url: str,
    internal_token: str,
    supabase_client: Any = None,
) -> tuple[str, ConvState]:
    """
    Process one user message through the Claude tool-use loop.

    Returns (reply_text, updated_state).
    The reply_text is what gets sent back to the Telegram user.
    """
    client = _get_client()

    # Build message list from persisted history + new user turn
    messages: list[dict] = list(state.history)

    # Inject staged photo info into the user message if photos are waiting
    user_text = new_text
    if state.staged_photos and state.flow in ("reporting", "found", "idle"):
        photo_paths = state.staged_photos
        user_text = (
            f"{new_text}\n"
            f"[{len(photo_paths)} photo(s) already uploaded to staging: {photo_paths}. "
            f"Use these when creating the case.]"
        )

    messages.append({"role": "user", "content": user_text})

    final_reply = ""
    tool_calls_this_turn: list[tuple[str, dict]] = []

    for turn in range(MAX_TURNS):
        logger.debug("Brain turn %d/%d, messages=%d", turn + 1, MAX_TURNS, len(messages))

        response = await client.messages.create(
            model=MODEL,
            max_tokens=2048,
            system=SYSTEM_PROMPT,
            messages=messages,
            tools=TOOL_DEFINITIONS,  # type: ignore[arg-type]
        )

        # Extract text and tool_use blocks
        text_blocks = [b for b in response.content if b.type == "text"]
        tool_use_blocks = [b for b in response.content if b.type == "tool_use"]

        # Append assistant turn to history (must serialize content blocks)
        assistant_content = [_serialize_block(b) for b in response.content]
        messages.append({"role": "assistant", "content": assistant_content})

        if text_blocks:
            final_reply = "\n".join(b.text for b in text_blocks)

        if response.stop_reason == "end_turn":
            break

        if response.stop_reason == "tool_use" and tool_use_blocks:
            tool_results = []
            for block in tool_use_blocks:
                tool_name = block.name
                tool_input = block.input  # type: ignore[union-attr]
                tool_calls_this_turn.append((tool_name, tool_input))

                logger.info("Tool call: %s(%s)", tool_name, list(tool_input.keys()))
                result_str, updated_state = await execute_tool(
                    name=tool_name,
                    inputs=tool_input,
                    state=state,
                    web_app_url=web_app_url,
                    internal_token=internal_token,
                    supabase_client=supabase_client,
                )
                if updated_state is not None:
                    state = updated_state

                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": result_str,
                })

            messages.append({"role": "user", "content": tool_results})
        else:
            # Unexpected stop reason
            break

    # Persist trimmed history to state
    state.history = messages[-HISTORY_CAP:]

    # Determine updated flow from draft
    if state.flow == "idle" and state.draft.get("type"):
        state.flow = "reporting" if state.draft["type"] == "perdido" else "found"

    return final_reply, state


def _serialize_block(block: Any) -> dict:
    """Convert an Anthropic content block to a JSON-serializable dict."""
    if block.type == "text":
        return {"type": "text", "text": block.text}
    elif block.type == "tool_use":
        return {
            "type": "tool_use",
            "id": block.id,
            "name": block.name,
            "input": block.input,
        }
    else:
        return {"type": block.type}
