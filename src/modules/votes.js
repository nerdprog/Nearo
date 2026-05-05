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

  const { error: rpcError } = await supabase.rpc('set_post_vote', {
    p_post_id: postId,
    p_user_id: user.uid,
    p_vote_type: voteType
  });

  if (!rpcError) return true;
  if (rpcError.code !== '42883' && rpcError.code !== 'PGRST202') {
    console.error("Vote RPC error:", rpcError);
    throw rpcError;
  }
  
  // Fallback for databases that have not run setup_instruction.txt yet.
  const { data: existingVote, error: voteFetchError } = await supabase
    .from('votes')
    .select('*')
    .eq('user_id', user.uid)
    .eq('post_id', postId)
    .maybeSingle();

  if (voteFetchError) throw voteFetchError;
    
  let postUpvoteChange = 0;
  let postDownvoteChange = 0;
  
  if (existingVote) {
    if (existingVote.vote_type === voteType) {
      // Removing vote
      const { error } = await supabase.from('votes').delete().eq('id', existingVote.id);
      if (error) throw error;
      if (voteType === 'up') postUpvoteChange = -1;
      else postDownvoteChange = -1;
    } else {
      // Changing vote
      const { error } = await supabase.from('votes').update({ vote_type: voteType }).eq('id', existingVote.id);
      if (error) throw error;
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
    const { error } = await supabase.from('votes').insert([{
      user_id: user.uid,
      post_id: postId,
      vote_type: voteType
    }]);
    if (error) throw error;
    if (voteType === 'up') postUpvoteChange = 1;
    else postDownvoteChange = 1;
  }
  
  // Note: For a production app, the vote count update should ideally be handled by a Postgres Function/Trigger
  // to prevent race conditions. Here we do it client-side for simplicity.
  const { data: post, error: postError } = await supabase.from('posts').select('upvotes, downvotes').eq('id', postId).single();
  if (postError) throw postError;
  
  if (post) {
    const nextUpvotes = Math.max(0, (post.upvotes || 0) + postUpvoteChange);
    const nextDownvotes = Math.max(0, (post.downvotes || 0) + postDownvoteChange);
    const { error } = await supabase.from('posts').update({
      upvotes: nextUpvotes,
      downvotes: nextDownvotes
    }).eq('id', postId);
    if (error) throw error;
  }
  
  return true;
}
