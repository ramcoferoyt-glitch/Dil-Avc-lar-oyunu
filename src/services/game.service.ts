
import { Injectable, signal, computed, inject } from '@angular/core';
import { GeminiService } from './gemini.service';
import { AudioService } from './audio.service';
import { AuthService } from './auth.service';
import { SocialUser, SocialService } from './social.service';

export type GameState = 'MENU' | 'SOCIAL' | 'TRANSITION' | 'PREPARE_ROUND' | 'ROUND_1' | 'ROUND_2' | 'ROUND_3' | 'WINNER_REVEAL';
export type Round3Stage = 'WAITING' | 'WRONG_WORD' | 'QUERY' | 'RIDDLE';
export type PlayerStatus = 'ACTIVE' | 'ELIMINATED' | 'SPECTATOR';
export type CardType = 'TASK' | 'PUNISHMENT' | 'LUCK' | 'EMPTY';
export type GameMode = 'INDIVIDUAL' | 'TEAM';

export interface GameSettings {
  roomId: string;
  roomName: string;
  targetLanguage: string;
  difficulty: 'Kolay' | 'Orta' | 'Zor' | 'Expert';
  maxPlayers: number;
  isPrivate: boolean;
  isPublished: boolean;
  mode: GameMode;
  backgroundImage: string;
  isChatLocked: boolean;
}

export interface RoomSummary {
  id: string;
  title: string;
  language: string;
  count: number;
  avatars: string[];
  tags: string[];
  isLive: boolean;
}

export interface Player {
  id: string;
  name: string;
  score: number;
  status: PlayerStatus;
  team?: 'KING' | 'QUEEN';
  isPatron: boolean; 
  avatarColor: string;
  isMutedByPatron: boolean; 
  lastDelta?: number;
  lastDeltaTime?: number;
  badges: string[];
  isBot: boolean;
  avatar: string;
  gender: 'Erkek' | 'Kadın' | 'Belirtilmemiş';
  hasJoker: boolean;
  hasPlayedInRound: boolean; 
  isSpy?: boolean;
  isOnStage: boolean;
  isHandRaised: boolean;
  isMuted: boolean;
}

