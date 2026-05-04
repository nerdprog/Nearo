import { state } from '../modules/state.js';
import { onAuthChange, signIn, signUp, signOut, deleteAccount, signInWithGoogle } from '../modules/auth.js';
import { updateLocation, calculateDistance } from '../modules/geo.js';
import { fetchPosts, createPost, getUserPosts, deletePost as removePost, searchPosts } from '../modules/posts.js';
import { votePost, getUserVotes } from '../modules/votes.js';
import { reportPost, getReportedPosts } from '../modules/reports.js';
import { getStreak, updateStreakOnPost } from '../modules/streaks.js';
import { withRateLimit } from '../utils/rate-limit.js';

import { createAuthPage } from './auth-page.js';
import { createFeed } from './feed.js';
import { createNavbar } from './navbar.js';
import { createAccountPanel } from './account.js';
import { createPostModal } from './create-post.js';
import { showToast } from './toast.js';

export function initApp() {
  const root = document.getElementById('app');
  state.initTheme();

  let currentView = 'loading'; // loading, auth, feed, account
  let currentSort = 'new';
  let isRateLimited = false;

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
        root.appendChild(createAuthPage(
          async (email, pwd) => {
            const res = await withRateLimit('auth', () => signIn(email, pwd))();
            if (res.error) showToast(res.error, 'error');
          },
          async (email, pwd, user) => {
            const res = await withRateLimit('auth', () => signUp(email, pwd, user))();
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

    // Main App Shell
    if (currentView === 'feed') {
      const feed = createFeed(state, 
        (sort) => { currentSort = sort; loadFeedData(); },
        (query) => { handleSearch(query); },
        handleVote,
        handleReport
      );
      root.appendChild(feed);
      
      // We need to re-render posts when state changes, so we attach it to state
      state.subscribe((s) => {
        if (currentView === 'feed' && document.getElementById('posts-container')) {
           feed.renderPosts(s.posts || [], s.userVotes || {}, s.userReports || new Set());
        }
      });
      
      // Initial load
      if (state.posts.length === 0) loadFeedData();
      else feed.renderPosts(state.posts, state.userVotes || {}, state.userReports || new Set());
    }

    if (currentView === 'account') {
      root.innerHTML = `<div style="height: 100vh; display: flex; justify-content: center; align-items: center;"><div class="loader"></div></div>`;
      
      try {
        const [posts, streak] = await Promise.all([
          getUserPosts(),
          getStreak()
        ]);
        
        root.innerHTML = '';
        root.appendChild(createAccountPanel(
          state, posts, streak,
          async () => { await signOut(); },
          async () => {
            const res = await deleteAccount();
            if (res.error) showToast(res.error, 'error');
          },
          async (id) => {
            try {
              await removePost(id);
              showToast('Post deleted', 'success');
              render(); // Re-render account panel
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

    // Add Navbar for feed/account
    root.appendChild(createNavbar((tab) => {
      if (tab === 'create') {
        const modal = createPostModal(
          async (title, content, img) => {
            try {
              await withRateLimit('post', () => createPost(title, content, state.zoneId, state.lat, state.lng))();
              await updateStreakOnPost();
              showToast('Posted to zone.', 'success');
              document.body.removeChild(modal);
              if (currentView === 'feed') loadFeedData();
            } catch (e) {
              showToast(e.message, 'error');
              throw e; // keep modal open if error
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
