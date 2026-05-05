import { timeAgo } from '../utils/time.js';

export function createAccountPanel(state, userPosts, streakData, onLogout, onDeleteAccount, onDeletePost) {
  const container = document.createElement('div');
  container.className = 'container flex-col';
  
  const user = state.user;
  const currentStreak = streakData ? streakData.current_streak : 0;
  
  // Header
  const header = document.createElement('div');
  header.className = 'flex justify-between items-center';
  header.style.marginBottom = 'var(--spacing-xl)';
  header.innerHTML = `
    <h2 style="font-size: 1.5rem;">Account</h2>
    <button id="btn-theme" class="btn-icon">
      ${state.theme === 'light' ? 
        '<svg viewBox="0 0 24 24" style="width: 20px; height: 20px; stroke: currentColor; fill: none; stroke-width: 2;"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>' : 
        '<svg viewBox="0 0 24 24" style="width: 20px; height: 20px; stroke: currentColor; fill: none; stroke-width: 2;"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>'
      }
    </button>
  `;
  container.appendChild(header);

  // Profile Info
  const profile = document.createElement('div');
  profile.className = 'card flex justify-between items-center';
  profile.style.marginBottom = 'var(--spacing-lg)';
  profile.innerHTML = `
    <div class="flex items-center gap-md">
      <img src="${user && user.photoURL ? user.photoURL : '/assets/pfp/1.png'}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 2px solid var(--border);" />
      <div>
        <div class="mono" style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: var(--spacing-xs);">USERNAME</div>
        <div style="font-size: 1.2rem; font-weight: 700;">@${user ? user.displayName : 'unknown'}</div>
      </div>
    </div>
    <div style="text-align: right;">
      <div class="mono" style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: var(--spacing-xs);">STREAK</div>
      <div class="flex items-center gap-sm justify-end">
        <span style="font-size: 1.2rem; font-weight: 700;">${currentStreak}</span>
        <span style="color: var(--accent); font-size: 1.2rem;">🔥</span>
      </div>
    </div>
  `;
  container.appendChild(profile);

  // My Posts Section
  const myPostsHeader = document.createElement('div');
  myPostsHeader.className = 'flex justify-between items-center';
  myPostsHeader.style.marginBottom = 'var(--spacing-sm)';
  myPostsHeader.innerHTML = `
    <h3 style="font-size: 1rem;">My Posts Today</h3>
    <span class="mono" style="font-size: 0.8rem; color: var(--text-secondary);">${userPosts.length} / 5</span>
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
          <div style="font-weight: 500; font-size: 0.95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 250px;">${post.title}</div>
          <div class="mono" style="font-size: 0.75rem; color: var(--text-secondary);">${timeAgo(post.created_at)}</div>
        </div>
        <button class="btn-icon btn-delete" data-id="${post.id}" style="color: var(--error);">
          <svg viewBox="0 0 24 24" style="width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 2;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      `;
      postsList.appendChild(item);
    });
  }
  container.appendChild(postsList);

  // Actions
  const actions = document.createElement('div');
  actions.className = 'flex-col gap-md';
  actions.innerHTML = `
    <button id="btn-logout" class="btn btn-outline" style="width: 100%;">Log Out</button>
    <button id="btn-delete-account" class="btn" style="width: 100%; color: var(--error); border: 1px solid var(--error);">Delete Account</button>
  `;
  container.appendChild(actions);

  // Events
  container.querySelector('#btn-theme').addEventListener('click', () => {
    state.toggleTheme();
    // Re-render handled by app.js state subscription
  });

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
