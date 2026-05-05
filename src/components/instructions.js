export function createInstructionsPage(onBack) {
  const container = document.createElement('div');
  container.className = 'container flex-col';
  container.style.padding = 'var(--spacing-lg)';

  container.innerHTML = `
    <div class="flex items-center gap-md" style="margin-bottom: var(--spacing-xl);">
      <button id="btn-back" class="btn-icon" title="Back">
        <svg viewBox="0 0 24 24" style="width: 24px; height: 24px; stroke: currentColor; fill: none; stroke-width: 2;"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
      </button>
      <h2 style="font-size: 1.5rem;">Neuro Guide</h2>
    </div>

    <div class="card flex-col gap-lg" style="margin-bottom: var(--spacing-xl);">
      <section>
        <h3 class="mono" style="font-size: 0.9rem; color: var(--accent); margin-bottom: var(--spacing-sm);">HOW IT WORKS</h3>
        <p style="font-size: 0.95rem; line-height: 1.6; color: var(--text-secondary);">
          Neuro shows posts from your nearby 3km zone. Use the feed to read local posts, switch to Top to see the highest scoring posts, and use the plus button to create a post.
        </p>
      </section>

      <section>
        <h3 class="mono" style="font-size: 0.9rem; color: var(--accent); margin-bottom: var(--spacing-sm);">CURRENT RULES</h3>
        <ul style="list-style: none; padding: 0; display: flex; flex-direction: column; gap: var(--spacing-sm);">
          <li style="display: flex; gap: var(--spacing-sm);"><span style="color: var(--accent);">-</span><span style="font-size: 0.9rem;">You can create up to 5 posts per day. Deleted posts still count toward this limit.</span></li>
          <li style="display: flex; gap: var(--spacing-sm);"><span style="color: var(--accent);">-</span><span style="font-size: 0.9rem;">You can include up to 1 image per day across all posts.</span></li>
          <li style="display: flex; gap: var(--spacing-sm);"><span style="color: var(--accent);">-</span><span style="font-size: 0.9rem;">Every post needs a title and content. Images are optional.</span></li>
          <li style="display: flex; gap: var(--spacing-sm);"><span style="color: var(--accent);">-</span><span style="font-size: 0.9rem;">Posts can have titles up to 50 words and content up to 250 words.</span></li>
        </ul>
      </section>

      <section>
        <h3 class="mono" style="font-size: 0.9rem; color: var(--accent); margin-bottom: var(--spacing-sm);">POSTING GUIDELINES</h3>
        <ul style="list-style: none; padding: 0; display: flex; flex-direction: column; gap: var(--spacing-sm);">
          <li style="display: flex; gap: var(--spacing-sm);"><span style="color: var(--accent);">-</span><span style="font-size: 0.9rem;">Be respectful. Do not post harassment, hate speech, threats, or targeted abuse.</span></li>
          <li style="display: flex; gap: var(--spacing-sm);"><span style="color: var(--accent);">-</span><span style="font-size: 0.9rem;">Do not share private personal information about yourself or others.</span></li>
          <li style="display: flex; gap: var(--spacing-sm);"><span style="color: var(--accent);">-</span><span style="font-size: 0.9rem;">Do not post spam, scams, illegal content, or misleading emergency reports.</span></li>
          <li style="display: flex; gap: var(--spacing-sm);"><span style="color: var(--accent);">-</span><span style="font-size: 0.9rem;">Report posts that break the rules so moderators can review them.</span></li>
        </ul>
      </section>

      <section>
        <h3 class="mono" style="font-size: 0.9rem; color: var(--accent); margin-bottom: var(--spacing-sm);">BUGS AND QUERIES</h3>
        <p style="font-size: 0.9rem; color: var(--text-secondary);">
          Contact <a href="mailto:harishkumarps@student.tce.edu" style="color: var(--text-primary); font-weight: 700; text-decoration: underline;">harishkumarps@student.tce.edu</a>.
        </p>
      </section>
    </div>
  `;

  container.querySelector('#btn-back').addEventListener('click', onBack);

  return container;
}
