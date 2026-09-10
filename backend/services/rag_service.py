from __future__ import annotations

from pathlib import Path

KNOWLEDGE_PATH = Path(__file__).resolve().parent.parent / "knowledge"


def answer_from_knowledge(category: str, question: str) -> tuple[str | None, str | None]:
    """Return a grounded answer and source filename, or no answer when unsupported."""
    source = KNOWLEDGE_PATH / f"{category.lower().replace(' ', '_')}.txt"
    if not source.exists():
        return None, None
    content = source.read_text(encoding="utf-8").strip()
    if not content:
        return None, None
    answer = content.split("\n\n")[0]
    return answer, source.name
