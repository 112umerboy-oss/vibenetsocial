import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Users, 
  Zap, 
  BarChart3, 
  ChevronRight, 
  ChevronDown,
  Send,
  Loader2,
  X,
  Camera,
  Video,
  Instagram,
  MessageSquare,
  Hash,
  BookOpen,
  MessageCircle,
  TrendingUp,
  MessageSquareText,
  Star,
  Search,
  Anchor,
  Flame,
  Layout,
  Bookmark,
  Plus,
  ArrowUpRight,
  User,
  LogOut,
  AppWindow,
  Menu,
  Trophy,
  Ghost,
  Skull,
  ShieldAlert,
  EyeOff,
  Coffee,
  Fingerprint,
  Bell,
  Grid,
  Swords,
  ShoppingBag
} from 'lucide-react';
import { 
  generateCaption, 
  matchVibes, 
  curateMood, 
  getCreatorInsights,
  analyzeVisualVibe,
  syncSocials,
  generateBio,
  getHashtagStrategy,
  buildStoryArc,
  generateDM,
  getTrendRadar,
  getCommentReplies,
  getAestheticScore,
  findCollabs,
  generateHook,
  getVibeDNA,
  detectCringe,
  getRealityCheck,
  usePostGraveyard
} from './services/vibeNetService';
import { auth, signIn, handleFirestoreError, OperationType } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Auth } from './components/Auth';
import { Feed } from './components/Feed';
import { Leaderboard } from './components/Leaderboard';
import { updateStreak, getStreakMessage } from './services/streakService';
import { UserProfile } from './types';
import { seedShadowFeed } from './services/seedService';
import { ProfilePage } from './components/ProfilePage';
import { QuickDrop } from './components/QuickDrop';
import { NotificationsPage } from './components/NotificationsPage';
import { HallOfFame } from './components/HallOfFame';
import { CreatorLab } from './components/CreatorLab';
import { VibeRooms } from './components/VibeRooms';
import { Marketplace } from './components/Marketplace';
import { VibeBattles } from './components/VibeBattles';
import { TrendProphet } from './components/TrendProphet';
import { FriendCompetition } from './components/FriendCompetition';
import { FriendsList } from './components/FriendsList';
import { GlobalSearch } from './components/GlobalSearch';
import { ThemeToggle } from './components/ThemeToggle';
import { Welcome } from './components/Welcome';
import { ChatWindow } from './components/ChatWindow';
import { MessagesList } from './components/MessagesList';
import { VibeWrapped } from './components/VibeWrapped';
import { chatService } from './services/chatService';
import { wrappedService } from './services/wrappedService';
import { collection, query, where, onSnapshot as onFirestoreSnapshot, doc, onSnapshot } from 'firebase/firestore';
import { db } from './lib/firebase';
import { VibeWrapped as VibeWrappedType } from './types';

type Feature = 
  | 'caption' | 'match' | 'mood' | 'insights' 
  | 'visual' | 'social' | 'bio' | 'hashtags' 
  | 'story' | 'dm' | 'trends' | 'replies' 
  | 'aesthetic' | 'collab' | 'hook' | 'daily'
  | 'dna' | 'cringe' | 'reality' | 'graveyard';

