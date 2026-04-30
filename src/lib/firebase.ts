import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup,
  EmailAuthProvider,
  PhoneAuthProvider,
  RecaptchaVerifier
} from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { OperationType, FirestoreErrorInfo } from '../types';

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const emailProvider = new EmailAuthProvider();

let isSigningIn = false;

export const signIn = async () => {
  if (isSigningIn) return;
  isSigningIn = true;
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result;
  } catch (error: any) {
    if (error.code === 'auth/popup-blocked') {
      alert('The sign-in popup was blocked by your browser. Please allow popups for this site or open the app in a new tab.');
    } else if (error.code === 'auth/cancelled-popup-request') {
      console.log('Sign-in popup was closed by the user.');
    } else if (error.code === 'auth/popup-closed-by-user') {
      console.log('Sign-in popup was closed before completion.');
    } else {
      console.error('Sign-in error:', error);
    }
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export { OperationType };

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  // We throw the error as a JSON string as required by the instructions
  throw new Error(JSON.stringify(errInfo));
}
