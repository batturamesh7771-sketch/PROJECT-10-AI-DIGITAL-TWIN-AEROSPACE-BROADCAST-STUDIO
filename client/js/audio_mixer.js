/**
 * audio_mixer.js - Master Broadcast Audio Graph
 * Mixes Host Microphone and AI Twin Generated Audio into a unified synchronized
 * stereo stream for the Master 1080p MediaRecorder.
 */

class BroadcastAudioMixer {
  constructor() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioCtx();
    this.mixedDestination = this.ctx.createMediaStreamDestination();
    this.hostSource = null;
    this.guestSource = null;
  }

  async resume() {
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  addHostAudioTrack(audioTrack) {
    if (!audioTrack) return;
    try {
      const stream = new MediaStream([audioTrack]);
      this.hostSource = this.ctx.createMediaStreamSource(stream);
      const hostGain = this.ctx.createGain();
      hostGain.gain.value = 1.0;
      this.hostSource.connect(hostGain);
      hostGain.connect(this.mixedDestination);
      console.log("Host audio track routed into master broadcast mixer.");
    } catch (e) {
      console.warn("Failed to route host audio:", e);
    }
  }

  addGuestAudioTrack(audioTrack) {
    if (!audioTrack) return;
    try {
      const stream = new MediaStream([audioTrack]);
      this.guestSource = this.ctx.createMediaStreamSource(stream);
      const guestGain = this.ctx.createGain();
      guestGain.gain.value = 1.0;
      this.guestSource.connect(guestGain);
      guestGain.connect(this.mixedDestination);
      console.log("Guest audio track routed into master broadcast mixer.");
    } catch (e) {
      console.warn("Failed to route guest audio:", e);
    }
  }

  getMixedAudioTrack() {
    const tracks = this.mixedDestination.stream.getAudioTracks();
    return tracks.length > 0 ? tracks[0] : null;
  }
}

window.BroadcastAudioMixer = BroadcastAudioMixer;
