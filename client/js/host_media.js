/**
 * host_media.js - Host Camera & Microphone Acquisition Engine
 * Captures 720p/1080p 30 FPS host webcam, routes audio into the analyser node,
 * and feeds the host VU meter.
 */

class HostMediaManager {
  constructor(videoElementId, vuBarElementId) {
    this.videoEl = document.getElementById(videoElementId);
    this.vuBarEl = document.getElementById(vuBarElementId);
    this.stream = null;
    this.audioTrack = null;
    this.videoTrack = null;
    this.audioContext = null;
    this.analyser = null;
    this.dataArray = null;
    this.isMuted = false;
    this.isCameraOff = false;
    this.animationFrameId = null;
  }

  async init() {
    try {
      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.videoTrack = this.stream.getVideoTracks()[0] || null;
      this.audioTrack = this.stream.getAudioTracks()[0] || null;

      if (this.videoEl) {
        this.videoEl.srcObject = this.stream;
        await this.videoEl.play().catch(e => console.warn("Host video autoplay prevented:", e));
      }

      this.setupAudioAnalyser();
      console.log("Host media successfully initialized.");
      return true;
    } catch (err) {
      console.error("Failed to access camera/mic:", err);
      // Fallback: create mock visual canvas if camera denied
      this.createFallbackStream();
      return false;
    }
  }

  setupAudioAnalyser() {
    if (!this.audioTrack) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(new MediaStream([this.audioTrack]));
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.6;
      source.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);
      this.startVUMeterLoop();
    } catch (e) {
      console.warn("Audio analyser setup failed:", e);
    }
  }

  startVUMeterLoop() {
    const update = () => {
      if (this.analyser && this.dataArray && this.vuBarEl) {
        this.analyser.getByteFrequencyData(this.dataArray);
        let sum = 0;
        for (let i = 0; i < this.dataArray.length; i++) {
          sum += this.dataArray[i];
        }
        const avg = sum / this.dataArray.length;
        const percent = Math.min(100, Math.round((avg / 128) * 100));
        this.vuBarEl.style.width = this.isMuted ? '0%' : `${percent}%`;
      }
      this.animationFrameId = requestAnimationFrame(update);
    };
    update();
  }

  toggleMute() {
    if (this.audioTrack) {
      this.isMuted = !this.isMuted;
      this.audioTrack.enabled = !this.isMuted;
      if (this.vuBarEl && this.isMuted) {
        this.vuBarEl.style.width = '0%';
      }
      return this.isMuted;
    }
    return false;
  }

  toggleCamera() {
    if (this.videoTrack) {
      this.isCameraOff = !this.isCameraOff;
      this.videoTrack.enabled = !this.isCameraOff;
      return this.isCameraOff;
    }
    return false;
  }

  createFallbackStream() {
    const canvas = document.createElement("canvas");
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#020617";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 32px sans-serif";
    ctx.fillText("Host Video Standby", 460, 360);
    const fallbackStream = canvas.captureStream(30);
    this.videoTrack = fallbackStream.getVideoTracks()[0];
    if (this.videoEl) {
      this.videoEl.srcObject = fallbackStream;
      this.videoEl.play();
    }
  }

  getVideoTrack() {
    return this.videoTrack;
  }

  getAudioTrack() {
    return this.audioTrack;
  }
}

window.HostMediaManager = HostMediaManager;
