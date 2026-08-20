// Cute Female Voice Engine for "Thư Ký Kim" (Vietnamese Voice Synthesis)
// Low-latency, lightweight Web Speech API with cute sweet female pitch modulation & auto-speak

class KimVoiceEngine {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeakingState: boolean = false;
  private listeners: Set<(speaking: boolean) => void> = new Set();
  private voices: SpeechSynthesisVoice[] = [];
  private selectedVoice: SpeechSynthesisVoice | null = null;

  // Dedicated Cute Female Voice Parameters
  private pitch: number = 1.18; // Giọng nữ dễ thương, trong trẻo (1.10 - 1.25)
  private rate: number = 1.02;  // Tốc độ nhanh nhẹn, tự nhiên, ngọt ngào (0.98 - 1.05)
  private volume: number = 1.0;
  private autoSpeak: boolean = true;
  private enabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();

      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }

      // Load saved preferences
      try {
        const savedAuto = localStorage.getItem('kim_voice_autospeak');
        if (savedAuto !== null) this.autoSpeak = savedAuto === 'true';

        const savedEnabled = localStorage.getItem('kim_voice_enabled');
        if (savedEnabled !== null) this.enabled = savedEnabled === 'true';

        const savedPitch = localStorage.getItem('kim_voice_pitch');
        if (savedPitch !== null) this.pitch = parseFloat(savedPitch);

        const savedRate = localStorage.getItem('kim_voice_rate');
        if (savedRate !== null) this.rate = parseFloat(savedRate);
      } catch {
        // Ignore
      }
    }
  }

  private loadVoices() {
    if (!this.synth) return;
    this.voices = this.synth.getVoices();

    // Priority matching for best Vietnamese Cute Female voice
    const viVoices = this.voices.filter(v => v.lang.includes('vi') || v.lang.includes('VI'));

    // 1. Check for Microsoft Edge Natural Female Vietnamese Voice (HoaiMy, Mai)
    const edgeNaturalFemale = viVoices.find(
      v =>
        (v.name.toLowerCase().includes('hoaimy') ||
          v.name.toLowerCase().includes('mai') ||
          v.name.toLowerCase().includes('linh') ||
          v.name.toLowerCase().includes('female')) &&
        (v.name.toLowerCase().includes('natural') || v.name.toLowerCase().includes('online'))
    );

    // 2. Check for any dedicated female Vietnamese voices (HoaiMy, Mai, Linh, Lan, Ngoc, Trang)
    const femaleVi = viVoices.find(
      v =>
        v.name.toLowerCase().includes('hoaimy') ||
        v.name.toLowerCase().includes('mai') ||
        v.name.toLowerCase().includes('linh') ||
        v.name.toLowerCase().includes('lan') ||
        v.name.toLowerCase().includes('ngoc') ||
        v.name.toLowerCase().includes('trang') ||
        v.name.toLowerCase().includes('female')
    );

    // 3. Google Vietnamese Neural Voice
    const googleVi = viVoices.find(v => v.name.toLowerCase().includes('google'));

    if (edgeNaturalFemale) {
      this.selectedVoice = edgeNaturalFemale;
    } else if (femaleVi) {
      this.selectedVoice = femaleVi;
    } else if (googleVi) {
      this.selectedVoice = googleVi;
    } else if (viVoices.length > 0) {
      this.selectedVoice = viVoices[0];
    } else {
      // Fallback to any natural voice
      this.selectedVoice = this.voices.find(v => v.default) || this.voices[0] || null;
    }
  }

  public getSelectedVoiceName(): string {
    return this.selectedVoice?.name || 'Giọng Nữ Dễ Thương (Thư Ký Kim)';
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.voices.filter(v => v.lang.includes('vi') || v.lang.includes('VI') || v.default);
  }

  public setVoiceByUri(uri: string) {
    const found = this.voices.find(v => v.voiceURI === uri);
    if (found) {
      this.selectedVoice = found;
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(v: boolean) {
    this.enabled = v;
    try {
      localStorage.setItem('kim_voice_enabled', String(v));
    } catch {}
    if (!v) this.stop();
  }

  public isAutoSpeak(): boolean {
    return this.autoSpeak;
  }

  public setAutoSpeak(v: boolean) {
    this.autoSpeak = v;
    try {
      localStorage.setItem('kim_voice_autospeak', String(v));
    } catch {}
  }

  public getPitch(): number {
    return this.pitch;
  }

  public setPitch(p: number) {
    this.pitch = Math.max(0.7, Math.min(1.8, p));
    try {
      localStorage.setItem('kim_voice_pitch', String(this.pitch));
    } catch {}
  }

  public getRate(): number {
    return this.rate;
  }

  public setRate(r: number) {
    this.rate = Math.max(0.7, Math.min(1.5, r));
    try {
      localStorage.setItem('kim_voice_rate', String(this.rate));
    } catch {}
  }

  public isSpeaking(): boolean {
    return this.isSpeakingState;
  }

  public subscribe(listener: (speaking: boolean) => void): () => void {
    this.listeners.add(listener);
    listener(this.isSpeakingState);
    return () => this.listeners.delete(listener);
  }

  private setSpeaking(speaking: boolean) {
    this.isSpeakingState = speaking;
    this.listeners.forEach(fn => fn(speaking));
  }

  /**
   * Filter and strip raw code blocks, markdown symbols, URLs for clean, natural speech
   */
  public cleanTextForSpeech(raw: string): string {
    let text = raw;

    // 1. Remove code blocks ```...```
    text = text.replace(/```[\s\S]*?```/g, ' [Khối mã lập trình] ');

    // 2. Remove inline code `...`
    text = text.replace(/`([^`]+)`/g, '$1');

    // 3. Remove URLs
    text = text.replace(/https?:\/\/\S+/g, 'đường dẫn');

    // 4. Remove Markdown images and links [text](url) -> text
    text = text.replace(/!\[(.*?)\]\(.*?\)/g, '$1');
    text = text.replace(/\[(.*?)\]\(.*?\)/g, '$1');

    // 5. Remove Markdown headers, bold, italics, blockquotes
    text = text.replace(/#{1,6}\s+/g, '');
    text = text.replace(/(\*\*|__)(.*?)\1/g, '$2');
    text = text.replace(/(\*|_)(.*?)\1/g, '$2');
    text = text.replace(/^\s*>\s+/gm, '');
    text = text.replace(/^\s*[-*+]\s+/gm, '');
    text = text.replace(/^\s*\d+\.\s+/gm, '');

    // 6. Clean special symbols & emojis
    text = text.replace(/[\u{1F300}-\u{1FAFF}\u{1F600}-\u{1F64F}\u{2600}-\u{26FF}]/gu, '');
    text = text.replace(/[•●★✦►▼■□|~^]/g, ' ');

    // 7. Normalize spaces
    text = text.replace(/\s+/g, ' ').trim();

    return text;
  }

  /**
   * Speak text with Cute Sweet Female Voice (Thư Ký Kim)
   */
  public speak(text: string, onEnd?: () => void) {
    if (!this.synth || !this.enabled) return;

    // Stop any ongoing speech
    this.stop();

    const cleaned = this.cleanTextForSpeech(text);
    if (!cleaned) return;

    const utterance = new SpeechSynthesisUtterance(cleaned);
    utterance.lang = 'vi-VN';
    utterance.pitch = this.pitch; // 1.18 (Cute Sweet Female)
    utterance.rate = this.rate;   // 1.02 (Lively, Sweet)
    utterance.volume = this.volume;

    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }

    utterance.onstart = () => {
      this.setSpeaking(true);
    };

    utterance.onend = () => {
      this.setSpeaking(false);
      this.currentUtterance = null;
      onEnd?.();
    };

    utterance.onerror = (e) => {
      if (e.error !== 'interrupted' && e.error !== 'canceled') {
        console.warn('Kim Voice Engine error:', e);
      }
      this.setSpeaking(false);
      this.currentUtterance = null;
    };

    this.currentUtterance = utterance;

    if (this.synth.paused) {
      this.synth.resume();
    }

    this.synth.speak(utterance);
  }

  /**
   * Stop current speech immediately
   */
  public stop() {
    if (!this.synth) return;
    try {
      this.synth.cancel();
    } catch {}
    this.setSpeaking(false);
    this.currentUtterance = null;
  }

  /**
   * Test current voice configuration
   */
  public testVoice() {
    this.speak('Dạ, em chào anh Vinh! Em là Thư Ký Kim, trợ lý ảo của anh. Em luôn sẵn sàng lắng nghe và hỗ trợ anh mọi lúc ạ!');
  }
}

export const deepVoice = new KimVoiceEngine();
