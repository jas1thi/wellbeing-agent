"""REST API for the journal frontend — runs standalone or mounts into the ADK app."""

import os
import re
from datetime import datetime
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse
from pydantic import BaseModel

from .tools.journal_store import search_journals as _search_journals

router = APIRouter(prefix="/api")

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _journal_dir() -> Path:
    d = Path(os.environ.get("JOURNAL_DIR", "./journals"))
    d.mkdir(parents=True, exist_ok=True)
    return d


def _parse_journal(file: Path) -> dict:
    """Parse a markdown journal file into structured data."""
    content = file.read_text()
    slug = file.stem
    date_match = re.match(r"^(\d{4}-\d{2}-\d{2})", slug)
    date = date_match.group(1) if date_match else slug

    # Title
    title_match = re.search(r"^#\s+(.+)$", content, re.MULTILINE)
    title = title_match.group(1) if title_match else date

    # Mood
    mood_match = (
        re.search(r"\*\*Mood:?\*\*:?\s*(.+)", content, re.IGNORECASE)
        or re.search(r"##\s*Mood\n(.+)", content, re.IGNORECASE)
        or re.search(r"##\s*How I'm Feeling\n(.+)", content, re.IGNORECASE)
    )
    mood = mood_match.group(1).strip() if mood_match else None
    # Truncate long mood descriptions to first sentence
    if mood and len(mood) > 60:
        first_sentence = re.match(r"^[^.!]+[.!]", mood)
        mood = first_sentence.group(0).strip() if first_sentence else mood[:60] + "..."

    # Thumbnail — first image reference
    img_match = re.search(r"!\[.*?\]\(([^)]+)\)", content)
    thumbnail = img_match.group(1).lstrip("./") if img_match else None

    # Highlights
    highlights: list[str] = []
    in_highlights = False
    for line in content.splitlines():
        if re.match(r"\*\*Highlights?\*\*", line, re.IGNORECASE) or re.match(
            r"##\s*Highlights?", line, re.IGNORECASE
        ):
            in_highlights = True
            continue
        if in_highlights:
            if line.startswith("- ") or line.startswith("* "):
                highlights.append(line.lstrip("-* ").strip())
            elif line.startswith("**") or line.startswith("##") or line.startswith("---"):
                in_highlights = False

    # Reflections
    refl_match = re.search(
        r"(?:\*\*Reflections?\*\*|##\s*Reflections?)\s*\n([\s\S]*?)(?=\n---|\n\*\*|\n##|\Z)",
        content,
        re.IGNORECASE,
    )
    reflections = refl_match.group(1).strip() if refl_match else None

    return {
        "slug": slug,
        "date": date,
        "title": title,
        "mood": mood,
        "thumbnail": thumbnail,
        "highlights": highlights,
        "reflections": reflections,
        "content": content,
    }


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class JournalSummary(BaseModel):
    slug: str
    date: str
    title: str
    mood: Optional[str] = None
    thumbnail: Optional[str] = None
    highlights: list[str] = []


class JournalDetail(JournalSummary):
    content: str
    reflections: Optional[str] = None


class MoodStats(BaseModel):
    total_entries: int
    entries_this_month: int
    current_streak: int
    longest_streak: int
    mood_distribution: dict[str, int]
    recent_moods: list[dict]


class SearchResult(BaseModel):
    results: str


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get("/journals", response_model=list[JournalSummary])
def list_journals():
    """List all journal entries, newest first."""
    journal_dir = _journal_dir()
    md_files = sorted(journal_dir.glob("*.md"), reverse=True)
    journals = []
    for f in md_files:
        if f.name == ".gitkeep":
            continue
        parsed = _parse_journal(f)
        journals.append(JournalSummary(**parsed))
    return journals


@router.get("/journals/{slug}", response_model=JournalDetail)
def get_journal(slug: str):
    """Get a single journal entry by slug."""
    journal_dir = _journal_dir()
    file = journal_dir / f"{slug}.md"
    if not file.exists():
        raise HTTPException(status_code=404, detail="Journal entry not found")
    return JournalDetail(**_parse_journal(file))


