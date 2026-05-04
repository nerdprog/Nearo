import { supabase } from '../config/supabase.js';
import { auth } from '../config/firebase.js';

export async function reportPost(postId) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  
  // 1. Try to insert report (will fail if already reported due to UNIQUE constraint)
  const { error: insertError } = await supabase
    .from('reports')
    .insert([{
      user_id: user.uid,
      post_id: postId
    }]);
    
  if (insertError) {
    if (insertError.code === '23505') {
      throw new Error("You have already reported this post");
    }
    throw insertError;
  }
  
  // 2. Increment report count and check if should flag
  const { data: post } = await supabase.from('posts').select('report_count').eq('id', postId).single();
  
  if (post) {
    const newCount = post.report_count + 1;
    const shouldFlag = newCount >= 10;
    
    await supabase.from('posts').update({
      report_count: newCount,
      flagged: shouldFlag
    }).eq('id', postId);
  }
  
  return true;
}

export async function getReportedPosts(postIds) {
  const user = auth.currentUser;
  if (!user || postIds.length === 0) return [];
  
  const { data, error } = await supabase
    .from('reports')
    .select('post_id')
    .eq('user_id', user.uid)
    .in('post_id', postIds);
    
  if (error) {
    console.error("Get reports error:", error);
    return [];
  }
  
  return data.map(r => r.post_id);
}
