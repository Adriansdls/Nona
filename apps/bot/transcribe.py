"""Whisper transcription for Telegram voice messages."""
from __future__ import annotations

import os
import tempfile

from openai import AsyncOpenAI


async def transcribe_voice(audio_bytes: bytes, mime_type: str = "audio/ogg") -> str:
    """
    Transcribe voice audio using OpenAI Whisper.

    Telegram sends voice messages as .oga (Opus codec).
    Whisper handles this natively.
    """
    client = AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])

    # Determine file extension from mime type
    ext_map = {
        "audio/ogg": "oga",
        "audio/mpeg": "mp3",
        "audio/mp4": "m4a",
        "audio/wav": "wav",
    }
    ext = ext_map.get(mime_type, "oga")

    # Write to a temp file — Whisper needs a seekable file-like object with a name
    with tempfile.NamedTemporaryFile(suffix=f".{ext}", delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        with open(tmp_path, "rb") as f:
            transcription = await client.audio.transcriptions.create(
                model="whisper-1",
                file=f,
                response_format="text",
            )
        return str(transcription).strip()
    finally:
        os.unlink(tmp_path)
