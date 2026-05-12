import { state } from '../modules/state.js';
import { onAuthChange, signIn, signUp, signOut, deleteAccount, signInWithGoogle } from '../modules/auth.js';
import { updateLocation, calculateDistance } from '../modules/geo.js';
import { fetchPosts, createPost, getUserPosts, getDailyStats, deletePost as removePost, searchPosts } from '../modules/posts.js';
import { votePost, getUserVotes } from '../modules/votes.js';
import { reportPost, getReportedPosts } from '../modules/reports.js';
import { getStreak, updateStreakOnPost } from '../modules/streaks.js';
import { withRateLimit } from '../utils/rate-limit.js';

import { createAuthPage } from './auth-page.js';
import { createFeed } from './feed.js';
import { createNavbar } from './navbar.js';
import { createAccountPanel } from './account.js';
import { createPostModal } from './create-post.js';
import { createInstructionsPage } from './instructions.js';
import { createPostCard } from './post-card.js'; // reuse for detail
import { showToast } from './toast.js';

export function initApp() {
  const root = document.getElementById('app');
  state.initTheme();

  let currentView = 'loading'; // loading, auth, feed, account, instructions, post
  let currentSort = 'new';
  let isRateLimited = false;
  let selectedPost = null;

  // Global listeners for nav
  window.addEventListener('nav-instructions', () => {
    currentView = 'instructions';
    render();
  });

  // Render loop
  const render = async () => {
    root.innerHTML = '';

    if (currentView === 'loading') {
      root.innerHTML = `<div style="height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center;">
        <div class="loader"></div>
        <p class="mono" style="margin-top: var(--spacing-md); color: var(--text-secondary); font-size: 0.8rem;">INITIALIZING...</p>
      </div>`;
      return;
    }

    if (currentView === 'auth') {
      root.innerHTML = '';
      root.appendChild(createAuthPage(
        async (email, pwd) => {
          const res = await withRateLimit('auth', () => signIn(email, pwd))();
          if (res.error) showToast(res.error, 'error');
        },
        async (email, pwd, user, pfpUrl) => {
          const res = await withRateLimit('auth', () => signUp(email, pwd, user, pfpUrl))();
          if (res.error) showToast(res.error, 'error');
          else showToast('Identity created.', 'success');
        },
        async () => {
          const res = await withRateLimit('auth', () => signInWithGoogle())();
          if (res.error) showToast(res.error, 'error');
          else showToast('Signed in with Google.', 'success');
        }
      ));
      return;
    }

    // Persistent Shell structure
    root.innerHTML = `
      <div id="main-content" style="flex: 1; overflow-y: auto;"></div>
      <div id="navbar-anchor"></div>
    `;
    const contentArea = document.getElementById('main-content');
    const navAnchor = document.getElementById('navbar-anchor');

    // Add Navbar immediately
    navAnchor.appendChild(createNavbar((tab) => {
      if (tab === 'create') {
        const modal = createPostModal(
          async (title, content, img) => {
            try {
              await withRateLimit('post', () => createPost(title, content, state.zoneId, state.lat, state.lng, img))();
              await updateStreakOnPost();
              showToast('Posted to zone.', 'success');
              document.body.removeChild(modal);
              if (currentView === 'feed') loadFeedData();
              else { currentView = 'feed'; render(); }
            } catch (e) {
              showToast(e.message, 'error');
              throw e;
            }
          },
          () => document.body.removeChild(modal)
        );
        document.body.appendChild(modal);
      } else {
        if (currentView !== tab) {
          currentView = tab;
          render();
        }
      }
    }));

    // Main App Views
    if (currentView === 'feed') {
      const feed = createFeed(state, 
        (sort) => { currentSort = sort; loadFeedData(); },
        (query) => { handleSearch(query); },
        handleVote,
        handleReport,
        (post) => {
          selectedPost = post;
          currentView = 'post';
          render();
        }
      );
      contentArea.appendChild(feed);
      
      state.subscribe((s) => {
        if (currentView === 'feed' && document.getElementById('posts-container')) {
           feed.renderPosts(s.posts || [], s.userVotes || {}, s.userReports || new Set());
        }
      });
      
      if (state.posts.length === 0) loadFeedData();
      else feed.renderPosts(state.posts, state.userVotes || {}, state.userReports || new Set());
    }

    if (currentView === 'account') {
      const loader = document.createElement('div');
      loader.innerHTML = `<div style="height: 50vh; display: flex; justify-content: center; align-items: center;"><div class="loader"></div></div>`;
      contentArea.appendChild(loader);
      
      try {
        const [posts, streak, dailyStats] = await Promise.all([
          getUserPosts(),
          getStreak(),
          getDailyStats()
        ]);
        
        if (currentView !== 'account') return;
        contentArea.innerHTML = '';
        contentArea.appendChild(createAccountPanel(
          state, posts, streak, dailyStats,
          async () => { await signOut(); },
          async () => {
            const res = await deleteAccount();
            if (res.error) showToast(res.error, 'error');
          },
          async (id) => {
            try {
              await removePost(id);
              showToast('Post deleted', 'success');
              render();
            } catch (e) {
              showToast(e.message, 'error');
            }
          }
        ));
      } catch (e) {
        showToast("Error loading account data", 'error');
        currentView = 'feed';
        render();
      }
    }

    if (currentView === 'instructions') {
      contentArea.appendChild(createInstructionsPage(() => {
        currentView = 'feed';
        render();
      }));
    }

    if (currentView === 'post' && selectedPost) {
      const detailContainer = document.createElement('div');
      detailContainer.className = 'container flex-col';
      detailContainer.style.padding = 'var(--spacing-md)';
      
      const backHeader = document.createElement('div');
      backHeader.className = 'flex items-center gap-md';
      backHeader.style.marginBottom = 'var(--spacing-lg)';
      backHeader.innerHTML = `
        <button id="btn-post-back" class="btn-icon">
          <svg viewBox="0 0 24 24" style="width: 24px; height: 24px; stroke: currentColor; fill: none; stroke-width: 2;"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        </button>
        <h2 style="font-size: 1.2rem;">Post Details</h2>
      `;
      detailContainer.appendChild(backHeader);
      
      const voteType = (state.userVotes || {})[selectedPost.id] || null;
      const reported = (state.userReports || new Set()).has(selectedPost.id);
      
      const card = createPostCard(selectedPost, voteType, reported, handleVote, handleReport, null);
      const contentPara = card.querySelector('p');
      if (contentPara) {
        contentPara.textContent = selectedPost.content;
      }
      
      detailContainer.appendChild(card);
      contentArea.appendChild(detailContainer);
      
      detailContainer.querySelector('#btn-post-back').addEventListener('click', () => {
        currentView = 'feed';
        render();
      });
    }

    // Removed duplicate navbar block as it's now handled at the shell level above
    if (currentView === 'feed' || currentView === 'account' || currentView === 'instructions' || currentView === 'post') {
        // The navbar is already added to navbar-anchor
        // We just need to make sure the active state matches currentView
        const activeItem = navAnchor.querySelector(`.nav-item[data-tab="${currentView}"]`);
        if (activeItem) {
          navAnchor.querySelectorAll('.nav-item').forEach(t => t.classList.remove('active'));
          activeItem.classList.add('active');
        }
    }
  };

  // Data loaders
  const loadFeedData = async () => {
    if (!state.zoneId) return;
    try {
      const posts = await fetchPosts(state.nearbyZones, currentSort);
      
      // Filter by strict 3km radius
      const filteredPosts = posts.filter(post => {
        if (!post.lat || !post.lng) return false; 
        const dist = calculateDistance(state.lat, state.lng, post.lat, post.lng);
        return dist <= 3;
      });
      
      // Fetch user specific data for these posts
      const postIds = filteredPosts.map(p => p.id);
      const [votes, reports] = await Promise.all([
        getUserVotes(postIds),
        getReportedPosts(postIds)
      ]);
      
      const votesMap = {};
      votes.forEach(v => votesMap[v.post_id] = v.vote_type);
      
      state.userVotes = votesMap;
      state.userReports = new Set(reports);
      state.setPosts(filteredPosts);
      
    } catch (e) {
      showToast("Error loading posts", 'error');
    }
  };

  const handleSearch = async (query) => {
    if (!query.trim()) {
      loadFeedData();
      return;
    }
    try {
      const posts = await searchPosts(query, state.nearbyZones);
      const filteredPosts = posts.filter(post => {
        if (!post.lat || !post.lng) return false;
        return calculateDistance(state.lat, state.lng, post.lat, post.lng) <= 3;
      });
      state.setPosts(filteredPosts);
    } catch (e) {
      showToast("Search failed", 'error');
    }
  };

  const handleVote = async (postId, type) => {
    try {
      await withRateLimit('vote', () => votePost(postId, type))();
      // Optimistic update
      const currentVote = state.userVotes[postId];
      let post = state.posts.find(p => p.id === postId);
      if (!post) return;
      post.upvotes = post.upvotes || 0;
      post.downvotes = post.downvotes || 0;
      
      if (currentVote === type) {
        delete state.userVotes[postId];
        if (type === 'up') post.upvotes--; else post.downvotes--;
      } else {
        state.userVotes[postId] = type;
        if (type === 'up') {
          post.upvotes++;
          if (currentVote === 'down') post.downvotes--;
        } else {
          post.downvotes++;
          if (currentVote === 'up') post.upvotes--;
        }
      }
      post.upvotes = Math.max(0, post.upvotes || 0);
      post.downvotes = Math.max(0, post.downvotes || 0);
      post.vote_score = post.upvotes - post.downvotes;
      if (currentSort === 'top') {
        state.posts.sort((a, b) => ((b.vote_score ?? ((b.upvotes || 0) - (b.downvotes || 0))) - (a.vote_score ?? ((a.upvotes || 0) - (a.downvotes || 0)))) || new Date(b.created_at) - new Date(a.created_at));
      }
      state.notify();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const handleReport = async (postId) => {
    try {
      await withRateLimit('report', () => reportPost(postId))();
      state.userReports.add(postId);
      showToast('Post reported to moderators.', 'info');
      state.notify();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  // Auth Listener
  onAuthChange(async (user) => {
    if (user) {
      const isGoogleAuth = user.providerData.some(p => p.providerId === 'google.com');
      if (!user.emailVerified && !isGoogleAuth) {
        root.innerHTML = `
          <div class="container flex-col justify-center items-center" style="min-height: 100vh; text-align: center;">
            <svg viewBox="0 0 24 24" style="width: 48px; height: 48px; stroke: #fbbf24; fill: none; stroke-width: 2; margin-bottom: var(--spacing-md);"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
            <h2 style="margin-bottom: var(--spacing-sm);">Verify Your Email</h2>
            <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: var(--spacing-lg);">We've sent a verification link to your email. Please verify your identity to access Nearo.</p>
            <p style="color: var(--text-secondary); font-size: 0.8rem; margin-bottom: var(--spacing-md);">If you do not see it, please check your spam folder.</p>
            <button id="btn-force-out-verify" class="btn btn-outline" style="margin-top: var(--spacing-sm);">Back to Login</button>
          </div>
        `;
        document.getElementById('btn-force-out-verify').addEventListener('click', signOut);
        return;
      }

      state.setUser(user);
      currentView = 'loading';
      render();
      
      try {
        await updateLocation(state);
        currentView = 'feed';
      } catch (e) {
        // If location fails, we can't show feed.
        root.innerHTML = `
          <div class="container flex-col justify-center items-center" style="min-height: 100vh; text-align: center;">
            <svg viewBox="0 0 24 24" style="width: 48px; height: 48px; stroke: var(--error); fill: none; stroke-width: 2; margin-bottom: var(--spacing-md);"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            <h2 style="margin-bottom: var(--spacing-sm);">Location Required</h2>
            <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: var(--spacing-lg);">Nearo relies on your location to show posts in your zone. Please enable location permissions and refresh.</p>
            <button id="btn-retry-loc" class="btn btn-primary">Retry</button>
            <button id="btn-force-out" class="btn btn-outline" style="margin-top: var(--spacing-sm);">Log Out</button>
          </div>
        `;
        document.getElementById('btn-retry-loc').addEventListener('click', () => window.location.reload());
        document.getElementById('btn-force-out').addEventListener('click', signOut);
        return;
      }
      
    } else {
      state.setUser(null);
      state.setPosts([]);
      currentView = 'auth';
    }
    render();
  });
}