export default function App() {
  const [user, setUser] = useState(auth.currentUser);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [streak, setStreak] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [view, setView] = useState<'feed' | 'lab' | 'ranks' | 'confessions' | 'profile' | 'notifications' | 'rooms' | 'battles' | 'circles' | 'user-profile' | 'friends' | 'search' | 'prophet' | 'messages' | 'marketplace'>('feed');
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const [activeChat, setActiveChat] = useState<{ id: string, otherUser?: { displayName: string, photoURL?: string } } | null>(null);
  const [showVault, setShowVault] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showQuickDrop, setShowQuickDrop] = useState(false);
  const [showStreakPopup, setShowStreakPopup] = useState(false);
  const [showWrapped, setShowWrapped] = useState(false);
  const [wrappedData, setWrappedData] = useState<VibeWrappedType | null>(null);
  const [vault, setVault] = useState<{ id: string, feature: string, content: string, date: string }[]>([]);

  const viewUserProfile = (uid: string) => {
    setTargetUserId(uid);
    setView('user-profile');
    setShowMobileMenu(false);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const { doc, getDoc, setDoc, serverTimestamp } = await import('firebase/firestore');
        const userRef = doc(db, 'users', u.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          const newProfile = {
            uid: u.uid,
            displayName: u.displayName || 'Anon Agent',
            photoURL: u.photoURL || '',
            streak: 1,
            vibeScore: 100,
            rank: 0,
            totalPosts: 0,
            dominantMood: 'hype',
            aestheticDNA: ['neural-link', 'digital-native'],
            lastActiveAt: serverTimestamp(),
            createdAt: serverTimestamp()
          };
          await setDoc(userRef, newProfile);
          setUserProfile(newProfile as any);
        } else {
          setUserProfile(userSnap.data() as UserProfile);
        }

        const newStreak = await updateStreak(u.uid);
        setStreak(newStreak);
        
        // Show streak popup on login if streak is active
        if (newStreak > 0) {
          setShowStreakPopup(true);
        }

        // Seed Shadow Feed if empty
        seedShadowFeed(u.uid);

        // Check for Vibe Wrapped on profile load
        const checkWrapped = async (profile: UserProfile) => {
          const isFirstOfMonth = new Date().getDate() === 1;
          const searchParamStr = window.location.search;
          const forceWrapped = searchParamStr.includes('wrapped=true');
          
          if (isFirstOfMonth || forceWrapped) {
            const wrapped = await wrappedService.generateWrapped(u.uid, profile);
            if (wrapped) {
              setWrappedData(wrapped);
              setShowWrapped(true);
            }
          }
        };

        // Listen for profile changes to keep state in sync
        const profileRef = doc(db, 'users', u.uid);
        onSnapshot(profileRef, (doc) => {
          if (doc.exists()) {
             const profile = doc.data() as UserProfile;
             setUserProfile(profile);
             setStreak(profile.streak || 0);
             // Verify wrapped
             if (!wrappedData && !showWrapped) {
               checkWrapped(profile);
             }
          }
        });
      } else {
        setStreak(0);
        setUserProfile(null);
        setUnreadNotifications(0);
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) return;

    const notificationQuery = query(
      collection(db, `users/${user.uid}/notifications`),
      where('isRead', '==', false)
    );
    
    const unsubNotifications = onFirestoreSnapshot(notificationQuery, (snapshot) => {
      setUnreadNotifications(snapshot.size);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/notifications`);
    });

    return () => unsubNotifications();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = chatService.subscribeToConversations((convs) => {
      const totalUnread = convs.reduce((acc, conv) => acc + (conv.unreadCount?.[user.uid] || 0), 0);
      setUnreadMessages(totalUnread);
    });
    return () => unsubscribe();
  }, [user]);

  const saveToVault = (feature: string, content: string) => {
    const newItem = {
      id: Math.random().toString(36).substr(2, 9),
      feature,
      content,
      date: new Date().toLocaleDateString()
    };
    setVault(prev => [newItem, ...prev]);
  };

  return (
    <div className="min-h-screen bg-vibe-pure text-vibe-contrast font-sans selection:bg-vibe-neon selection:text-black">
      <AnimatePresence>
        {!user && <Welcome />}
      </AnimatePresence>

      {/* Top Header */}
      <nav className="fixed top-0 left-0 right-0 z-[60] px-6 py-6 flex justify-between items-center bg-vibe-pure/40 backdrop-blur-3xl border-b border-white/5">
        <div className="flex items-center gap-4">
           <h1 
             onClick={() => setView('feed')}
             className="text-xs font-black tracking-[0.4em] uppercase italic text-white cursor-pointer hover:opacity-80 transition-all"
           >
             VIBENET
           </h1>
        </div>

        <div className="flex items-center gap-6">
          <button 
            onClick={() => setView('notifications')}
            className={`relative group transition-all ${view === 'notifications' ? 'text-vibe-neon' : 'text-white/40 hover:text-white'}`}
          >
            <Bell className="w-5 h-5" />
            {unreadNotifications > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-black" />}
          </button>
          
          <button 
            onClick={() => setView('marketplace')}
            className={`relative group transition-all ${view === 'marketplace' ? 'text-vibe-neon' : 'text-white/40 hover:text-white'}`}
          >
            <ShoppingBag className="w-5 h-5" />
          </button>
          
          {/* Mobile Profile Toggle */}
          <button 
            onClick={() => setView('profile')}
            className="md:hidden w-10 h-10 rounded-full border border-white/10 overflow-hidden"
          >
             {user?.photoURL ? (
                <img src={user.photoURL} className="w-full h-full object-cover" alt="" />
             ) : (
                <User className="w-4 h-4 text-white/40 m-auto" />
             )}
          </button>
        </div>
      </nav>

      {/* Floating Bottom Navigation Bar */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[70] w-fit">
        <div className="flex items-center gap-4 p-2 bg-black/40 backdrop-blur-3xl border border-white/10 rounded-full px-8 py-4 shadow-2xl">
           <NavButton active={view === 'feed'} onClick={() => setView('feed')} icon={<Grid className="w-5 h-5" />} />
           <NavButton active={view === 'search'} onClick={() => setView('search')} icon={<Search className="w-5 h-5" />} />
           
           <button 
             onClick={() => setShowQuickDrop(true)}
             className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl"
           >
             <Plus className="w-6 h-6 stroke-[3]" />
           </button>

           <NavButton 
             active={view === 'messages'} 
             onClick={() => setView('messages')} 
             icon={
               <div className="relative">
                 <MessageSquareText className="w-5 h-5" />
                 {unreadMessages > 0 && <span className="absolute -top-2 -right-2 w-4 h-4 bg-vibe-neon text-black text-[8px] font-black flex items-center justify-center rounded-full border border-black">{unreadMessages}</span>}
               </div>
             } 
           />
           <NavButton active={view === 'profile'} onClick={() => setView('profile')} icon={<User className="w-5 h-5" />} />
        </div>
      </div>

      {/* Mobile Navigation Overlay */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div 
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            className="fixed inset-0 z-[100] bg-vibe-black p-8 flex flex-col gap-10"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black italic text-vibe-neon uppercase">Navigation</h2>
              <button onClick={() => setShowMobileMenu(false)} className="text-vibe-contrast">
                <X className="w-8 h-8" />
              </button>
            </div>

            <div className="flex flex-col gap-6 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => { setView('feed'); setShowMobileMenu(false); }}
                  className={`p-6 border flex flex-col items-center gap-2 ${view === 'feed' ? 'bg-vibe-neon border-vibe-neon text-black' : 'border-vibe-border text-vibe-contrast'}`}
                >
                  <Grid className="w-6 h-6" />
                  <span className="text-xs font-black uppercase tracking-widest italic">Home</span>
                </button>
                <button 
                  onClick={() => { setView('search'); setShowMobileMenu(false); }}
                  className={`p-6 border flex flex-col items-center gap-2 ${view === 'search' ? 'bg-vibe-neon border-vibe-neon text-black' : 'border-vibe-border text-vibe-contrast'}`}
                >
                  <Search className="w-6 h-6" />
                  <span className="text-xs font-black uppercase tracking-widest italic">Search</span>
                </button>
                <button 
                  onClick={() => { setView('lab'); setShowMobileMenu(false); }}
                  className={`p-6 border flex flex-col items-center gap-2 ${view === 'lab' ? 'bg-vibe-neon border-vibe-neon text-black' : 'border-vibe-border text-vibe-contrast'}`}
                >
                  <Sparkles className="w-6 h-6" />
                  <span className="text-xs font-black uppercase tracking-widest italic">Lab</span>
                </button>
              </div>

              <div className="space-y-4 py-6 border-y border-vibe-border">
                <p className="text-[10px] font-black uppercase tracking-widest text-vibe-muted">Nexus Protocol</p>
                <div className="grid grid-cols-1 gap-2">
                  <button onClick={() => { setView('ranks'); setShowMobileMenu(false); }} className={`flex items-center gap-4 p-4 border ${view === 'ranks' ? 'border-vibe-neon text-vibe-neon bg-vibe-neon/5' : 'border-vibe-border text-vibe-contrast'}`}>
                    <Star className="w-5 h-5 font-black uppercase italic text-left" />
                    <span className="text-sm font-black uppercase italic">Hall of Fame</span>
                  </button>
                  <button onClick={() => { setView('confessions'); setShowMobileMenu(false); }} className={`flex items-center gap-4 p-4 border ${view === 'confessions' ? 'border-vibe-neon text-vibe-neon bg-vibe-neon/5' : 'border-vibe-border text-vibe-contrast'}`}>
                    <Ghost className="w-5 h-5 font-black uppercase italic text-left" />
                    <span className="text-sm font-black uppercase italic">Shadow Feed</span>
                  </button>
                  <button onClick={() => { setView('rooms'); setShowMobileMenu(false); }} className={`flex items-center gap-4 p-4 border ${view === 'rooms' ? 'border-vibe-neon text-vibe-neon bg-vibe-neon/5' : 'border-vibe-border text-vibe-contrast'}`}>
                    <MessageSquare className="w-5 h-5 font-black uppercase italic text-left" />
                    <span className="text-sm font-black uppercase italic">Rooms</span>
                  </button>
                  <button onClick={() => { setView('battles'); setShowMobileMenu(false); }} className={`flex items-center gap-4 p-4 border ${view === 'battles' ? 'border-vibe-neon text-vibe-neon bg-vibe-neon/5' : 'border-vibe-border text-vibe-contrast'}`}>
                    <Swords className="w-5 h-5 font-black uppercase italic text-left" />
                    <span className="text-sm font-black uppercase italic">Battles</span>
                  </button>
                  <button onClick={() => { setView('prophet'); setShowMobileMenu(false); }} className={`flex items-center gap-4 p-4 border ${view === 'prophet' ? 'border-vibe-neon text-vibe-neon bg-vibe-neon/5' : 'border-vibe-border text-vibe-contrast'}`}>
                    <TrendingUp className="w-5 h-5 font-black uppercase italic text-left text-vibe-neon" />
                    <span className="text-sm font-black uppercase italic">Trend Prophet</span>
                  </button>
                  <button onClick={() => { setView('marketplace'); setShowMobileMenu(false); }} className={`flex items-center gap-4 p-4 border ${view === 'marketplace' ? 'border-vibe-neon text-vibe-neon bg-vibe-neon/5' : 'border-vibe-border text-vibe-contrast'}`}>
                    <ShoppingBag className="w-5 h-5 font-black uppercase italic text-left text-vibe-neon" />
                    <span className="text-sm font-black uppercase italic">Marketplace</span>
                  </button>
                  <button onClick={() => { setView('circles'); setShowMobileMenu(false); }} className={`flex items-center gap-4 p-4 border ${view === 'circles' ? 'border-vibe-neon text-vibe-neon bg-vibe-neon/5' : 'border-vibe-border text-vibe-contrast'}`}>
                    <Users className="w-5 h-5 font-black uppercase italic text-left" />
                    <span className="text-sm font-black uppercase italic">Circles</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => { setView('friends'); setShowMobileMenu(false); }}
                  className={`p-6 border flex flex-col items-center gap-2 ${view === 'friends' ? 'bg-vibe-neon border-vibe-neon text-black' : 'border-vibe-border text-vibe-contrast'}`}
                >
                  <Users className="w-6 h-6" />
                  <span className="text-xs font-black uppercase tracking-widest italic">Friends</span>
                </button>
                <button 
                  onClick={() => { setView('notifications'); setShowMobileMenu(false); }}
                  className={`p-6 border flex flex-col items-center gap-2 relative ${view === 'notifications' ? 'bg-vibe-neon border-vibe-neon text-black' : 'border-vibe-border text-vibe-contrast'}`}
                >
                  <Bell className="w-6 h-6" />
                  <span className="text-xs font-black uppercase tracking-widest italic">Alerts</span>
                  {unreadNotifications > 0 && <span className="absolute top-2 right-2 bg-red-600 text-[10px] text-white px-1.5 rounded-full font-black">{unreadNotifications}</span>}
                </button>
                <button 
                  onClick={() => { setView('profile'); setShowMobileMenu(false); }}
                  className={`p-6 border flex flex-col items-center gap-2 ${view === 'profile' ? 'bg-vibe-neon border-vibe-neon text-black' : 'border-vibe-border text-vibe-contrast'}`}
                >
                  <User className="w-6 h-6" />
                  <span className="text-xs font-black uppercase tracking-widest italic">Me</span>
                </button>
              </div>

              <button 
                onClick={() => { setShowVault(true); setShowMobileMenu(false); }}
                className="p-4 border border-dashed border-vibe-border text-xs font-black uppercase italic text-center text-vibe-muted hover:text-vibe-contrast transition-colors flex items-center justify-center gap-3"
              >
                <X className="w-4 h-4 rotate-45" /> The Vault
              </button>
            </div>

            <div className="mt-auto pt-8 border-t border-white/5 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 italic">VNet Protocol Alpha</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="pt-24 pb-32 px-4 max-w-lg mx-auto min-h-screen">
        <AnimatePresence mode="wait">
          {!user ? (
            <motion.div 
              key="landing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-32 text-center"
            >
              <h2 className="text-7xl font-black tracking-tighter text-vibe-contrast uppercase italic mb-6 leading-none relative">
                <Ghost className="absolute -top-16 -left-8 w-16 h-16 text-vibe-neon/20 -rotate-12 animate-pulse" />
                Your content has a <br />
                <span className="text-vibe-neon underline decoration-4 underline-offset-8">signature.</span>
              </h2>
              <p className="text-vibe-gray/60 max-w-lg mb-12 font-medium">
                The elite social layer where AI upgrades your presence. 
                Vibe check the world. Dominate the grid.
              </p>
              <Auth streak={streak} />
            </motion.div>
          ) : (
            <motion.div 
              key="main-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {view === 'feed' ? (
                <div key="feed" className="space-y-12">
                  <Feed 
                    onViewProfile={viewUserProfile} 
                    onMessage={(id, other) => setActiveChat({ id, otherUser: other })}
                  />
                </div>
              ) : view === 'ranks' ? (
                <div key="ranks">
                  <HallOfFame onViewProfile={viewUserProfile} />
                </div>
              ) : view === 'confessions' ? (
                <div key="confessions" className="space-y-12">
                  <div className="text-center py-12 bg-vibe-card rounded-[40px] border border-white/5 relative overflow-hidden">
                    <Ghost className="w-12 h-12 text-white/10 mx-auto mb-4" />
                    <h2 className="text-3xl font-serif italic font-bold text-white mb-2">Shadow Feed</h2>
                    <p className="text-white/20 text-[10px] uppercase font-bold tracking-[0.3em]">Raw resonance. Anonymous signal.</p>
                  </div>
                  <Feed filter="anonymous" onViewProfile={viewUserProfile} />
                </div>
              ) : view === 'profile' ? (
                <div key="profile">
                  <ProfilePage 
                    onMessage={(id, other) => setActiveChat({ id, otherUser: other })} 
                    onViewWrapped={(data) => {
                      setWrappedData(data);
                      setShowWrapped(true);
                    }}
                  />
                </div>
              ) : view === 'user-profile' ? (
                <div key="user-profile">
                  <button 
                    onClick={() => setView('feed')}
                    className="mb-6 text-[10px] uppercase font-black tracking-widest text-vibe-muted hover:text-vibe-neon flex items-center gap-2"
                  >
                    ← Back to Grid
                  </button>
                  <ProfilePage 
                    userId={targetUserId || undefined} 
                    onMessage={(id, other) => setActiveChat({ id, otherUser: other })} 
                    onViewWrapped={(data) => {
                      setWrappedData(data);
                      setShowWrapped(true);
                    }}
                  />
                </div>
              ) : view === 'notifications' ? (
                <div key="notifications">
                  <NotificationsPage />
                </div>
              ) : view === 'prophet' ? (
                <div key="prophet">
                  <TrendProphet />
                </div>
              ) : view === 'rooms' ? (
                <div key="rooms">
                  <VibeRooms />
                </div>
              ) : view === 'marketplace' ? (
                <div key="marketplace">
                  <Marketplace />
                </div>
              ) : view === 'battles' ? (
                <div key="battles">
                  <VibeBattles />
                </div>
              ) : view === 'friends' ? (
                <div key="friends">
                  <FriendsList onViewProfile={viewUserProfile} />
                </div>
              ) : view === 'search' ? (
                <div key="search">
                  <GlobalSearch onViewProfile={viewUserProfile} />
                </div>
              ) : view === 'messages' ? (
                <div key="messages" className="min-h-full">
                  <MessagesList 
                    onSelectConversation={(conv) => {
                      const otherParticipant = Object.entries(conv.participantData || {}).find(([uid]) => uid !== user?.uid);
                      setActiveChat({
                        id: conv.id,
                        otherUser: otherParticipant?.[1]
                      });
                    }}
                    activeConversationId={activeChat?.id}
                  />
                </div>
              ) : view === 'circles' ? (
                <div key="circles">
                  <FriendCompetition onViewProfile={viewUserProfile} />
                </div>
              ) : (
                <div key="lab">
                  <CreatorLab 
                    onShowVault={() => setShowVault(true)} 
                    onSaveToVault={saveToVault}
                  />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Vault Overlay */}
      <AnimatePresence>
        {showVault && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 p-6 md:p-12 overflow-y-auto"
          >
            <div className="max-w-4xl mx-auto">
              <div className="flex justify-between items-center mb-12 border-b border-vibe-border pb-6">
                <h2 className="text-5xl font-black italic text-vibe-neon uppercase tracking-tighter">The Vault</h2>
                <button onClick={() => setShowVault(false)} className="text-vibe-muted hover:text-vibe-contrast transition-colors">
                  <X className="w-8 h-8" />
                </button>
              </div>
              
              {vault.length === 0 ? (
                <div className="text-center py-24">
                  <Bookmark className="w-16 h-16 text-vibe-border mx-auto mb-6" />
                  <p className="text-vibe-muted uppercase font-black tracking-widest">Vault is currently empty.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {vault.map((item) => (
                    <div key={item.id} className="p-8 border border-vibe-border bg-vibe-card relative group">
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-[10px] font-mono text-vibe-neon uppercase tracking-widest px-2 py-1 border border-vibe-neon">
                          {item.feature}
                        </span>
                        <span className="text-[10px] font-mono text-vibe-muted">{item.date}</span>
                      </div>
                      <div className="text-vibe-gray font-mono text-sm whitespace-pre-wrap leading-relaxed">
                        {item.content}
                      </div>
                      <button 
                        onClick={() => setVault(prev => prev.filter(v => v.id !== item.id))}
                        className="absolute top-4 right-4 text-vibe-muted hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Drop Overlay */}
      <AnimatePresence>
        {showQuickDrop && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-md"
            >
              <QuickDrop 
                onClose={() => setShowQuickDrop(false)} 
                onSuccess={() => setView('feed')} 
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {activeChat && (
          <ChatWindow 
            conversationId={activeChat.id}
            otherUser={activeChat.otherUser}
            onClose={() => setActiveChat(null)}
          />
        )}
      </AnimatePresence>

      {/* Vibe Wrapped Modal */}
      <AnimatePresence>
        {showWrapped && wrappedData && userProfile && (
          <VibeWrapped 
            data={wrappedData}
            displayName={userProfile.displayName}
            onClose={() => setShowWrapped(false)}
          />
        )}
      </AnimatePresence>

      {/* Streak Achievement Popup */}
      <AnimatePresence>
        {showStreakPopup && user && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-vibe-black/95 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.8, y: 40, rotate: -2 }}
              animate={{ scale: 1, y: 0, rotate: 0 }}
              exit={{ scale: 0.8, y: 40, opacity: 0 }}
              className="w-full max-w-sm bg-black border-4 border-vibe-neon p-8 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-vibe-neon/5 animate-pulse pointer-events-none" />
              
              <div className="relative z-10 space-y-6">
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="p-4 bg-vibe-neon text-black rounded-full shadow-[0_0_40px_rgba(204,255,0,0.6)]">
                    <Flame className="w-12 h-12 fill-current" />
                  </div>
                  
                  <div className="space-y-1">
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter text-vibe-neon leading-tight">
                      ⚡ STREAK ALIVE, {user.displayName?.split(' ')[0] || 'AGENT'}
                    </h2>
                    <p className="text-white text-sm font-mono uppercase tracking-[0.2em]">
                      day {streak} of dominance.
                    </p>
                  </div>

                  <p className="text-vibe-muted text-[10px] font-black uppercase tracking-widest bg-vibe-neon/10 px-4 py-2 border border-vibe-neon/20">
                    post today or it resets.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => {
                      setShowStreakPopup(false);
                      setShowQuickDrop(true);
                    }}
                    className="w-full py-4 bg-vibe-neon text-black font-black uppercase italic text-sm tracking-tighter hover:bg-white transition-all shadow-[0_0_20px_rgba(204,255,0,0.3)]"
                  >
                    [ DROP NOW ]
                  </button>
                  <button 
                    onClick={() => setShowStreakPopup(false)}
                    className="w-full py-3 bg-transparent text-vibe-muted font-black uppercase text-[10px] tracking-widest hover:text-white transition-all border border-white/10"
                  >
                    [ LATER ]
                  </button>
                </div>
              </div>

              {/* Decorative scanline */}
              <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] opacity-20" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-vibe-border flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex flex-col gap-2">
          <div className="text-[10px] font-mono text-vibe-muted uppercase tracking-widest">VibeNet // Social Intelligence Layer v5.2.0</div>
          <div className="text-[10px] font-mono text-vibe-neon opacity-60">Connected to Asia-Southeast1-Grid</div>
        </div>
        
        <div className="flex flex-col items-center md:items-end gap-3 px-6 py-4 border border-vibe-neon/20 bg-vibe-neon/5 max-w-sm">
          <div className="flex items-center gap-2 text-vibe-contrast text-[10px] font-black uppercase tracking-widest italic">
            <Coffee className="w-3 h-3 text-vibe-neon" /> 
            Screen Time Honesty
          </div>
          <p className="text-[9px] font-mono text-vibe-muted text-center md:text-right leading-relaxed italic">
            you're loaded up. go make something worth posting. see you when you're back. 🖤
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ id, title, icon, onClick }: { id: string, title: string, icon: React.ReactNode, onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ y: -4, borderColor: '#CCFF00' }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="p-6 border border-vibe-border bg-vibe-card flex flex-col gap-4 aspect-square transition-all group relative overflow-hidden"
    >
      <div className="w-10 h-10 border border-vibe-neon flex items-center justify-center text-vibe-neon group-hover:bg-vibe-neon group-hover:text-black transition-all">
        {icon}
      </div>
      <div className="text-[10px] font-black uppercase tracking-widest text-left">{title}</div>
      <ChevronRight className="absolute bottom-6 right-6 w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-vibe-neon" />
    </motion.button>
  );
}

function NavButton({ active, onClick, icon }: { active: boolean, onClick: () => void, icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`p-3 rounded-full transition-all ${active ? 'text-vibe-neon' : 'text-white/40 hover:text-white'}`}
    >
      {icon}
    </button>
  );
}
