import { createClient } from '@supabase/supabase-js';
import { auth } from './firebase.js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: async (url, options) => {
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken();
        const headers = new Headers(options.headers);
        headers.set('Authorization', `Bearer ${token}`);
        options.headers = headers;
      }
      return fetch(url, options);
    }
  }
});
