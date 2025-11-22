import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../services/game.service';

@Component({
  selector: 'app-spy-round',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-8 h-full flex flex-col items-center relative overflow-hidden">
      <!-- Spy Theme Background -->
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-950 to-black z-0 pointer-events-none"></div>
      
      <div class="relative z-10 w-full max-w-4xl flex flex-col h-full">
        <div class="text-center mb-8">
           <h2 class="text-4xl font-bold text-red-500 tracking-widest uppercase mb-2 animate-pulse">2. TUR: CASUS GÖREVİ</h2>
           <p class="text-slate-400">Düşmanı dinle, bilgiyi topla. Sessiz ol.</p>
        </div>

        <!-- Spy Selection Area -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
           <!-- King Team -->
           <div class="bg-slate-900/80 border border-yellow-600/30 p-6 rounded-xl">
             <h3 class="text-yellow-500 font-bold mb-4">Kral Takımı Ajanı Seç</h3>
             <div class="flex flex-wrap gap-2">
               @for (player of kings(); track player.id) {
                 <button 
                   (click)="gameService.makeSpy(player.id)"
                   [class]="player.isSpy ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'"
                   class="px-4 py-2 rounded border border-slate-600 transition-colors text-sm font-bold">
                   {{ player.name }} {{ player.isSpy ? '(SEÇİLDİ)' : '' }}
                 </button>
               }
             </div>
           </div>

           <!-- Queen Team -->
           <div class="bg-slate-900/80 border border-pink-600/30 p-6 rounded-xl">
             <h3 class="text-pink-500 font-bold mb-4">Kraliçe Takımı Ajanı Seç</h3>
             <div class="flex flex-wrap gap-2">
               @for (player of queens(); track player.id) {
                 <button 
                   (click)="gameService.makeSpy(player.id)"
                   [class]="player.isSpy ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'"
                   class="px-4 py-2 rounded border border-slate-600 transition-colors text-sm font-bold">
                   {{ player.name }} {{ player.isSpy ? '(SEÇİLDİ)' : '' }}
                 </button>
               }
             </div>
           </div>
        </div>

        <!-- Mission Envelope -->
        <div class="flex-1 flex items-center justify-center flex-col">
           @if (!missionRevealed()) {
             <button (click)="generateAndReveal()" class="group relative">
               <div class="w-64 h-40 bg-amber-100 rounded shadow-2xl flex items-center justify-center border-4 border-amber-200 transform group-hover:scale-105 transition-transform cursor-pointer relative overflow-hidden">
                 <div class="absolute inset-0 flex items-center justify-center opacity-10 text-red-900 font-black text-4xl -rotate-12">TOP SECRET</div>
                 <span class="text-red-800 font-bold text-xl z-10">GÖREVİ AL</span>
                 <!-- Seal -->
                 <div class="absolute -top-4 right-1/2 translate-x-1/2 w-12 h-12 bg-red-700 rounded-full shadow-md border-2 border-red-500"></div>
               </div>
             </button>
           } @else {
             <div class="bg-slate-800 border border-red-500/50 p-8 rounded-xl shadow-2xl max-w-2xl w-full animate-fade-up">
               <div class="flex justify-between items-center mb-4 border-b border-slate-700 pb-4">
                 <h3 class="text-red-400 font-bold text-xl uppercase">Gizli Talimatlar</h3>
                 <button (click)="hideMission()" class="text-slate-500 hover:text-white text-sm underline">Gizle</button>
               </div>
               
               @if (gameService.spyMission()) {
                 <p class="text-white text-lg leading-relaxed font-mono whitespace-pre-wrap mb-6">
                   {{ gameService.spyMission() }}
                 </p>
                 <div class="bg-black/30 p-4 rounded text-sm text-yellow-400 border-l-2 border-yellow-500">
                   <strong class="block mb-1">Not:</strong>
                   Ajanlar bu kelimeleri yakalarsa +20 Puan. Yakalanırlarsa -10 Puan.
                 </div>
               } @else {
                 <div class="flex items-center justify-center py-8">
                   <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                 </div>
               }
             </div>
           }
        </div>

        <div class="mt-8 flex justify-center">
          <button (click)="gameService.startRound3()" class="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-bold transition-colors">
            GÖREV TAMAMLANDI - 3. TURA GEÇ &rarr;
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-fade-up { animation: fadeUp 0.5s ease-out; }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class SpyRoundComponent {
  gameService = inject(GameService);
  missionRevealed = signal(false);

  get kings() { return this.gameService.players().filter(p => p.team === 'KING'); }
  get queens() { return this.gameService.players().filter(p => p.team === 'QUEEN'); }

  async generateAndReveal() {
    this.missionRevealed.set(true);
    if (!this.gameService.spyMission()) {
      await this.gameService.generateSpyTask();
    }
  }

  hideMission() {
    this.missionRevealed.set(false);
  }
}