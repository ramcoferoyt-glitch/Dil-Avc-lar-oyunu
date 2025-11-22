
import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SocialService } from '../services/social.service';

@Component({
  selector: 'app-discover',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-full flex flex-col bg-[#0F111A] relative overflow-hidden font-sans">
       
       <!-- Header -->
       <div class="px-6 pt-8 pb-4 bg-gradient-to-b from-[#1A1D29] to-[#0F111A] z-10">
          <h1 class="text-3xl font-black text-white mb-4">Keşfet 🌍</h1>
          
          <!-- Search Bar -->
          <div class="relative">
             <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
             <input type="text" [(ngModel)]="searchText" placeholder="İsim veya ilgi alanı ara..." 
                    class="w-full bg-slate-900/80 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white focus:border-blue-500 outline-none shadow-inner">
          </div>
       </div>

       <!-- Content -->
       <div class="flex-1 overflow-y-auto px-4 pb-24 custom-scrollbar">
           
           <!-- Recommended / New Users -->
           @if(!searchText()) {
               <div class="mb-6">
                   <h2 class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 px-2">Yeni Üyeler</h2>
                   <div class="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                       @for(user of newUsers(); track user.id) {
                           <div (click)="socialService.openChat(user.id)" class="shrink-0 w-28 bg-slate-800 rounded-xl p-3 flex flex-col items-center border border-slate-700 cursor-pointer hover:border-blue-500 transition-colors">
                               <img [src]="user.avatar" class="w-14 h-14 rounded-full mb-2 bg-slate-900">
                               <div class="font-bold text-white text-xs truncate w-full text-center">{{ user.username }}</div>
                               <div class="text-[9px] text-green-400 mt-1">Çevrimiçi</div>
                           </div>
                       }
                   </div>
               </div>
           }

           <h2 class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 px-2">
               {{ searchText() ? 'Arama Sonuçları' : 'Tüm Avcılar' }}
           </h2>

           <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
               @for(user of filteredUsers(); track user.id) {
                   <div class="bg-[#161922] p-4 rounded-xl border border-white/5 flex items-center gap-4 hover:bg-slate-800 transition-colors group">
                       <div class="relative">
                           <img [src]="user.avatar" class="w-14 h-14 rounded-full bg-slate-900 border-2" [class.border-pink-500]="user.gender==='Kadın'" [class.border-blue-500]="user.gender!=='Kadın'">
                           @if(user.isOnline) { <div class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border border-slate-800 rounded-full"></div> }
                       </div>
                       
                       <div class="flex-1 min-w-0">
                           <h3 class="text-white font-bold text-sm">{{ user.username }}</h3>
                           <p class="text-slate-400 text-xs truncate">{{ user.bio }}</p>
                           <div class="flex flex-wrap gap-1 mt-1.5">
                               @for(h of user.hobbies.slice(0, 2); track h) {
                                   <span class="text-[9px] bg-slate-900 text-slate-500 px-1.5 py-0.5 rounded">{{ h }}</span>
                               }
                           </div>
                       </div>

                       <button (click)="socialService.openChat(user.id)" class="w-10 h-10 rounded-full bg-slate-700 text-white flex items-center justify-center hover:bg-blue-600 transition-colors">
                           💬
                       </button>
                   </div>
               }
               @if(filteredUsers().length === 0) {
                   <div class="col-span-full py-12 text-center text-slate-500">
                       Aradığınız kriterde avcı bulunamadı.
                   </div>
               }
           </div>
       </div>
    </div>
  `,
  styles: [`
    .no-scrollbar::-webkit-scrollbar { display: none; }
  `]
})
export class DiscoverComponent {
  socialService = inject(SocialService);
  searchText = signal('');

  // Get all users excluding self
  allUsers = computed(() => {
     // Here we simulate filtering out 'me' if needed, but for now show everyone
     return this.socialService.allUsers();
  });

  newUsers = computed(() => this.allUsers().slice(0, 5));

  filteredUsers = computed(() => {
     const term = this.searchText().toLowerCase();
     if(!term) return this.allUsers();
     
     return this.allUsers().filter(u => 
         u.username.toLowerCase().includes(term) || 
         u.hobbies.some(h => h.toLowerCase().includes(term))
     );
  });
}
