
import { Component, inject, computed, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-full bg-[#0F111A] relative overflow-y-auto font-sans pb-24">
      
      @if (displayUser(); as user) {
        
        <!-- Header Image / Banner -->
        <div class="h-48 w-full bg-gradient-to-r from-blue-900 to-purple-900 relative">
             <div class="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30"></div>
             <button (click)="close.emit()" class="absolute top-4 left-4 w-10 h-10 bg-black/30 rounded-full text-white flex items-center justify-center backdrop-blur-md z-20">←</button>
             
             <!-- Edit Button -->
             <button (click)="startEditing()" class="absolute top-4 right-4 px-4 py-1.5 bg-black/30 rounded-full text-white text-xs font-bold backdrop-blur-md z-20">
                Profili Düzenle
             </button>
        </div>

        <!-- Profile Card Container -->
        <div class="px-4 -mt-16 relative z-10">
            <div class="bg-[#1A1D29] rounded-3xl p-6 shadow-2xl border border-white/5">
                
                <!-- Avatar & Status -->
                <div class="flex justify-between items-end mb-4">
                    <div class="w-24 h-24 rounded-[2rem] border-4 border-[#1A1D29] bg-slate-800 overflow-hidden shadow-lg relative -mt-16">
                        <img [src]="user.avatar" class="w-full h-full object-cover">
                    </div>
                    <div class="flex gap-2">
                         <div class="flex flex-col items-center px-3">
                             <span class="font-bold text-white text-lg">{{ user.crowns.king + user.crowns.queen }}</span>
                             <span class="text-[10px] text-slate-500 uppercase font-bold">Taç</span>
                         </div>
                         <div class="flex flex-col items-center px-3 border-l border-slate-700">
                             <span class="font-bold text-white text-lg">{{ user.level }}</span>
                             <span class="text-[10px] text-slate-500 uppercase font-bold">Seviye</span>
                         </div>
                    </div>
                </div>

                <!-- Name & Bio -->
                <h1 class="text-2xl font-black text-white">{{ user.username }}</h1>
                <div class="flex items-center gap-2 mb-4">
                     <span class="text-sm font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                        {{ user.gender === 'Kadın' ? 'Kraliçe Takımı 👑' : 'Kral Takımı 👑' }}
                     </span>
                </div>

                <p class="text-slate-300 text-sm leading-relaxed mb-6">
                    {{ user.bio || 'Merhaba! Ben Dil Avcısıyım.' }}
                </p>

                <!-- Tags / Interests -->
                <div class="flex flex-wrap gap-2 mb-6">
                    @for(tag of user.hobbies; track tag) {
                        <span class="px-3 py-1 rounded-lg bg-slate-800 text-slate-400 text-xs font-bold border border-slate-700">{{ tag }}</span>
                    }
                </div>

                <!-- Badges -->
                <div>
                    <h3 class="text-slate-500 text-[10px] font-bold uppercase mb-3 tracking-widest">BAŞARILAR</h3>
                    <div class="grid grid-cols-4 gap-2">
                        @for(badge of user.achievements; track badge) {
                             <div class="aspect-square rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center border border-white/5" title="{{badge}}">
                                 <span class="text-2xl">🏅</span>
                             </div>
                        }
                        <!-- Placeholder empty slots -->
                        <div class="aspect-square rounded-xl bg-slate-900/50 border border-dashed border-slate-700"></div>
                        <div class="aspect-square rounded-xl bg-slate-900/50 border border-dashed border-slate-700"></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Edit Modal -->
        @if(isEditing) {
            <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div class="bg-[#1A1D29] w-full max-w-md rounded-2xl p-6 border border-slate-700">
                    <h3 class="text-white font-bold mb-4">Profili Düzenle</h3>
                    
                    <div class="space-y-4 mb-6">
                        <div>
                            <label class="block text-xs text-slate-500 mb-1">Hakkında</label>
                            <textarea [(ngModel)]="editData.bio" class="w-full bg-black/50 border border-slate-700 rounded-xl p-3 text-white text-sm outline-none h-24"></textarea>
                        </div>
                        <div>
                            <label class="block text-xs text-slate-500 mb-1">İlgi Alanı Ekle</label>
                            <div class="flex gap-2">
                                <input [(ngModel)]="hobbyInput" class="flex-1 bg-black/50 border border-slate-700 rounded-xl p-2 text-white text-sm outline-none">
                                <button (click)="addHobby()" class="bg-slate-700 px-4 rounded-xl text-white font-bold">+</button>
                            </div>
                        </div>
                    </div>

                    <div class="flex gap-3">
                        <button (click)="isEditing = false" class="flex-1 py-2 bg-slate-800 text-white rounded-lg font-bold">İptal</button>
                        <button (click)="saveChanges()" class="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold">Kaydet</button>
                    </div>
                </div>
            </div>
        }

      }
    </div>
  `
})
export class ProfileComponent {
  authService = inject(AuthService);
  close = output<void>();

  isEditing = false;
  editData: any = {};
  hobbyInput = '';

  displayUser = computed(() => this.authService.currentUser());

  startEditing() {
      this.editData = JSON.parse(JSON.stringify(this.authService.currentUser()));
      this.isEditing = true;
  }

  saveChanges() {
      this.authService.updateProfile(this.editData);
      this.isEditing = false;
  }

  addHobby() {
      if(this.hobbyInput) {
          if(!this.editData.hobbies) this.editData.hobbies = [];
          this.editData.hobbies.push(this.hobbyInput);
          this.hobbyInput = '';
      }
  }
}
