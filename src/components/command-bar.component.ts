import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameService } from '../services/game.service';

@Component({
  selector: 'app-command-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-16 bg-slate-900 border-t border-slate-700 flex items-center px-6 gap-4">
      <div class="flex-1 relative">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-purple-500">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
        </span>
        <input 
          type="text" 
          [(ngModel)]="commandText"
          (keyup.enter)="sendCommand()"
          placeholder="Sesli komut simülasyonu: 'Yeni görev üret', '1. Tur başlasın'..." 
          class="w-full bg-slate-800 text-white border border-slate-600 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:border-purple-500 font-mono text-sm shadow-inner"
        />
      </div>
      <button (click)="sendCommand()" class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-full font-bold text-sm transition-colors">
        GÖNDER
      </button>
    </div>
  `
})
export class CommandBarComponent {
  gameService = inject(GameService);
  commandText = '';

  sendCommand() {
    if (this.commandText.trim()) {
      this.gameService.processCommand(this.commandText);
      this.commandText = '';
    }
  }
}