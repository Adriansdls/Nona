#!/usr/bin/env python3
"""
PostToolUse hook: fires after every Write/Edit tool call.
When a final_report_*.md is written to research/notes/, this script:
  1. Injects Obsidian-ready YAML frontmatter if missing
  2. Copies the report to research/reports/
  3. Ensures research/.obsidianignore exists
"""
import json
import re
import sys
import glob
import shutil
from datetime import date
from pathlib import Path


def main():
    event = json.load(sys.stdin)
    tool_name = event.get("tool_name", "")
    tool_input = event.get("tool_input", {})

    if tool_name not in ("Write", "Edit"):
        return

    file_path = tool_input.get("file_path", "")
    if not file_path:
        return

    p = Path(file_path)

    # Only act on research/notes/final_report_*.md
    if not (p.name.startswith("final_report_") and p.suffix == ".md"):
        return
    if "research/notes" not in file_path.replace("\\", "/"):
        return

    repo_root = Path(file_path)
    # Walk up to find research/ dir
    while repo_root.name != "research" and repo_root != repo_root.parent:
        repo_root = repo_root.parent
    if repo_root.name != "research":
        return
    repo_root = repo_root.parent  # one above research/

    vault_tag = p.stem.replace("final_report_", "")
    report_path = Path(file_path)

    if not report_path.exists():
        return

    content = report_path.read_text(encoding="utf-8")

    # --- Inject frontmatter if missing ---
    if not content.startswith("---"):
        # Extract title from first H1
        title_match = re.search(r"^#\s+(.+)$", content, re.MULTILINE)
        title = title_match.group(1).strip() if title_match else vault_tag.replace("-", " ").title()

        # Find run manifest for this vault_tag
        run_id = ""
        tier = "light"
        brief = ""
        manifests = glob.glob(str(repo_root / f"research/runs/{vault_tag}-*/run.json"))
        if manifests:
            latest = sorted(manifests)[-1]
            try:
                manifest = json.loads(Path(latest).read_text())
                run_id = manifest.get("run_id", "")
                tier = manifest.get("pipeline_tier") or "light"
            except Exception:
                pass

        # Find brief name from scaffold
        scaffolds = glob.glob(str(repo_root / f"research/runs/{vault_tag}-*/scaffold.md"))
        if scaffolds:
            scaffold_text = Path(sorted(scaffolds)[-1]).read_text(encoding="utf-8")
            m = re.search(r"brief[_\-]?file[:\s]+([^\s\n]+)", scaffold_text, re.IGNORECASE)
            if m:
                brief = m.group(1).strip()

        # Derive topic tags from vault_tag (split hyphens, drop generic words)
        skip = {"dog", "the", "a", "an", "and", "or", "of", "in", "for"}
        topic_tags = [w for w in vault_tag.split("-") if w not in skip and len(w) > 2][:4]

        frontmatter_lines = [
            "---",
            f'title: "{title}"',
            f"id: final_report_{vault_tag}",
            "type: final-report",
            f"vault_tag: {vault_tag}",
        ]
        if brief:
            frontmatter_lines.append(f"brief: {brief}")
        if run_id:
            frontmatter_lines.append(f"run_id: {run_id}")
        frontmatter_lines += [
            f"pipeline_tier: {tier}",
            f'created: "{date.today().isoformat()}"',
            "status: evergreen",
            "tags:",
            f"  - {vault_tag}",
            "  - final-report",
        ]
        for tag in topic_tags:
            if tag != vault_tag:
                frontmatter_lines.append(f"  - {tag}")
        frontmatter_lines.append("---")
        frontmatter_lines.append("")

        new_content = "\n".join(frontmatter_lines) + content
        report_path.write_text(new_content, encoding="utf-8")
        print(f"[research_postprocess] Injected frontmatter into {p.name}")

    # --- Copy to research/reports/ ---
    reports_dir = repo_root / "research" / "reports"
    reports_dir.mkdir(parents=True, exist_ok=True)
    dest = reports_dir / p.name
    shutil.copy2(str(report_path), str(dest))
    print(f"[research_postprocess] Copied to research/reports/{p.name}")

    # --- Ensure .obsidianignore exists ---
    obsidian_ignore = repo_root / "research" / ".obsidianignore"
    if not obsidian_ignore.exists():
        obsidian_ignore.write_text(".hyperresearch\nruns/*/temp/claims\n", encoding="utf-8")
        print("[research_postprocess] Created research/.obsidianignore")


if __name__ == "__main__":
    main()
