
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameService } from '../services/game.service';
import { SocialService } from '../services/social.service';

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-slate-950 border border-yellow-600/20 h-full flex flex-col relative overflow-hidden font-sans">
      <!-- Ambient -->
      <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-600 via-purple-600 to-blue-600 z-20"></div>
      
      <div class="flex-1 flex flex-col max-w-7xl mx-auto w-full p-6 z-10">
        
        <!-- Header -->
        <div class="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
           <div>
             <h2 class="text-4xl font-black text-white tracking-tight uppercase">Oyun Lobisi</h2>
             <p class="text-slate-400 text-sm mt-1 font-mono">ID: {{ settings.roomId }}</p>
           </div>
           
           <div class="px-4 py-1 rounded bg-green-900/30 text-green-400 border border-green-500/30 text-xs font-bold uppercase animate-pulse">
              {{ settings.isPublished ? 'Yayında' : 'Hazırlık' }}
           </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 overflow-hidden">
          
          <!-- Settings -->
          <div class="lg:col-span-4 bg-slate-900/50 border border-slate-700 rounded-xl p-6 flex flex-col gap-5">
            <h3 class="text-slate-400 font-bold text-xs uppercase tracking-widest">Ayarlar</h3>
            
            <div class="space-y-4">
               <!-- ... settings inputs ... -->
               <div>
                  <label class="text-[10px] text-slate-500 uppercase font-bold block mb-1">Oda Adı</label>
                  <input [(ngModel)]="settings.roomName" [disabled]="settings.isPublished" class="w-full bg-slate-800 border-slate-600 rounded p-2 text-white text-sm" />
               </div>
               <div>
                  <label class="text-[10px] text-slate-500 uppercase font-bold block mb-1">Mod</label>
                  <select [(ngModel)]="settings.mode" [disabled]="settings.isPublished" class="w-full bg-slate-800 border-slate-600 rounded p-2 text-white text-sm">
                    <option value="INDIVIDUAL">Bireysel (Herkes Tek)</option>
                    <option value="TEAM">Takım Savaşı (Kırmızı vs Mavi)</option>
                  </select>
               </div>
               <div>
                  <label class="text-[10px] text-slate-500 uppercase font-bold block mb-1">Dil & Seviye</label>
                  <div class="flex gap-2">
                    <select [(ngModel)]="settings.targetLanguage" class="flex-1 bg-slate-800 border-slate-600 rounded p-2 text-white text-sm">
                        @for(l of gameService.availableLanguages; track l) { <option [value]="l">{{l}}</option> }
                    </select>
                    <select [(ngModel)]="settings.difficulty" class="w-24 bg-slate-800 border-slate-600 rounded p-2 text-white text-sm">
                        <option>Kolay</option><option>Orta</option><option>Zor</option><option>Expert</option>
                    </select>
                  </div>
               </div>
            </div>
            
            <div class="mt-auto flex flex-col gap-2">
              <button (click)="fillWithBots()" class="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded border border-slate-600 text-sm flex items-center justify-center gap-2">
                 <span>🤖</span> BOT EKLE (DOLU ODA)
              </button>

              @if (!settings.isPublished) {
                <button (click)="publishRoom()" class="w-full py-3 bg-yellow-500 text-black font-bold rounded-lg hover:brightness-110">
                  ODAYI YAYINLA
                </button>
              } @else {
                 <div class="p-4 bg-black/30 rounded border border-slate-700 text-center">
                    <p class="text-slate-400 text-xs mb-2">Oyuncuları Davet Et</p>
                    <div class="text-white font-mono bg-slate-800 p-2 rounded text-sm select-all">
                      dilavcilar.app/{{settings.roomId}}
                    </div>
                 </div>
              }
            </div>
          </div>

          <!-- Player List -->
          <div class="lg:col-span-8 bg-slate-900/50 border border-slate-700 rounded-xl p-6 flex flex-col">
             <h3 class="text-slate-400 font-bold text-xs uppercase tracking-widest mb-4">
                Katılımcılar ({{ gameService.players().length }})
             </h3>

             <div class="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 content-start custom-scrollbar">
                @for (player of gameService.players(); track player.id) {
                  <div class="relative flex flex-col items-center p-3 rounded-lg border bg-slate-800/50 hover:bg-slate-800 group transition-all"
                       [class.border-yellow-500]="player.isPatron"
                       [class.border-slate-700]="!player.isPatron">
                     
                     <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white mb-2 overflow-hidden bg-slate-900 relative">
                       @if(player.avatar) {
                         <img [src]="player.avatar" class="w-full h-full object-cover">
                       } @else {
                         {{ player.name.substring(0,2).toUpperCase() }}
                       }
                     </div>
                     
                     <div class="text-center w-full">
                       <div class="font-bold text-white text-sm truncate">{{ player.name }}</div>
                       @if(player.isPatron) { <span class="text-[9px] text-yellow-500 uppercase font-bold">Yönetici</span> }
                       @if(player.isBot) { <span class="text-[9px] text-purple-400 uppercase font-bold ml-1">BOT</span> }
                     </div>
                     
                     <!-- Kick Button (Only visible to Patron) -->
                     @if(!player.isPatron) {
                        <button (click)="gameService.kickPlayer(player.id)" class="absolute top-1 right-1 text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" title="At">
                           ✕
                        </button>
                     }
                  </div>
                }
             </div>
             
             <div class="mt-4 flex justify-end">
                <button (click)="startGame()" [disabled]="gameService.players().length < 2"
                  class="px-8 py-3 bg-green-600 text-white font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform shadow-lg">
                  BAŞLAT 🚀
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LobbyComponent {
  gameService = inject(GameService);
  socialService = inject(SocialService);

  get settings() { return this.gameService.settings(); }
  publishRoom() { this.gameService.publishRoom(); }
  startGame() { this.gameService.startGame(); }

  fillWithBots() {
    const needed = 11;
    const bots = this.socialService.getRandomBots(needed);
    bots.forEach(b => {
       this.gameService.addBotPlayer(b);
    });
  }
}
