import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
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
      "Phone sign-in is not configured yet. Please contact the operator.",
    );
  return getAuth(getApps().length ? getApp() : initializeApp(config));
}
