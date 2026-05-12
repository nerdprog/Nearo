import { timeAgo } from '../utils/time.js';

export function createAccountPanel(state, userPosts, streakData, dailyStats, onLogout, onDeleteAccount, onDeletePost) {
  const container = document.createElement('div');
  container.className = 'container flex-col';

  const user = state.user;
  const currentStreak = streakData ? streakData.current_streak : 0;
  const postsUsed = dailyStats ? dailyStats.posts_count : 0;
  const pfpUrl = user?.photoURL || '/assets/pfp/placeholder.svg';

  container.innerHTML = `
    <style>
      html[data-theme="dark"] .theme-moon { display: none; }
      html[data-theme="light"] .theme-moon { display: block; }
      html[data-theme="dark"] .theme-sun { display: block; }
      html[data-theme="light"] .theme-sun { display: none; }
    </style>
    <div class="card" style="margin-bottom: var(--spacing-lg); position: relative;">
      <button id="btn-theme-toggle" class="btn-icon" style="position: absolute; top: var(--spacing-md); right: var(--spacing-md); color: var(--text-secondary);" title="Toggle Theme">
        <svg class="theme-moon" viewBox="0 0 24 24" style="width: 20px; height: 20px; stroke: currentColor; fill: none; stroke-width: 2;"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
        <svg class="theme-sun" viewBox="0 0 24 24" style="width: 20px; height: 20px; stroke: currentColor; fill: none; stroke-width: 2;"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
      </button>
      <div class="flex items-center gap-md" style="margin-bottom: var(--spacing-md); padding-right: 32px;">
        <img src="${escapeHtml(pfpUrl)}" alt="" style="width: 56px; height: 56px; border-radius: 50%; object-fit: cover; border: 1px solid var(--border);" />
        <div style="min-width: 0;">
          <h2 style="font-size: 1.1rem; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(user?.displayName || 'Anonymous')}</h2>
          <div class="mono" style="font-size: 0.75rem; color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis;">${escapeHtml(user?.email || '')}</div>
        </div>
      </div>

      <div class="flex justify-between" style="border-top: 1px solid var(--border); padding-top: var(--spacing-md);">
        <div>
          <div class="mono" style="font-size: 0.75rem; color: var(--text-secondary);">POSTS TODAY</div>
          <div class="mono" style="font-size: 1rem; font-weight: 700;">${postsUsed} / 5</div>
        </div>
        <div style="text-align: right;">
          <div class="mono" style="font-size: 0.75rem; color: var(--text-secondary);">STREAK</div>
          <div class="mono" style="font-size: 1rem; font-weight: 700;">${currentStreak} days</div>
        </div>
      </div>
    </div>
  `;

  const myPostsHeader = document.createElement('div');
  myPostsHeader.className = 'flex justify-between items-center';
  myPostsHeader.style.marginBottom = 'var(--spacing-sm)';
  myPostsHeader.innerHTML = `
    <h3 style="font-size: 1rem;">My Posts Today</h3>
    <span class="mono" style="font-size: 0.8rem; color: var(--text-secondary);">${postsUsed} / 5</span>
  `;
  container.appendChild(myPostsHeader);

  const postsList = document.createElement('div');
  postsList.className = 'flex-col gap-sm';
  postsList.style.marginBottom = 'var(--spacing-xl)';

  if (userPosts.length === 0) {
    postsList.innerHTML = `<div class="card" style="text-align: center; color: var(--text-secondary); font-size: 0.9rem;">You haven't posted today.</div>`;
  } else {
    userPosts.forEach(post => {
      const item = document.createElement('div');
      item.className = 'card flex justify-between items-center';
      item.style.padding = 'var(--spacing-sm) var(--spacing-md)';
      item.innerHTML = `
        <div style="overflow: hidden;">
          <div style="font-weight: 500; font-size: 0.95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 250px;">${escapeHtml(post.title)}</div>
          <div class="mono" style="font-size: 0.75rem; color: var(--text-secondary);">${timeAgo(post.created_at)}</div>
        </div>
        <button class="btn-icon btn-delete" data-id="${escapeHtml(post.id)}" style="color: var(--error);" title="Delete post">
          <svg viewBox="0 0 24 24" style="width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 2;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      `;
      postsList.appendChild(item);
    });
  }
  container.appendChild(postsList);

  const actions = document.createElement('div');
  actions.className = 'flex-col gap-md';
  actions.innerHTML = `
    <button id="btn-logout" class="btn btn-outline" style="width: 100%;">Log Out</button>
    <button id="btn-delete-account" class="btn" style="width: 100%; color: var(--error); border: 1px solid var(--error);">Delete Account</button>
  `;
  container.appendChild(actions);

  container.querySelector('#btn-theme-toggle').addEventListener('click', () => state.toggleTheme());
  container.querySelector('#btn-logout').addEventListener('click', onLogout);
  container.querySelector('#btn-delete-account').addEventListener('click', () => {
    if (confirm("Are you sure? This will delete your account and all your data. This action cannot be undone.")) {
      onDeleteAccount();
    }
  });

  postsList.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      if (confirm("Delete this post?")) {
        onDeletePost(id);
      }
    });
  });

  return container;
}

function escapeHtml(unsafe) {
  return (unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
