
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
             <button (click)="close.emit()" class="absolute top-4 left-4 w-10 h-10 bg-black/30 rounded-full text-white flex items-center justify-center backdrop-blur-md z-20 hover:bg-black/50 transition-colors">←</button>
             
             <!-- Edit Button -->
             <button (click)="startEditing()" class="absolute top-4 right-4 px-4 py-1.5 bg-black/30 rounded-full text-white text-xs font-bold backdrop-blur-md z-20 hover:bg-black/50 transition-colors flex items-center gap-2">
                <span>✏️</span> Düzenle
             </button>
        </div>

        <!-- Profile Card Container -->
        <div class="px-4 -mt-16 relative z-10">
            <div class="bg-[#1A1D29] rounded-3xl p-6 shadow-2xl border border-white/5">
                
                <!-- Avatar & Status -->
                <div class="flex justify-between items-end mb-4">
                    <div class="w-24 h-24 rounded-[2rem] border-4 border-[#1A1D29] bg-slate-800 overflow-hidden shadow-lg relative -mt-16 group">
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
                     @if(user.birthDate) {
                        <span class="text-xs text-slate-500">• {{ getAge(user.birthDate) }} Yaşında</span>
                     }
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
                        <div class="aspect-square rounded-xl bg-slate-900/50 border border-dashed border-slate-700 flex items-center justify-center text-slate-600 text-xs text-center p-1">
                           + Daha Fazla
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Edit Modal -->
        @if(isEditing) {
            <div class="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-0 md:p-4">
                <div class="bg-[#1A1D29] w-full md:max-w-lg rounded-t-3xl md:rounded-3xl p-6 border-t md:border border-slate-700 shadow-2xl h-[90vh] md:h-auto overflow-y-auto">
                    <div class="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
                        <h3 class="text-white font-bold text-xl">Profili Düzenle</h3>
                        <button (click)="isEditing = false" class="text-slate-400 hover:text-white text-sm font-bold">İptal</button>
                    </div>
                    
                    <div class="space-y-6 mb-8">
                        
                        <!-- Avatar Editor -->
                        <div class="flex flex-col items-center gap-3">
                            <div class="w-24 h-24 rounded-full border-4 border-slate-700 overflow-hidden relative group">
                                <img [src]="editData.avatar" class="w-full h-full object-cover">
                            </div>
                            <button (click)="randomizeAvatar()" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-full text-xs font-bold text-white border border-slate-600 flex items-center gap-2 transition-colors">
                                <span>🎲</span> Resmi Değiştir (Zar At)
                            </button>
                        </div>

                        <!-- Basic Info -->
                        <div class="space-y-4">
                            <div>
                                <label class="block text-xs text-slate-500 font-bold uppercase mb-1">Kullanıcı Adı</label>
                                <input [(ngModel)]="editData.username" class="w-full bg-black/50 border border-slate-700 rounded-xl p-3 text-white text-sm outline-none focus:border-blue-500">
                            </div>

                            <div>
                                <label class="block text-xs text-slate-500 font-bold uppercase mb-1">Doğum Tarihi</label>
                                <input [(ngModel)]="editData.birthDate" type="date" class="w-full bg-black/50 border border-slate-700 rounded-xl p-3 text-white text-sm outline-none focus:border-blue-500">
                            </div>

                            <div>
                                <label class="block text-xs text-slate-500 font-bold uppercase mb-1">Hakkında</label>
                                <textarea [(ngModel)]="editData.bio" class="w-full bg-black/50 border border-slate-700 rounded-xl p-3 text-white text-sm outline-none h-24 focus:border-blue-500"></textarea>
                            </div>

                            <div>
                                <label class="block text-xs text-slate-500 font-bold uppercase mb-1">İlgi Alanları (Virgülle Ayır)</label>
                                <div class="flex gap-2">
                                    <input [(ngModel)]="hobbyInput" (keyup.enter)="addHobby()" placeholder="Müzik, Kodlama, Gezi..." class="flex-1 bg-black/50 border border-slate-700 rounded-xl p-3 text-white text-sm outline-none focus:border-blue-500">
                                    <button (click)="addHobby()" class="bg-blue-600 hover:bg-blue-500 px-4 rounded-xl text-white font-bold transition-colors">+</button>
                                </div>
                                <div class="flex flex-wrap gap-2 mt-2">
                                    @for(h of editData.hobbies; track h) {
                                        <span class="bg-slate-800 text-slate-300 text-xs px-2 py-1 rounded flex items-center gap-1">
                                            {{ h }} <button (click)="removeHobby(h)" class="text-red-400 hover:text-red-300 font-bold ml-1">×</button>
                                        </span>
                                    }
                                </div>
                            </div>
                        </div>
                    </div>

                    <button (click)="saveChanges()" class="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:scale-[1.02] transition-transform">
                        KAYDET VE GÜNCELLE
                    </button>
                </div>
            </div>
        }

      }
    </div>
  `,
  styles: [`
     .animate-fade-in { animation: fadeIn 0.2s ease-out; }
     @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  `]
})
export class ProfileComponent {
  authService = inject(AuthService);
  close = output<void>();

  isEditing = false;
  editData: any = {};
  hobbyInput = '';

  displayUser = computed(() => this.authService.currentUser());

  getAge(dateString: string) {
      if(!dateString) return '';
      const today = new Date();
      const birthDate = new Date(dateString);
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
      }
      return age;
  }

  startEditing() {
      // Clone user data to avoid direct mutation before save
      const current = this.authService.currentUser();
      if(current) {
          this.editData = JSON.parse(JSON.stringify(current));
          if(!this.editData.hobbies) this.editData.hobbies = [];
      }
      this.isEditing = true;
  }

  randomizeAvatar() {
      // Generate a new seed
      const seed = Math.random().toString(36).substring(7);
      this.editData.avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
  }

  saveChanges() {
      this.authService.updateProfile(this.editData);
      this.isEditing = false;
  }

  addHobby() {
      if(this.hobbyInput.trim()) {
          const newHobbies = this.hobbyInput.split(',').map(s => s.trim()).filter(s => s.length > 0);
          this.editData.hobbies = [...new Set([...this.editData.hobbies, ...newHobbies])];
          this.hobbyInput = '';
      }
  }

  removeHobby(hobby: string) {
      this.editData.hobbies = this.editData.hobbies.filter((h: string) => h !== hobby);
  }
}
