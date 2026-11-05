/**
 * avatar_webrtc.js - Real-Time Natural AI Avatar Controller
 * Supports both Tina (Female Neural Co-Host) and Nikhil (Human Clone),
 * featuring natural breathing, idle micro-head sway, eye blinks,
 * and audio-driven lip synchronization with dual SpeechSynthesis and backend audio playback.
 */

class NaturalAvatarController {
  constructor(canvasElementId, vuBarElementId, defaultCharacter = "tina") {
    this.canvas = document.getElementById(canvasElementId);
    this.vuBar = document.getElementById(vuBarElementId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;

    this.character = defaultCharacter; // 'tina' or 'nikhil'
    this.referenceImg = new Image();

    this.isSpeaking = false;
    this.speechStartTime = 0;
    this.speechDuration = 0;
    this.lastBlinkTime = performance.now() / 1000;
    this.blinkInterval = 3.6;
    this.blinkDuration = 0.16;

    this.audioElement = new Audio();
    this.audioContext = null;
    this.analyser = null;
    this.dataArray = null;
    this.audioDest = null;
    this.audioTrack = null;
    this.videoTrack = null;

    this.setCharacter(defaultCharacter);
    this.init();
  }

  setCharacter(charName) {
    this.character = charName || "tina";

    if (this.character === "tina") {
      this.mouthConfig = { mx: 468, my: 450, mw: 92, mh: 54, jawScale: 5.8 };
      this.eyesConfig = [
        { x: 458, y: 328, w: 28, h: 14 },
        { x: 556, y: 328, w: 28, h: 14 }
      ];
      this.eyelidSkin = "rgba(228, 185, 162, 0.95)";
      this.eyelidLash = "rgba(40, 25, 20, 0.8)";
      this.referenceImg.src = "assets/tina_avatar_reference.png";
      this.referenceImg.onerror = () => {
        this.referenceImg.src = "assets/banner.png";
      };
    } else {
      this.mouthConfig = { mx: 462, my: 468, mw: 106, mh: 62, jawScale: 6.8 };
      this.eyesConfig = [
        { x: 462, y: 312, w: 32, h: 16 },
        { x: 566, y: 312, w: 32, h: 16 }
      ];
      this.eyelidSkin = "rgba(180, 130, 105, 0.95)";
      this.eyelidLash = "rgba(30, 20, 15, 0.75)";
      this.referenceImg.src = "assets/nikhil_twin_reference.png";
      this.referenceImg.onerror = () => {
        this.referenceImg.src = "/static/assets/nikhil_twin_reference.png";
      };
    }
  }

  init() {
    if (!this.canvas) return;
    this.canvas.width = 1024;
    this.canvas.height = 764;

    this.referenceImg.onload = () => {
      this.startRenderLoop();
    };

    if (this.referenceImg.complete) {
      this.startRenderLoop();
    }

    if (this.canvas.captureStream) {
      try {
        const stream = this.canvas.captureStream(30);
        this.videoTrack = stream.getVideoTracks()[0] || null;
      } catch (e) {
        console.warn("captureStream notice:", e);
      }
    }
  }

  setupAudioGraph() {
    if (this.audioContext) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaElementSource(this.audioElement);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.3;

      this.audioDest = this.audioContext.createMediaStreamDestination();
      source.connect(this.analyser);
      source.connect(this.audioDest);
      source.connect(this.audioContext.destination);

      this.audioTrack = this.audioDest.stream.getAudioTracks()[0];
      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);
    } catch (e) {
      console.warn("Audio graph setup notice:", e);
    }
  }

  async playSpeech(audioSrc, durationSec) {
    if (!audioSrc) return;

    if (!this.audioContext) {
      this.setupAudioGraph();
    }

    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch (e) {}
    }

    this.audioElement.src = audioSrc;
    this.isSpeaking = true;
    this.speechStartTime = performance.now() / 1000;
    this.speechDuration = durationSec || 4.0;

    this.audioElement.onended = () => {
      this.isSpeaking = false;
      if (this.vuBar) this.vuBar.style.width = '0%';
    };

    try {
      await this.audioElement.play();
    } catch (e) {
      console.warn("Audio element play notice:", e);
    }
  }

  speakWithVoice(text) {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) {
        this.isSpeaking = true;
        this.speechStartTime = performance.now() / 1000;
        this.speechDuration = Math.max(2.5, text.split(/\s+/).length / 2.5);
        setTimeout(() => {
          this.isSpeaking = false;
          if (this.vuBar) this.vuBar.style.width = '0%';
          resolve();
        }, this.speechDuration * 1000);
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();

      if (this.character === "tina") {
        const preferred = voices.find(v => 
          (v.name.includes("Female") || v.name.includes("Zira") || v.name.includes("Samantha") || v.name.includes("Google UK English Female") || v.name.includes("Victoria") || v.name.includes("Natural")) && 
          v.lang.startsWith("en")
        ) || voices.find(v => v.lang.startsWith("en"));
        if (preferred) utterance.voice = preferred;
        utterance.pitch = 1.05;
        utterance.rate = 1.02;
      } else {
        const maleVoice = voices.find(v => 
          (v.name.includes("Male") || v.name.includes("David") || v.name.includes("George") || v.name.includes("Prabhat")) && 
          v.lang.startsWith("en")
        ) || voices.find(v => v.lang.startsWith("en"));
        if (maleVoice) utterance.voice = maleVoice;
        utterance.pitch = 0.95;
        utterance.rate = 1.0;
      }

      const wordCount = text.split(/\s+/).length;
      const estimatedDuration = Math.max(2.5, wordCount / 2.6);

      this.isSpeaking = true;
      this.speechStartTime = performance.now() / 1000;
      this.speechDuration = estimatedDuration;

      utterance.onend = () => {
        this.isSpeaking = false;
        if (this.vuBar) this.vuBar.style.width = '0%';
        resolve();
      };
      utterance.onerror = () => {
        this.isSpeaking = false;
        if (this.vuBar) this.vuBar.style.width = '0%';
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  }

  startRenderLoop() {
    if (this._loopStarted) return;
    this._loopStarted = true;
    const render = () => {
      this.drawFrame();
      requestAnimationFrame(render);
    };
    requestAnimationFrame(render);
  }

  drawFrame() {
    if (!this.ctx || !this.referenceImg.complete) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const now = performance.now() / 1000;

    // 1. Natural human presence (breathing & head sway)
    const breathY = Math.sin(now * 1.6) * 1.5;
    const headSwayX = Math.sin(now * 0.65) * 1.8;
    const headSwayY = Math.cos(now * 0.85) * 1.2 + breathY;
    const headTilt = Math.sin(now * 0.45) * 0.005;

    ctx.save();
    ctx.clearRect(0, 0, w, h);
    ctx.translate(w / 2 + headSwayX, h / 2 + headSwayY);
    ctx.rotate(headTilt);
    ctx.drawImage(this.referenceImg, -w / 2, -h / 2, w, h);
    ctx.restore();

    // 2. Audio-driven natural mouth movement
    let vocalEnergy = 0;
    if (this.analyser && this.dataArray && this.isSpeaking) {
      this.analyser.getByteFrequencyData(this.dataArray);
      let sum = 0;
      for (let i = 4; i < 28; i++) {
        sum += this.dataArray[i];
      }
      const avg = sum / 24;
      vocalEnergy = Math.min(1.0, avg / 105);

      if (this.vuBar) {
        this.vuBar.style.width = `${Math.min(100, Math.round(vocalEnergy * 100))}%`;
      }
    } else if (this.isSpeaking) {
      const elapsed = now - this.speechStartTime;
      const syllable = (Math.sin(elapsed * 16.0) * 0.5 + Math.sin(elapsed * 8.5) * 0.35 + 0.15);
      vocalEnergy = Math.max(0, syllable);
      if (this.vuBar) {
        this.vuBar.style.width = `${Math.min(100, Math.round(vocalEnergy * 85))}%`;
      }
    } else {
      if (this.vuBar) this.vuBar.style.width = '0%';
    }

    // 3. Articulate mouth when speaking (natural mouth deformation)
    if (vocalEnergy > 0.04) {
      const cfg = this.mouthConfig;
      const mx = cfg.mx + headSwayX;
      const my = cfg.my + headSwayY;
      const mw = cfg.mw;
      const mh = cfg.mh;

      ctx.save();
      ctx.beginPath();
      ctx.ellipse(mx + mw / 2, my + mh / 2, mw * 0.48, mh * (0.42 + vocalEnergy * 0.35), 0, 0, Math.PI * 2);
      ctx.clip();

      const jawDrop = vocalEnergy * cfg.jawScale;
      ctx.drawImage(
        this.referenceImg,
        cfg.mx, cfg.my, mw, mh,
        mx - vocalEnergy * 1.2, my + jawDrop, mw + vocalEnergy * 2.4, mh + jawDrop * 0.55
      );
      ctx.restore();
    }

    // 4. Natural Periodic Eye Blinks
    let timeSinceBlink = now - this.lastBlinkTime;
    if (timeSinceBlink > this.blinkInterval) {
      const progress = (timeSinceBlink - this.blinkInterval) / this.blinkDuration;
      if (progress < 1.0) {
        const blinkAmount = Math.sin(progress * Math.PI);
        this.drawBlink(ctx, blinkAmount, headSwayX, headSwayY);
      } else {
        this.lastBlinkTime = now;
        this.blinkInterval = 3.2 + Math.random() * 2.5;
      }
    }
  }

  drawBlink(ctx, amount, dx, dy) {
    if (amount <= 0.04) return;
    const eyes = this.eyesConfig;

    ctx.save();
    eyes.forEach(eye => {
      const ex = eye.x + dx;
      const ey = eye.y + dy;

      ctx.beginPath();
      ctx.ellipse(ex, ey, eye.w / 2, (eye.h / 2) * amount, 0, 0, Math.PI * 2);
      ctx.fillStyle = this.eyelidSkin;
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(ex, ey + (eye.h / 4) * amount, eye.w / 2, 1.6, 0, 0, Math.PI * 2);
      ctx.fillStyle = this.eyelidLash;
      ctx.fill();
    });
    ctx.restore();
  }

  getVideoTrack() {
    if (!this.videoTrack && this.canvas && this.canvas.captureStream) {
      try {
        const stream = this.canvas.captureStream(30);
        this.videoTrack = stream.getVideoTracks()[0] || null;
      } catch (e) {}
    }
    return this.videoTrack;
  }

  getAudioTrack() {
    return this.audioTrack;
  }

  getCanvasElement() {
    return this.canvas;
  }
}

window.NaturalAvatarController = NaturalAvatarController;
