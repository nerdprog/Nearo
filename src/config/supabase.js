import { createClient } from '@supabase/supabase-js';
import { auth } from './firebase.js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  accessToken: async () => {
    // This tells Supabase to use the Firebase user's token for requests
    const user = auth.currentUser;
    if (user) {
      return await user.getIdToken();
    }
    return null;
  }
});
