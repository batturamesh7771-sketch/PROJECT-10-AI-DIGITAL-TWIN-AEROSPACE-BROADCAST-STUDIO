"""
app.py - Main FastAPI Production Server for AI Digital Twin Studio
Manages Living Video Streams, WebSockets, REST endpoints, conversation state,
and broadcast archival recordings.
"""

import os
import time
import uuid
import json
import base64
import logging
from typing import Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, UploadFile, File
from fastapi.responses import HTMLResponse, JSONResponse, StreamingResponse, Response, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(BASE_DIR)
load_dotenv(os.path.join(ROOT_DIR, ".env"))

from brain_engine import AerospaceBrain
from tts_voice_engine import VoiceCloningEngine
from avatar_pipeline import avatar_streamer

logger = logging.getLogger("AppServer")
logging.basicConfig(level=logging.INFO)

app = FastAPI(title="AI Digital Twin Studio - Aerospace Broadcast")

# CORS middleware for local broadcast interfaces
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

brain = AerospaceBrain()
tts = VoiceCloningEngine()

CLIENT_DIR = os.path.join(ROOT_DIR, "client")
ASSETS_DIR = os.path.join(ROOT_DIR, "assets")
RECORDINGS_DIR = os.path.join(ROOT_DIR, "recordings")
AUDIO_CACHE_DIR = os.path.join(RECORDINGS_DIR, "audio_cache")
CONFIG_PATH = os.path.join(ROOT_DIR, "avatar_config.json")

os.makedirs(RECORDINGS_DIR, exist_ok=True)
os.makedirs(AUDIO_CACHE_DIR, exist_ok=True)

# Mount client directory for static resources
app.mount("/static", StaticFiles(directory=CLIENT_DIR), name="static")

active_websockets = set()


def get_current_avatar_config() -> dict:
    if os.path.exists(CONFIG_PATH):
        try:
            with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.warning(f"Failed to read avatar_config.json: {e}")
    return {
        "avatar_id": "nikhilnani391_clone",
        "avatar_name": "Nikhil's AI Clone",
        "role": "Podcast Guest",
        "media_assets": {
            "visual_source": "/api/video/avatar_video.mp4",
            "voice_clone_id": "en-IN-PrabhatNeural"
        },
        "llm_settings": {
            "model": "gemini-2.5-flash",
            "temperature": 0.7,
            "system_prompt": "You are the AI digital clone and podcast guest of Nikhil, who is the real-human host."
        },
        "interaction_settings": {
            "mode": "real_time_qa",
            "interruption_handling": True,
            "response_delay_ms": 500
        }
    }


@app.get("/", response_class=HTMLResponse)
async def get_index():
    index_path = os.path.join(CLIENT_DIR, "index.html")
    if os.path.exists(index_path):
        with open(index_path, "r", encoding="utf-8") as f:
            return f.read()
    return "<h1>AI Broadcast Studio</h1><p>Client directory not initialized.</p>"


@app.get("/api/avatar-config")
async def get_avatar_config_endpoint():
    return JSONResponse(get_current_avatar_config())


@app.post("/api/avatar-config")
async def save_avatar_config_endpoint(request: Request):
    new_cfg = await request.json()
    with open(CONFIG_PATH, "w", encoding="utf-8") as f:
        json.dump(new_cfg, f, indent=2)
    return JSONResponse({"status": "saved", "config": new_cfg})


@app.get("/api/video/{video_name}")
async def get_video(video_name: str):
    """Streams living video files with range-header support for seamless HTML5 video looping."""
    candidate_paths = [
        os.path.join(ASSETS_DIR, video_name),
        os.path.join(CLIENT_DIR, "assets", video_name),
        os.path.join(r"E:\Users\user\Downloads", video_name),
        os.path.join(r"E:\Users\user\Downloads", "gemini_generated_video_e4abc5a7.mp4")
    ]
    for p in candidate_paths:
        if os.path.exists(p):
            return FileResponse(p, media_type="video/mp4")
    return Response(status_code=404)


@app.post("/api/upload-avatar-video")
async def upload_avatar_video(file: UploadFile = File(...)):
    """Receives user-uploaded living avatar video and sets it as the active visual source."""
    filename = f"living_avatar_{int(time.time())}_{file.filename}"
    save_path = os.path.join(ASSETS_DIR, filename)
    client_save_path = os.path.join(CLIENT_DIR, "assets", filename)

    contents = await file.read()
    with open(save_path, "wb") as f:
        f.write(contents)
    with open(client_save_path, "wb") as f:
        f.write(contents)

    cfg = get_current_avatar_config()
    cfg["media_assets"]["visual_source"] = f"/api/video/{filename}"
    with open(CONFIG_PATH, "w", encoding="utf-8") as f:
        json.dump(cfg, f, indent=2)

    return JSONResponse({
        "status": "uploaded",
        "video_url": f"/api/video/{filename}",
        "filename": filename
    })


