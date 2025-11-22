
import { Injectable, signal } from '@angular/core';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  password?: string; // In real app, hash this!
  avatar: string;
  bio: string;
  gender: string;
  birthDate: string;
  targetLanguages: string[];
  hobbies: string[]; 
  level: number;
  crowns: { king: number; queen: number };
  achievements: string[];
  isOnline: boolean;
  isBot?: boolean; 
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  currentUser = signal<UserProfile | null>(null);
  // Key updated to v3 to force clear old corrupted data causing hangs
  private readonly DB_KEY = 'dilavcilar_users_v3'; 
  private readonly SESSION_KEY = 'dilavcilar_session_v3';
  
  constructor() {
    this.tryRestoreSession();
  }

  private tryRestoreSession() {
      try {
          const session = localStorage.getItem(this.SESSION_KEY);
          if (session) {
              const user = this.getUserByUsername(session);
              if (user) {
                  this.currentUser.set(user);
              } else {
                  // Session exists but user data missing? Clear it.
                  this.logout();
              }
          }
      } catch (e) {
          console.error('Session restore failed, resetting:', e);
          this.logout();
      }
  }

  // --- Database Operations ---

  private getUsersDB(): UserProfile[] {
      try {
          const raw = localStorage.getItem(this.DB_KEY);
          if (!raw) return [];
          return JSON.parse(raw);
      } catch (e) {
          console.error('DB Corrupt, resetting');
          localStorage.removeItem(this.DB_KEY);
          return [];
      }
  }

  private saveUsersDB(users: UserProfile[]) {
      try {
          localStorage.setItem(this.DB_KEY, JSON.stringify(users));
      } catch (e) {
          console.error('Save failed', e);
      }
  }

  private getUserByUsername(username: string): UserProfile | undefined {
      const users = this.getUsersDB();
      return users.find(u => u.username.toLowerCase() === username.toLowerCase());
  }

  // --- Auth Actions ---

  register(data: any): boolean {
    const users = this.getUsersDB();
    
    if (users.some(u => u.username.toLowerCase() === data.username.toLowerCase())) {
        return false; // User exists
    }

    // Auto-detect Team based on Gender
    let team = 'Avcı'; // Default text
    // Logic is handled in game service for score, but we store gender properly here.

    const newUser: UserProfile = {
      id: 'u-' + Date.now() + Math.floor(Math.random() * 1000),
      username: data.username,
      email: data.email,
      password: data.password, 
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.username}`,
      bio: 'Yeni bir Dil Avcısı maceraya hazır.',
      gender: 'Belirtilmemiş',
      birthDate: '',
      targetLanguages: ['İngilizce'],
      hobbies: ['Müzik', 'Sinema'],
      level: 1,
      crowns: { king: 0, queen: 0 },
      achievements: ['Çaylak Avcı'],
      isOnline: true
    };

    users.push(newUser);
    this.saveUsersDB(users);
    
    // CRITICAL: Auto login immediately after register
    this.loginInternal(newUser);
    return true;
  }

  login(username: string, password?: string): boolean {
    const user = this.getUserByUsername(username);
    if (user) {
        // Check password would happen here
        if (password && user.password && user.password !== password) {
            return false;
        }
        this.loginInternal(user);
        return true;
    }
    return false;
  }

  private loginInternal(user: UserProfile) {
      this.currentUser.set(user);
      localStorage.setItem(this.SESSION_KEY, user.username);
  }

  logout() { 
      this.currentUser.set(null); 
      localStorage.removeItem(this.SESSION_KEY);
  }
  
  updateProfile(d: Partial<UserProfile>) { 
    this.currentUser.update(u => {
        if (!u) return null;
        const updated = { ...u, ...d };
        
        // Update DB
        const users = this.getUsersDB();
        const idx = users.findIndex(x => x.id === u.id);
        if (idx !== -1) {
            users[idx] = updated;
            this.saveUsersDB(users);
        }
        
        return updated;
    }); 
  }
}
