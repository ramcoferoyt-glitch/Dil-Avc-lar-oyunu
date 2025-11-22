import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../services/game.service';

@Component({
  selector: 'app-scoreboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-slate-900/95 border-l border-slate-800 h-full flex flex-col text-white shadow-2xl">
      <!-- Team Scores Header -->
      <div class="p-4 grid grid-cols-2 gap-2 border-b border-slate-700 bg-slate-800/50">
        <div class="text-center p-2 rounded bg-yellow-900/20 border border-yellow-600/30">
           <div class="text-[10px] text-yellow-500 uppercase font-bold tracking-wider">KRAL T.</div>
           <div class="text-2xl font-bold text-white">{{ gameService.kingTeamScore() }}</div>
        </div>
        <div class="text-center p-2 rounded bg-pink-900/20 border border-pink-600/30">
           <div class="text-[10px] text-pink-500 uppercase font-bold tracking-wider">KRALİÇE T.</div>
           <div class="text-2xl font-bold text-white">{{ gameService.queenTeamScore() }}</div>
        </div>
      </div>

      <div class="p-4 bg-slate-800/30">
         <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Yönetici (Patron)</h4>
         @if (gameService.currentPatron(); as patron) {
           <div class="flex items-center gap-2 text-yellow-400 font-bold">
             <span class="bg-yellow-500 text-black text-xs px-1 rounded">P</span> {{ patron.name }}
           </div>
         } @else {
           <span class="text-slate-500 text-xs">Atanmadı</span>
         }
      </div>

      <div class="flex-1 overflow-y-auto space-y-1 custom-scrollbar p-2">
        @for (player of sortedPlayers(); track player.id) {
          <div class="flex items-center justify-between p-2 rounded hover:bg-slate-800 transition-colors border-l-2" 
               [ngClass]="{'border-yellow-500': player.team === 'KING', 'border-pink-500': player.team === 'QUEEN'}">
            <div class="flex items-center gap-2 overflow-hidden">
              <div class="w-2 h-2 rounded-full flex-shrink-0" [style.backgroundColor]="player.avatarColor"></div>
              <div class="truncate text-sm">
                <span class="font-medium" [ngClass]="{'line-through text-slate-500': player.status === 'ELIMINATED'}">{{ player.name }}</span>
                @if(player.isSpy) { <span class="text-[10px] text-red-400 ml-1">(Casus)</span> }
              </div>
            </div>
            <div class="flex items-center gap-2 flex-shrink-0">
              <span class="font-bold text-sm">{{ player.score }}</span>
              <div class="flex flex-col gap-0.5">
                <button (click)="gameService.updateScore(player.id, 10)" class="w-4 h-4 flex items-center justify-center text-[10px] bg-green-900 text-green-300 rounded hover:bg-green-800">+</button>
                <button (click)="gameService.updateScore(player.id, -5)" class="w-4 h-4 flex items-center justify-center text-[10px] bg-red-900 text-red-300 rounded hover:bg-red-800">-</button>
              </div>
            </div>
          </div>
        }
      </div>

      <div class="p-2 border-t border-slate-700 bg-black/40">
        <div class="font-mono text-[10px] text-green-400 h-24 overflow-y-auto flex flex-col-reverse custom-scrollbar">
          @for (log of gameService.gameLog(); track $index) {
            <div class="opacity-70">{{ log }}</div>
          }
        </div>
      </div>
    </div>
  `
})
export class ScoreboardComponent {
  gameService = inject(GameService);

  get sortedPlayers() {
    return () => [...this.gameService.players()].sort((a, b) => b.score - a.score);
  }
}