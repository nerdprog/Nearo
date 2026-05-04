import { supabase } from '../config/supabase.js';
import { auth } from '../config/firebase.js';

export async function getStreak() {
  const user = auth.currentUser;
  if (!user) return null;
  
  const { data, error } = await supabase
    .from('streaks')
    .select('*')
    .eq('user_id', user.uid)
    .single();
    
  if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned", which is fine
    console.error("Get streak error:", error);
    return null;
  }
  
  return data;
}

export async function updateStreakOnPost() {
  const user = auth.currentUser;
  if (!user) return;
  
  const todayDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  // 1. Get current streak
  const { data: currentStreak } = await supabase
    .from('streaks')
    .select('*')
    .eq('user_id', user.uid)
    .single();
    
  if (!currentStreak) {
    // First post ever
    await supabase.from('streaks').insert([{
      user_id: user.uid,
      current_streak: 1,
      longest_streak: 1,
      last_post_date: todayDate
    }]);
    return;
  }
  
  if (currentStreak.last_post_date === todayDate) {
    // Already posted today, streak doesn't change
    return;
  }
  
  // Check if yesterday
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  let newStreak = 1; // Reset to 1 by default
  
  if (currentStreak.last_post_date === yesterdayStr) {
    // Posted yesterday, increment
    newStreak = currentStreak.current_streak + 1;
  }
  
  const newLongest = Math.max(currentStreak.longest_streak, newStreak);
  
  await supabase.from('streaks').update({
    current_streak: newStreak,
    longest_streak: newLongest,
    last_post_date: todayDate
  }).eq('user_id', user.uid);
}
