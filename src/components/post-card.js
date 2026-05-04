import { timeAgo } from '../utils/time.js';

export function createPostCard(post, userVote, hasReported, onVote, onReport) {
  const card = document.createElement('div');
  card.className = 'card';
  if (post.flagged) {
    card.style.opacity = '0.5';
  }
  
  const upvoteColor = userVote === 'up' ? 'var(--accent)' : 'var(--text-secondary)';
  const downvoteColor = userVote === 'down' ? 'var(--accent)' : 'var(--text-secondary)';
  const reportColor = hasReported ? 'var(--accent)' : 'var(--text-secondary)';

  card.innerHTML = `
    <div class="flex justify-between items-center" style="margin-bottom: var(--spacing-sm);">
      <div class="mono" style="font-size: 0.8rem; font-weight: 700;">@${post.username}</div>
      <div class="mono" style="font-size: 0.75rem; color: var(--text-secondary);">${timeAgo(post.created_at)}</div>
    </div>
    
    ${post.flagged ? `<div class="mono accent" style="font-size: 0.75rem; margin-bottom: var(--spacing-sm);">⚠️ This post has been flagged by the community.</div>` : ''}
    
    <h3 style="margin-bottom: var(--spacing-xs); font-size: 1.1rem;">${escapeHtml(post.title)}</h3>
    <p style="color: var(--text-secondary); font-size: 0.95rem; margin-bottom: var(--spacing-md); word-wrap: break-word;">
      ${escapeHtml(post.content)}
    </p>
    
    <div class="flex items-center justify-between" style="border-top: 1px solid var(--border); padding-top: var(--spacing-sm);">
      <div class="flex items-center gap-sm">
        <button class="btn-icon vote-up" style="color: ${upvoteColor};">
          <svg viewBox="0 0 24 24" style="width: 18px; height: 18px; stroke: currentColor; fill: ${userVote === 'up' ? 'currentColor' : 'none'}; stroke-width: 2;"><polyline points="18 15 12 9 6 15"></polyline></svg>
        </button>
        <span class="mono" style="font-size: 0.85rem; font-weight: 700;">${post.upvotes - post.downvotes}</span>
        <button class="btn-icon vote-down" style="color: ${downvoteColor};">
          <svg viewBox="0 0 24 24" style="width: 18px; height: 18px; stroke: currentColor; fill: ${userVote === 'down' ? 'currentColor' : 'none'}; stroke-width: 2;"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </button>
      </div>
      
      <button class="btn-icon btn-report" style="color: ${reportColor};" title="Report post">
        <svg viewBox="0 0 24 24" style="width: 16px; height: 16px; stroke: currentColor; fill: ${hasReported ? 'currentColor' : 'none'}; stroke-width: 2;"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
      </button>
    </div>
  `;

  // Events
  card.querySelector('.vote-up').addEventListener('click', () => onVote(post.id, 'up'));
  card.querySelector('.vote-down').addEventListener('click', () => onVote(post.id, 'down'));
  card.querySelector('.btn-report').addEventListener('click', () => onReport(post.id));

  return card;
}

function escapeHtml(unsafe) {
    return (unsafe || "")
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}
