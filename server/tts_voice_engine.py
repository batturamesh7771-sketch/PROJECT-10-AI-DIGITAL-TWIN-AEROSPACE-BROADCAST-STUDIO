"""
tts_voice_engine.py - Indian English Vocal Timbre Synthesizer
Generates spoken responses with Nikhil's natural Indian accent and calm cadence.
Supports local neural synthesis (Edge-TTS) and ElevenLabs cloning.
"""

import os
import asyncio
import io
import re
import logging
from typing import Tuple, List, Dict, Any

logger = logging.getLogger("TTSEngine")
logging.basicConfig(level=logging.INFO)


class VoiceCloningEngine:
    def __init__(self):
        self.elevenlabs_key = os.environ.get("ELEVENLABS_API_KEY", "")
        self.cloned_voice_id = os.environ.get("ELEVENLABS_VOICE_ID", "")
        # Authentic Indian English neural voices:
        # en-IN-PrabhatNeural (Natural Indian English Male, calm & authoritative)
        # en-IN-NeerjaNeural (Indian English Female alternate)
        self.default_neural_voice = os.environ.get("DEFAULT_NEURAL_VOICE", "en-IN-PrabhatNeural")

    async def synthesize(self, text: str) -> bytes:
        """Synthesizes clean audio stream with authentic Indian English accent."""
        clean_text = self._prepare_text(text)
        if not clean_text:
            return b""

        # If ElevenLabs is configured with an active custom voice clone
        if self.elevenlabs_key and self.cloned_voice_id:
            try:
                logger.info("Synthesizing via ElevenLabs custom voice clone...")
                return await self._synthesize_elevenlabs(clean_text)
            except Exception as e:
                logger.warning(f"ElevenLabs synthesis failed: {e}. Falling back to neural Indian English voice.")

        # Primary neural Indian English engine via Edge-TTS
        return await self._synthesize_neural_indian(clean_text)

    async def synthesize_with_visemes(self, text: str) -> Tuple[bytes, List[Dict[str, Any]]]:
        """
        Synthesizes audio along with phoneme/viseme timing events for micro-precise
        talking-head lip synchronization.
        """
        clean_text = self._prepare_text(text)
        if not clean_text:
            return b"", []

        import edge_tts

        communicate = edge_tts.Communicate(
            clean_text,
            self.default_neural_voice,
            rate="+2%",
            pitch="+0Hz"
        )

        audio_buffer = io.BytesIO()
        viseme_events = []

        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_buffer.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                viseme_events.append({
                    "offset": chunk.get("offset", 0),
                    "duration": chunk.get("duration", 0),
                    "text": chunk.get("text", "")
                })

        return audio_buffer.getvalue(), viseme_events

    def _prepare_text(self, text: str) -> str:
        """Strips symbols and prepares smooth conversational Indian English flow."""
        text = text.replace("*", "").replace("#", "").replace("`", "")
        text = re.sub(r"\[.*?\]", "", text)
        text = re.sub(r"\(.*?\)", "", text)
        text = re.sub(r"\s+", " ", text).strip()
        return text

    async def _synthesize_neural_indian(self, text: str) -> bytes:
        import edge_tts

        communicate = edge_tts.Communicate(
            text,
            self.default_neural_voice,
            rate="+2%",
            pitch="+0Hz"
        )
        audio_buffer = io.BytesIO()
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_buffer.write(chunk["data"])
        return audio_buffer.getvalue()

    async def _synthesize_elevenlabs(self, text: str) -> bytes:
        import aiohttp

        url = f"https://api.elevenlabs.io/v1/text-to-speech/{self.cloned_voice_id}"
        headers = {
            "xi-api-key": self.elevenlabs_key,
            "Content-Type": "application/json"
        }
        payload = {
            "text": text,
            "model_id": "eleven_multilingual_v2",
            "voice_settings": {
                "stability": 0.65,
                "similarity_boost": 0.85,
                "style": 0.15,
                "use_speaker_boost": True
            }
        }
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=payload, headers=headers) as resp:
                if resp.status == 200:
                    return await resp.read()
                raise RuntimeError(f"ElevenLabs HTTP status {resp.status}")
