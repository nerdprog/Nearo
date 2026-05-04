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
 * Map Firebase error codes to user-friendly messages
 */
function mapAuthError(error) {
  const code = error.code;
  switch (code) {
    case 'auth/invalid-email':
      return 'Invalid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/user-not-found':
      return 'Account not found.';
    case 'auth/wrong-password':
      return 'Incorrect password.';
    case 'auth/email-already-in-use':
      return 'Email already in use.';
    case 'auth/weak-password':
      return 'Password is too weak.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in window was closed.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    case 'auth/invalid-credential':
      return 'Incorrect email or password.';
    default:
      return error.message || 'An unexpected error occurred.';
  }
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
    return { user: null, error: mapAuthError(error) };
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
    return { user: null, error: mapAuthError(error) };
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
    return { error: mapAuthError(error) };
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
    return { error: mapAuthError(error) };
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
    return { user: null, error: mapAuthError(error) };
  }
}
