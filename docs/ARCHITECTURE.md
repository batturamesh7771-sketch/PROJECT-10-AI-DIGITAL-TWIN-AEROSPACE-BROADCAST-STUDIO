# System Architecture & Technical Specifications

**Project Designation:** PROJECT 10 — AI Digital Twin: Aerospace Broadcast Studio  
**Author:** Mr ELONIKHIL (`mr elonikhil`)  
**License:** MIT License  

---

## 1. Architectural Topology

```
+====================================================================================================+
|                                    BROADCAST CLIENT (BROWSER)                                      |
|                                                                                                    |
|    +------------------------------------+        +------------------------------------+            |
|    |         HOST STAGE (LEFT)          |        |     AI GUEST STAGE (RIGHT)         |            |
|    | - Live WebRTC / Webcam stream      |        | - Simli Neural Avatar (Default)    |            |
|    | - Web Audio Analyser (Host VU)     |        | - Nikhil AI Twin (Optional Clone)  |            |
|    | - Lower-Third: Nikhil (Host)       |        | - Lower-Third: AI Guest            |            |
|    +-----------------+------------------+        +------------------+-----------------+            |
|                      | (Laptop Mic Stream)                          | (WebRTC Audio/Video)         |
|                      v                                              v                              |
|    +------------------------------------+        +------------------------------------+            |
|    |   Voice Activity Detection (VAD)   |        |   Dedicated Talk to Simli Button   |            |
|    | - Continuous en-IN Speech STT      |        | - Zero Audio Overlap Isolation     |            |
|    | - 1.2s Silence Threshold Guard     |        | - Real-time Viseme & Audio Stream  |            |
|    +-----------------+------------------+        +------------------+-----------------+            |
|                      |                                              |                              |
|                      +-----------------------+----------------------+                              |
|                                              |                                                     |
|                                              v                                                     |
|              +------------------------------------------------------------------+                  |
|              |         MASTER 1920x1080 COMPOSITE BROADCAST RECORDER            |                  |
|              | - Side-by-Side 50/50 Broadcast Layout with Studio HUD Graphics   |                  |
|              | - Web Audio Master Destination: (Host Mic + AI Guest Voice)      |                  |
|              | - MediaRecorder: Continuous 30 FPS Full HD Archival (.webm)      |                  |
|              | - One-Click Export: Video Episode File + Markdown Transcript     |                  |
|              +------------------------------------------------------------------+                  |
+====================================================================================================+
                                              |
                          WebSocket / REST (`/api/chat`)
                                              v
+====================================================================================================+
|                                  FASTAPI / PYTHON BACKEND SERVER                                   |
|                                                                                                    |
|    +------------------------------------------------------------------------------------------+    |
|    |                            MULTI-TURN CONVERSATIONAL MEMORY                              |    |
|    | - Retains full session turns across the 1-hour broadcast dialogue                        |    |
|    | - Prevents repetition with domain-anchored context deltas                                |    |
|    +--------------------------------------------+---------------------------------------------+    |
|                                                 |                                                  |
|                                                 v                                                  |
|    +------------------------------------------------------------------------------------------+    |
|    |                           MULTI-PROVIDER LLM ORCHESTRATION                               |    |
|    | 1. Google Gemini 2.5 Pro (Primary Brain)                                                 |    |
|    | 2. OpenRouter Gateway (Gemini 2.0 / Nemotron / Llama 3.3)                                |    |
|    | 3. OpenAI GPT-4o (Deep Aerospace Fallback)                                               |    |
|    | 4. xAI Grok (Autonomous Reasoning Fallback)                                              |    |
|    +--------------------------------------------+---------------------------------------------+    |
|                                                 |                                                  |
|                                                 v                                                  |
|    +------------------------------------------------------------------------------------------+    |
|    |                           INDIAN ENGLISH VOICE SYNTHESIS                                 |    |
|    | - Edge-TTS `en-IN-PrabhatNeural` with pitch and rate shaping                             |    |
|    | - ElevenLabs voice cloning API integration                                               |    |
|    | - Sub-second chunked audio delivery                                                      |    |
|    +------------------------------------------------------------------------------------------+    |
+====================================================================================================+
```

---

## 2. Component Breakdown

### 2.1 Broadcast Client (`client/`)
- **`index.html`**: Production broadcast interface with master header, timer box, split-screen stage, and bottom studio dock.
- **`css/studio.css`**: Obsidian and glowing cyan HUD styling, lower-thirds, VU meter bars, and pulsing broadcast indicators.
- **`js/host_media.js`**: Captures host 30 FPS webcam and laptop mic with real-time Web Audio analyser.
- **`js/vad_stt.js`**: Hands-free continuous speech recognition with 1.2s silence threshold debounce.
- **`js/avatar_webrtc.js`**: Natural neural avatar rendering engine with eyelid blink kinematics, micro head-sway, and speech-reactive mouth deformation.
- **`js/audio_mixer.js`**: Unified Web Audio mixing graph connecting dual channels into a single destination.
- **`js/master_recorder.js`**: 1920x1080 30 FPS composite canvas recorder exporting `.webm` video files and Markdown transcripts.

### 2.2 Server Pipeline (`server/`)
- **`app.py`**: FastAPI production server managing REST endpoints, WebSockets, static file mounts, and archival storage.
- **`brain_engine.py`**: Aerospace multi-turn conversational brain with prompt sanitization and multi-provider failover.
- **`tts_voice_engine.py`**: Authentic Indian English vocal timbre synthesizer.
- **`avatar_pipeline.py`**: Real-time facial dynamics and landmark deformation engine.
- **`simli_livekit_agent.py`**: LiveKit agent script connecting Simli avatar sessions to real-time Gemini 2.5 Pro reasoning.
