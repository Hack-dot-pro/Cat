// Vietnamese Robotic Text-To-Speech (TTS) Engine for CAT AI
// Generates futuristic holographic robotic voice in Vietnamese

import { sounds } from './sound';

export interface RobotVoiceOptions {
  pitch?: number;
  rate?: number;
  volume?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

class RobotVoiceService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private enabled: boolean = true;
  private autoSpeak: boolean = true;
  private pitch: number = 0.88; // Slightly robotic/deep tone
  private rate: number = 1.08;  // Fast, precise robotic cadence
  private volume: number = 0.9;
  private voices: SpeechSynthesisVoice[] = [];
  private selectedVoiceURI: string = '';
  private isCurrentlySpeaking: boolean = false;
  private listeners: ((speaking: boolean) => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadSettings();
      this.initVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.initVoices();
      }
    }
  }

  private loadSettings() {
    try {
      const enabledPref = localStorage.getItem('cat_tts_enabled');
      if (enabledPref !== null) this.enabled = enabledPref === 'true';

      const autoPref = localStorage.getItem('cat_tts_autospeak');
      if (autoPref !== null) this.autoSpeak = autoPref === 'true';

      const pitchPref = localStorage.getItem('cat_tts_pitch');
      if (pitchPref !== null) this.pitch = parseFloat(pitchPref);

      const ratePref = localStorage.getItem('cat_tts_rate');
      if (ratePref !== null) this.rate = parseFloat(ratePref);

      const voicePref = localStorage.getItem('cat_tts_voice_uri');
      if (voicePref) this.selectedVoiceURI = voicePref;
    } catch {}
  }

  private initVoices() {
    if (!this.synth) return;
    this.voices = this.synth.getVoices();
  }

  public getVietnameseVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    if (this.voices.length === 0) {
      this.voices = this.synth.getVoices();
    }
    return this.voices.filter(
      v =>
        v.lang.toLowerCase().includes('vi') ||
        v.name.toLowerCase().includes('vietnam') ||
        v.name.toLowerCase().includes('tiếng việt') ||
        v.lang.startsWith('vi')
    );
  }

  public getAllVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    if (this.voices.length === 0) {
      this.voices = this.synth.getVoices();
    }
    return this.voices;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
    try {
      localStorage.setItem('cat_tts_enabled', String(enabled));
    } catch {}
    if (!enabled) this.stop();
  }

  public isAutoSpeak(): boolean {
    return this.autoSpeak;
  }

  public setAutoSpeak(auto: boolean) {
    this.autoSpeak = auto;
    try {
      localStorage.setItem('cat_tts_autospeak', String(auto));
    } catch {}
  }

  public getPitch(): number {
    return this.pitch;
  }

  public setPitch(pitch: number) {
    this.pitch = Math.max(0.5, Math.min(2.0, pitch));
    try {
      localStorage.setItem('cat_tts_pitch', String(this.pitch));
    } catch {}
  }

  public getRate(): number {
    return this.rate;
  }

  public setRate(rate: number) {
    this.rate = Math.max(0.5, Math.min(2.0, rate));
    try {
      localStorage.setItem('cat_tts_rate', String(this.rate));
    } catch {}
  }

  public getSelectedVoiceURI(): string {
    return this.selectedVoiceURI;
  }

  public setSelectedVoiceURI(uri: string) {
    this.selectedVoiceURI = uri;
    try {
      localStorage.setItem('cat_tts_voice_uri', uri);
    } catch {}
  }

  public isSpeaking(): boolean {
    return this.isCurrentlySpeaking;
  }

  public onSpeakingChange(fn: (speaking: boolean) => void) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  private notifySpeaking(speaking: boolean) {
    this.isCurrentlySpeaking = speaking;
    this.listeners.forEach(fn => fn(speaking));
  }

  // Clean Markdown, code blocks and special characters for natural Vietnamese speech
  public cleanTextForSpeech(raw: string): string {
    let clean = raw
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, ' Đoạn mã lập trình. ')
      // Remove inline code
      .replace(/`([^`]+)`/g, '$1')
      // Remove images and markdown links
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      // Remove markdown headers, bold, italics, bullets
      .replace(/#{1,6}\s+/g, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/^[\s*-+]\s+/gm, '')
      .replace(/^\d+\.\s+/gm, '')
      // Remove emojis & special math symbols
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .replace(/[|—–_~`^]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // If text is too long for one utterance, cap it cleanly
    if (clean.length > 600) {
      clean = clean.slice(0, 600) + '... và các thông tin chi tiết khác.';
    }

    return clean;
  }

  public speak(text: string, options?: RobotVoiceOptions): Promise<void> {
    return new Promise((resolve) => {
      if (!this.synth || !this.enabled) {
        resolve();
        return;
      }

      this.stop();

      const clean = this.cleanTextForSpeech(text);
      if (!clean) {
        resolve();
        return;
      }

      // Play robotic radio transmission chirp before speaking
      sounds.playMessage();

      const utterance = new SpeechSynthesisUtterance(clean);
      this.currentUtterance = utterance;

      // Select Vietnamese voice
      const viVoices = this.getVietnameseVoices();
      let chosenVoice: SpeechSynthesisVoice | undefined;

      if (this.selectedVoiceURI) {
        chosenVoice = this.voices.find(v => v.voiceURI === this.selectedVoiceURI);
      }
      if (!chosenVoice && viVoices.length > 0) {
        // Prefer Google Tiếng Việt or Microsoft voices
        chosenVoice =
          viVoices.find(v => v.name.includes('Google') || v.name.includes('HoaiMy') || v.name.includes('Nam')) ||
          viVoices[0];
      }

      if (chosenVoice) {
        utterance.voice = chosenVoice;
        utterance.lang = chosenVoice.lang;
      } else {
        utterance.lang = 'vi-VN';
      }

      utterance.pitch = options?.pitch ?? this.pitch;
      utterance.rate = options?.rate ?? this.rate;
      utterance.volume = options?.volume ?? this.volume;

      utterance.onstart = () => {
        this.notifySpeaking(true);
        options?.onStart?.();
      };

      utterance.onend = () => {
        this.notifySpeaking(false);
        this.currentUtterance = null;
        options?.onEnd?.();
        resolve();
      };

      utterance.onerror = (e) => {
        this.notifySpeaking(false);
        this.currentUtterance = null;
        options?.onError?.(e);
        resolve();
      };

      // Speak
      setTimeout(() => {
        if (this.synth) {
          this.synth.speak(utterance);
        }
      }, 50);
    });
  }

  public stop() {
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch {}
    }
    this.notifySpeaking(false);
    this.currentUtterance = null;
  }

  public pause() {
    if (this.synth && this.isCurrentlySpeaking) {
      this.synth.pause();
    }
  }

  public resume() {
    if (this.synth && this.synth.paused) {
      this.synth.resume();
    }
  }
}

export const robotVoice = new RobotVoiceService();
