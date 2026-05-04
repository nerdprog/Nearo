import { supabase } from '../config/supabase.js';
import { auth } from '../config/firebase.js';

export async function getUserVotes(postIds) {
  const user = auth.currentUser;
  if (!user || postIds.length === 0) return [];
  
  const { data, error } = await supabase
    .from('votes')
    .select('post_id, vote_type')
    .eq('user_id', user.uid)
    .in('post_id', postIds);
    
  if (error) {
    console.error("Get user votes error:", error);
    return [];
  }
  
  return data;
}

export async function votePost(postId, voteType) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  
  // 1. Get current vote
  const { data: existingVote } = await supabase
    .from('votes')
    .select('*')
    .eq('user_id', user.uid)
    .eq('post_id', postId)
    .single();
    
  let postUpvoteChange = 0;
  let postDownvoteChange = 0;
  
  if (existingVote) {
    if (existingVote.vote_type === voteType) {
      // Removing vote
      await supabase.from('votes').delete().eq('id', existingVote.id);
      if (voteType === 'up') postUpvoteChange = -1;
      else postDownvoteChange = -1;
    } else {
      // Changing vote
      await supabase.from('votes').update({ vote_type: voteType }).eq('id', existingVote.id);
      if (voteType === 'up') {
        postUpvoteChange = 1;
        postDownvoteChange = -1;
      } else {
        postUpvoteChange = -1;
        postDownvoteChange = 1;
      }
    }
  } else {
    // New vote
    await supabase.from('votes').insert([{
      user_id: user.uid,
      post_id: postId,
      vote_type: voteType
    }]);
    if (voteType === 'up') postUpvoteChange = 1;
    else postDownvoteChange = 1;
  }
  
  // Note: For a production app, the vote count update should ideally be handled by a Postgres Function/Trigger
  // to prevent race conditions. Here we do it client-side for simplicity.
  const { data: post } = await supabase.from('posts').select('upvotes, downvotes').eq('id', postId).single();
  
  if (post) {
    await supabase.from('posts').update({
      upvotes: post.upvotes + postUpvoteChange,
      downvotes: post.downvotes + postDownvoteChange
    }).eq('id', postId);
  }
  
  return true;
}