@app.get("/api/status")
@app.get("/api/health")
async def get_status():
    cfg = get_current_avatar_config()
    return {
        "status": "online",
        "service": "Project 10 Aerospace Broadcast Studio",
        "avatar_type": "living_video",
        "visual_source": cfg.get("media_assets", {}).get("visual_source", "/api/video/avatar_video.mp4"),
        "brain_history_turns": len(brain.history) // 2,
        "primary_model": cfg.get("llm_settings", {}).get("model", "Gemini 2.5 Flash"),
        "voice": cfg.get("media_assets", {}).get("voice_clone_id", "en-IN-PrabhatNeural"),
        "avatar_fps": 30,
        "is_speaking": avatar_streamer.is_speaking
    }


@app.get("/api/stream-avatar")
async def stream_avatar():
    """Continuous 30 FPS MJPEG fallback video stream."""
    return StreamingResponse(
        avatar_streamer.generate_mjpeg_stream(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )


@app.post("/api/chat")
async def chat_endpoint(request: Request):
    """
    Full-duplex conversational turn:
    1. Reads user prompt and persona from avatar_config.json
    2. Queries LLM brain with multi-turn memory buffer
    3. Synthesizes authentic Indian English audio
    4. Returns synthesized text, audio base64, and estimated duration
    """
    data = await request.json()
    question = data.get("question", "")
    provider = data.get("provider", "gemini")

    if not question.strip():
        return JSONResponse({"error": "Empty question"}, status_code=400)

    start_t = time.time()
    answer = brain.ask(question, preferred_provider=provider)
    brain_latency = time.time() - start_t

    tts_start = time.time()
    audio_bytes, visemes = await tts.synthesize_with_visemes(answer)
    tts_latency = time.time() - tts_start

    word_count = len(answer.split())
    estimated_duration = max(2.5, word_count / 2.6)

    audio_id = f"speech_{int(time.time())}_{uuid.uuid4().hex[:6]}.mp3"
    audio_path = os.path.join(AUDIO_CACHE_DIR, audio_id)
    with open(audio_path, "wb") as f:
        f.write(audio_bytes)

    avatar_streamer.trigger_speech(estimated_duration)
    audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")

    broadcast_payload = {
        "type": "turn_event",
        "question": question,
        "answer": answer,
        "duration": estimated_duration,
        "turn_count": len(brain.history) // 2,
        "brain_latency_ms": int(brain_latency * 1000),
        "tts_latency_ms": int(tts_latency * 1000)
    }
    for ws in list(active_websockets):
        try:
            await ws.send_json(broadcast_payload)
        except Exception:
            active_websockets.discard(ws)

    return JSONResponse({
        "answer": answer,
        "audio_base64": f"data:audio/mp3;base64,{audio_b64}",
        "audio_url": f"/api/audio/{audio_id}",
        "duration": estimated_duration,
        "turn_count": len(brain.history) // 2,
        "visemes": visemes,
        "metrics": {
            "brain_latency_ms": int(brain_latency * 1000),
            "tts_latency_ms": int(tts_latency * 1000)
        }
    })


@app.get("/api/audio/{filename}")
async def get_audio_file(filename: str):
    filepath = os.path.join(AUDIO_CACHE_DIR, filename)
    if os.path.exists(filepath):
        return FileResponse(filepath, media_type="audio/mpeg")
    return Response(status_code=404)


@app.post("/api/save_recording")
async def save_recording(request: Request):
    body = await request.body()
    filename = f"podcast_broadcast_{int(time.time())}.webm"
    filepath = os.path.join(RECORDINGS_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(body)
    logger.info(f"Saved master episode recording ({len(body)} bytes) to {filepath}")
    return {"status": "saved", "filename": filename, "bytes": len(body)}


@app.post("/api/save_transcript")
async def save_transcript(request: Request):
    data = await request.json()
    markdown_content = data.get("transcript", "")
    filename = f"transcript_{int(time.time())}.md"
    filepath = os.path.join(RECORDINGS_DIR, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(markdown_content)
    return {"status": "saved", "filename": filename}


@app.websocket("/ws/broadcast")
async def websocket_broadcast(websocket: WebSocket):
    await websocket.accept()
    active_websockets.add(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        active_websockets.discard(websocket)
    except Exception:
        active_websockets.discard(websocket)


if __name__ == "__main__":
    import uvicorn
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", 8000))
    print(f"Starting Aerospace Digital Twin Studio on http://localhost:{port}")
    uvicorn.run(app, host=host, port=port)
