import { createSearch } from './search.js';
import { createPostCard } from './post-card.js';
import { getResetCountdown } from '../utils/time.js';

export function createFeed(state, onSort, onSearch, onVote, onReport, onPostClick) {
  const container = document.createElement('div');
  container.className = 'container flex-col';

  // Header
  const header = document.createElement('div');
  header.className = 'flex justify-between items-center';
  header.style.marginBottom = 'var(--spacing-md)';
  header.innerHTML = `
    <h1 id="logo-nearo" style="font-size: 1.5rem; display: flex; align-items: center; gap: 8px; cursor: pointer;">
      <svg viewBox="0 0 64 64" width="24" height="24" fill="none"><rect width="64" height="64" rx="16" fill="var(--text-primary)"/><circle cx="32" cy="28" r="10" stroke="var(--bg-primary)" stroke-width="2.5" fill="none"/><circle cx="32" cy="28" r="3" fill="var(--accent)"/><path d="M20 48 C20 38 44 38 44 48" stroke="var(--bg-primary)" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg>
      NEARO
    </h1>
    <div class="mono flex items-center gap-sm" style="font-size: 0.8rem; background: var(--bg-secondary); padding: 4px 8px; border-radius: var(--radius-sm);">
      <svg viewBox="0 0 24 24" style="width: 14px; height: 14px; stroke: currentColor; fill: none; stroke-width: 2;"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
      <span id="reset-timer">${getResetCountdown()}</span>
    </div>
  `;
  container.appendChild(header);

  container.querySelector('#logo-nearo').addEventListener('click', () => {
    // Navigate to instructions
    window.dispatchEvent(new CustomEvent('nav-instructions'));
  });

  // Update timer every minute
  setInterval(() => {
    const timerEl = container.querySelector('#reset-timer');
    if (timerEl) timerEl.textContent = getResetCountdown();
  }, 60000);

  // Search
  container.appendChild(createSearch(onSearch));

  // Sort Tabs
  const sortTabs = document.createElement('div');
  sortTabs.className = 'flex gap-md';
  sortTabs.style.marginBottom = 'var(--spacing-lg)';
  sortTabs.style.borderBottom = '1px solid var(--border)';
  
  const sortOptions = ['new', 'top'];
  let currentSort = 'new'; // Default

  const renderTabs = () => {
    sortTabs.innerHTML = '';
    sortOptions.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'mono';
      btn.style.padding = 'var(--spacing-sm) 0';
      btn.style.textTransform = 'uppercase';
      btn.style.fontWeight = '700';
      btn.style.fontSize = '0.9rem';
      btn.style.color = currentSort === opt ? 'var(--text-primary)' : 'var(--text-secondary)';
      btn.style.borderBottom = currentSort === opt ? '2px solid var(--text-primary)' : '2px solid transparent';
      btn.style.marginBottom = '-1px'; // Overlap border
      btn.textContent = opt;
      
      btn.addEventListener('click', () => {
        currentSort = opt;
        renderTabs();
        onSort(opt);
      });
      
      sortTabs.appendChild(btn);
    });
  };
  renderTabs();
  container.appendChild(sortTabs);

  // Posts Container
  const postsContainer = document.createElement('div');
  postsContainer.className = 'flex-col gap-sm';
  postsContainer.id = 'posts-container';
  container.appendChild(postsContainer);

  // Render function for posts
  container.renderPosts = (posts, userVotesMap, userReportsSet) => {
    postsContainer.innerHTML = '';
    
    if (posts.length === 0) {
      postsContainer.innerHTML = `
        <div style="text-align: center; padding: var(--spacing-xl) 0; color: var(--text-secondary);">
          <svg viewBox="0 0 24 24" style="width: 48px; height: 48px; stroke: currentColor; fill: none; stroke-width: 1; margin-bottom: var(--spacing-md); opacity: 0.5;"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
          <p class="mono" style="font-size: 0.9rem;">No posts in your zone yet.</p>
          <p style="font-size: 0.8rem; margin-top: var(--spacing-sm);">Be the first to post something today.</p>
        </div>
      `;
      return;
    }
    
    posts.forEach((post, index) => {
      const voteType = userVotesMap[post.id] || null;
      const reported = userReportsSet.has(post.id);
      
      const card = createPostCard(post, voteType, reported, onVote, onReport, onPostClick);
      // Staggered fade in
      card.style.opacity = '0';
      card.style.transform = 'translateY(10px)';
      card.style.animation = `slideDown 0.3s ease ${index * 0.05}s forwards`;
      
      postsContainer.appendChild(card);
    });
  };

  return container;
}
