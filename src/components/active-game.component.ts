
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameService, Player } from '../services/game.service';
import { AuthService } from '../services/auth.service';
import { GameRoundComponent } from './game-round.component';
import { FinalRoundComponent } from './final-round.component';
import { SpyRoundComponent } from './spy-round.component';
import { SocialService } from '../services/social.service';
import { AppComponent } from '../app.component';

@Component({
  selector: 'app-active-game',
  standalone: true,
  imports: [CommonModule, FormsModule, GameRoundComponent, FinalRoundComponent, SpyRoundComponent],
  template: `
    <div class="h-full w-full flex flex-col relative overflow-hidden select-none font-sans bg-black">
      
      <!-- === BASE LAYER: ROOM BACKGROUND === -->
      <div class="absolute inset-0 z-0">
         <div class="absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-in-out transform scale-105"
              [style.backgroundImage]="'url(' + gameService.settings().backgroundImage + ')'">
         </div>
         <div class="absolute inset-0 bg-gradient-to-b from-black/80 via-black/20 to-black/90"></div>
      </div>

      <!-- === TOP BAR (TRANSPARENT HEADER) === -->
      <div class="absolute top-0 left-0 w-full z-40 pt-safe-top px-4 py-3 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
          
          <!-- LEFT: Room Info -->
          <div class="flex items-center gap-3 pointer-events-auto">
              <div class="relative group cursor-pointer">
                  <div class="w-10 h-10 rounded-full border-2 border-yellow-500 overflow-hidden bg-slate-800 shadow-md">
                      <img [src]="hostUser()?.avatar" class="w-full h-full object-cover">
                  </div>
              </div>
              <div class="flex flex-col drop-shadow-md">
                  <h3 class="text-white font-bold text-sm leading-tight tracking-wide">{{ gameService.settings().roomName }}</h3>
                  <div class="flex items-center gap-2 mt-0.5">
                     <div class="bg-black/40 px-2 py-0.5 rounded text-[10px] text-slate-300 border border-white/10 backdrop-blur-sm">
                        {{ gameService.players().length }} Oyuncu
                     </div>
                  </div>
              </div>
          </div>

          <!-- RIGHT: Controls -->
          <div class="flex items-center gap-3 pointer-events-auto">
               <!-- Global Sound -->
               <button (click)="gameService.toggleGlobalSound()" class="w-10 h-10 rounded-full bg-black/40 border border-white/10 flex items-center justify-center transition-all hover:bg-white/10 backdrop-blur-md">
                    <span class="text-lg">{{ gameService.isGlobalSoundMuted() ? '🔇' : '🔊' }}</span>
               </button>

               <!-- HAMBURGER MENU (HOST ONLY) -->
               @if(isMePatron()) {
                   <button (click)="showSettingsDrawer = true" class="w-10 h-10 rounded-full bg-yellow-500 text-black flex items-center justify-center shadow-lg shadow-yellow-500/20 active:scale-95 transition-transform">
                       <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 6h16M4 12h16M4 18h16" />
                       </svg>
                   </button>
               }
               <!-- EXIT -->
               <button (click)="minimizeRoom()" class="w-10 h-10 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-white hover:bg-red-900/40 backdrop-blur-md">
                   ✕
               </button>
          </div>
      </div>

      <!-- === GAME AREA === -->
      <div class="absolute inset-0 z-20 flex flex-col pt-20 pb-24 pointer-events-none">
         
         <!-- TURN INDICATOR -->
         @if(gameService.activePlayer(); as activeP) {
            <div class="w-full flex justify-center mb-4 pointer-events-auto animate-slide-down">
                <div class="bg-black/60 backdrop-blur-xl border border-yellow-500/30 pr-5 pl-2 py-2 rounded-full flex items-center gap-3 shadow-2xl">
                    <div class="relative">
                        <img [src]="activeP.avatar" class="w-10 h-10 rounded-full border-2 border-white">
                        <div class="absolute inset-0 rounded-full border-2 border-yellow-500 animate-ping opacity-50"></div>
                    </div>
                    <div class="flex flex-col">
                        <span class="text-[9px] text-yellow-500 font-black uppercase tracking-widest leading-none mb-1">ŞİMDİ</span>
                        <span class="text-white font-bold text-sm leading-none">{{ activeP.name }}</span>
                    </div>
                    @if(gameService.isTimerRunning()) {
                        <div class="w-10 h-10 flex items-center justify-center rounded-full bg-red-600 text-white font-black text-lg ml-2 shadow-lg border-2 border-red-400">
                           {{ gameService.timerValue() }}
                        </div>
                    }
                </div>
            </div>
         }

         <!-- MAIN GAME BOARD -->
         @if(isGameActive()) {
             <div class="flex-1 w-full max-w-4xl mx-auto px-2 flex items-center justify-center pointer-events-auto">
                 <div class="w-full bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-3xl shadow-2xl overflow-hidden relative flex flex-col h-full max-h-[70vh] animate-in fade-in zoom-in duration-500">
                     
                     <div class="flex-1 overflow-hidden relative w-full">
                          @if(gameService.gameState() === 'ROUND_1' || gameService.gameState() === 'ROUND_2') {
                              <app-game-round />
                          } @else if(gameService.gameState() === 'ROUND_3' || gameService.gameState() === 'WINNER_REVEAL') {
                              <app-final-round />
                          } @else if(gameService.gameState() === 'TRANSITION') {
                              <div class="flex flex-col items-center justify-center h-full text-center p-6">
                                  <div class="text-6xl mb-6 animate-bounce drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]">🚀</div>
                                  <h2 class="text-4xl font-black text-white mb-3 tracking-tight">{{ gameService.transitionTitle() }}</h2>
                                  <p class="text-lg text-blue-400 font-mono uppercase tracking-widest border-t border-blue-500/30 pt-4">{{ gameService.transitionSubtitle() }}</p>
                              </div>
                          }
                     </div>

                     <!-- BIG CARD OVERLAY (FOCUS MODE) -->
                     @if(gameService.activeCard(); as card) {
                         <div class="absolute inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
                             @if(card.isRevealed && card.content !== 'YÜKLENİYOR...') {
                                 <div class="px-4 py-1.5 rounded-full bg-slate-800 border border-slate-600 text-[10px] text-slate-400 font-bold mb-8 uppercase tracking-widest">
                                    {{ card.type === 'TASK' ? 'GÖREV' : (card.type === 'PUNISHMENT' ? 'CEZA' : 'ŞANS') }}
                                 </div>
                                 
                                 <div class="text-2xl md:text-3xl font-black text-white mb-12 leading-relaxed font-sans drop-shadow-xl max-w-lg">
                                    "{{ card.content }}"
                                 </div>
                                 
                                 @if(isMePatron()) {
                                     <div class="flex gap-4 w-full max-w-xs">
                                         <button (click)="gameService.judgeActivePlayer(true)" class="flex-1 py-4 bg-green-600 text-white rounded-xl font-bold shadow-lg active:scale-95 transition-transform flex flex-col items-center gap-1">
                                             <span class="text-2xl">✅</span>
                                             <span class="text-[10px]">BAŞARILI</span>
                                         </button>
                                         <button (click)="gameService.judgeActivePlayer(false)" class="flex-1 py-4 bg-red-600 text-white rounded-xl font-bold shadow-lg active:scale-95 transition-transform flex flex-col items-center gap-1">
                                             <span class="text-2xl">❌</span>
                                             <span class="text-[10px]">BAŞARISIZ</span>
                                         </button>
                                     </div>
                                 } @else {
                                     <div class="flex items-center gap-2 text-yellow-500 font-bold animate-pulse bg-yellow-900/20 px-4 py-2 rounded-full text-xs">
                                         <span>⏳</span> Yönetici Kararı Bekleniyor...
                                     </div>
                                 }
                             } @else {
                                 <div class="w-12 h-12 border-4 border-t-transparent border-yellow-500 rounded-full animate-spin mb-6"></div>
                                 <p class="text-slate-400 text-sm font-bold tracking-wide">Yapay Zeka Üretiyor...</p>
                             }
                         </div>
                     }
                 </div>
             </div>
         }
      </div>

      <!-- === PLAYER AVATARS (SCROLLABLE) === -->
      <div class="absolute bottom-[70px] left-0 w-full z-20 pointer-events-auto bg-gradient-to-t from-black via-black/80 to-transparent pb-4 pt-10">
         <div class="flex overflow-x-auto px-4 gap-4 no-scrollbar items-end h-24">
             @for(p of stagePlayers(); track p.id) {
                 <div (click)="openPlayerMenu(p)" class="flex-shrink-0 flex flex-col items-center relative group cursor-pointer transition-transform active:scale-95" 
                      [class.scale-110]="gameService.activePlayerId() === p.id">
                     
                     <div class="relative w-12 h-12">
                         @if(gameService.activePlayerId() === p.id) {
                            <div class="absolute -inset-2 rounded-full bg-yellow-500 blur-md opacity-50 animate-pulse"></div>
                         }
                         <img [src]="p.avatar" class="w-full h-full rounded-full object-cover border-2 border-slate-800 bg-slate-900 relative z-10">
                         @if(p.isMuted || p.isMutedByPatron) {
                             <div class="absolute bottom-0 right-0 w-4 h-4 bg-red-600 rounded-full flex items-center justify-center z-20 border border-white">
                                 <span class="text-[8px] text-white">✕</span>
                             </div>
                         }
                     </div>
                     <span class="mt-1 text-white font-bold text-[9px] bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-sm border border-white/5 truncate max-w-[70px]">{{ p.name }}</span>
                 </div>
             }
         </div>
      </div>

      <!-- === BOTTOM BAR === -->
      <div class="absolute bottom-0 left-0 w-full px-4 pb-safe-bottom pt-2 z-50 bg-[#0F111A] border-t border-white/10 flex items-center justify-between h-[70px]">
          
          <!-- Chat Button -->
          <button (click)="socialService.openChat('global')" class="flex flex-col items-center gap-1 w-16 text-slate-400 hover:text-white active:scale-95 transition-all">
               <div class="w-6 h-6 flex items-center justify-center relative">
                    <span class="text-xl">💬</span>
                    @if(gameService.settings().isChatLocked) { <span class="absolute -top-1 -right-1 text-[10px]">🔒</span> }
               </div>
               <span class="text-[9px] font-bold">Sohbet</span>
          </button>

          <!-- MAIN ACTION BUTTON (CENTER) -->
          @if(isMePatron() && isGameActive()) {
               <button (click)="handleNextTurn()" 
                       class="flex-1 max-w-[180px] h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/20 active:scale-95 transition-transform border border-white/20 -mt-8 relative z-50">
                   <span class="text-2xl animate-pulse">🎲</span>
                   <span class="font-black text-black text-sm tracking-wider">SIRADAKİ</span>
               </button>
          } 
          @else {
               <button (click)="toggleMyMic()" 
                     [class]="me()?.isMuted ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-green-500 text-white border-green-400 shadow-green-500/30'"
                     class="w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-xl border-4 border-[#0F111A] active:scale-95 transition-transform -mt-8 relative z-50">
                 {{ me()?.isMuted ? '🔇' : '🎙️' }}
               </button>
          }

          <!-- Gift Button -->
          <button class="flex flex-col items-center gap-1 w-16 text-slate-400 hover:text-white active:scale-95 transition-all">
              <div class="w-6 h-6 flex items-center justify-center"><span class="text-xl">🎁</span></div>
              <span class="text-[9px] font-bold">Hediye</span>
          </button>
      </div>

      <!-- === PLAYER POPUP MENU (Cards) === -->
      @if(selectedPlayer) {
          <div class="fixed inset-0 z-[200] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in" (click)="selectedPlayer = null">
              <div class="bg-[#1A1D29] w-full md:w-80 p-6 rounded-t-3xl md:rounded-3xl border-t border-white/10 shadow-2xl animate-slide-up" (click)="$event.stopPropagation()">
                  <div class="w-12 h-1 bg-slate-700 rounded-full mx-auto mb-6 opacity-50"></div>
                  
                  <div class="flex items-center gap-4 mb-6">
                      <img [src]="selectedPlayer!.avatar" class="w-16 h-16 rounded-full border-2 border-slate-600">
                      <div>
                          <h3 class="text-xl font-bold text-white">{{ selectedPlayer!.name }}</h3>
                          <div class="text-yellow-500 font-mono text-sm">{{ selectedPlayer!.score }} Puan</div>
                          <div class="text-xs text-slate-500 mt-1">{{ selectedPlayer!.team === 'KING' ? '👑 Kral Takımı' : '👑 Kraliçe Takımı' }}</div>
                      </div>
                  </div>
                  
                  @if(isMePatron() && selectedPlayer!.id !== me()?.id) {
                      <div class="space-y-3">
                          <button (click)="gameService.toggleMute(selectedPlayer!.id); selectedPlayer=null" class="w-full py-3 bg-slate-800 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2">
                              <span>{{ selectedPlayer!.isMuted ? '🔊' : '🔇' }}</span>
                              {{ selectedPlayer!.isMuted ? 'Sesini Aç' : 'Sustur' }}
                          </button>
                          
                          <div class="flex gap-3">
                              <button (click)="gameService.updateScore(selectedPlayer!.id, 10); selectedPlayer=null" class="flex-1 py-3 bg-green-900/30 text-green-400 rounded-xl text-sm font-bold border border-green-900/50">
                                  +10 Puan
                              </button>
                              <button (click)="gameService.updateScore(selectedPlayer!.id, -10); selectedPlayer=null" class="flex-1 py-3 bg-red-900/30 text-red-400 rounded-xl text-sm font-bold border border-red-900/50">
                                  -10 Puan
                              </button>
                          </div>

                          <button (click)="gameService.kickPlayer(selectedPlayer!.id); selectedPlayer=null" class="w-full py-3 bg-red-600/10 text-red-500 rounded-xl text-sm font-bold border border-red-900/30 hover:bg-red-600 hover:text-white transition-colors">
                              Oyundan At
                          </button>
                      </div>
                  }
              </div>
          </div>
      }

      <!-- === HOST SETTINGS DRAWER (RIGHT SIDE SLIDER) === -->
      @if(showSettingsDrawer) {
          <div class="fixed inset-0 z-[100] flex justify-end">
              <div class="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" (click)="showSettingsDrawer = false"></div>
              
              <div class="relative w-[85%] max-w-[320px] h-full bg-[#161922] shadow-2xl flex flex-col animate-slide-left border-l border-white/5">
                  
                  <!-- Drawer Header -->
                  <div class="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-[#12141C]">
                      <h2 class="text-white font-black text-lg tracking-tight">Oyun Ayarları</h2>
                      <button (click)="showSettingsDrawer = false" class="text-slate-400 hover:text-white">✕</button>
                  </div>

                  <!-- Drawer Content -->
                  <div class="flex-1 overflow-y-auto p-5 space-y-8 custom-scrollbar">
                      
                      <!-- Quick Actions -->
                      <div class="grid grid-cols-2 gap-3">
                          <button (click)="addBot()" class="flex flex-col items-center p-3 bg-slate-800 rounded-xl border border-slate-700 active:scale-95">
                              <span class="text-2xl mb-1">🤖</span>
                              <span class="text-xs font-bold text-slate-300">Bot Ekle</span>
                          </button>
                          <button (click)="gameService.muteAll()" class="flex flex-col items-center p-3 bg-slate-800 rounded-xl border border-slate-700 active:scale-95">
                              <span class="text-2xl mb-1">🔇</span>
                              <span class="text-xs font-bold text-slate-300">Herkesi Sustur</span>
                          </button>
                      </div>

                      <!-- Settings Inputs (Dropdowns) -->
                      <div class="space-y-5">
                          <div>
                              <label class="text-[10px] text-blue-400 font-black uppercase tracking-widest mb-2 block">Oyun Modu</label>
                              <div class="relative">
                                  <select [(ngModel)]="gameService.settings().mode" class="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-xl px-4 py-3 appearance-none focus:border-blue-500 outline-none">
                                      <option value="INDIVIDUAL">👤 Bireysel (Herkes Tek)</option>
                                      <option value="TEAM">👑 Takım (Kral vs Kraliçe)</option>
                                  </select>
                                  <div class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">▼</div>
                              </div>
                          </div>

                          <div>
                              <label class="text-[10px] text-blue-400 font-black uppercase tracking-widest mb-2 block">Hedef Dil</label>
                              <div class="relative">
                                  <select #langSelect (change)="setLanguage(langSelect.value)" [value]="gameService.settings().targetLanguage"
                                          class="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-xl px-4 py-3 appearance-none focus:border-blue-500 outline-none">
                                      @for(lang of gameService.availableLanguages; track lang) { <option [value]="lang">{{ lang }}</option> }
                                  </select>
                                  <div class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">▼</div>
                              </div>
                          </div>
                          
                          <div>
                              <label class="text-[10px] text-blue-400 font-black uppercase tracking-widest mb-2 block">Zorluk</label>
                              <div class="relative">
                                  <select #diffSelect (change)="setDifficulty(diffSelect.value)" [value]="gameService.settings().difficulty"
                                          class="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-xl px-4 py-3 appearance-none focus:border-blue-500 outline-none">
                                      <option>Kolay</option><option>Orta</option><option>Zor</option><option>Expert</option>
                                  </select>
                                  <div class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">▼</div>
                              </div>
                          </div>

                          <div>
                              <label class="text-[10px] text-blue-400 font-black uppercase tracking-widest mb-2 block">Tema</label>
                              <div class="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                                  <button (click)="setTheme('https://images.unsplash.com/photo-1516280440614-6697288d5d38')" class="shrink-0 w-14 h-14 rounded-lg border-2 border-slate-700 hover:border-white overflow-hidden bg-cover" style="background-image: url('https://images.unsplash.com/photo-1516280440614-6697288d5d38?q=80&w=100')"></button>
                                  <button (click)="setTheme('https://images.unsplash.com/photo-1534447677768-be436bb09401')" class="shrink-0 w-14 h-14 rounded-lg border-2 border-slate-700 hover:border-white overflow-hidden bg-cover" style="background-image: url('https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=100')"></button>
                                  <button (click)="setTheme('https://images.unsplash.com/photo-1518709268805-4e9042af9f23')" class="shrink-0 w-14 h-14 rounded-lg border-2 border-slate-700 hover:border-white overflow-hidden bg-cover" style="background-image: url('https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=100')"></button>
                              </div>
                          </div>
                      </div>
                  </div>

                  <!-- Drawer Footer -->
                  <div class="p-5 border-t border-white/5 bg-[#12141C] flex flex-col gap-3 pb-safe-bottom">
                      <button (click)="saveSettings()" class="w-full py-3 bg-slate-800 text-slate-300 font-bold rounded-xl hover:bg-slate-700 transition-colors text-xs uppercase tracking-wider">
                          Oda Ayarlarını Kaydet
                      </button>

                      @if(!isGameActive()) {
                          <button (click)="startGame()" class="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-black rounded-xl shadow-lg hover:scale-[1.02] transition-transform flex items-center justify-center gap-2">
                              <span>🚀</span> OYUNU BAŞLAT
                          </button>
                      } @else {
                          <button (click)="nextRound()" class="w-full py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg">
                              SONRAKİ TURA GEÇ
                          </button>
                          <button (click)="gameService.restartGame(); showSettingsDrawer=false" class="w-full py-3 bg-red-900/20 text-red-400 font-bold rounded-xl border border-red-900/50">
                              OYUNU BİTİR
                          </button>
                      }
                  </div>
              </div>
          </div>
      }
    </div>
  `,
  styles: [`
    .pt-safe-top { padding-top: max(12px, env(safe-area-inset-top)); }
    .pb-safe-bottom { padding-bottom: max(20px, env(safe-area-inset-bottom)); }
    .animate-slide-down { animation: slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
    .animate-slide-left { animation: slideLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
    .animate-slide-up { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
    .animate-fade-in { animation: fadeIn 0.3s ease-out; }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    @keyframes slideDown { from { transform: translateY(-100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @keyframes slideLeft { from { transform: translateX(100%); } to { transform: translateX(0); } }
    @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  `]
})
export class ActiveGameComponent {
  gameService = inject(GameService);
  authService = inject(AuthService);
  socialService = inject(SocialService);
  app = inject(AppComponent);

