/**
 * master_recorder.js - Broadcast Compositor & Recorder
 * Combines Host Video (50%) + Living AI Twin Video (50%) into a 1920x1080 canvas.
 * Mixes Host Mic and Twin Audio into a single synchronized stream.
 * Exports high-definition video (.webm/.mp4) and timestamped transcript.
 */

class MasterBroadcastRecorder {
  constructor(hostVideoEl, guestVideoEl, hostAudioTrack, guestAudioTrack) {
    this.hostVideo = hostVideoEl;
    this.guestVideo = guestVideoEl;
    this.hostAudioTrack = hostAudioTrack;
    this.guestAudioTrack = guestAudioTrack;

    // 1080p Master Canvas
    this.canvas = document.createElement("canvas");
    this.canvas.width = 1920;
    this.canvas.height = 1080;
    this.ctx = this.canvas.getContext("2d");

    // Audio mixing graph
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    this.audioCtx = new AudioCtx();
    this.mixedAudioDest = this.audioCtx.createMediaStreamDestination();

    if (this.hostAudioTrack) {
      try {
        const hostSrc = this.audioCtx.createMediaStreamSource(new MediaStream([this.hostAudioTrack]));
        hostSrc.connect(this.mixedAudioDest);
      } catch (e) {
        console.warn("Host audio setup notice:", e);
      }
    }

    if (this.guestAudioTrack) {
      try {
        const guestSrc = this.audioCtx.createMediaStreamSource(new MediaStream([this.guestAudioTrack]));
        guestSrc.connect(this.mixedAudioDest);
      } catch (e) {
        console.warn("Guest audio setup notice:", e);
      }
    }

    this.isRecording = false;
    this.recordedChunks = [];
    this.mediaRecorder = null;
    this.startTime = 0;
    this.currentCaption = "";
    this.dialogueHistory = [];
  }

  setCaptions(text) {
    this.currentCaption = text;
  }

  addDialogueTurn(speaker, text) {
    const elapsedSec = Math.floor((Date.now() - (this.startTime || Date.now())) / 1000);
    const timeStr = this.formatDuration(elapsedSec);
    this.dialogueHistory.push({
      time: timeStr,
      speaker: speaker,
      text: text
    });
  }

  start() {
    this.isRecording = true;
    this.recordedChunks = [];
    this.startTime = Date.now();
    this.renderLoop();

    const canvasStream = this.canvas.captureStream(30);
    const audioTracks = this.mixedAudioDest.stream.getAudioTracks();
    const combinedTracks = [...canvasStream.getVideoTracks()];
    if (audioTracks.length > 0) {
      combinedTracks.push(audioTracks[0]);
    }

    const combinedStream = new MediaStream(combinedTracks);

    let options = { mimeType: 'video/webm;codecs=vp9,opus' };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = { mimeType: 'video/webm' };
    }

