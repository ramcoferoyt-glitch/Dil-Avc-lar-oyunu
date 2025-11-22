
import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AudioService {
  audioContext: AudioContext | null = null;
  isMicrophoneActive = signal(false);
  
  private tensionInterval: any = null;

  constructor() {
    const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (AudioContext) {
      this.audioContext = new AudioContext();
    }
  }

  // --- PREMIUM SYNTHESIZER FX (CLEAN & PRO) ---

  private playTone(freq: number, type: OscillatorType, dur: number, vol = 0.1, when = 0, ramp = true) {
     if(!this.audioContext) return;
     if(this.audioContext.state === 'suspended') this.audioContext.resume();

     const t = this.audioContext.currentTime + when;
     const o = this.audioContext.createOscillator();
     const g = this.audioContext.createGain();
     
     o.type = type;
     o.frequency.setValueAtTime(freq, t);
     
     // Envelope to prevent clicking/popping
     g.gain.setValueAtTime(0, t);
     g.gain.linearRampToValueAtTime(vol, t + 0.01); // Smooth Attack
     
     if(ramp) {
         g.gain.exponentialRampToValueAtTime(0.001, t + dur); // Decay
     } else {
         g.gain.linearRampToValueAtTime(0, t + dur);
     }

     o.connect(g); 
     g.connect(this.audioContext.destination);
     
     o.start(t); 
     o.stop(t + dur + 0.1);
  }

  playOrbClick() {
    // Clean, high-tech glass tap
    this.playTone(1200, 'sine', 0.1, 0.05);
  }

  playTick() { 
    // Soft mechanical tick
    this.playTone(800, 'sine', 0.05, 0.02); 
  }
  
  playSuccess() { 
      // Uplifting, clean chime (C Major)
      const now = 0;
      this.playTone(523.25, 'sine', 0.6, 0.2, now); // C5
      this.playTone(659.25, 'sine', 0.6, 0.2, now + 0.1); // E5
      this.playTone(783.99, 'sine', 0.8, 0.2, now + 0.2); // G5
      this.playTone(1046.50, 'sine', 1.0, 0.1, now + 0.3); // C6
  }
  
  playFail() { 
      // Low, heavy thud (No harsh buzzing)
      const now = 0;
      this.playTone(150, 'sine', 0.4, 0.5, now);
      this.playTone(145, 'triangle', 0.4, 0.3, now); // Slight dissonance
  }

  playAlarm() {
      // Urgent but not ear-piercing
      if(!this.audioContext) return;
      for(let i=0; i<3; i++) {
        this.playTone(800, 'sine', 0.15, 0.2, i*0.25);
        this.playTone(400, 'sine', 0.15, 0.2, i*0.25 + 0.1);
      }
  }

  playVictory() {
      // Grand Orchestral Fanfare (Smoothed)
      [523, 659, 783, 1046, 1318, 1568].forEach((f, i) => this.playTone(f, 'triangle', 1.5, 0.1, i*0.1));
      // Bass root
      this.playTone(261, 'sine', 2.0, 0.3, 0.5); 
  }

  playGameStart() {
      // Deep cinematic boom (Sine wave only, no static)
      if(!this.audioContext) return;
      const t = this.audioContext.currentTime;
      const o = this.audioContext.createOscillator();
      const g = this.audioContext.createGain();
      
      o.type = 'sine';
      o.frequency.setValueAtTime(150, t);
      o.frequency.exponentialRampToValueAtTime(40, t + 2); // Pitch drop
      
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.5, t + 0.1);
      g.gain.linearRampToValueAtTime(0, t + 2);

      o.connect(g); 
      g.connect(this.audioContext.destination);
      o.start(t); 
      o.stop(t + 2.1);
  }

  playTension() {
      // "Heartbeat" Effect - No continuous drone/static
      this.stopTension();
      
      const beat = () => {
          // Thump-Thump
          this.playTone(60, 'sine', 0.15, 0.4, 0);      // Low Sub
          this.playTone(100, 'triangle', 0.05, 0.1, 0); // Slight attack
          
          setTimeout(() => {
              this.playTone(55, 'sine', 0.2, 0.3, 0);
          }, 250); // 250ms later
      };

      beat(); // First one immediate
      this.tensionInterval = setInterval(beat, 2000); // Every 2 seconds
  }

  stopTension() {
      if(this.tensionInterval) {
          clearInterval(this.tensionInterval);
          this.tensionInterval = null;
      }
  }
}