  showSettingsDrawer = false;
  selectedPlayer: Player | null = null;
  
  stagePlayers = this.gameService.stagePlayers;

  me = computed(() => {
      const user = this.authService.currentUser();
      if(!user) return null;
      return this.gameService.players().find(p => p.id === user.id);
  });

  hostUser = computed(() => this.gameService.players().find(p => p.isPatron));
  isMePatron() { return this.me()?.isPatron ?? false; }
  
  toggleMyMic() { if(this.me()) this.gameService.toggleMute(this.me()!.id); }

  isGameActive() {
      const s = this.gameService.gameState();
      return s !== 'MENU' && s !== 'SOCIAL';
  }

  handleNextTurn() {
      const success = this.gameService.nextTurn();
      if (!success) {
           // Provide feedback but don't use ugly browser alert
           // Ideally show a toast, for now just log or do nothing, waiting for host to end round
      }
  }

  openPlayerMenu(p: Player) {
      this.selectedPlayer = p;
  }

  saveSettings() {
      this.gameService.saveSettings();
      this.showSettingsDrawer = false;
  }

  startGame() {
      this.gameService.startGameLoop();
      this.showSettingsDrawer = false;
  }

  nextRound() {
      this.gameService.startNextRoundPreparation();
      setTimeout(() => this.gameService.proceedToNextRound(), 1500);
      this.showSettingsDrawer = false;
  }

  leaveRoom() {
      if(this.isMePatron()) this.gameService.resetGame();
      this.gameService.leaveGame();
      this.app.navTo('ROOMS');
  }

  minimizeRoom() { this.app.navTo('ROOMS'); }
  setLanguage(lang: string) { this.gameService.setLanguage(lang); }
  setDifficulty(diff: string) { this.gameService.setDifficulty(diff); }
  setTheme(url: string) { 
      const highRes = url + '?q=80&w=1920&auto=format&fit=crop';
      this.gameService.setTheme(highRes); 
  }
  addBot() { this.gameService.addSingleBot(); }
}