    this.mediaRecorder = new MediaRecorder(combinedStream, options);
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        this.recordedChunks.push(e.data);
      }
    };
    this.mediaRecorder.onstop = () => this.exportFiles();
    this.mediaRecorder.start(1000);
    console.log("Master Broadcast 1080p recording initialized with Living Video Avatar.");
  }

  stop() {
    this.isRecording = false;
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
  }

  renderLoop() {
    if (!this.isRecording) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // 1. Studio Backdrop Fill
    ctx.fillStyle = "#070b14";
    ctx.fillRect(0, 0, w, h);

    // 2. Master Header Bar
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, w, 84);
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 84, w, 2);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 26px sans-serif";
    ctx.fillText("AI IN THE AEROSPACE INDUSTRY | NIKHIL & DIGITAL TWIN", 48, 52);

    // Live Recording Clock
    const elapsedSec = Math.floor((Date.now() - this.startTime) / 1000);
    const clockText = this.formatDuration(elapsedSec);

    // Red Recording Pulse
    ctx.fillStyle = "#e11d48";
    ctx.beginPath();
    ctx.arc(w - 220, 44, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = "bold 22px monospace";
    ctx.fillStyle = "#38bdf8";
    ctx.fillText(clockText, w - 190, 52);

    // 50/50 Stage Geometry
    const margin = 28;
    const topOffset = 104;
    const bottomReserved = 110;
    const halfW = (w - (margin * 3)) / 2;
    const frameH = h - topOffset - bottomReserved;

    // 3. Left Stage: Human Host (Live Webcam)
    ctx.save();
    ctx.fillStyle = "#020617";
    ctx.fillRect(margin, topOffset, halfW, frameH);

    if (this.hostVideo && this.hostVideo.readyState >= 2) {
      ctx.save();
      ctx.translate(margin + halfW, topOffset);
      ctx.scale(-1, 1);
      ctx.drawImage(this.hostVideo, 0, 0, halfW, frameH);
      ctx.restore();
    }

    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2;
    ctx.strokeRect(margin, topOffset, halfW, frameH);

    // Host Lower Third Graphic
    ctx.fillStyle = "rgba(11, 17, 32, 0.94)";
    ctx.fillRect(margin + 20, topOffset + frameH - 96, 380, 76);
    ctx.fillStyle = "#38bdf8";
    ctx.fillRect(margin + 20, topOffset + frameH - 96, 6, 76);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 24px sans-serif";
    ctx.fillText("Nikhil", margin + 42, topOffset + frameH - 58);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "15px sans-serif";
    ctx.fillText("Host (Live from India)", margin + 42, topOffset + frameH - 34);
    ctx.restore();

    // 4. Right Stage: AI Twin Guest (Living Video Feed)
    const guestX = margin * 2 + halfW;
    ctx.save();
    ctx.fillStyle = "#020617";
    ctx.fillRect(guestX, topOffset, halfW, frameH);

    if (this.guestVideo) {
      try {
        if (this.guestVideo.tagName === 'VIDEO') {
          if (this.guestVideo.readyState >= 2) {
            ctx.drawImage(this.guestVideo, guestX, topOffset, halfW, frameH);
          }
        } else {
          ctx.drawImage(this.guestVideo, guestX, topOffset, halfW, frameH);
        }
      } catch (e) {
        ctx.fillStyle = "#0d1527";
        ctx.fillRect(guestX, topOffset, halfW, frameH);
      }
    }

    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2;
    ctx.strokeRect(guestX, topOffset, halfW, frameH);

    // Guest Lower Third Graphic
    ctx.fillStyle = "rgba(11, 17, 32, 0.94)";
    ctx.fillRect(guestX + 20, topOffset + frameH - 96, 480, 76);
    ctx.fillStyle = "#06b6d4";
    ctx.fillRect(guestX + 20, topOffset + frameH - 96, 6, 76);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 24px sans-serif";
    ctx.fillText("Nikhil (AI Digital Twin)", guestX + 42, topOffset + frameH - 58);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "15px sans-serif";
    ctx.fillText("Aerospace AI Specialist • Indian Accent • Living Avatar", guestX + 42, topOffset + frameH - 34);
    ctx.restore();

    // 5. Bottom Master Closed-Captions
    const captionY = h - 86;
    ctx.fillStyle = "#090f1d";
    ctx.fillRect(margin, captionY, w - (margin * 2), 66);
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 1;
    ctx.strokeRect(margin, captionY, w - (margin * 2), 66);

    ctx.fillStyle = "#06b6d4";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText("LIVE BROADCAST FEED:", margin + 20, captionY + 38);

    const captionText = this.currentCaption || "Dialogue stream active. Physics-informed neural surrogate modeling & flight dynamics telemetry.";
    ctx.fillStyle = "#f1f5f9";
    ctx.font = "16px sans-serif";
    ctx.fillText(captionText.slice(0, 110), margin + 230, captionY + 38);

    requestAnimationFrame(() => this.renderLoop());
  }

  formatDuration(sec) {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  async exportFiles() {
    const timestamp = Date.now();
    const blob = new Blob(this.recordedChunks, { type: 'video/webm' });

    const videoUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = videoUrl;
    a.download = `AI_Aerospace_Podcast_Episode_${timestamp}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    try {
      await fetch("/api/save_recording", {
        method: "POST",
        headers: { "Content-Type": "video/webm" },
        body: blob
      });
      console.log("Master episode successfully archived to server disk.");
    } catch (e) {
      console.warn("Server recording upload notice:", e);
    }

    this.exportTranscript(timestamp);
  }

  exportTranscript(timestamp) {
    let md = `# AI in the Aerospace Industry — Broadcast Episode Transcript\n`;
    md += `**Date:** ${new Date().toISOString()}\n`;
    md += `**Host:** Nikhil (Live Human)\n`;
    md += `**Guest:** Nikhil (AI Digital Twin — Indian Accent)\n`;
    md += `**Format:** 1080p Master Dual-Screen Broadcast\n\n`;
    md += `---\n\n`;

    if (this.dialogueHistory.length === 0) {
      md += `*No dialogue turns recorded in this session.*\n`;
    } else {
      this.dialogueHistory.forEach(turn => {
        md += `### [${turn.time}] ${turn.speaker}\n\n${turn.text}\n\n`;
      });
    }

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `AI_Aerospace_Podcast_Transcript_${timestamp}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    fetch("/api/save_transcript", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript: md })
    }).catch(e => console.warn("Server transcript sync notice:", e));
  }
}

window.MasterBroadcastRecorder = MasterBroadcastRecorder;
