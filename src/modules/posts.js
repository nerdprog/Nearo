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
    query = query.order('vote_score', { ascending: false }).order('created_at', { ascending: false });
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
export async function createPost(title, content, zoneId, lat = null, lng = null, imageFile = null) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  
  const today = new Date().toISOString().split('T')[0];
  
  // Check daily stats
  const { data: statsData, error: statsError } = await supabase
    .from('user_daily_stats')
    .select('*')
    .eq('user_id', user.uid)
    .eq('stat_date', today)
    .single();

  if (statsError && statsError.code !== 'PGRST116') { // PGRST116 is 'not found'
    throw statsError;
  }

  const postsCount = statsData ? statsData.posts_count : 0;
  const hasImage = statsData ? statsData.has_image_uploaded : false;

  if (postsCount >= 5) {
    throw new Error("You have reached your daily limit of 5 posts.");
  }
  
  if (imageFile && hasImage) {
    throw new Error("You have already uploaded an image today.");
  }

  let imageUrl = null;
  if (imageFile) {
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${user.uid}_${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from('post_images')
      .upload(fileName, imageFile);
      
    if (uploadError) throw new Error("Image upload failed: " + uploadError.message);
    
    const { data: publicUrlData } = supabase.storage
      .from('post_images')
      .getPublicUrl(fileName);
      
    imageUrl = publicUrlData.publicUrl;
  }

  const pfpUrl = user.photoURL || '/assets/pfp/1.png';

  const { data, error } = await supabase
    .from('posts')
    .insert([{
      user_id: user.uid,
      username: user.displayName || 'Anonymous',
      pfp_url: pfpUrl,
      zone_id: zoneId,
      lat,
      lng,
      title,
      content,
      image_url: imageUrl
    }])
    .select();
    
  if (error) {
    console.error("Create post error:", error);
    throw error;
  }

  // Update daily stats
  if (statsData) {
    await supabase.from('user_daily_stats').update({
      posts_count: postsCount + 1,
      has_image_uploaded: hasImage || !!imageUrl
    }).eq('id', statsData.id);
  } else {
    await supabase.from('user_daily_stats').insert([{
      user_id: user.uid,
      stat_date: today,
      posts_count: 1,
      has_image_uploaded: !!imageUrl
    }]);
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
