"""Batch generate cartoon images for all journal entries that don't have one."""
import os
import re
import time
from pathlib import Path
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

JOURNAL_DIR = Path(os.environ.get("JOURNAL_DIR", "./journals"))
client = genai.Client()


def get_entries_without_images():
    entries = []
    for f in sorted(JOURNAL_DIR.glob("*.md")):
        if f.name == ".gitkeep":
            continue
        content = f.read_text()
        # Check if entry already references an image
        if re.search(r"!\[.*?\]\(.*?\)", content):
            print(f"  SKIP {f.stem} (already has image)")
            continue

        # Extract highlights for the prompt
        highlights = []
        for line in content.splitlines():
            if line.startswith("- ") or line.startswith("* "):
                highlights.append(line.lstrip("-* ").strip())

        # Extract mood
        mood_match = re.search(r"\*\*Mood:?\*\*:?\s*(.+)", content, re.IGNORECASE)
        mood = mood_match.group(1).strip() if mood_match else "neutral"

        summary = f"Mood: {mood}. " + ", ".join(highlights[:4])
        entries.append({"file": f, "slug": f.stem, "summary": summary})

    return entries


def generate_image(summary, slug):
    prompt = (
        f"A cute, colorful cartoon illustration of someone's day: {summary}. "
        "Style: warm, friendly, hand-drawn cartoon with soft colors and rounded shapes. "
        "Cozy everyday life vibes. No text or words in the image."
    )

    try:
        response = client.models.generate_content(
            model="gemini-3-pro-image-preview",
            contents=[prompt],
            config=types.GenerateContentConfig(
                response_modalities=["TEXT", "IMAGE"],
            ),
        )

        if not response.candidates or not response.candidates[0].content.parts:
            return None

        for part in response.candidates[0].content.parts:
            if part.inline_data is not None:
                image_path = JOURNAL_DIR / f"{slug}-cartoon.png"
                image_path.write_bytes(part.inline_data.data)
                return image_path.name

    except Exception as e:
        print(f"  ERROR generating for {slug}: {e}")
        return None

    return None


def append_image_to_entry(file_path, image_filename):
    content = file_path.read_text().rstrip()
    content += f"\n\n---\n![Day Cartoon]({image_filename})\n"
    file_path.write_text(content)


if __name__ == "__main__":
    print("Scanning for entries without images...")
    entries = get_entries_without_images()
    print(f"\nFound {len(entries)} entries needing images.\n")

    for i, entry in enumerate(entries):
        slug = entry["slug"]
        print(f"[{i+1}/{len(entries)}] Generating cartoon for {slug}...")
        image_file = generate_image(entry["summary"], slug)

        if image_file:
            append_image_to_entry(entry["file"], image_file)
            print(f"  OK -> {image_file}")
        else:
            print(f"  FAILED - no image generated")

        # Rate limit: small pause between requests
        if i < len(entries) - 1:
            time.sleep(2)

    print("\nDone!")
