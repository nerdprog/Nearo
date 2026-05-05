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

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', user.uid)
    .gte('created_at', start.toISOString())
    .lt('created_at', end.toISOString())
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error("Get user posts error:", error);
    throw error;
  }
  
  return data;
}

/**
 * Get daily stats for current user
 */
export async function getDailyStats() {
  const user = auth.currentUser;
  if (!user) return null;
  
  const today = getLocalDateString();
  const { data, error } = await supabase
    .from('user_daily_stats')
    .select('*')
    .eq('user_id', user.uid)
    .eq('stat_date', today)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error("Get daily stats error:", error);
    return null;
  }
  
  return data;
}

/**
 * Create a new post
 */
export async function createPost(title, content, zoneId, lat = null, lng = null, imageFile = null) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  
  const today = getLocalDateString();
  
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
  let imagePath = null;
  if (imageFile) {
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${user.uid}_${Date.now()}.${fileExt}`;
    imagePath = fileName;
    const { error: uploadError } = await supabase.storage
      .from('post_images')
      .upload(imagePath, imageFile);
      
    if (uploadError) throw new Error("Image upload failed: " + uploadError.message);
    
    const { data: publicUrlData } = supabase.storage
      .from('post_images')
      .getPublicUrl(imagePath);
      
    imageUrl = publicUrlData.publicUrl;
  }

  const pfpUrl = user.photoURL || '/assets/pfp/placeholder.svg';

  const postPayload = {
    user_id: user.uid,
    username: user.displayName || 'Anonymous',
    pfp_url: pfpUrl,
    zone_id: zoneId,
    lat,
    lng,
    title,
    content,
    image_url: imageUrl,
    image_path: imagePath
  };

  let data;
  let error;
  try {
    const result = await insertPost(postPayload);
    data = result.data;
    error = result.error;
  } catch (insertError) {
    if (imagePath) {
      await supabase.storage.from('post_images').remove([imagePath]);
    }
    throw insertError;
  }
    
  if (error) {
    console.error("Create post error:", error);
    if (imagePath) {
      await supabase.storage.from('post_images').remove([imagePath]);
    }
    throw error;
  }

  await ensureDailyStatsCount(today, statsData, postsCount, !!imageUrl);
  
  return data[0];
}

/**
 * Delete a post (own post only, enforced by RLS)
 */
export async function deletePost(postId) {
  const { data: post, error: fetchError } = await getPostImageInfo(postId);

  if (fetchError) {
    console.error("Fetch post before delete error:", fetchError);
    throw fetchError;
  }

  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId);
    
  if (error) {
    console.error("Delete post error:", error);
    throw error;
  }

  const imagePath = getStoragePath(post);
  if (imagePath) {
    const { error: storageError } = await supabase.storage
      .from('post_images')
      .remove([imagePath]);

    if (storageError) {
      console.error("Delete post image error:", storageError);
      throw new Error("Post deleted, but image cleanup failed: " + storageError.message);
    }
  }
  
  return true;
}

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function ensureDailyStatsCount(today, previousStats, previousPostsCount, postedImage) {
  const user = auth.currentUser;
  if (!user) return;

  const { data: latestStats, error } = await supabase
    .from('user_daily_stats')
    .select('*')
    .eq('user_id', user.uid)
    .eq('stat_date', today)
    .single();

  if (error && error.code !== 'PGRST116') return;

  if (!latestStats) {
    await supabase.from('user_daily_stats').insert([{
      user_id: user.uid,
      stat_date: today,
      posts_count: 1,
      has_image_uploaded: postedImage
    }]);
    return;
  }

  const triggerAlreadyCounted = latestStats.posts_count > previousPostsCount;
  if (!triggerAlreadyCounted && previousStats) {
    await supabase.from('user_daily_stats').update({
      posts_count: previousPostsCount + 1,
      has_image_uploaded: latestStats.has_image_uploaded || postedImage
    }).eq('id', latestStats.id);
  }
}

async function insertPost(postPayload) {
  const result = await supabase
    .from('posts')
    .insert([postPayload])
    .select();

  if (!isMissingColumnError(result.error, 'image_path')) {
    return result;
  }

  const legacyPayload = { ...postPayload };
  delete legacyPayload.image_path;

  return supabase
    .from('posts')
    .insert([legacyPayload])
    .select();
}

async function getPostImageInfo(postId) {
  const result = await supabase
    .from('posts')
    .select('image_url, image_path')
    .eq('id', postId)
    .single();

  if (!isMissingColumnError(result.error, 'image_path')) {
    return result;
  }

  return supabase
    .from('posts')
    .select('image_url')
    .eq('id', postId)
    .single();
}

function isMissingColumnError(error, columnName) {
  if (!error) return false;
  const message = `${error.message || ''} ${error.details || ''} ${error.hint || ''}`;
  return error.code === '42703' || message.includes(columnName);
}

function getStoragePath(post) {
  if (!post) return null;
  if (post.image_path) return post.image_path;
  return getStoragePathFromPublicUrl(post.image_url);
}

function getStoragePathFromPublicUrl(imageUrl) {
  if (!imageUrl) return null;

  const marker = '/storage/v1/object/public/post_images/';
  const markerIndex = imageUrl.indexOf(marker);
  if (markerIndex === -1) return null;

  return decodeURIComponent(imageUrl.slice(markerIndex + marker.length).split('?')[0]);
}
