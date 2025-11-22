
import { Component, inject, computed, ElementRef, ViewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SocialService } from '../services/social.service';

@Component({
  selector: 'app-chat-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (socialService.isChatOpen()) {
       <div class="fixed bottom-0 right-0 md:right-4 w-full md:w-96 h-[500px] bg-slate-900 border border-slate-700 rounded-t-2xl shadow-2xl z-[100] flex flex-col animate-slide-up">
          
          <!-- Header -->
          @if (activeUser(); as user) {
            <div class="h-16 bg-slate-800 rounded-t-2xl flex items-center justify-between px-4 border-b border-slate-700 cursor-pointer" (click)="toggleMinimize()">
               <div class="flex items-center gap-3">
                  <div class="relative">
                     <img [src]="user.avatar" class="w-10 h-10 rounded-full border border-green-500">
                     <span class="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border border-slate-800 rounded-full"></span>
                  </div>
                  <div>
                     <div class="font-bold text-white text-sm">{{ user.username }}</div>
                     <div class="text-[10px] text-green-400">Çevrimiçi</div>
                  </div>
               </div>
               
               <button (click)="socialService.closeChat(); $event.stopPropagation()" class="text-slate-400 hover:text-white p-2">
                  ✕
               </button>
            </div>

            <!-- Messages Area -->
            <div class="flex-1 bg-slate-950 overflow-y-auto p-4 space-y-4 custom-scrollbar" #scrollContainer>
               @for (msg of messages(); track msg.timestamp) {
                  <div class="flex w-full" [ngClass]="msg.isMe ? 'justify-end' : 'justify-start'">
                     <div class="max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed animate-fade-in shadow-md"
                          [ngClass]="msg.isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none'">
                        {{ msg.text }}
                        <div class="text-[9px] opacity-50 mt-1 text-right">
                           {{ formatTime(msg.timestamp) }}
                        </div>
                     </div>
                  </div>
               }
            </div>

            <!-- Input Area -->
            <div class="p-3 bg-slate-900 border-t border-slate-800 flex gap-2">
               <input type="text" [(ngModel)]="newMessage" (keyup.enter)="send()" 
                      placeholder="Bir mesaj yaz..." 
                      class="flex-1 bg-slate-800 border border-slate-700 rounded-full px-4 py-2 text-sm text-white focus:border-blue-500 outline-none">
               <button (click)="send()" [disabled]="!newMessage.trim()" class="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-full w-10 h-10 flex items-center justify-center disabled:opacity-50 transition-colors">
                  ➤
               </button>
            </div>
          }
       </div>
    }
  `,
  styles: [`
    .animate-slide-up { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
    .animate-fade-in { animation: fadeIn 0.2s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class ChatDrawerComponent {
  socialService = inject(SocialService);
  newMessage = '';
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  activeUser = computed(() => {
     const id = this.socialService.activeChatUserId();
     if(!id) return null;
     return this.socialService.getById(id);
  });

  messages = computed(() => {
     const id = this.socialService.activeChatUserId();
     if(!id) return [];
     return this.socialService.chatHistory().get(id) || [];
  });

  constructor() {
      effect(() => {
          // Auto scroll to bottom when messages change
          const msgs = this.messages(); 
          setTimeout(() => this.scrollToBottom(), 100);
      });
  }

  send() {
     if(this.newMessage.trim()) {
        this.socialService.sendMessage(this.newMessage);
        this.newMessage = '';
     }
  }

  toggleMinimize() {
     // Placeholder for minimize logic
  }

  formatTime(ts: number) {
     return new Date(ts).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  }

  scrollToBottom(): void {
    try {
        if(this.scrollContainer) {
            this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
        }
    } catch(err) { }
  }
}
