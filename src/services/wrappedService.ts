import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  addDoc, 
  serverTimestamp,
  doc,
  getDoc
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { VibeWrapped, Post, UserProfile } from '../types';

class WrappedService {
  async getLatestWrapped(userId: string): Promise<VibeWrapped | null> {
    const wrappedRef = collection(db, `users/${userId}/wrapped`);
    const q = query(wrappedRef, orderBy('createdAt', 'desc'), limit(1));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as VibeWrapped;
  }

  async generateWrapped(userId: string, profile: UserProfile): Promise<VibeWrapped | null> {
    const now = new Date();
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    // Check if already exists for this month
    const existing = await this.getLatestWrapped(userId);
    if (existing && existing.month === monthStr) return existing;

    // Aggregation Logic (Simulated for Demo)
    // In a real app, this would query posts from the last month
    const postsRef = collection(db, 'posts');
    const postsQ = query(
      postsRef, 
      where('authorId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const postsSnap = await getDocs(postsQ);
    const posts = postsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Post));

    if (posts.length === 0) return null;

    const moods = posts.map(p => p.mood).filter(Boolean);
    const moodCounts: Record<string, number> = {};
    moods.forEach(m => moodCounts[m!] = (moodCounts[m!] || 0) + 1);
    const dominantMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Chill';
    const moodPercentage = Math.round((moodCounts[dominantMood] || 0) / moods.length * 100) || 0;

    const mostResonant = posts.sort((a, b) => b.likesCount - a.likesCount)[0];

    const wrappedData: Omit<VibeWrapped, 'id'> = {
      userId,
      month: monthStr,
      scoreStart: Math.max(0, (profile.vibeScore || 0) - Math.floor(Math.random() * 200)),
      scoreEnd: profile.vibeScore || 0,
      longestStreak: profile.streak,
      dominantMood,
      moodPercentage,
      mostResonantPostId: mostResonant?.id,
      mostResonantPostCaption: mostResonant?.caption,
      aestheticDNA: profile.aestheticDNA || ['minimal', 'builder'],
      rankStart: (profile.rank || 0) + Math.floor(Math.random() * 20),
      rankEnd: profile.rank || 0,
      totalPosts: profile.totalPosts || posts.length,
      createdAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, `users/${userId}/wrapped`), wrappedData);
    return { id: docRef.id, ...wrappedData } as VibeWrapped;
  }
}

export const wrappedService = new WrappedService();
