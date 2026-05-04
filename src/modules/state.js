class AppState {
  constructor() {
    this.user = null; // Firebase user
    this.zoneId = null; // Current grid zone
    this.nearbyZones = [];
    this.posts = []; // Current view's posts
    this.theme = localStorage.getItem('theme') || 'light';
    
    this.listeners = new Set();
  }

  // Subscribe to state changes
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify listeners
  notify() {
    this.listeners.forEach(callback => callback(this));
  }

  // Update user state
  setUser(user) {
    this.user = user;
    this.notify();
  }

  // Update location state
  setLocation(zoneId, nearbyZones) {
    this.zoneId = zoneId;
    this.nearbyZones = nearbyZones;
    this.notify();
  }

  // Update posts state
  setPosts(posts) {
    this.posts = posts;
    this.notify();
  }

  // Toggle theme
  toggleTheme() {
    this.theme = this.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', this.theme);
    document.documentElement.setAttribute('data-theme', this.theme);
    this.notify();
  }
  
  // Apply initial theme
  initTheme() {
    document.documentElement.setAttribute('data-theme', this.theme);
  }
}

export const state = new AppState();
