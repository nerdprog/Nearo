import { validateUsername, validatePassword, validateEmail } from '../utils/validators.js';

export function createAuthPage(onSignIn, onSignUp, onGoogleSignIn) {
  const container = document.createElement('div');
  container.className = 'container flex-col justify-center';
  container.style.minHeight = '100vh';

  let mode = 'login'; // 'login' or 'signup'
  let selectedPfp = '/assets/pfp/placeholder.svg';
  let selectedGender = '';

  // Place profile images in public/assets/pfp. Replace these placeholders with project avatars as needed.
  const pfpList = [
    '/assets/pfp/placeholder.svg',
    ...Array.from({length: 10}, (_, i) => `/assets/pfp/avatar-${String(i + 1).padStart(2, '0')}.png`)
  ];

  const genderColors = {
    Male: '#3b82f6',
    Female: '#ec4899',
    Others: '#9ca3af'
  };

  const setPfpSelected = (img, isSelected) => {
    img.classList.toggle('selected', isSelected);
    img.style.borderColor = isSelected ? 'var(--accent)' : 'transparent';
    img.style.opacity = isSelected ? '1' : '0.6';
  };

  const updatePfpSelection = () => {
    container.querySelectorAll('.pfp-option').forEach(img => {
      setPfpSelected(img, img.dataset.url === selectedPfp);
    });
  };

  const setGenderSelected = (btn, isSelected) => {
    const gender = btn.dataset.gender;
    const color = genderColors[gender];
    btn.style.borderColor = isSelected ? color : 'var(--border)';
    const icon = btn.querySelector('.gender-icon');
    const label = btn.querySelector('span');
    if (icon) icon.style.stroke = isSelected ? color : 'var(--text-secondary)';
    if (label) label.style.color = isSelected ? color : 'var(--text-secondary)';
  };

  const updateGenderSelection = () => {
    container.querySelectorAll('.gender-btn').forEach(btn => {
      setGenderSelected(btn, btn.dataset.gender === selectedGender);
    });
  };


  // Creative username placeholders
  const placeholders = ['CoolName99', 'NeonRider', 'CyberNomad', 'PixelGhost', 'VoidWalker', 'SynthWave', 'SilentObserver', 'DigitalDrifter', 'ChronoSeeker', 'SheHasNoIdea'];
  let placeholderIndex = 0;

  const intervalId = setInterval(() => {
    // Clean up interval if component is removed from DOM
    if (!container.isConnected) {
      clearInterval(intervalId);
      return;
    }
    const usernameInput = container.querySelector('#username');
    if (usernameInput) {
      // Start fade out
      usernameInput.classList.add('fade-out');

      // Wait for fade out to complete before changing text and fading in
      setTimeout(() => {
        placeholderIndex = (placeholderIndex + 1) % placeholders.length;
        usernameInput.setAttribute('placeholder', placeholders[placeholderIndex]);
        usernameInput.classList.remove('fade-out');
      }, 300);
    }
  }, 2500);

  const render = () => {
    container.innerHTML = `
      <style>
        .gender-btn:hover[data-gender="Male"] { border-color: #3b82f6 !important; }
        .gender-btn:hover[data-gender="Male"] .gender-icon { stroke: #3b82f6 !important; }
        .gender-btn:hover[data-gender="Male"] span { color: #3b82f6 !important; }
        
        .gender-btn:hover[data-gender="Female"] { border-color: #ec4899 !important; }
        .gender-btn:hover[data-gender="Female"] .gender-icon { stroke: #ec4899 !important; }
        .gender-btn:hover[data-gender="Female"] span { color: #ec4899 !important; }
        
        .gender-btn:hover[data-gender="Others"] { border-color: #9ca3af !important; }
        .gender-btn:hover[data-gender="Others"] .gender-icon { stroke: #9ca3af !important; }
        .gender-btn:hover[data-gender="Others"] span { color: #9ca3af !important; }
      </style>
      <div style="text-align: center; margin-bottom: var(--spacing-xl);">
        <svg viewBox="0 0 64 64" width="64" height="64" fill="none" style="margin-bottom: var(--spacing-md);"><rect width="64" height="64" rx="16" fill="var(--text-primary)"/><circle cx="32" cy="28" r="10" stroke="var(--bg-primary)" stroke-width="2.5" fill="none"/><circle cx="32" cy="28" r="3" fill="var(--accent)"/><path d="M20 48 C20 38 44 38 44 48" stroke="var(--bg-primary)" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg>
        <h1 style="font-size: 2rem; margin-bottom: var(--spacing-xs);">NEURO</h1>
        <p class="mono" style="color: var(--text-secondary); font-size: 0.85rem;">Local. Anonymous. Ephemeral.</p>
      </div>
      
      <div class="card" style="margin-bottom: var(--spacing-lg);">
        <div class="flex" style="margin-bottom: var(--spacing-lg); border-bottom: 1px solid var(--border);">
          <button id="tab-login" class="mono" style="flex: 1; padding: var(--spacing-sm) 0; font-weight: 700; text-transform: uppercase; font-size: 0.9rem; color: ${mode === 'login' ? 'var(--text-primary)' : 'var(--text-secondary)'}; border-bottom: 2px solid ${mode === 'login' ? 'var(--text-primary)' : 'transparent'}; margin-bottom: -1px;">Login</button>
          <button id="tab-signup" class="mono" style="flex: 1; padding: var(--spacing-sm) 0; font-weight: 700; text-transform: uppercase; font-size: 0.9rem; color: ${mode === 'signup' ? 'var(--text-primary)' : 'var(--text-secondary)'}; border-bottom: 2px solid ${mode === 'signup' ? 'var(--text-primary)' : 'transparent'}; margin-bottom: -1px;">Sign Up</button>
        </div>
        
        <form id="auth-form">
          <div class="input-group">
            <label class="input-label">Email</label>
            <input type="email" id="email" class="input-field" placeholder="you@example.com" autocomplete="email" required />
          </div>
          
          ${mode === 'signup' ? `
            <div class="input-group">
              <label class="input-label">Username</label>
              <input type="text" id="username" class="input-field placeholder-fade" placeholder="CoolName99" required />
            </div>
            
            <div class="input-group">
              <label class="input-label">Choose Avatar</label>
              <div class="pfp-grid flex gap-sm" style="flex-wrap: wrap; justify-content: center; margin-top: var(--spacing-sm);">
                ${pfpList.map(pfp => `
                  <img src="${pfp}" alt="Avatar option" class="pfp-option ${selectedPfp === pfp ? 'selected' : ''}" data-url="${pfp}" style="width: 48px; height: 48px; border-radius: 50%; cursor: pointer; border: 2px solid ${selectedPfp === pfp ? 'var(--accent)' : 'transparent'}; opacity: ${selectedPfp === pfp ? '1' : '0.6'}; transition: all 0.2s; object-fit: cover;" />
                `).join('')}
              </div>
            </div>

            <div class="input-group">
              <label class="input-label">Gender</label>
              <div class="flex gap-md" style="justify-content: center; margin-top: var(--spacing-sm);">
                <button type="button" class="gender-btn flex-col items-center justify-center gap-xs" data-gender="Male" style="flex: 1; padding: var(--spacing-sm); border-radius: var(--radius-md); border: 2px solid ${selectedGender === 'Male' ? '#3b82f6' : 'var(--border)'}; background: transparent; cursor: pointer; transition: all 0.2s;">
                  <svg viewBox="0 0 24 24" width="24" height="24" stroke="${selectedGender === 'Male' ? '#3b82f6' : 'var(--text-secondary)'}" stroke-width="2" fill="none" class="gender-icon" style="transition: stroke 0.2s;"><circle cx="10" cy="14" r="5"/><line x1="14" y1="10" x2="21" y2="3"/><polyline points="16 3 21 3 21 8"/></svg>
                  <span class="mono" style="font-size: 0.8rem; color: ${selectedGender === 'Male' ? '#3b82f6' : 'var(--text-secondary)'}; transition: color 0.2s;">Male</span>
                </button>
                <button type="button" class="gender-btn flex-col items-center justify-center gap-xs" data-gender="Female" style="flex: 1; padding: var(--spacing-sm); border-radius: var(--radius-md); border: 2px solid ${selectedGender === 'Female' ? '#ec4899' : 'var(--border)'}; background: transparent; cursor: pointer; transition: all 0.2s;">
                  <svg viewBox="0 0 24 24" width="24" height="24" stroke="${selectedGender === 'Female' ? '#ec4899' : 'var(--text-secondary)'}" stroke-width="2" fill="none" class="gender-icon" style="transition: stroke 0.2s;"><circle cx="12" cy="10" r="5"/><line x1="12" y1="15" x2="12" y2="22"/><line x1="9" y1="19" x2="15" y2="19"/></svg>
                  <span class="mono" style="font-size: 0.8rem; color: ${selectedGender === 'Female' ? '#ec4899' : 'var(--text-secondary)'}; transition: color 0.2s;">Female</span>
                </button>
                <button type="button" class="gender-btn flex-col items-center justify-center gap-xs" data-gender="Others" style="flex: 1; padding: var(--spacing-sm); border-radius: var(--radius-md); border: 2px solid ${selectedGender === 'Others' ? '#9ca3af' : 'var(--border)'}; background: transparent; cursor: pointer; transition: all 0.2s;">
                  <svg viewBox="0 0 24 24" width="24" height="24" stroke="${selectedGender === 'Others' ? '#9ca3af' : 'var(--text-secondary)'}" stroke-width="2" fill="none" class="gender-icon" style="transition: stroke 0.2s;"><circle cx="12" cy="12" r="5"/><line x1="12" y1="7" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="17"/><line x1="2" y1="12" x2="7" y2="12"/><line x1="17" y1="12" x2="22" y2="12"/></svg>
                  <span class="mono" style="font-size: 0.8rem; color: ${selectedGender === 'Others' ? '#9ca3af' : 'var(--text-secondary)'}; transition: color 0.2s;">Others</span>
                </button>
              </div>
            </div>
          ` : ''}
          
          <div class="input-group">
            <label class="input-label">Password</label>
            <input type="password" id="password" class="input-field" placeholder="Password" autocomplete="${mode === 'login' ? 'current-password' : 'new-password'}" required />
          </div>
          
          <button type="submit" id="btn-submit" class="btn btn-primary" style="margin-top: var(--spacing-md); width: 100%;">
            ${mode === 'login' ? 'Enter Zone' : 'Create Identity'}
          </button>
        </form>

        <div style="text-align: center; margin: var(--spacing-md) 0;">
          <span class="mono" style="color: var(--text-secondary); font-size: 0.8rem; padding: 0 8px; background: var(--bg-card); position: relative; z-index: 1;">OR</span>
          <div style="height: 1px; background: var(--border); margin-top: -10px; z-index: 0;"></div>
        </div>

        <button id="btn-google" class="btn btn-outline" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;">
          <svg viewBox="0 0 24 24" style="width: 18px; height: 18px;" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/><path d="M1 1h22v22H1z" fill="none"/></svg>
          Continue with Google
        </button>
      </div>
    `;

    // Events
    container.querySelector('#tab-login').addEventListener('click', () => { mode = 'login'; render(); });
    container.querySelector('#tab-signup').addEventListener('click', () => { mode = 'signup'; render(); });

    if (mode === 'signup') {
      container.querySelectorAll('.pfp-option').forEach(img => {
        img.addEventListener('click', (e) => {
          selectedPfp = e.target.dataset.url;
          updatePfpSelection();
        });
      });
      container.querySelectorAll('.gender-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          selectedGender = e.currentTarget.dataset.gender;
          updateGenderSelection();
        });
      });
    }

    container.querySelector('#btn-google').addEventListener('click', () => {
      onGoogleSignIn();
    });

    container.querySelector('#auth-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const email = container.querySelector('#email').value;
      const password = container.querySelector('#password').value;

      const btn = container.querySelector('#btn-submit');
      btn.disabled = true;
      btn.innerHTML = '<div class="loader"></div>';

      if (mode === 'login') {
        onSignIn(email, password).finally(() => {
          btn.disabled = false;
          btn.textContent = 'Enter Zone';
        });
      } else {
        const username = container.querySelector('#username').value;

        const emailVal = validateEmail(email);
        if (!emailVal.valid) { btn.disabled = false; btn.textContent = 'Create Identity'; return alert(emailVal.error); }

        const userVal = validateUsername(username);
        if (!userVal.valid) { btn.disabled = false; btn.textContent = 'Create Identity'; return alert(userVal.error); }

        const passVal = validatePassword(password);
        if (!passVal.valid) { btn.disabled = false; btn.textContent = 'Create Identity'; return alert(passVal.error); }
        
        if (!selectedGender) { btn.disabled = false; btn.textContent = 'Create Identity'; return alert('Please select a gender.'); }

        onSignUp(email, password, username, selectedPfp, selectedGender).finally(() => {
          btn.disabled = false;
          btn.textContent = 'Create Identity';
        });
      }
    });
  };

  render();
  return container;
}
