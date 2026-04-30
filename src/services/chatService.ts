import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  setDoc,
  updateDoc,
  doc, 
  serverTimestamp, 
  getDocs,
  getDoc,
  limit,
  increment,
  writeBatch
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { Conversation, Message, UserProfile } from '../types';

export const chatService = {
  // Start or get existing conversation between two users
  async startConversation(otherUser: UserProfile): Promise<string> {
    if (!auth.currentUser) throw new Error('Auth required');
    const myUid = auth.currentUser.uid;
    const participants = [myUid, otherUser.uid].sort();
    const convId = participants.join('_');

    const convRef = doc(db, 'conversations', convId);
    const convSnap = await getDoc(convRef);

    if (!convSnap.exists()) {
      await setDoc(convRef, {
        participants,
        lastMessage: 'Conversation started',
        lastMessageAt: serverTimestamp(),
        unreadCount: { [myUid]: 0, [otherUser.uid]: 0 },
        participantData: {
          [myUid]: {
            displayName: auth.currentUser.displayName || 'User',
            photoURL: auth.currentUser.photoURL || ''
          },
          [otherUser.uid]: {
            displayName: otherUser.displayName,
            photoURL: otherUser.photoURL || ''
          }
        }
      });
    }

    return convId;
  },

  // Send a message
  async sendMessage(convId: string, text: string) {
    if (!auth.currentUser) throw new Error('Auth required');
    const myUid = auth.currentUser.uid;

    try {
      const messagesRef = collection(db, 'conversations', convId, 'messages');
      await addDoc(messagesRef, {
        senderId: myUid,
        text,
        createdAt: serverTimestamp(),
        read: false
      });

      // Update conversation summary
      const convRef = doc(db, 'conversations', convId);
      const convSnap = await getDoc(convRef);
      if (convSnap.exists()) {
        const convData = convSnap.data() as Conversation;
        const otherUid = convData.participants.find(p => p !== myUid);
        
        const updateData: any = {
          lastMessage: text,
          lastMessageAt: serverTimestamp(),
        };

        if (otherUid) {
          updateData[`unreadCount.${otherUid}`] = increment(1);
        }

        await updateDoc(convRef, updateData);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `conversations/${convId}/messages`);
    }
  },

  // Mark all messages in a conversation as read
  async markAsRead(convId: string) {
    if (!auth.currentUser) return;
    const myUid = auth.currentUser.uid;

    try {
      const convRef = doc(db, 'conversations', convId);
      await updateDoc(convRef, {
        [`unreadCount.${myUid}`]: 0
      });

      // Optional: Batch update individual messages as read (more expensive)
      // For this demo, updating the conv unreadCount is enough.
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `conversations/${convId}`);
    }
  },

  // Stream active conversations
  subscribeToConversations(callback: (conversations: Conversation[]) => void) {
    if (!auth.currentUser) return () => {};
    
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', auth.currentUser.uid),
      orderBy('lastMessageAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const convs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Conversation));
      callback(convs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'conversations');
    });
  },

  // Stream messages in a specific conversation
  subscribeToMessages(convId: string, callback: (messages: Message[]) => void) {
    const q = query(
      collection(db, 'conversations', convId, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(100)
    );

    return onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Message));
      callback(msgs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `conversations/${convId}/messages`);
    });
  }
};
