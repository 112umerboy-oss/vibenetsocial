import { db } from '../lib/firebase';
import { collection, getDocs, query, where, limit, addDoc, serverTimestamp } from 'firebase/firestore';

const ANONYMOUS_SEED_POSTS = [
  {
    authorName: 'Phantom',
    mediaUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80',
    mediaType: 'image',
    caption: 'The algorithm only rewards what it can categorize. Be uncategorizable.',
    isAnonymous: true,
  },
  {
    authorName: 'Phantom',
    mediaUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80',
    mediaType: 'image',
    caption: 'Ghosting the system is the only way to find yourself.',
    isAnonymous: true,
  },
  {
    authorName: 'Phantom',
    mediaUrl: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&q=80',
    mediaType: 'image',
    caption: 'Shadow Feed is for the thoughts you transcribe at 3 AM.',
    isAnonymous: true,
  },
  {
    authorName: 'Phantom',
    mediaUrl: 'https://images.unsplash.com/photo-1516339901600-2e3a8ad0f1d8?auto=format&fit=crop&q=80',
    mediaType: 'image',
    caption: 'Everything is a projection. Adjust your lens.',
    isAnonymous: true,
  },
  {
    authorName: 'Phantom',
    mediaUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80',
    mediaType: 'image',
    caption: 'The grid is watching, but the shadow is yours.',
    isAnonymous: true,
  }
];

export const seedShadowFeed = async (userId: string) => {
  const postsRef = collection(db, 'posts');
  try {
    const q = query(postsRef, where('isAnonymous', '==', true), limit(1));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log('Shadow Feed empty. Seeding anonymous vibes...');
      for (const post of ANONYMOUS_SEED_POSTS) {
        await addDoc(postsRef, {
          ...post,
          authorId: userId,
          authorPhoto: '',
          likesCount: 0,
          dislikesCount: 0,
          createdAt: serverTimestamp()
        });
      }
    }
  } catch (error) {
    console.error('Seed error:', error);
  }
};
