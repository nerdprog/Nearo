import { supabase } from '../config/supabase.js';
import { auth } from '../config/firebase.js';

/**
 * Fetch posts for given zones
 */
export async function fetchPosts(zoneIds, sortBy = 'new', limit = 50) {
  let query = supabase
    .from('posts')
    .select('*')
    .in('zone_id', zoneIds)
    .eq('flagged', false); // Hide flagged posts
    
  if (sortBy === 'top') {
    query = query.order('upvotes', { ascending: false }).order('created_at', { ascending: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }
  
  const { data, error } = await query.limit(limit);
  
  if (error) {
    console.error("Fetch posts error:", error);
    throw error;
  }
  
  return data;
}

/**
 * Search posts today
 */
export async function searchPosts(searchQuery, zoneIds) {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .in('zone_id', zoneIds)
    .eq('flagged', false)
    .ilike('title', `%${searchQuery}%`)
    .order('created_at', { ascending: false })
    .limit(20);
    
  if (error) {
    console.error("Search posts error:", error);
    throw error;
  }
  
  return data;
}

/**
 * Get current user's posts
 */
export async function getUserPosts() {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', user.uid)
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error("Get user posts error:", error);
    throw error;
  }
  
  return data;
}

/**
 * Create a new post
 */
export async function createPost(title, content, zoneId, lat = null, lng = null) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  
  // First, check daily limit
  const today = new Date().toISOString().split('T')[0];
  const { count, error: countError } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.uid)
    .gte('created_at', `${today}T00:00:00Z`);
    
  if (countError) throw countError;
  
  if (count >= 5) {
    throw new Error("You have reached your daily limit of 5 posts.");
  }
  
  const { data, error } = await supabase
    .from('posts')
    .insert([{
      user_id: user.uid,
      username: user.displayName || 'Anonymous',
      zone_id: zoneId,
      lat,
      lng,
      title,
      content
    }])
    .select();
    
  if (error) {
    console.error("Create post error:", error);
    throw error;
  }
  
  return data[0];
}

/**
 * Delete a post (own post only, enforced by RLS)
 */
export async function deletePost(postId) {
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId);
    
  if (error) {
    console.error("Delete post error:", error);
    throw error;
  }
  
  return true;
}