@router.get("/stats", response_model=MoodStats)
def get_stats():
    """Get mood analytics and streak data."""
    journal_dir = _journal_dir()
    md_files = sorted(journal_dir.glob("*.md"))
    md_files = [f for f in md_files if f.name != ".gitkeep"]

    now = datetime.now()
    current_month = now.strftime("%Y-%m")

    entries = []
    for f in md_files:
        entries.append(_parse_journal(f))

    # Sort by date descending for streak calc
    entries.sort(key=lambda e: e["date"], reverse=True)

    total = len(entries)
    this_month = sum(1 for e in entries if e["date"].startswith(current_month))

    # Mood distribution
    mood_dist: dict[str, int] = {}
    for e in entries:
        if e["mood"]:
            # Normalize mood to a simple category
            mood_lower = e["mood"].lower()
            if any(w in mood_lower for w in ["great", "amazing", "fantastic", "excellent"]):
                key = "Great"
            elif any(w in mood_lower for w in ["good", "positive", "happy"]):
                key = "Good"
            elif any(w in mood_lower for w in ["okay", "ok", "alright", "fine", "neutral"]):
                key = "Okay"
            elif any(w in mood_lower for w in ["bad", "sad", "low", "down", "rough"]):
                key = "Low"
            elif any(w in mood_lower for w in ["anxious", "nervous", "stressed"]):
                key = "Anxious"
            else:
                key = "Mixed"
            mood_dist[key] = mood_dist.get(key, 0) + 1

    # Recent moods (last 14 entries)
    recent_moods = [
        {"date": e["date"], "mood": e["mood"], "slug": e["slug"]}
        for e in entries[:14]
        if e["mood"]
    ]

    # Streak calculation (consecutive days with entries)
    dates = set()
    for e in entries:
        try:
            dates.add(datetime.strptime(e["date"], "%Y-%m-%d").date())
        except ValueError:
            pass

    current_streak = 0
    longest_streak = 0
    if dates:
        today = now.date()
        # Current streak: count back from today
        d = today
        while d in dates:
            current_streak += 1
            d = d.replace(day=d.day - 1) if d.day > 1 else d.replace(
                month=d.month - 1 if d.month > 1 else 12,
                year=d.year if d.month > 1 else d.year - 1,
                day=28,
            )

        # If no entry today, check from yesterday
        if current_streak == 0:
            from datetime import timedelta
            d = today - timedelta(days=1)
            while d in dates:
                current_streak += 1
                d -= timedelta(days=1)

        # Longest streak
        sorted_dates = sorted(dates)
        streak = 1
        for i in range(1, len(sorted_dates)):
            if (sorted_dates[i] - sorted_dates[i - 1]).days == 1:
                streak += 1
            else:
                longest_streak = max(longest_streak, streak)
                streak = 1
            longest_streak = max(longest_streak, streak)

    return MoodStats(
        total_entries=total,
        entries_this_month=this_month,
        current_streak=current_streak,
        longest_streak=longest_streak,
        mood_distribution=mood_dist,
        recent_moods=recent_moods,
    )


@router.get("/search")
def search(
    q: str = Query(..., description="Search query"),
    top_k: int = Query(5, ge=1, le=20),
):
    """Semantic search across journal entries."""
    return {"results": _search_journals(q, top_k)}


@router.get("/calendar")
def calendar_data(
    year: int = Query(None),
    month: int = Query(None),
):
    """Get journal entries grouped by date for calendar view."""
    journal_dir = _journal_dir()
    md_files = sorted(journal_dir.glob("*.md"))

    now = datetime.now()
    target_year = year or now.year
    target_month = month or now.month
    prefix = f"{target_year}-{target_month:02d}"

    entries = []
    for f in md_files:
        if f.name == ".gitkeep":
            continue
        parsed = _parse_journal(f)
        if parsed["date"].startswith(prefix):
            entries.append({
                "date": parsed["date"],
                "slug": parsed["slug"],
                "title": parsed["title"],
                "mood": parsed["mood"],
            })

    return {"year": target_year, "month": target_month, "entries": entries}
