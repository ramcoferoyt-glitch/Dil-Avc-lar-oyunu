
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameService } from '../services/game.service';
import { AppComponent } from '../app.component'; 

@Component({
  selector: 'app-room-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-full flex flex-col bg-[#0F111A] relative overflow-hidden font-sans">
      
      <!-- Gradient Header -->
      <div class="px-6 pt-6 pb-4 bg-gradient-to-b from-[#1A1D29] to-[#0F111A] z-10 sticky top-0 border-b border-white/5">
         <div class="flex justify-between items-center mb-4">
             <h1 class="text-3xl font-black text-white tracking-tight">Parti 🎉</h1>
             <div class="flex gap-2">
                 <button (click)="openCreateModal()" class="bg-white/10 hover:bg-white/20 text-white w-10 h-10 rounded-full flex items-center justify-center transition-colors">
                    +
                 </button>
             </div>
         </div>
         
         <!-- Tags / Filters -->
         <div class="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
             <button class="px-4 py-1.5 bg-white text-black rounded-full text-xs font-bold">Tümü</button>
             <button class="px-4 py-1.5 bg-slate-800 text-slate-400 rounded-full text-xs font-bold whitespace-nowrap">🇹🇷 Türkçe</button>
             <button class="px-4 py-1.5 bg-slate-800 text-slate-400 rounded-full text-xs font-bold whitespace-nowrap">🇬🇧 English</button>
             <button class="px-4 py-1.5 bg-slate-800 text-slate-400 rounded-full text-xs font-bold whitespace-nowrap">💬 Sohbet</button>
             <button class="px-4 py-1.5 bg-slate-800 text-slate-400 rounded-full text-xs font-bold whitespace-nowrap">🎮 Oyun</button>
         </div>
      </div>

      <!-- Room Feed -->
      <div class="flex-1 overflow-y-auto custom-scrollbar px-4 pt-2 pb-24 space-y-4">
         
         <!-- Create Room Promo Card -->
         <div (click)="openCreateModal()" class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg cursor-pointer transform transition-transform hover:scale-[1.01] relative overflow-hidden group">
             <div class="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
             <div class="relative z-10 flex justify-between items-center">
                 <div>
                     <h2 class="text-xl font-bold mb-1">Kendi Evrenini Yarat</h2>
                     <p class="text-blue-100 text-xs">Arkadaşlarını topla ve oyuna başla.</p>
                 </div>
                 <div class="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl group-hover:rotate-90 transition-transform">
                     🚀
                 </div>
             </div>
         </div>

         <!-- Live Rooms -->
         @for(room of dummyRooms; track room.id) {
             <div (click)="joinRoom(room.id)" class="bg-[#161922] rounded-2xl p-4 border border-white/5 hover:border-white/20 transition-all cursor-pointer group">
                 <div class="flex justify-between items-start mb-3">
                     <h3 class="text-white font-bold text-lg leading-tight group-hover:text-blue-400 transition-colors">{{ room.title }}</h3>
                     <span class="bg-green-900/30 text-green-400 text-[10px] font-bold px-2 py-1 rounded animate-pulse">LIVE</span>
                 </div>
                 
                 <div class="flex items-center gap-4">
                     <!-- Avatar Pile -->
                     <div class="flex -space-x-3">
                         @for(img of room.avatars; track img) {
                             <img [src]="img" class="w-10 h-10 rounded-full border-2 border-[#161922] bg-slate-700">
                         }
                         <div class="w-10 h-10 rounded-full border-2 border-[#161922] bg-slate-800 flex items-center justify-center text-xs text-slate-400 font-bold">
                             +{{ room.count }}
                         </div>
                     </div>
                     
                     <div class="flex flex-wrap gap-2">
                         @for(tag of room.tags; track tag) {
                             <span class="text-[10px] text-slate-500 bg-slate-900 px-2 py-0.5 rounded">{{ tag }}</span>
                         }
                     </div>
                 </div>
             </div>
         }
      </div>

      <!-- Create Room Modal Overlay -->
      @if(showCreateModal) {
          <div class="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
              <div class="bg-[#1A1D29] w-full md:max-w-md p-6 rounded-t-3xl md:rounded-3xl border-t border-white/10 shadow-2xl animate-slide-up">
                  <div class="w-12 h-1 bg-slate-700 rounded-full mx-auto mb-6"></div>
                  
                  <h2 class="text-2xl font-bold text-white mb-6 text-center">Oda Başlat</h2>
                  
                  <div class="space-y-4 mb-8">
                      <div>
                          <label class="text-xs text-slate-500 font-bold uppercase mb-1 block">Oda Konusu</label>
                          <input [(ngModel)]="newRoomName" placeholder="Örn: İngilizce Pratik" class="w-full bg-black/50 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-blue-500">
                      </div>
                      <div class="grid grid-cols-2 gap-4">
                          <div>
                              <label class="text-xs text-slate-500 font-bold uppercase mb-1 block">Dil</label>
                              <select [(ngModel)]="newRoomLang" class="w-full bg-black/50 border border-slate-700 rounded-xl p-3 text-white outline-none">
                                  @for(l of gameService.availableLanguages; track l) { <option [value]="l">{{l}}</option> }
                              </select>
                          </div>
                          <div>
                              <label class="text-xs text-slate-500 font-bold uppercase mb-1 block">Zorluk</label>
                              <select [(ngModel)]="newRoomDiff" class="w-full bg-black/50 border border-slate-700 rounded-xl p-3 text-white outline-none">
                                  <option>Kolay</option><option>Orta</option><option>Zor</option>
                              </select>
                          </div>
                      </div>
                  </div>

                  <div class="flex gap-3">
                      <button (click)="showCreateModal = false" class="flex-1 py-3 bg-slate-800 text-white font-bold rounded-xl">İptal</button>
                      <button (click)="createRoom()" class="flex-[2] py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:scale-[1.02] transition-transform">
                          Partiyi Başlat 🚀
                      </button>
                  </div>
              </div>
          </div>
      }
    </div>
  `,
  styles: [`
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .animate-fade-in { animation: fadeIn 0.2s ease-out; }
    .animate-slide-up { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
  `]
})
export class RoomListComponent {
  gameService = inject(GameService);
  app = inject(AppComponent);

  showCreateModal = false;
  newRoomName = '';
  newRoomLang = 'İngilizce';
  newRoomDiff: any = 'Orta';

  // Dummy Data for UI
  dummyRooms = [
      { id: '1', title: '🇺🇸 English Speaking Practice', count: 12, avatars: ['https://api.dicebear.com/7.x/avataaars/svg?seed=Alice', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie'], tags: ['İngilizce', 'Sohbet'] },
      { id: '2', title: 'Gece Sohbeti & Müzik 🌙', count: 5, avatars: ['https://api.dicebear.com/7.x/avataaars/svg?seed=David', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Eve'], tags: ['Türkçe', 'Chill'] },
      { id: '3', title: 'Dil Avcıları Yarışması 🏆', count: 24, avatars: ['https://api.dicebear.com/7.x/avataaars/svg?seed=Frank', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Grace', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hank'], tags: ['Yarışma', 'Ödüllü'] }
  ];

  openCreateModal() {
      this.newRoomName = 'Parti #' + Math.floor(Math.random() * 1000);
      this.showCreateModal = true;
  }

  createRoom() {
      this.gameService.createNewRoom({
          roomName: this.newRoomName,
          targetLanguage: this.newRoomLang,
          difficulty: this.newRoomDiff,
          maxPlayers: 12
      });
      this.showCreateModal = false;
      this.app.navTo('GAME');
  }

  joinRoom(id: string) {
      this.gameService.enterRoom(id);
      this.app.navTo('GAME');
  }
}
