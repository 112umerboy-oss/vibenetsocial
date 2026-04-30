import { 
  doc, 
  updateDoc, 
  getDoc, 
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { UserProfile, Post } from '../types';

export const insuranceService = {
  async purchaseInsurance(): Promise<void> {
    if (!auth.currentUser) throw new Error('Authentication required');
    
    // Simulate $1 payment success
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    const userRef = doc(db, 'users', auth.currentUser.uid);
    await updateDoc(userRef, {
      hasInsurance: true,
      insuranceStatus: 'active',
      insuranceRenewalDate: nextMonth
    });
  },

  async claimInsurance(): Promise<{ posts: Post[], emailList: string[] }> {
    if (!auth.currentUser) throw new Error('Authentication required');
    
    const userRef = doc(db, 'users', auth.currentUser.uid);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data() as UserProfile;
    
    if (!userData.hasInsurance || userData.insuranceStatus !== 'active') {
      throw new Error('No active insurance policy found');
    }

    // 1. Fetch top posts for "migration"
    const postsQuery = query(
      collection(db, 'posts'),
      where('authorId', '==', auth.currentUser.uid),
      orderBy('likesCount', 'desc'),
      limit(20)
    );
    const postsSnap = await getDocs(postsQuery);
    const topPosts = postsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Post));

    // 2. Mock "audience email export"
    // In a real app, this would query a 'follows' collection that includes email permissions
    const emailList = [
      'fan_resonance_01@example.com',
      'vibe_check_pro@gmail.com',
      'aesthetic_master@outlook.com'
    ];

    // 3. Mark insurance as claimed
    await updateDoc(userRef, {
      insuranceStatus: 'claimed'
    });

    return { posts: topPosts, emailList };
  }
};