export interface GameCard {
  id: number | string;
  type: CardType;
  content: string;
  isRevealed: boolean;
  label: string;
  ariaLabel: string; 
  colorClass?: string; 
  orbType?: 'GOLD' | 'COLOR'; 
  completed?: boolean;
  colorName?: string; 
}

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private geminiService = inject(GeminiService);
  private audioService = inject(AudioService);
  private authService = inject(AuthService);
  private socialService = inject(SocialService);

  private readonly ROOMS_DB_KEY = 'dilavcilar_rooms_db_v1';

  // --- PUBLIC ROOMS DATABASE (Persistent) ---
  publicRooms = signal<RoomSummary[]>([]);

  settings = signal<GameSettings>({
    roomId: 'RM-' + Math.floor(Math.random() * 10000),
    roomName: 'DİL AVCILARI',
    targetLanguage: 'İngilizce',
    difficulty: 'Orta',
    maxPlayers: 50, 
    isPrivate: false,
    isPublished: false,
    mode: 'INDIVIDUAL',
    backgroundImage: 'https://images.unsplash.com/photo-1516280440614-6697288d5d38?q=80&w=1920&auto=format&fit=crop',
    isChatLocked: false
  });

  availableLanguages = [
    'Türkçe', 'İngilizce', 'Kürtçe', 'Arapça', 'İspanyolca', 
    'Almanca', 'Fransızca', 'Çince', 'Rusça', 'İtalyanca', 
    'Japonca', 'Portekizce', 'Farsça', 'Azerice', 'Osmanlıca', 'Korece'
  ];

  gameState = signal<GameState>('MENU'); 
  round3Stage = signal<Round3Stage>('WAITING');
  transitionTitle = signal<string>('');
  transitionSubtitle = signal<string>('');
  
  nextRoundTitle = signal<string>('');
  nextRoundDesc = signal<string>('');

  players = signal<Player[]>([]);
  currentRoundCards = signal<GameCard[]>([]);
  gameLog = signal<string[]>([]);
  
  timerValue = signal<number>(0);
  timerMax = signal<number>(1); 
  isTimerRunning = signal<boolean>(false);
  
  activeCard = signal<GameCard | null>(null);
  activePlayerId = signal<string | null>(null);
  winnerPlayer = signal<Player | null>(null);
  
  spyMission = signal<string>('');
  finalRoundContent = signal<string>('');
  isGlobalSoundMuted = signal<boolean>(false);

  activePlayer = computed(() => this.players().find(p => p.id === this.activePlayerId()));
  currentPatron = computed(() => this.players().find(p => p.isPatron));
  
  stagePlayers = computed(() => this.players().filter(p => p.isOnStage || p.isPatron));
  sortedPlayers = computed(() => this.players().slice().sort((a, b) => b.score - a.score));
  top3Players = computed(() => this.players().filter(p => p.score > 0 && p.status !== 'ELIMINATED').sort((a,b) => b.score - a.score).slice(0,3));
  
  kingTeamScore = computed(() => this.players().filter(p => p.team === 'KING').reduce((acc, p) => acc + p.score, 0));
  queenTeamScore = computed(() => this.players().filter(p => p.team === 'QUEEN').reduce((acc, p) => acc + p.score, 0));

  private timerInterval: any;
  private currentRoundDeckMap: Map<number | string, CardType> = new Map();

  constructor() {
      this.loadRooms();
  }

  private loadRooms() {
      try {
          const stored = localStorage.getItem(this.ROOMS_DB_KEY);
          if (stored) {
              this.publicRooms.set(JSON.parse(stored));
          }
      } catch (e) { console.error('Room DB Error'); }
  }

  private saveRooms(rooms: RoomSummary[]) {
      this.publicRooms.set(rooms);
      localStorage.setItem(this.ROOMS_DB_KEY, JSON.stringify(rooms));
  }

  createNewRoom(settings: Partial<GameSettings>) {
    this.settings.update(s => ({
      ...s,
      ...settings,
      roomId: 'RM-' + Math.floor(1000 + Math.random() * 9000),
      isPublished: false // Reset published state for new room
    }));
    this.players.set([]); 
    const me = this.authService.currentUser();
    this.addPlayer(me ? me.username : 'Yönetici', true, me?.avatar, me?.id, me?.gender as any, true);
    this.gameState.set('SOCIAL');
  }

  publishRoom() {
      this.settings.update(s => ({ ...s, isPublished: true }));
      
      const current = this.settings();
      const summary: RoomSummary = {
          id: current.roomId,
          title: current.roomName,
          language: current.targetLanguage,
          count: this.players().length,
          avatars: this.players().slice(0,3).map(p => p.avatar),
          tags: [current.targetLanguage, current.mode === 'TEAM' ? 'Takım Savaşı' : 'Yarışma'],
          isLive: false 
      };

      const existing = this.publicRooms();
      // Update if exists, else add
      const filtered = existing.filter(r => r.id !== summary.id);
      this.saveRooms([summary, ...filtered]);
  }

  enterRoom(id: string) {
    this.gameState.set('SOCIAL');
    // Find room info
    const room = this.publicRooms().find(r => r.id === id);
    if(room) {
        this.settings.update(s => ({...s, roomName: room.title, targetLanguage: room.language, roomId: id}));
    }
    
    const me = this.authService.currentUser();
    if (me && !this.players().some(p => p.id === me.id)) {
       this.addPlayer(me.username, false, me.avatar, me.id, me.gender as any, false);
    }
  }

  addPlayer(name: string, forcePatron = false, avatarUrl?: string, existingId?: string, gender: 'Erkek'|'Kadın'|'Belirtilmemiş' = 'Belirtilmemiş', startOnStage = false) {
    let team: 'KING'|'QUEEN' = 'KING';
    if (gender === 'Kadın') team = 'QUEEN';
    else if (gender === 'Erkek') team = 'KING';
    else team = Math.random() > 0.5 ? 'KING' : 'QUEEN'; 

    const newPlayer: Player = {
      id: existingId || (Date.now().toString() + Math.random()),
      name,
      score: 0,
      status: 'ACTIVE',
      isPatron: forcePatron || this.players().length === 0,
      avatarColor: this.getRandomColor(),
      isMutedByPatron: false,
      badges: [],
      isBot: false,
      avatar: avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
      team: team,
      gender: gender,
      hasJoker: false,
      hasPlayedInRound: false,
      isSpy: false,
      isOnStage: startOnStage || forcePatron,
      isHandRaised: false,
      isMuted: true
    };
    this.players.update(list => {
        if(list.some(p => p.id === newPlayer.id)) return list;
        return [...list, newPlayer];
    });
    
    if (this.players().length > 1 && !this.isGlobalSoundMuted()) this.audioService.playOrbClick(); 
    
    // Update room count in DB if published
    if (this.settings().isPublished) this.updateRoomCountInDB();
  }

  private updateRoomCountInDB() {
      const rid = this.settings().roomId;
      const count = this.players().length;
      const rooms = this.publicRooms().map(r => r.id === rid ? { ...r, count } : r);
      this.saveRooms(rooms);
  }

  addBotPlayer(bot: SocialUser) {
     const currentBots = this.players().filter(p => p.isBot).length;
     if (currentBots >= 12) { return; }

     const uniqueId = bot.id + '-' + Math.random().toString(36).substr(2, 5);
     const newPlayer: Player = {
         id: uniqueId,
         name: bot.username,
         score: 0,
         status: 'ACTIVE',
         isPatron: false,
         avatarColor: this.getRandomColor(),
         isMutedByPatron: false,
         badges: bot.achievements,
         isBot: true,
         avatar: bot.avatar,
         team: bot.gender === 'Kadın' ? 'QUEEN' : 'KING',
         gender: bot.gender as any,
         hasJoker: false,
         hasPlayedInRound: false,
         isSpy: false,
         isOnStage: true,
         isHandRaised: false,
         isMuted: false
     };
     this.players.update(list => [...list, newPlayer]);
     if(!this.isGlobalSoundMuted()) this.audioService.playOrbClick();
     if (this.settings().isPublished) this.updateRoomCountInDB();
  }

  addSingleBot() {
      const bots = this.socialService.getRandomBots(1);
      if(bots.length > 0) {
          this.addBotPlayer(bots[0]);
      }
  }

  toggleMute(playerId: string) {
      this.players.update(list => list.map(p => p.id === playerId ? { ...p, isMuted: !p.isMuted } : p));
  }

  muteAll() {
      this.players.update(list => list.map(p => p.isPatron ? p : { ...p, isMutedByPatron: true, isMuted: true }));
      if(!this.isGlobalSoundMuted()) this.audioService.playTick();
  }

  toggleGlobalSound() {
      this.isGlobalSoundMuted.update(v => !v);
      if (this.isGlobalSoundMuted()) {
          this.audioService.stopTension();
      }
  }

  startGameLoop() {
    this.settings.update(s => ({ ...s, isChatLocked: true }));
    
    // Update public room status to Live
    const rid = this.settings().roomId;
    const rooms = this.publicRooms().map(r => r.id === rid ? { ...r, isLive: true } : r);
    this.saveRooms(rooms);

    if(!this.isGlobalSoundMuted()) this.audioService.playGameStart();
    this.resetRoundStatus();
    this.runTransition('1. TUR', 'HIZLI & ÖFKELİ', 'ROUND_1');
  }

  resetRoundStatus() {
      this.players.update(list => list.map(p => ({ ...p, hasPlayedInRound: false })));
      this.activePlayerId.set(null);
  }

  nextTurn() {
      this.activePlayerId.set(null);
      this.activeCard.set(null);

      let candidates = this.players().filter(p => 
          !p.isPatron && 
          p.status === 'ACTIVE' && 
          !p.hasPlayedInRound
      );
      
      if (candidates.length === 0) {
          return false; 
      }

      const nextPlayer = candidates[Math.floor(Math.random() * candidates.length)];
      this.setActivePlayer(nextPlayer.id);
      return true;
  }

  setActivePlayer(id: string) {
      this.activePlayerId.set(id);
      this.players.update(list => list.map(p => p.id === id ? {...p, isOnStage: true, isMuted: false} : p));
      if(!this.isGlobalSoundMuted()) this.audioService.playOrbClick();
  }

  startNextRoundPreparation() {
      const current = this.gameState();
      let nextR = '';
      let title = '';
      let desc = '';

      if (current === 'ROUND_1') {
          nextR = 'ROUND_2';
          title = '2. TUR: RENKLERİN DİLİ';
          desc = 'Kutuları seç, rengine uygun görevi yap! Dikkat: Cevaplar sende, sorular bizde.';
      } else if (current === 'ROUND_2') {
          nextR = 'ROUND_3';
          title = 'BÜYÜK FİNAL';
          desc = 'Sadece en iyiler kaldı. Soruyu bil, cevabı bul, şampiyonluğu kazan.';
      } else {
          return;
      }

      this.gameState.set('PREPARE_ROUND');
      this.nextRoundTitle.set(title);
      this.nextRoundDesc.set(desc);
      this.activeCard.set(null);
      if(!this.isGlobalSoundMuted()) this.audioService.playTension();
  }

  proceedToNextRound() {
      const currentTitle = this.nextRoundTitle();
      const targetState: GameState = currentTitle.includes('2. TUR') ? 'ROUND_2' : 'ROUND_3';
      this.runTransition(
          targetState === 'ROUND_2' ? '2. TUR' : 'FİNAL', 
          targetState === 'ROUND_2' ? 'RENK SPEKTRUMU' : 'SON KARAR', 
          targetState
      );
  }

  runTransition(title: string, subtitle: string, nextState: GameState) {
      this.gameState.set('TRANSITION');
      this.transitionTitle.set(title);
      this.transitionSubtitle.set(subtitle);
      if(!this.isGlobalSoundMuted()) this.audioService.playGameStart();
      
      setTimeout(() => {
          if(nextState === 'ROUND_1') this.startRound1();
          if(nextState === 'ROUND_2') this.startRound2();
          if(nextState === 'ROUND_3') this.startRound3();
      }, 3000);
  }

  private shuffleDeck(deck: CardType[]): CardType[] {
      const shuffled = [...deck];
      for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
  }

  startRound1() {
    this.resetRoundStatus();
    this.gameState.set('ROUND_1');
    const deckComposition: CardType[] = ['LUCK', 'LUCK', 'LUCK', 'TASK', 'TASK', 'TASK', 'TASK', 'TASK', 'TASK', 'TASK', 'TASK', 'PUNISHMENT', 'PUNISHMENT', 'PUNISHMENT', 'PUNISHMENT'];
    const shuffledDeck = this.shuffleDeck(deckComposition);
    this.currentRoundDeckMap.clear();

    const cards: GameCard[] = [];
    for (let i = 1; i <= 15; i++) {
      const cardId = i;
      this.currentRoundDeckMap.set(cardId, shuffledDeck[i-1]);
      cards.push({ id: cardId, label: i.toString(), ariaLabel: `Kutu ${i}`, type: 'EMPTY', content: '?', orbType: 'GOLD', isRevealed: false, completed: false });
    }
    this.currentRoundCards.set(cards);
    this.activeCard.set(null);
    if(!this.isGlobalSoundMuted()) this.audioService.playGameStart();
  }

  startRound2() {
    this.resetRoundStatus();
    this.gameState.set('ROUND_2');
    const deckComposition: CardType[] = ['LUCK', 'LUCK', 'TASK', 'TASK', 'TASK', 'TASK', 'TASK', 'TASK', 'TASK', 'TASK', 'PUNISHMENT', 'PUNISHMENT', 'PUNISHMENT', 'PUNISHMENT', 'PUNISHMENT'];
    const shuffledDeck = this.shuffleDeck(deckComposition);
    this.currentRoundDeckMap.clear();

    const cards: GameCard[] = [];
    const palette = [
      { c: 'from-red-500 to-red-700', n: 'Kırmızı' }, { c: 'from-blue-500 to-blue-700', n: 'Mavi' },
      { c: 'from-green-500 to-green-700', n: 'Yeşil' }, { c: 'from-purple-400 to-purple-600', n: 'Mor' },
      { c: 'from-yellow-400 to-yellow-600', n: 'Altın' }, { c: 'from-pink-400 to-pink-600', n: 'Pembe' },
      { c: 'from-orange-400 to-orange-600', n: 'Turuncu' }, { c: 'from-teal-400 to-teal-600', n: 'Turkuaz' },
      { c: 'from-indigo-500 to-indigo-800', n: 'Lacivert' }, { c: 'from-rose-400 to-rose-600', n: 'Gül' },
      { c: 'from-cyan-400 to-cyan-600', n: 'Camgöbeği' }, { c: 'from-lime-400 to-lime-600', n: 'Limon' },
      { c: 'from-amber-600 to-amber-800', n: 'Kehribar' }, { c: 'from-gray-400 to-gray-600', n: 'Gümüş' },
      { c: 'from-emerald-500 to-emerald-700', n: 'Zümrüt' }
    ];

    for (let i = 0; i < 15; i++) {
       const p = palette[i % palette.length];
       const cardId = i + 200;
       this.currentRoundDeckMap.set(cardId, shuffledDeck[i]);
       cards.push({
         id: cardId, label: '', ariaLabel: p.n, colorClass: `bg-gradient-to-br ${p.c}`,
         orbType: 'COLOR', colorName: p.n, type: 'EMPTY', content: '?', isRevealed: false, completed: false
       });
    }
    this.currentRoundCards.set(cards);
    this.activeCard.set(null);
    if(!this.isGlobalSoundMuted()) this.audioService.playGameStart();
  }

  startRound3() {
     this.gameState.set('ROUND_3');
     this.round3Stage.set('WAITING');
     this.activeCard.set(null);
     if(!this.isGlobalSoundMuted()) {
         this.audioService.playGameStart();
         setTimeout(() => this.audioService.playTension(), 2000);
     }
  }

  getTimerDuration(type: CardType, content: string = '') {
      if (content.includes('şarkı') || content.includes('Şarkı')) return 30;
      if (content.includes('say') || content.includes('listele')) return 15;
      const diff = this.settings().difficulty;
      let base = 20;
      if (diff === 'Kolay') base = 30;
      if (diff === 'Zor') base = 15;
      if (type === 'PUNISHMENT') return 15; 
      return base;
  }

  private processLuckCard(playerId: string): { rewardText: string, rewardType: string } {
      const outcomes = [
          { type: 'JACKPOT', text: '🎉 BÜYÜK İKRAMİYE!\n+50 PUAN!', points: 50, joker: false },
          { type: 'BONUS', text: '✨ ŞANSLI GÜN!\n+20 PUAN', points: 20, joker: false },
          { type: 'JOKER', text: '🃏 JOKER KAZANDIN!\nBu kartı sakla.', points: 0, joker: true },
          { type: 'SAFE', text: '🛡️ DOKUNULMAZLIK!\n+10 Puan', points: 10, joker: false }
      ];
      const randomIndex = Math.floor(Math.random() * outcomes.length);
      const outcome = outcomes[randomIndex];
      this.players.update(list => list.map(p => p.id === playerId ? { ...p, score: p.score + outcome.points, hasJoker: outcome.joker ? true : p.hasJoker, hasPlayedInRound: true } : p));
      return { rewardText: outcome.text, rewardType: outcome.type };
  }

  async openCard(cardId: number | string) {
    if (!this.activePlayerId()) {
        const success = this.nextTurn();
        if(!success) {
            if(!this.isGlobalSoundMuted()) this.audioService.playFail();
            return; 
        }
        await new Promise(r => setTimeout(r, 500));
    }
    
    const cards = this.currentRoundCards();
    const idx = cards.findIndex(c => c.id === cardId);
    if (idx === -1 || cards[idx].completed || this.activeCard()) return;

    const type = this.currentRoundDeckMap.get(cardId) || 'TASK';
    
    if(!this.isGlobalSoundMuted()) this.audioService.playTension();
    
    this.updateCard(idx, { isRevealed: true, type: type, content: 'YÜKLENİYOR...' });
    this.activeCard.set(this.currentRoundCards()[idx]);
    
    try {
        let content = '';
        if (type === 'LUCK') {
            const luckResult = this.processLuckCard(this.activePlayerId()!);
            content = luckResult.rewardText;
            setTimeout(() => {
                 this.updateCard(idx, { content: content, completed: true });
                 this.activeCard.set(this.currentRoundCards()[idx]);
                 if(!this.isGlobalSoundMuted()) this.audioService.playVictory();
                 setTimeout(() => { this.closeActiveCard(); }, 3000);
            }, 800);
        } else {
            const lang = this.settings().targetLanguage;
            if (type === 'PUNISHMENT') content = await this.geminiService.generatePenalty(lang);
            else if (this.gameState() === 'ROUND_2') content = await this.geminiService.generateColorTask(cards[idx].colorName || 'Renk', lang, this.settings().difficulty);
            else content = await this.geminiService.generateRound1Task(lang, this.settings().difficulty);
            
            setTimeout(() => {
                 this.updateCard(idx, { content: content });
                 this.activeCard.set(this.currentRoundCards()[idx]); 
                 // Keep tension playing during the task reading
                 if(!this.isGlobalSoundMuted()) {
                     if (type === 'PUNISHMENT') this.audioService.playAlarm(); else this.audioService.playOrbClick(); 
                 }
                 this.startTimer(this.getTimerDuration(type, content));
            }, 1000);
        }
    } catch (e) {
        this.updateCard(idx, { content: 'Bağlantı hatası.' });
        this.audioService.stopTension();
    }
  }

  judgeActivePlayer(success: boolean) {
    const pid = this.activePlayerId();
    const card = this.activeCard();
    if (!pid || !card) return;
    if (card.type === 'LUCK') { this.closeActiveCard(); return; }
    
    const idx = this.currentRoundCards().findIndex(c => c.id === card.id);
    if (idx !== -1) this.updateCard(idx, { completed: true });
    
    let points = success ? 15 : -5;
    if (card.type === 'PUNISHMENT' && !success) points = -15;
    
    this.updateScore(pid, points);
    this.players.update(list => list.map(p => p.id === pid ? {...p, hasPlayedInRound: true} : p));
    
    if(!this.isGlobalSoundMuted()) {
        this.audioService.stopTension();
        if (points > 0) this.audioService.playVictory(); else this.audioService.playFail();
    }
    this.closeActiveCard();
    this.activePlayerId.set(null);
  }

  handleTimeOut() {
      const pid = this.activePlayerId();
      if (pid) {
          this.updateScore(pid, -10);
          this.players.update(list => list.map(p => p.id === pid ? {...p, hasPlayedInRound: true} : p));
          if(!this.isGlobalSoundMuted()) this.audioService.playAlarm();
          this.activeCard.update(c => c ? ({...c, content: "🛑 SÜRE DOLDU!"}) : null);
          setTimeout(() => { this.closeActiveCard(); this.activePlayerId.set(null); }, 2500);
      } else {
          this.closeActiveCard();
      }
  }

  async triggerRound3Stage(stage: Round3Stage) {
      this.round3Stage.set(stage);
      this.finalRoundContent.set('Soru Hazırlanıyor...');
      if(!this.isGlobalSoundMuted()) this.audioService.playTension(); 
      try {
          let content = '';
          if (stage === 'WRONG_WORD') content = await this.geminiService.generateWrongWordPuzzle(this.settings().targetLanguage, this.settings().difficulty);
          else if (stage === 'QUERY') content = await this.geminiService.generateInterviewQuestion(this.settings().targetLanguage, this.settings().difficulty);
          else if (stage === 'RIDDLE') content = await this.geminiService.generateRiddle(this.settings().targetLanguage);
          
          this.finalRoundContent.set(content);
          this.startTimer(30);
      } catch (e) {
          this.finalRoundContent.set('Hata.');
      }
  }
  
  judgeRound3(playerId: string, success: boolean) {
      const points = success ? 50 : -20;
      this.updateScore(playerId, points);
      if(!this.isGlobalSoundMuted()) {
          this.audioService.stopTension();
          if (success) this.audioService.playVictory(); else this.audioService.playFail();
      }
      this.stopTimer();
      this.activePlayerId.set(null);
  }

  closeActiveCard() {
      this.activeCard.set(null);
      this.stopTimer();
      this.audioService.stopTension();
  }

  updateScore(pid: string, delta: number) {
      this.players.update(list => list.map(p => 
          p.id === pid ? { ...p, score: p.score + delta, lastDelta: delta, lastDeltaTime: Date.now() } : p
      ));
  }

  finalizeRound3() {
      const finalists = this.top3Players();
      if(finalists.length === 0) return;
      const winner = finalists.reduce((prev, current) => (prev.score > current.score) ? prev : current);
      this.declareWinner(winner.id);
  }

  declareWinner(playerId: string) {
      const winner = this.players().find(p => p.id === playerId);
      if (!winner) return;
      this.winnerPlayer.set(winner);
      this.gameState.set('WINNER_REVEAL');
      if(!this.isGlobalSoundMuted()) this.audioService.playVictory();
  }

  leaveGame() {
      this.gameState.set('MENU'); 
      this.audioService.stopTension();
      this.settings.update(s => ({...s, isChatLocked: false}));
      
      // Remove me from players if leaving properly
      const me = this.authService.currentUser();
      if(me) {
          this.players.update(list => list.filter(p => p.id !== me.id));
          if(this.settings().isPublished) this.updateRoomCountInDB();
      }
  }
  
  kickPlayer(id: string) {
    const p = this.players().find(x => x.id === id);
    if(p && !p.isPatron) {
        this.players.update(list => list.filter(x => x.id !== id));
        if(this.settings().isPublished) this.updateRoomCountInDB();
    }
  }

  saveSettings() {
      // If room is published, update its metadata in public list
      if(this.settings().isPublished) {
          this.updateRoomCountInDB();
      }
  }

  makeSpy(id: string) {
      this.players.update(list => list.map(p => p.id === id ? { ...p, isSpy: !p.isSpy } : p));
  }

  generateSpyTask() {
     this.geminiService.generateSpyTask().then(res => { this.spyMission.set(res); });
  }

  startTimer(sec: number) {
    this.stopTimer();
    this.timerValue.set(sec);
    this.timerMax.set(sec);
    this.isTimerRunning.set(true);
    this.timerInterval = setInterval(() => {
        const v = this.timerValue();
        if (v > 0) {
            this.timerValue.set(v - 1);
            if (v <= 6 && !this.isGlobalSoundMuted()) this.audioService.playTick();
        } else { 
            this.stopTimer(); 
            this.handleTimeOut();
        }
    }, 1000);
  }
  
  stopTimer() { clearInterval(this.timerInterval); this.isTimerRunning.set(false); }
  revealCard(id: number | string, round: string) { this.openCard(id); }
  processCommand(cmd: string) { }
  private updateCard(idx: number, changes: Partial<GameCard>) {
    this.currentRoundCards.update(c => { const n = c.slice(); n[idx] = { ...n[idx], ...changes }; return n; });
  }
  private getRandomColor() { return ['#ef4444', '#3b82f6', '#eab308', '#a855f7', '#22c55e', '#ec4899'][Math.floor(Math.random()*6)]; }
  
  setPlayerOnStage(playerId: string) {
      this.activePlayerId.set(playerId);
      if(!this.isGlobalSoundMuted()) this.audioService.playOrbClick();
  }
  
  resetGame() {
      this.gameState.set('MENU');
      this.players.set([]);
      this.settings.update(s => ({...s, isChatLocked: false}));
  }
  
  restartGame() {
      this.gameState.set('SOCIAL');
      this.settings.update(s => ({...s, isChatLocked: false}));
      this.players.update(list => list.map(p => ({...p, score:0, hasPlayedInRound: false, status:'ACTIVE'})));
  }
  
  setLanguage(lang: string) { this.settings.update(s => ({ ...s, targetLanguage: lang })); }
  setTheme(url: string) { this.settings.update(s => ({ ...s, backgroundImage: url })); }
  setDifficulty(d: any) { this.settings.update(s => ({...s, difficulty: d})); }
}
