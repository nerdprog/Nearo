import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  updateProfile,
  deleteUser,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { auth } from "../config/firebase.js";
import { supabase } from "../config/supabase.js";

/**
 * Listen for auth state changes
 */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Sign up a new user
 */
export async function signUp(email, password, username) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update profile with username
    await updateProfile(user, {
      displayName: username
    });
    
    return { user, error: null };
  } catch (error) {
    console.error("Sign up error:", error);
    return { user: null, error: error.message };
  }
}

/**
 * Sign in existing user
 */
export async function signIn(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    console.error("Sign in error:", error);
    return { user: null, error: error.message };
  }
}

/**
 * Sign out current user
 */
export async function signOut() {
  try {
    await firebaseSignOut(auth);
    return { error: null };
  } catch (error) {
    console.error("Sign out error:", error);
    return { error: error.message };
  }
}

/**
 * Delete current user account and data
 */
export async function deleteAccount() {
  const user = auth.currentUser;
  if (!user) return { error: "No authenticated user" };
  
  try {
    // 1. Delete data from Supabase (handled by RLS / cascade, but we can explicitly delete posts)
    await supabase.from('posts').delete().eq('user_id', user.uid);
    await supabase.from('streaks').delete().eq('user_id', user.uid);
    
    // 2. Delete Firebase Auth user
    await deleteUser(user);
    
    return { error: null };
  } catch (error) {
    console.error("Delete account error:", error);
    return { error: error.message };
  }
}

/**
 * Sign in with Google
 */
export async function signInWithGoogle() {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    return { user: userCredential.user, error: null };
  } catch (error) {
    console.error("Google sign in error:", error);
    return { user: null, error: error.message };
  }
}
