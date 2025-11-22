
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService, GameCard } from '../services/game.service';

@Component({
  selector: 'app-game-round',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-8 h-full flex flex-col items-center justify-center overflow-y-auto custom-scrollbar relative">
      
      <!-- Warning Toast -->
      @if (showWarning) {
          <div class="absolute top-4 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-lg font-bold shadow-xl z-50 animate-bounce" role="alert">
              ⚠️ ÖNCE BİR OYUNCUYU SAHNEYE ALIN!
          </div>
      }

      <!-- GAME SHOW GRID -->
      <div class="grid gap-6 w-full max-w-6xl perspective-1000"
           [ngClass]="{
              'grid-cols-3 md:grid-cols-5': gameService.gameState() === 'ROUND_1',
              'grid-cols-3 md:grid-cols-5': gameService.gameState() === 'ROUND_2'
           }"
           role="list"
           aria-label="Oyun Kartları Paneli">
           
        @for (card of gameService.currentRoundCards(); track card.id) {
          <button 
            (click)="revealIfActive(card)"
            [disabled]="card.completed || !!gameService.activeCard()"
            [attr.aria-label]="card.ariaLabel"
            class="relative group aspect-[4/3] md:aspect-square transition-all duration-500 transform-style-3d outline-none focus:ring-4 focus:ring-white/50 rounded-xl"
            [ngClass]="{
               'opacity-40 grayscale cursor-not-allowed scale-95': card.completed,
               'cursor-pointer hover:scale-105 hover:z-10': !card.completed && !gameService.activeCard(),
               'cursor-wait': !!gameService.activeCard() && !card.completed
            }">
            
            <!-- PANEL CONTAINER -->
            <div class="absolute inset-0 rounded-xl shadow-2xl transition-all duration-500 flex flex-col items-center justify-center border-2 overflow-hidden"
                 [ngClass]="{
                    'bg-gradient-to-b from-yellow-600 to-yellow-800 border-yellow-400 shadow-yellow-900/50': card.orbType === 'GOLD',
                    'border-white/20 shadow-black': card.orbType === 'COLOR',
                    'rotate-y-180': card.completed
                 }"
                 [style.background]="card.orbType === 'COLOR' ? '' : null"
                 [ngClass]="card.orbType === 'COLOR' ? card.colorClass : ''">
                 
                 <!-- SHINE EFFECT -->
                 <div class="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-50 pointer-events-none"></div>
                 
                 @if (card.orbType === 'GOLD') {
                    <span class="text-4xl md:text-6xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] font-mono z-10" aria-hidden="true">
                        {{ card.label }}
                    </span>
                    @if (gameService.activePlayerId()) {
                        <div class="text-[10px] uppercase tracking-widest text-yellow-200 mt-2 font-bold z-10 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true">
                            SEÇ
                        </div>
                    }
                 } 
                 @else {
                    <!-- Visual Only ? Mark -->
                    <span class="text-5xl font-black text-white opacity-50 group-hover:opacity-100 transition-opacity z-10" aria-hidden="true">?</span>
                 }

                 <!-- COMPLETED OVERLAY -->
                 @if(card.completed) {
                     <div class="absolute inset-0 bg-black/80 flex items-center justify-center z-20">
                        <span class="text-green-500 font-black text-2xl border-2 border-green-500 px-2 py-1 rounded -rotate-12">TAMAMLANDI</span>
                     </div>
                 }
            </div>
            
            <!-- Reflection/Floor Glow -->
            @if(!card.completed) {
               <div class="absolute -bottom-4 left-2 right-2 h-4 bg-black/50 blur-md rounded-[50%] pointer-events-none"></div>
            }
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    .perspective-1000 { perspective: 1000px; }
    .transform-style-3d { transform-style: preserve-3d; }
    .rotate-y-180 { transform: rotateY(180deg); }
  `]
})
export class GameRoundComponent {
  gameService = inject(GameService);
  showWarning = false;

  revealIfActive(card: GameCard) {
      if (card.completed || this.gameService.activeCard()) return;

      if (!this.gameService.activePlayerId()) {
          this.triggerWarning();
          return;
      }
      
      this.gameService.revealCard(card.id, 'ANY');
  }

  triggerWarning() {
      this.showWarning = true;
      setTimeout(() => this.showWarning = false, 2000);
  }
}
