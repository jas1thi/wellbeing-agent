import os
from datetime import datetime
from pathlib import Path

from google import genai
from google.genai import types


def generate_day_cartoon(summary: str) -> str:
    """Generate a cartoon-style image of the user's day highlights.

    Args:
        summary: A short description of the day's highlights and mood to illustrate.

    Returns:
        Confirmation message with the saved image path.
    """
    client = genai.Client()

    prompt = (
        f"A cute, colorful cartoon illustration of someone's day: {summary}. "
        "Style: warm, friendly, hand-drawn cartoon with soft colors. "
        "No text or words in the image."
    )

    response = client.models.generate_content(
        model="gemini-3-pro-image-preview",
        contents=[prompt],
        config=types.GenerateContentConfig(
            response_modalities=["TEXT", "IMAGE"],
        ),
    )

    if not response.candidates or not response.candidates[0].content.parts:
        return "Could not generate an image this time."

    # Save the image
    today = datetime.now().strftime("%Y-%m-%d")
    journal_dir = Path(os.environ.get("JOURNAL_DIR", "./journals"))
    journal_dir.mkdir(parents=True, exist_ok=True)
    image_path = journal_dir / f"{today}-cartoon.png"
    counter = 2
    while image_path.exists():
        image_path = journal_dir / f"{today}-cartoon-{counter}.png"
        counter += 1

    for part in response.candidates[0].content.parts:
        if part.inline_data is not None:
            image_path.write_bytes(part.inline_data.data)
            filename = image_path.name
            return f"Cartoon saved. Use this exact markdown to embed it in the journal:\n![Day Cartoon]({filename})"

    return "Could not generate an image this time."
