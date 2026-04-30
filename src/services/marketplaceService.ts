import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  serverTimestamp, 
  orderBy,
  updateDoc,
  increment
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { MarketplaceItem, Purchase } from '../types';

export const marketplaceService = {
  async listItem(item: Omit<MarketplaceItem, 'id' | 'salesCount' | 'rating' | 'createdAt' | 'sellerId' | 'sellerName'>): Promise<string> {
    if (!auth.currentUser) throw new Error('Auth required');
    
    const newItem: Omit<MarketplaceItem, 'id'> = {
      ...item,
      sellerId: auth.currentUser.uid,
      sellerName: auth.currentUser.displayName || 'Anonymous Creator',
      salesCount: 0,
      rating: 5,
      createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'marketplace'), newItem);
    return docRef.id;
  },

  async purchaseItem(item: MarketplaceItem): Promise<string> {
    if (!auth.currentUser) throw new Error('Auth required');
    
    // Simulate payment success
    const platformFee = item.price * 0.1;
    
    const purchase: Omit<Purchase, 'id'> = {
      buyerId: auth.currentUser.uid,
      itemId: item.id,
      sellerId: item.sellerId,
      amount: item.price,
      platformFee,
      createdAt: serverTimestamp()
    };
    
    // Update sales count atomically
    const itemRef = doc(db, 'marketplace', item.id);
    await updateDoc(itemRef, {
      salesCount: increment(1)
    });
    
    const docRef = await addDoc(collection(db, 'purchases'), purchase);
    return docRef.id;
  },

  async getMyPurchases(): Promise<Purchase[]> {
    if (!auth.currentUser) return [];
    const q = query(collection(db, 'purchases'), where('buyerId', '==', auth.currentUser.uid), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Purchase));
  },

  async getMarketplaceItems(type?: string): Promise<MarketplaceItem[]> {
    let q = query(collection(db, 'marketplace'), orderBy('createdAt', 'desc'));
    if (type) {
      q = query(collection(db, 'marketplace'), where('type', '==', type), orderBy('createdAt', 'desc'));
    }
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as MarketplaceItem));
  }
};
