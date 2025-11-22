
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../services/game.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-final-round',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="h-full flex flex-col items-center justify-center p-6 relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-950 to-black">
      
      <!-- Intro Screen (Waiting) -->
      @if (gameService.round3Stage() === 'WAITING') {
         <div class="text-center max-w-3xl z-10 animate-fade-in">
            <h2 class="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-purple-600 mb-6 tracking-tighter">
              BÜYÜK SORGULAMA
            </h2>
            <p class="text-xl text-slate-300 mb-12 leading-relaxed">
               Sadece en iyi 3 oyuncu buraya kadar gelebildi.<br>
               Şimdi gerçek sınav başlıyor.
            </p>

            <div class="grid grid-cols-3 gap-4 mb-12">
               @for(player of gameService.top3Players(); track player.id) {
                  <div class="flex flex-col items-center gap-3 bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                     <img [src]="player.avatar" class="w-20 h-20 rounded-full border-4 border-yellow-500">
                     <div class="font-bold text-xl text-white">{{ player.name }}</div>
                     <div class="text-yellow-400 font-mono">{{ player.score }} Puan</div>
                  </div>
               }
            </div>

            @if(isPatron()) {
               <div class="flex flex-col gap-4">
                  <p class="text-slate-500 text-sm uppercase font-bold mb-2">Aşamayı Başlat</p>
                  <div class="flex gap-4 justify-center flex-wrap">
                     <button (click)="gameService.triggerRound3Stage('WRONG_WORD')" class="px-8 py-4 bg-slate-800 hover:bg-red-900 border border-red-500 text-red-400 font-bold rounded-xl transition-all hover:scale-105">
                        1. YANLIŞ KELİME
                     </button>
                     <button (click)="gameService.triggerRound3Stage('QUERY')" class="px-8 py-4 bg-slate-800 hover:bg-blue-900 border border-blue-500 text-blue-400 font-bold rounded-xl transition-all hover:scale-105">
                        2. SORGU
                     </button>
                     <button (click)="gameService.triggerRound3Stage('RIDDLE')" class="px-8 py-4 bg-slate-800 hover:bg-purple-900 border border-purple-500 text-purple-400 font-bold rounded-xl transition-all hover:scale-105">
                        3. BİLMECE
                     </button>
                  </div>
               </div>
            } @else {
               <p class="text-slate-500 animate-pulse">Yönetici aşamayı başlatacak...</p>
            }
         </div>
      } @else if (gameService.gameState() === 'WINNER_REVEAL') {
          <!-- Winner Screen -->
          <div class="text-center z-10 animate-zoom-in">
              <div class="text-9xl mb-6 drop-shadow-[0_0_50px_rgba(234,179,8,0.8)]">👑</div>
              <h2 class="text-6xl font-black text-yellow-500 mb-2">KAZANAN</h2>
              <h1 class="text-8xl font-black text-white mb-8">{{ gameService.winnerPlayer()?.name }}</h1>
              <p class="text-2xl text-slate-300">Dil Avcıları Şampiyonu</p>
              <div class="text-4xl font-mono text-yellow-400 font-bold mt-4">{{ gameService.winnerPlayer()?.score }} PUAN</div>
              
              <div class="flex gap-4 justify-center mt-12">
                  <button (click)="gameService.restartGame()" class="px-8 py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-colors">
                      TEKRAR OYNA
                  </button>
                  <button (click)="gameService.leaveGame()" class="px-8 py-4 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-colors">
                      ANA MENÜ
                  </button>
              </div>
          </div>
      } @else {
         <!-- Active Puzzle Stage -->
         <div class="max-w-4xl w-full z-10 flex flex-col h-full py-4">
            <div class="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
               <button (click)="gameService.round3Stage.set('WAITING')" class="text-slate-400 hover:text-white">← Geri</button>
               <div class="text-2xl font-bold text-white uppercase tracking-widest">
                  {{ getStageName(gameService.round3Stage()) }}
               </div>
            </div>

            <div class="flex-1 flex flex-col items-center justify-center text-center">
               @if(gameService.finalRoundContent(); as content) {
                  <div class="bg-black/40 backdrop-blur-md border-2 border-slate-600 p-8 md:p-12 rounded-3xl shadow-2xl w-full mb-8">
                     <div class="text-3xl md:text-5xl font-medium text-white leading-relaxed whitespace-pre-wrap font-mono">
                        {{ content }}
                     </div>
                  </div>
               } @else {
                  <div class="w-16 h-16 border-4 border-t-transparent border-white rounded-full animate-spin"></div>
               }

               <!-- Active Player Selection for Round 3 -->
               @if(gameService.activePlayer(); as p) {
                  <div class="flex items-center gap-4 bg-slate-800 px-6 py-3 rounded-full mb-6 animate-bounce-subtle">
                     <img [src]="p.avatar" class="w-12 h-12 rounded-full">
                     <div class="text-xl font-bold">{{ p.name }} Yanıtlıyor...</div>
                  </div>
               } @else {
                  <!-- Select Player to Answer -->
                   <div class="grid grid-cols-3 gap-4 w-full max-w-2xl mb-6">
                       @for(p of gameService.top3Players(); track p.id) {
                           <button (click)="gameService.setPlayerOnStage(p.id)" 
                                   class="bg-slate-800 hover:bg-slate-700 p-4 rounded-xl border border-slate-600 hover:border-yellow-500 transition-all flex flex-col items-center">
                               <img [src]="p.avatar" class="w-12 h-12 rounded-full mb-2">
                               <span class="font-bold text-sm">{{ p.name }}</span>
                               <span class="text-xs text-yellow-500">{{ p.score }} Puan</span>
                           </button>
                       }
                   </div>
               }

               <!-- Judge Controls -->
               @if(isPatron() && gameService.activePlayer()) {
                  <div class="flex gap-6 w-full max-w-xl">
                     <button (click)="gameService.judgeRound3(gameService.activePlayerId()!, true)" class="flex-1 py-6 bg-green-600 hover:bg-green-500 rounded-xl font-black text-2xl shadow-lg transition-transform hover:scale-105">
                        DOĞRU (+50)
                     </button>
                     <button (click)="gameService.judgeRound3(gameService.activePlayerId()!, false)" class="flex-1 py-6 bg-red-600 hover:bg-red-500 rounded-xl font-black text-2xl shadow-lg transition-transform hover:scale-105">
                        YANLIŞ (-20)
                     </button>
                  </div>
               }
               
               <!-- Declare Winner Button (Only visible after rounds) -->
               @if(isPatron() && !gameService.activePlayer()) {
                   <div class="mt-12 pt-12 border-t border-slate-800 w-full flex justify-center">
                       <button (click)="gameService.finalizeRound3()" class="bg-gradient-to-r from-yellow-600 to-yellow-500 text-black px-8 py-4 rounded-full font-black text-xl shadow-[0_0_30px_rgba(234,179,8,0.4)] hover:scale-105 transition-transform">
                          FİNALİ SONUÇLANDIR VE KAZANANI AÇIKLA 👑
                       </button>
                   </div>
               }
            </div>
         </div>
      }
    </div>
  `,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.5s ease-out; }
    .animate-zoom-in { animation: zoomIn 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes zoomIn { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  `]
})
export class FinalRoundComponent {
  gameService = inject(GameService);
  authService = inject(AuthService);

  isPatron() {
      const me = this.authService.currentUser();
      return this.gameService.currentPatron()?.id === me?.id;
  }

  getStageName(s: string) {
      if(s === 'WRONG_WORD') return '1. Yanlış Kelime Avı';
      if(s === 'QUERY') return '2. İngilizce Sorgu';
      if(s === 'RIDDLE') return '3. Büyük Bilmece';
      return '';
  }
}
