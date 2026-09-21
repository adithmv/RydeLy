import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, signOut } from "firebase/auth";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";

export function getFirebaseAuth() {
  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };
  if (
    !config.apiKey ||
    !config.authDomain ||
    !config.projectId ||
    !config.appId
  )
    throw new Error(
      "Authentication is not configured yet. Please contact the operator.",
    );
  return getAuth(getApps().length ? getApp() : initializeApp(config));
}

export async function signUpDriverWithEmail(email: string, password: string) {
  const auth = getFirebaseAuth();
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await sendEmailVerification(result.user);
  return result.user;
}

export async function signInDriverWithEmail(email: string, password: string) {
  const auth = getFirebaseAuth();
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function sendDriverEmailVerification(user: any) {
  await sendEmailVerification(user);
}

export async function sendDriverPasswordReset(email: string) {
  const auth = getFirebaseAuth();
  await sendPasswordResetEmail(auth, email);
}

export async function signOutDriver() {
  const auth = getFirebaseAuth();
  await signOut(auth);
}

// FCM Token Management
let messagingInstance: any = null;

export async function getMessagingInstance(): Promise<any | null> {
  if (messagingInstance) return messagingInstance;
  const supported = await isSupported();
  if (!supported) {
    console.warn("FCM not supported in this browser");
    return null;
  }
  const auth = getFirebaseAuth();
  messagingInstance = getMessaging(auth.app);
  return messagingInstance;
}

export async function getFCMToken(): Promise<string | null> {
  const messaging = await getMessagingInstance();
  if (!messaging) return null;
  
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    console.warn("VAPID key not configured for FCM");
    return null;
  }
  
  try {
    const token = await getToken(messaging, { vapidKey });
    return token;
  } catch (error) {
    console.error("Failed to get FCM token:", error);
    return null;
  }
}

export async function onFCMMessage(callback: (payload: any) => void): Promise<(() => void) | null> {
  const messaging = await getMessagingInstance();
  if (!messaging) return null;
  return onMessage(messaging, callback);
}

export async function registerFCMTokenForDriver(): Promise<string | null> {
  const token = await getFCMToken();
  if (!token) return null;
  
  // Store token in localStorage for persistence
  localStorage.setItem("driver_fcm_token", token);
  return token;
}

export function getStoredFCMToken(): string | null {
  return localStorage.getItem("driver_fcm_token");
}