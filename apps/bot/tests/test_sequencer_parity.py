"""
WS1 parity: the bot sequencer (apps/bot/agent/pi_tools.py) is the SOURCE OF TRUTH
for guided step order. The web mirror (apps/web/src/lib/guided/sequencer.ts) must
carry identical step titles. This test reads the TS source and asserts every bot
title string appears in it verbatim — catches drift without needing a JS runtime.
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from agent.pi_tools import GUIDE_BUCKETS, STEP_TITLES, WAIT_STEPS, build_step_sequence

WEB_SEQUENCER = os.path.join(
    os.path.dirname(__file__), "..", "..", "web", "src", "lib", "guided", "sequencer.ts"
)


def test_wait_appended_only_for_hard():
    for bucket in GUIDE_BUCKETS:
        soft = build_step_sequence(bucket, False)
        hard = build_step_sequence(bucket, True)
        assert all(s["kind"] == "action" for s in soft)
        assert hard[-1]["kind"] == "wait"
        assert len(hard) == len(soft) + 1


def test_idx_sequential():
    for bucket in GUIDE_BUCKETS:
        for is_hard in (True, False):
            seq = build_step_sequence(bucket, is_hard)
            assert [s["idx"] for s in seq] == list(range(len(seq)))


def test_web_mirror_carries_all_titles():
    assert os.path.exists(WEB_SEQUENCER), f"web mirror missing at {WEB_SEQUENCER}"
    with open(WEB_SEQUENCER, encoding="utf-8") as f:
        web_src = f.read()
    missing = []
    for bucket in GUIDE_BUCKETS:
        for title in STEP_TITLES[bucket]:
            if title not in web_src:
                missing.append(f"action[{bucket}]: {title}")
        if WAIT_STEPS[bucket]["title"] not in web_src:
            missing.append(f"wait[{bucket}]: {WAIT_STEPS[bucket]['title']}")
    assert not missing, "web mirror diverged from bot source of truth:\n" + "\n".join(missing)
