// Speech Recognition & Wake Word ("Kim" / "Thư Ký Kim") Engine with 1s Silence Detection
// Uses Web Speech Recognition API with Continuous Listening, Wake Word Detection, and 1000ms Debounce

export interface SpeechRecognitionResultPayload {
  raw: string;
  command: string;
  wakeWordDetected: boolean;
  confidence: number;
}

class KimSpeechRecognitionEngine {
  private recognition: any = null;
  private isListeningState: boolean = false;
  private isWakeWordActive: boolean = true;
  private isContinuousListening: boolean = false;
  private silenceTimer: any = null;
  private silenceDurationMs: number = 1000; // 1 second pause detection
  private currentTranscript: string = '';
  private interimTranscript: string = '';

  private wakeWords: string[] = [
    'thư ký kim',
    'thu ky kim',
    'thư kí kim',
    'thu ki kim',
    'em kim ơi',
    'em kim',
    'kim ơi',
    'chị kim',
    'cô kim',
    'kim',
    'hey kim',
    'ok kim',
    'alo kim',
    'alô kim',
  ];

  // Callbacks
  private onWakeWordDetectedCallback: (() => void) | null = null;
  private onInterimCallback: ((text: string) => void) | null = null;
  private onCommandFinalizedCallback: ((result: SpeechRecognitionResultPayload) => void) | null = null;
  private onStateChangeCallback: ((listening: boolean) => void) | null = null;

  constructor() {
    this.initRecognition();
  }

  private initRecognition() {
    if (typeof window === 'undefined') return;

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      console.warn('SpeechRecognition API is not supported in this browser.');
      return;
    }

    try {
      this.recognition = new SpeechRec();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'vi-VN';
      this.recognition.maxAlternatives = 1;

      this.recognition.onstart = () => {
        this.isListeningState = true;
        this.onStateChangeCallback?.(true);
      };

      this.recognition.onend = () => {
        this.isListeningState = false;
        this.onStateChangeCallback?.(false);

        // Auto restart if continuous listening is enabled
        if (this.isContinuousListening) {
          try {
            this.recognition.start();
          } catch {
            // Ignore start errors
          }
        }
      };

      this.recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          console.warn('SpeechRecognition Error:', event.error);
        }
      };

      this.recognition.onresult = (event: any) => {
        this.handleSpeechResult(event);
      };
    } catch (err) {
      console.warn('Failed to initialize SpeechRecognition:', err);
    }
  }

  private handleSpeechResult(event: any) {
    let interim = '';
    let finalChunk = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const trans = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalChunk += trans;
      } else {
        interim += trans;
      }
    }

    const liveText = (this.currentTranscript + ' ' + finalChunk + ' ' + interim).trim();
    this.interimTranscript = liveText;
    this.onInterimCallback?.(liveText);

    // Reset silence timer on every new speech chunk
    this.clearSilenceTimer();

    // Check wake word if not yet activated in this session
    const lowerText = liveText.toLowerCase();
    const hasWakeWord = this.wakeWords.some(w => lowerText.includes(w));

    if (hasWakeWord) {
      this.onWakeWordDetectedCallback?.();
    }

    // Set 1-second silence timer to finalize the command
    this.silenceTimer = setTimeout(() => {
      this.finalizeCommand(liveText);
    }, this.silenceDurationMs);
  }

  private finalizeCommand(text: string) {
    this.clearSilenceTimer();
    const cleaned = text.trim();
    if (!cleaned) return;

    // Check and strip wake word prefix
    let command = cleaned;
    let wakeWordFound = false;

    // Sort wake words by length descending so longer phrases match first
    const sortedWakeWords = [...this.wakeWords].sort((a, b) => b.length - a.length);

    for (const w of sortedWakeWords) {
      const regex = new RegExp(`^(${w})\\b[,\\s]*`, 'i');
      if (regex.test(command)) {
        wakeWordFound = true;
        command = command.replace(regex, '').trim();
        break;
      }
    }

    // Also check if wake word is anywhere in the sentence
    if (!wakeWordFound) {
      for (const w of sortedWakeWords) {
        if (command.toLowerCase().includes(w)) {
          wakeWordFound = true;
          command = command.replace(new RegExp(`\\b${w}\\b`, 'gi'), '').trim();
          break;
        }
      }
    }

    const finalPayload: SpeechRecognitionResultPayload = {
      raw: cleaned,
      command: command || cleaned,
      wakeWordDetected: wakeWordFound,
      confidence: 0.95,
    };

    this.currentTranscript = '';
    this.interimTranscript = '';

    this.onCommandFinalizedCallback?.(finalPayload);
  }

  private clearSilenceTimer() {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }

  public startListening(continuous: boolean = false) {
    if (!this.recognition) return false;
    this.isContinuousListening = continuous;
    this.currentTranscript = '';
    this.interimTranscript = '';

    try {
      this.recognition.start();
      return true;
    } catch {
      return false;
    }
  }

  public stopListening() {
    this.isContinuousListening = false;
    this.clearSilenceTimer();
    if (!this.recognition) return;

    try {
      this.recognition.stop();
    } catch {}
  }

  public isSupported(): boolean {
    return this.recognition !== null;
  }

  public isListening(): boolean {
    return this.isListeningState;
  }

  public setSilenceDuration(ms: number) {
    this.silenceDurationMs = Math.max(500, Math.min(5000, ms));
  }

  public getSilenceDuration(): number {
    return this.silenceDurationMs;
  }

  // Event Listeners
  public onWakeWord(callback: () => void) {
    this.onWakeWordDetectedCallback = callback;
  }

  public onInterim(callback: (text: string) => void) {
    this.onInterimCallback = callback;
  }

  public onCommandFinalized(callback: (result: SpeechRecognitionResultPayload) => void) {
    this.onCommandFinalizedCallback = callback;
  }

  public onStateChange(callback: (listening: boolean) => void) {
    this.onStateChangeCallback = callback;
  }
}

export const speechEngine = new KimSpeechRecognitionEngine();
