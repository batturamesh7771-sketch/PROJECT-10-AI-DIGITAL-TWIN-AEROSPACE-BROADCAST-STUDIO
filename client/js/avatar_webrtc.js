/**
 * avatar_webrtc.js - Real-Time Natural AI Avatar Controller
 * Renders Nikhil's authentic face, idle presence with natural breathing and blinks,
 * and speech-synchronized lip & jaw kinematics when answering questions.
 */

class NaturalAvatarController {
  constructor(canvasElementId, vuBarElementId) {
    this.canvas = document.getElementById(canvasElementId);
    this.vuBar = document.getElementById(vuBarElementId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;

    this.referenceImg = new Image();
    this.referenceImg.src = "/static/assets/nikhil_twin_reference.png";

    this.isSpeaking = false;
    this.speechStartTime = 0;
    this.speechDuration = 0;
    this.lastBlinkTime = performance.now() / 1000;
    this.blinkInterval = 4.2;
    this.blinkDuration = 0.15;

    this.audioElement = new Audio();
    this.audioContext = null;
    this.analyser = null;
    this.dataArray = null;
    this.audioDest = null;
    this.audioTrack = null;
    this.videoTrack = null;

    this.init();
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
      const stream = this.canvas.captureStream(30);
      this.videoTrack = stream.getVideoTracks()[0] || null;
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
      await this.audioContext.resume();
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
      console.warn("Audio playback notice:", e);
    }
  }

  startRenderLoop() {
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

    // 1. Natural subtle human presence (breathing & head sway)
    const breathY = Math.sin(now * 1.5) * 1.4;
    const headSwayX = Math.sin(now * 0.6) * 1.6;
    const headSwayY = Math.cos(now * 0.8) * 1.1 + breathY;
    const headTilt = Math.sin(now * 0.4) * 0.004;

    ctx.save();
    ctx.clearRect(0, 0, w, h);
    ctx.translate(w / 2 + headSwayX, h / 2 + headSwayY);
    ctx.rotate(headTilt);
    ctx.drawImage(this.referenceImg, -w / 2, -h / 2, w, h);
    ctx.restore();

    // 2. Audio-driven natural mouth movement (phoneme tracking)
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
      const syllable = (Math.sin(elapsed * 16.0) * 0.5 + Math.sin(elapsed * 8.0) * 0.3);
      vocalEnergy = Math.max(0, syllable);
      if (this.vuBar) {
        this.vuBar.style.width = `${Math.min(100, Math.round(vocalEnergy * 80))}%`;
      }
    } else {
      if (this.vuBar) this.vuBar.style.width = '0%';
    }

    // 3. Articulate mouth ONLY when speaking (natural mouth deformation)
    if (vocalEnergy > 0.03) {
      const mx = 462 + headSwayX;
      const my = 468 + headSwayY;
      const mw = 106;
      const mh = 62;

      ctx.save();
      ctx.beginPath();
      ctx.ellipse(mx + mw / 2, my + mh / 2, mw * 0.46, mh * (0.42 + vocalEnergy * 0.32), 0, 0, Math.PI * 2);
      ctx.clip();

      const jawDrop = vocalEnergy * 6.8;
      ctx.drawImage(
        this.referenceImg,
        462, 468, mw, mh,
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
        this.blinkInterval = 3.8 + Math.random() * 2.2;
      }
    }
  }

  drawBlink(ctx, amount, dx, dy) {
    if (amount <= 0.05) return;
    const eyes = [
      { x: 462 + dx, y: 312 + dy, w: 32, h: 16 },
      { x: 566 + dx, y: 312 + dy, w: 32, h: 16 }
    ];

    ctx.save();
    eyes.forEach(eye => {
      ctx.beginPath();
      ctx.ellipse(eye.x, eye.y, eye.w / 2, (eye.h / 2) * amount, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(180, 130, 105, 0.95)";
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(eye.x, eye.y + (eye.h / 4) * amount, eye.w / 2, 1.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(30, 20, 15, 0.75)";
      ctx.fill();
    });
    ctx.restore();
  }

  getVideoTrack() {
    if (!this.videoTrack && this.canvas && this.canvas.captureStream) {
      const stream = this.canvas.captureStream(30);
      this.videoTrack = stream.getVideoTracks()[0] || null;
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
