/**
 * vad_stt.js - Hands-Free Voice Activity Detection & Speech-to-Text
 * Utilizes continuous Indian English (en-IN) speech recognition paired
 * with a 1.2s silence threshold detector to seamlessly trigger conversational turns.
 */

class VoiceActivitySTT {
  constructor(options = {}) {
    this.language = options.language || 'en-IN';
    this.silenceThresholdMs = options.silenceThresholdMs || 1200;
    this.onUtterance = options.onUtterance || (() => {});
    this.onInterim = options.onInterim || (() => {});
    this.onStatusChange = options.onStatusChange || (() => {});

    this.recognition = null;
    this.isListening = false;
    this.silenceTimer = null;
    this.accumulatedTranscript = '';
    this.isPaused = false;

    this.setupRecognition();
  }

  setupRecognition() {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      console.warn("Web Speech API not supported in this browser. Manual input fallback active.");
      return;
    }

    this.recognition = new SpeechRec();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = this.language;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.onStatusChange({ listening: true, text: "Listening (en-IN)..." });
    };

    this.recognition.onresult = (event) => {
      if (this.isPaused) return;

      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        const transcriptPart = item[0].transcript;
        if (item.isFinal) {
          this.accumulatedTranscript += ' ' + transcriptPart;
        } else {
          interim += transcriptPart;
        }
      }

      const displayCurrent = (this.accumulatedTranscript + ' ' + interim).trim();
      if (displayCurrent) {
        this.onInterim(displayCurrent);

        // Reset silence debounce timer
        clearTimeout(this.silenceTimer);
        this.silenceTimer = setTimeout(() => {
          this.finalizeUtterance();
        }, this.silenceThresholdMs);
      }
    };

    this.recognition.onerror = (err) => {
      console.warn("Speech recognition notice:", err.error);
      if (err.error === 'not-allowed') {
        this.onStatusChange({ listening: false, text: "Mic permission denied" });
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      // Automatically restart continuous listening if not intentionally stopped
      if (!this.isPaused) {
        try {
          this.recognition.start();
        } catch (e) {
          // Ignore restart collisions
        }
      }
    };
  }

  start() {
    this.isPaused = false;
    if (this.recognition && !this.isListening) {
      try {
        this.recognition.start();
      } catch (e) {
        console.warn("Start error:", e);
      }
    }
  }

  stop() {
    this.isPaused = true;
    clearTimeout(this.silenceTimer);
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }
  }

  finalizeUtterance() {
    const text = this.accumulatedTranscript.trim();
    this.accumulatedTranscript = '';
    clearTimeout(this.silenceTimer);

    if (text.length > 3) {
      console.log("VAD Triggered utterance:", text);
      this.onUtterance(text);
    }
  }
}

window.VoiceActivitySTT = VoiceActivitySTT;
