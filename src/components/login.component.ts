
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-full flex items-center justify-center p-4 relative overflow-hidden bg-slate-950 h-screen">
      <!-- Animated Background -->
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-950 to-black"></div>
      <div class="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 animate-pulse-slow"></div>

      <!-- Main Card -->
      <div class="relative z-10 bg-slate-900/95 border border-slate-700 p-8 rounded-2xl shadow-2xl max-w-md w-full backdrop-blur-xl">
        
        <!-- Loading Overlay -->
        @if (isLoading) {
          <div class="absolute inset-0 z-50 bg-slate-900/95 rounded-2xl flex flex-col items-center justify-center animate-fade-in">
            <div class="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p class="text-yellow-400 font-bold animate-pulse">{{ loadingText }}</p>
          </div>
        }

        <div class="text-center mb-8">
          <h1 class="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-pink-600 mb-2 tracking-tighter drop-shadow-sm">
            DİL AVCILARI
          </h1>
          <p class="text-slate-300 text-sm font-medium">Evrenin en büyük dil yarışması.</p>
        </div>

        @if(errorMessage) {
            <div class="bg-red-900/50 border border-red-500 text-red-200 p-3 rounded-lg mb-4 text-sm text-center animate-shake">
                {{ errorMessage }}
            </div>
        }

        <!-- Form -->
        <form (submit)="onSubmit()" class="space-y-4">
          <div>
            <label for="username" class="block text-xs font-bold text-slate-300 mb-1 ml-1">Kullanıcı Adı</label>
            <input type="text" id="username" [(ngModel)]="username" name="username" 
                   placeholder="Örn: DilAvcısı2024" 
                   required
                   class="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white placeholder-slate-500 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-colors">
          </div>
          
          @if(!isLoginMode) {
            <div class="animate-fade-in">
               <label for="email" class="block text-xs font-bold text-slate-300 mb-1 ml-1">E-posta Adresi</label>
               <input type="email" id="email" [(ngModel)]="email" name="email" 
                      placeholder="ornek@email.com" 
                      required
                      class="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white placeholder-slate-500 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-colors">
            </div>
          }
          
          <div>
             <label for="password" class="block text-xs font-bold text-slate-300 mb-1 ml-1">Şifre</label>
             <input type="password" id="password" [(ngModel)]="password" name="password" 
                    placeholder="••••••••" 
                    required
                    class="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white placeholder-slate-500 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-colors">
          </div>

          <button type="submit" 
                  [disabled]="isLoading || !username || !password"
                  class="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 text-black font-black uppercase py-4 rounded-lg shadow-lg hover:brightness-110 transition-all transform hover:scale-[1.02] focus:ring-4 focus:ring-yellow-500/50 outline-none disabled:opacity-50 disabled:cursor-not-allowed">
            {{ isLoginMode ? 'GİRİŞ YAP' : 'HESAP OLUŞTUR' }}
          </button>
        </form>

        <div class="mt-6 text-center">
          <button (click)="toggleMode()" class="text-slate-400 text-sm hover:text-white transition-colors underline decoration-slate-600 hover:decoration-white font-medium">
            {{ isLoginMode ? 'Hesabın yok mu? Kayıt Ol' : 'Zaten üye misin? Giriş Yap' }}
          </button>
        </div>
      </div>
      
      <!-- Footer Info -->
      <div class="absolute bottom-4 text-center w-full text-slate-600 text-xs">
        &copy; 2024 Dil Avcıları. Tüm hakları saklıdır.
      </div>
    </div>
  `,
  styles: [`
    .animate-pulse-slow { animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
    .animate-fade-in { animation: fadeIn 0.3s ease-out; }
    .animate-shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes shake { 10%, 90% { transform: translate3d(-1px, 0, 0); } 20%, 80% { transform: translate3d(2px, 0, 0); } 30%, 50%, 70% { transform: translate3d(-4px, 0, 0); } 40%, 60% { transform: translate3d(4px, 0, 0); } }
  `]
})
export class LoginComponent {
  authService = inject(AuthService);
  
  isLoginMode = true;
  isLoading = false;
  loadingText = '';
  errorMessage = '';
  
  username = '';
  email = '';
  password = '';

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
    this.errorMessage = '';
  }

  async onSubmit() {
    if (!this.username || !this.password) return;

    this.isLoading = true;
    this.errorMessage = '';
    this.loadingText = this.isLoginMode ? 'Kimlik doğrulanıyor...' : 'Profil oluşturuluyor...';

    // Very short delay for UX, then process
    await new Promise(resolve => setTimeout(resolve, 500));

    let success = false;

    if (this.isLoginMode) {
        success = this.authService.login(this.username, this.password);
        if (!success) {
            this.errorMessage = 'Kullanıcı bulunamadı veya şifre yanlış.';
            this.isLoading = false; // Stop loading on error
        }
    } else {
        success = this.authService.register({ 
            username: this.username, 
            email: this.email, 
            password: this.password 
        });
        if (!success) {
            this.errorMessage = 'Bu kullanıcı adı zaten alınmış.';
            this.isLoading = false; // Stop loading on error
        }
    }
    
    // If success, we DON'T set isLoading = false here immediately. 
    // The AppComponent effect will detect the user change and switch the view.
    // However, just in case of a glitch, we set a failsafe timeout.
    if(success) {
       setTimeout(() => { this.isLoading = false; }, 2000);
    }
  }
}
