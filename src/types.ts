export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  streak: number;
  vibeScore?: number;
  rank?: number;
  totalPosts?: number;
  dominantMood?: string;
  aestheticDNA?: string[];
  lastActiveAt?: any;
  isPro?: boolean;
  proExpiresAt?: any;
  hasInsurance?: boolean;
  insuranceStatus?: 'active' | 'expired' | 'claimed';
  insuranceRenewalDate?: any;
  dailyAiUsage?: {
    count: number;
    lastResetDate: string; // YYYY-MM-DD
  };
  createdAt: any;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  caption: string;
  mood?: 'hype' | 'chill' | 'creative' | 'deep' | 'raw';
  likesCount: number;
  dislikesCount: number;
  isAnonymous?: boolean;
  authorIsPro?: boolean;
  scheduledAt?: any;
  isScheduled?: boolean;
  createdAt: any;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: any;
}

export interface Notification {
  id: string;
  recipientId: string;
  type: 'like' | 'comment' | 'streak' | 'follow' | 'friend_request' | 'match' | 'battle_result' | 'rank_change' | 'mention';
  postId?: string;
  message: string;
  isRead: boolean;
  createdAt: any;
}

export interface UserStat {
  period: string;
  type: 'week' | 'month';
  resonance: number;
  userId: string;
  updatedAt: any;
}

export interface RoomMessage {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  text: string;
  createdAt: any;
}

export interface Prediction {
  id: string;
  userId: string;
  userName: string;
  prediction: string;
  week: string;
  isCorrect: boolean | null;
  pointsAwarded: number;
  createdAt: any;
}

export interface Battle {
  id: string;
  post1Id: string;
  post2Id: string;
  votes1: number;
  votes2: number;
  voters: string[]; // List of UIDs to prevent double voting
  status: 'active' | 'finished';
  winnerId?: string;
  startedAt: any;
  endsAt: any;
}

export interface Story {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  mediaUrl: string;
  mediaType?: 'image' | 'video';
  createdAt: any;
  expiresAt: any;
  viewedBy: string[];
}

export interface Conversation {
  id: string;
  participants: string[]; // [uid1, uid2]
  lastMessage: string;
  lastMessageAt: any;
  unreadCount: { [uid: string]: number };
  participantData?: {
    [uid: string]: {
      displayName: string;
      photoURL?: string;
    };
  };
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: any;
  read: boolean;
}

export interface VibeWrapped {
  id: string;
  userId: string;
  month: string;
  scoreStart: number;
  scoreEnd: number;
  longestStreak: number;
  dominantMood: string;
  moodPercentage: number;
  mostResonantPostId?: string;
  mostResonantPostCaption?: string;
  aestheticDNA: string[];
  rankStart?: number;
  rankEnd?: number;
  totalPosts: number;
  createdAt: any;
}

export interface MarketplaceItem {
  id: string;
  sellerId: string;
  sellerName: string;
  title: string;
  description: string;
  price: number;
  type: 'caption_pack' | 'strategy' | 'preset';
  content: string;
  salesCount: number;
  rating: number;
  createdAt: any;
}

export interface Purchase {
  id: string;
  buyerId: string;
  itemId: string;
  sellerId: string;
  amount: number;
  platformFee: number;
  createdAt: any;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}
