# backend/app/services/voice_service.py
import httpx
from app.core.config import settings

ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1/text-to-speech"

async def generate_voice_narration(text: str, voice_id: str = "21m00Tcm4TlvDq8ikWAM"):
    headers = {
        "xi-api-key": settings.ELEVENLABS_API_KEY,
        "Content-Type": "application/json"
    }
    data = {
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {"stability": 0.5, "similarity_boost": 0.8}
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(f"{ELEVENLABS_API_URL}/{voice_id}", json=data, headers=headers)
        return response.content # Returns raw MP3 binary