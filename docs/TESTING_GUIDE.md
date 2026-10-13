# PROJECT 10: Complete A-Z Sequential Testing & Verification Guide

**Project Name:** PROJECT 10 — AI Digital Twin: Aerospace Broadcast Studio  
**Author:** Mr ELONIKHIL (`mr elonikhil`)  
**License:** MIT License  
**Local Studio URL:** [http://localhost:8000](http://localhost:8000)  

---

## Table of Contents
1. [Prerequisites & Environment Setup](#1-prerequisites--environment-setup)
2. [Configuration & API Keys](#2-configuration--api-keys)
3. [Starting the Broadcast Server](#3-starting-the-broadcast-server)
4. [A-Z Sequential Verification Steps](#4-a-z-sequential-verification-steps)
   - [Step A: Health & Diagnostic Endpoint](#step-a-health--diagnostic-endpoint)
   - [Step B: Browser Broadcast HUD Initialization](#step-b-browser-broadcast-hud-initialization)
   - [Step C: Host Webcam & Laptop Mic Verification](#step-c-host-webcam--laptop-mic-verification)
   - [Step D: Dual Avatar Switching (Simli vs. Nikhil Clone)](#step-d-dual-avatar-switching-simli-vs-nikhil-clone)
   - [Step E: Dedicated "Talk to Simli Avatar" Button Test](#step-e-dedicated-talk-to-simli-avatar-button-test)
   - [Step F: Laptop Mic Push-to-Talk & Hands-Free VAD](#step-f-laptop-mic-push-to-talk--hands-free-vad)
   - [Step G: Live AI Brain & Aerospace Q&A Dialogue](#step-g-live-ai-brain--aerospace-qa-dialogue)
   - [Step H: Zero-Audio-Overlap Verification](#step-h-zero-audio-overlap-verification)
   - [Step I: 1080p Master Recording & Transcript Export](#step-i-1080p-master-recording--transcript-export)
5. [API Endpoint Test Suite (cURL / PowerShell)](#5-api-endpoint-test-suite-curl--powershell)
6. [Troubleshooting & FAQs](#6-troubleshooting--faqs)

---

## 1. Prerequisites & Environment Setup

- **Operating System:** Windows 10/11, macOS, or Linux
- **Python:** Python 3.10 or higher
- **Web Browser:** Google Chrome, Microsoft Edge, or Chromium-based browser (with WebRTC & Web Audio support)
- **Hardware:** Laptop webcam & built-in or USB microphone, speakers/headphones

```powershell
# Clone the repository
git clone https://github.com/batturamesh7771-sketch/PROJECT-10-AI-DIGITAL-TWIN-AEROSPACE-BROADCAST-STUDIO.git
cd PROJECT-10-AI-DIGITAL-TWIN-AEROSPACE-BROADCAST-STUDIO

# Install Python requirements
pip install -r server/requirements.txt
```

---

## 2. Configuration & API Keys

Copy `.env.example` to `.env`:
```powershell
Copy-Item .env.example .env
```

Ensure your `.env` contains valid credentials for live generative features:
```ini
# Primary Generative AI Brain (Gemini 2.5 Pro)
GEMINI_API_KEY=your_gemini_api_key_here

# OpenRouter Multi-Model Gateway Fallback
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Simli Neural Avatar API
SIMLI_API_KEY=your_simli_api_key_here
SIMLI_FACE_ID=0655685c-c0ab-41af-95ed-2adbc4def4a2

# Server Configuration
PORT=8000
HOST=0.0.0.0
```

---

## 3. Starting the Broadcast Server

Launch the production FastAPI server:
```powershell
python server/app.py
```
Expected output:
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

---

## 4. A-Z Sequential Verification Steps

### Step A: Health & Diagnostic Endpoint
Open your terminal or browser and query the health endpoint:
- **URL:** [http://localhost:8000/api/health](http://localhost:8000/api/health)
- **Verification:** Expect JSON response `{"status": "ok", "service": "Project 10 Aerospace Broadcast Studio", ...}`.

### Step B: Browser Broadcast HUD Initialization
1. Open your browser and navigate to [http://localhost:8000](http://localhost:8000).
2. The obsidian & cyan broadcast studio UI will load.
3. Observe the top header bar showing `PROJECT 10: AI IN AEROSPACE BROADCAST STUDIO`, the session timer (`00:00:00`), and status badges.

### Step C: Host Webcam & Laptop Mic Verification
1. Allow camera and microphone permissions when prompted by the browser.
2. The left stage ("HOST: NIKHIL") will activate with your live webcam video stream.
3. Speak into your laptop microphone and confirm that the host green VU meter bar bounces in real-time with your voice amplitude.

### Step D: Dual Avatar Switching (Simli vs. Nikhil Clone)
1. On the top-right control bar, locate the **Guest Mode Switch**:
   - `Simli Avatar (Default)`
   - `Nikhil Clone (Optional)`
2. Toggle between them:
   - **Simli Mode:** Right stage loads the high-fidelity Simli WebRTC iframe stream with direct lip-sync.
   - **Nikhil Clone Mode:** Right stage switches to Nikhil's procedural 30 FPS neural visual clone with synthetic eyelids, micro-head sway, and audio-reactive viseme deformation.

### Step E: Dedicated "Talk to Simli Avatar" Button Test
1. In the bottom control dock, locate the prominent cyan button:
   ```
   [🎙️ TALK TO SIMLI AVATAR]
   ```
2. Click the button. The browser immediately activates speech capture.
3. Ask your aerospace question (e.g., *"How do Fourier Neural Operators accelerate hypersonic reentry CFD calculations?"*).
4. Click again or allow the 1.2s silence detector to finish.
5. Observe the AI guest stage respond with live generative aerospace intelligence.

### Step F: Laptop Mic Push-to-Talk & Hands-Free VAD
1. Alternatively, click the `[🎙️ Click to Speak (Laptop Mic)]` button.
2. The microphone badge pulses red with `[LISTENING...]`.
3. Speak for 5–10 seconds. The speech-to-text transcript automatically appears in the question input bar and dispatches to the brain engine upon natural pause.

### Step G: Live AI Brain & Aerospace Q&A Dialogue
1. Test quick aerospace topic chips at the bottom of the stage:
   - `Raptor 3 Telemetry & Cavitation`
   - `Hypersonic PINNs & Non-Equilibrium`
   - `GPS-Denied Neuromorphic VIO`
   - `Inconel 718 Additive Diffusion`
2. Observe the AI guest response:
   - **Zero Repetition:** Each answer dynamically reasons using Gemini 2.5 Pro.
   - **Indian English Cadence:** Vocal synthesis speaks with natural Indian English cadence (`en-IN-PrabhatNeural`).
   - **Clear Prose:** Answers are free from unpronounceable Markdown artifacts or code brackets.

### Step H: Zero-Audio-Overlap Verification
1. During Simli avatar mode playback, confirm that audio is piped directly through the Simli WebRTC stream.
2. Confirm there is no duplicate local Edge-TTS voice overlapping or echoing in the background.

### Step I: 1080p Master Recording & Transcript Export
1. Click the red **[⏺️ START BROADCAST RECORDING]** button in the header.
2. The REC badge lights up red and the timer starts incrementing.
3. Conduct 1 to 2 minutes of back-and-forth aerospace dialogue.
4. Click **[⏹️ STOP & SAVE EPISODE]**.
5. The studio automatically triggers two simultaneous downloads:
   - `podcast_broadcast_YYYY-MM-DD_HH-mm-ss.webm` (1080p 30 FPS side-by-side composite video)
   - `podcast_transcript_YYYY-MM-DD_HH-mm-ss.md` (Full timestamped markdown dialogue transcript)

---

## 5. API Endpoint Test Suite (cURL / PowerShell)

### 1. Health Check
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/health" -Method Get | ConvertTo-Json
```

### 2. Live Chat Query (Direct Brain Test)
```powershell
$body = @{
    message = "Explain acoustic combustion instability in the Raptor 3 staged combustion cycle."
    history = @()
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/chat" -Method Post -Body $body -ContentType "application/json" | ConvertTo-Json
```

### 3. Voice Synthesis Test
```powershell
$voiceBody = @{
    text = "Welcome to Project 10 Aerospace Broadcast Studio. We are exploring autonomous flight and rocket propulsion today."
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/tts" -Method Post -Body $voiceBody -ContentType "application/json" -OutFile "test_audio.mp3"
```

---

## 6. Troubleshooting & FAQs

| Issue | Cause | Resolution |
|---|---|---|
| **Webcam not displaying** | Browser permissions blocked | Click the lock/tune icon in the browser address bar and set Camera & Mic to "Allow". |
| **Simli stream loading spinner** | Token or session expiration | Ensure `SIMLI_API_KEY` is set in `.env` or use the provided active session token. |
| **No audio heard from avatar** | Browser autoplay policy | Click anywhere on the browser page to grant audio playback authorization. |
| **Port 8000 in use** | An existing background server instance | Run `Get-NetTCPConnection -LocalPort 8000 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }` then restart. |

---

*Authored by **Mr ELONIKHIL** (`mr elonikhil`) under the MIT License.*
