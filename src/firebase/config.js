// Firebase Configuration
// Replace these values with your own Firebase project credentials
// Instructions:
// 1. Go to https://console.firebase.google.com/
// 2. Create a new project named "olive-seeds-smp"
// 3. Add a Web App
// 4. Copy the config values below
// 5. Enable Firestore, Authentication (Email/Password), and Storage

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
 apiKey: "AIzaSyBD9LhSAsAZjTqmke7ca8sYHlnYSMJwT38",
  authDomain: "olive-seeds-smp.firebaseapp.com",
  projectId: "olive-seeds-smp",
  storageBucket: "olive-seeds-smp.firebasestorage.app",
  messagingSenderId: "635997228578",
  appId: "1:635997228578:web:7d938b4ae351ed3a13847b"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export default app;
