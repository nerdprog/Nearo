export function createNavbar(onNavigate) {
  const nav = document.createElement('nav');
  nav.className = 'navbar';
  
  nav.innerHTML = `
    <div class="nav-item active" data-tab="feed">
      <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
      <span>Feed</span>
    </div>
    
    <div class="nav-item">
      <button class="nav-fab" id="btn-create-post">
        <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
      </button>
    </div>
    
    <div class="nav-item" data-tab="account">
      <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
      <span>Account</span>
    </div>
  `;

  // Event listeners
  const tabs = nav.querySelectorAll('.nav-item[data-tab]');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      onNavigate(tab.dataset.tab);
    });
  });

  const createBtn = nav.querySelector('#btn-create-post');
  createBtn.addEventListener('click', () => {
    onNavigate('create');
  });

  return nav;
}
