import { validateTitle, validateContent } from '../utils/validators.js';

export function createPostModal(onSubmit, onCancel) {
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.backgroundColor = 'var(--bg-primary)';
  overlay.style.zIndex = '1000';
  overlay.style.display = 'flex';
  overlay.style.flexDirection = 'column';
  overlay.style.overflowY = 'auto';

  // Mobile container bounds
  const container = document.createElement('div');
  container.style.maxWidth = '480px';
  container.style.width = '100%';
  container.style.margin = '0 auto';
  container.style.padding = 'var(--spacing-md)';
  container.style.minHeight = '100vh';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';

  container.innerHTML = `
    <div class="flex justify-between items-center" style="margin-bottom: var(--spacing-lg);">
      <h2 style="font-size: 1.2rem;">New Post</h2>
      <button class="btn-icon" id="btn-cancel">
        <svg viewBox="0 0 24 24" style="width: 24px; height: 24px; stroke: currentColor; fill: none; stroke-width: 2;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    </div>

    <div class="input-group">
      <div class="flex justify-between">
        <label class="input-label">Title</label>
        <span class="mono" id="title-counter" style="font-size: 0.75rem; color: var(--text-secondary);">0 / 50 words</span>
      </div>
      <input type="text" id="post-title" class="input-field" placeholder="Make it catchy..." />
    </div>

    <div class="input-group" style="flex-grow: 1; display: flex; flex-direction: column;">
      <div class="flex justify-between">
        <label class="input-label">Content</label>
        <span class="mono" id="content-counter" style="font-size: 0.75rem; color: var(--text-secondary);">0 / 250 words</span>
      </div>
      <textarea id="post-content" class="input-field" style="flex-grow: 1; resize: none; min-height: 150px; line-height: 1.5;" placeholder="What's happening in your zone?"></textarea>
    </div>

    <div class="input-group">
      <label class="input-label">Image</label>
      <div id="image-upload-area" style="border: 1px dashed var(--border); padding: var(--spacing-lg); text-align: center; border-radius: var(--radius-md); position: relative; cursor: pointer; background-color: var(--bg-secondary);">
        <svg viewBox="0 0 24 24" style="width: 32px; height: 32px; stroke: var(--text-secondary); fill: none; stroke-width: 1.5; margin-bottom: var(--spacing-sm);"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
        <p class="mono" id="image-upload-text" style="font-size: 0.8rem; color: var(--text-secondary);">Click to attach image (Max 1/day)</p>
      </div>
      <input type="file" id="post-image" accept="image/*" style="display: none;" />
    </div>

    <button id="btn-submit" class="btn btn-primary" style="margin-top: auto; margin-bottom: var(--spacing-md);">Post to Zone</button>
  `;

  overlay.appendChild(container);

  // Events
  const titleInput = container.querySelector('#post-title');
  const titleCounter = container.querySelector('#title-counter');
  const contentInput = container.querySelector('#post-content');
  const contentCounter = container.querySelector('#content-counter');
  const submitBtn = container.querySelector('#btn-submit');
  const cancelBtn = container.querySelector('#btn-cancel');

  const updateWordCount = (text, element, max) => {
    const count = text.trim() ? text.trim().split(/\s+/).length : 0;
    element.textContent = `${count} / ${max} words`;
    element.style.color = count > max ? 'var(--error)' : 'var(--text-secondary)';
    return count <= max;
  };

  titleInput.addEventListener('input', (e) => updateWordCount(e.target.value, titleCounter, 50));
  contentInput.addEventListener('input', (e) => updateWordCount(e.target.value, contentCounter, 250));

  const imageUploadArea = container.querySelector('#image-upload-area');
  const imageInput = container.querySelector('#post-image');
  const imageUploadText = container.querySelector('#image-upload-text');

  imageUploadArea.addEventListener('click', () => imageInput.click());
  imageInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      imageUploadText.textContent = e.target.files[0].name;
      imageUploadArea.style.borderColor = 'var(--accent)';
      imageUploadArea.style.color = 'var(--accent)';
    } else {
      imageUploadText.textContent = 'Click to attach image (Max 1/day)';
      imageUploadArea.style.borderColor = 'var(--border)';
      imageUploadArea.style.color = 'var(--text-secondary)';
    }
  });

  cancelBtn.addEventListener('click', onCancel);

  submitBtn.addEventListener('click', () => {
    const title = titleInput.value;
    const content = contentInput.value;
    
    const titleVal = validateTitle(title);
    if (!titleVal.valid) return alert(titleVal.error); // We'll replace with toast in app.js
    
    const contentVal = validateContent(content);
    if (!contentVal.valid) return alert(contentVal.error);

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="loader"></div>';
    
    const imageFile = imageInput.files.length > 0 ? imageInput.files[0] : null;
    
    onSubmit(title, content, imageFile).finally(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Post to Zone';
    });
  });

  return overlay;
}
