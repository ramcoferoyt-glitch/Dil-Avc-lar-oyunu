
import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { GameService } from './services/game.service';

// Components
import { LoginComponent } from './components/login.component';
import { ProfileComponent } from './components/profile.component';
import { RoomListComponent } from './components/room-list.component';
import { LobbyComponent } from './components/lobby.component';
import { ActiveGameComponent } from './components/active-game.component';
import { ChatDrawerComponent } from './components/chat-drawer.component';
import { ScoreboardComponent } from './components/scoreboard.component';
import { DiscoverComponent } from './components/discover.component';

export type ViewState = 'ROOMS' | 'GAME' | 'RANK' | 'PROFILE' | 'DISCOVER';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    LoginComponent,
    ProfileComponent,
    RoomListComponent,
    LobbyComponent,
    ActiveGameComponent,
    ChatDrawerComponent,
    ScoreboardComponent,
    DiscoverComponent
  ],
  template: `
    <div class="h-screen w-screen bg-[#0F111A] text-white overflow-hidden flex flex-col font-sans relative">
      
      @if (authService.currentUser(); as user) {
        
        <!-- Main Content Area -->
        <main class="flex-1 overflow-hidden relative w-full" [class.pb-[70px]]="showBottomNav()"> 
           @switch (currentView()) {
             @case ('PROFILE') { <app-profile (close)="navTo('ROOMS')" /> }
             @case ('ROOMS') { <app-room-list /> }
             @case ('DISCOVER') { <app-discover /> }
             @case ('GAME') { 
                <!-- Game Logic: If state is MENU, show empty state, else show Active Game -->
                @if(gameService.gameState() === 'MENU') {
                    <div class="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-900">
                        <div class="text-6xl mb-4 opacity-50">🪐</div>
                        <p class="mb-6 font-medium">Şu an bir odada değilsin.</p>
                        <button (click)="navTo('ROOMS')" class="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full text-white font-bold shadow-lg hover:scale-105 transition-transform">
                           Oda Keşfet
                        </button>
                    </div>
                } @else {
                    <app-active-game />
                }
             }
             @case ('RANK') { <app-scoreboard class="h-full block" /> }
             @default { <app-room-list /> }
           }
        </main>

        <!-- Global Chat Drawer (Overlay) -->
        <app-chat-drawer />

        <!-- BOTTOM NAVIGATION BAR (Only visible when NOT in a Game/Room) -->
        @if(showBottomNav()) {
          <nav class="absolute bottom-0 left-0 w-full h-[70px] bg-[#1A1D29]/95 backdrop-blur-md border-t border-white/5 flex justify-around items-center px-2 z-50 shadow-2xl">
              
              <!-- Home / Rooms -->
              <button (click)="navTo('ROOMS')" class="flex flex-col items-center gap-1 p-2 w-14 group">
                  <div class="text-2xl transition-transform group-hover:-translate-y-1" [class.text-white]="currentView() === 'ROOMS'" [class.text-slate-600]="currentView() !== 'ROOMS'">
                      🏠
                  </div>
                  <span class="text-[9px] font-bold uppercase" [class.text-white]="currentView() === 'ROOMS'" [class.text-slate-600]="currentView() !== 'ROOMS'">Ana Sayfa</span>
              </button>

              <!-- Discover (NEW) -->
              <button (click)="navTo('DISCOVER')" class="flex flex-col items-center gap-1 p-2 w-14 group">
                  <div class="text-2xl transition-transform group-hover:-translate-y-1" [class.text-blue-400]="currentView() === 'DISCOVER'" [class.text-slate-600]="currentView() !== 'DISCOVER'">
                      🔍
                  </div>
                  <span class="text-[9px] font-bold uppercase" [class.text-blue-400]="currentView() === 'DISCOVER'" [class.text-slate-600]="currentView() !== 'DISCOVER'">Keşfet</span>
              </button>

              <!-- Create / Speak (Smart Button) -->
              <div class="relative -top-6">
                  <button (click)="handleMiddleButton()" class="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 shadow-[0_0_20px_rgba(236,72,153,0.5)] flex items-center justify-center border-4 border-[#1A1D29] transform active:scale-95 transition-all group hover:scale-105">
                      <span class="text-3xl text-white">+</span>
                  </button>
              </div>

              <!-- Rank / Score -->
              <button (click)="navTo('RANK')" class="flex flex-col items-center gap-1 p-2 w-14 group">
                  <div class="text-2xl transition-transform group-hover:-translate-y-1" [class.text-yellow-500]="currentView() === 'RANK'" [class.text-slate-600]="currentView() !== 'RANK'">
                      🏆
                  </div>
                  <span class="text-[9px] font-bold uppercase" [class.text-yellow-500]="currentView() === 'RANK'" [class.text-slate-600]="currentView() !== 'RANK'">Liderler</span>
              </button>

              <!-- Profile -->
              <button (click)="navTo('PROFILE')" class="flex flex-col items-center gap-1 p-2 w-14 group">
                  <div class="w-7 h-7 rounded-full overflow-hidden border-2 transition-colors" [class.border-white]="currentView() === 'PROFILE'" [class.border-transparent]="currentView() !== 'PROFILE'">
                      <img [src]="user.avatar" class="w-full h-full object-cover bg-slate-800">
                  </div>
                  <span class="text-[9px] font-bold uppercase" [class.text-white]="currentView() === 'PROFILE'" [class.text-slate-600]="currentView() !== 'PROFILE'">Profil</span>
              </button>

          </nav>
        }

      } @else {
        <!-- Login Screen -->
        <app-login />
      }
    </div>
  `
})
export class AppComponent {
  authService = inject(AuthService);
  gameService = inject(GameService);
  
  currentView = signal<ViewState>('ROOMS');

  constructor() {
    effect(() => {
        const state = this.gameService.gameState();
        if (state !== 'MENU' && state !== 'SOCIAL') {
            // If game is active
        }
    });
  }

  navTo(view: ViewState) {
      this.currentView.set(view);
  }

  showBottomNav(): boolean {
      if (this.currentView() === 'GAME' && this.gameService.gameState() !== 'MENU') {
          return false;
      }
      return true;
  }

  handleMiddleButton() {
      if (this.gameService.gameState() !== 'MENU') {
          this.navTo('GAME');
      } else {
          this.navTo('ROOMS'); 
      }
  }
}
