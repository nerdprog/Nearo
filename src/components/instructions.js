export function createInstructionsPage(onBack) {
  const container = document.createElement('div');
  container.className = 'container flex-col';
  container.style.padding = 'var(--spacing-lg)';

  container.innerHTML = `
    <div class="flex items-center gap-md" style="margin-bottom: var(--spacing-xl);">
      <button id="btn-back" class="btn-icon">
        <svg viewBox="0 0 24 24" style="width: 24px; height: 24px; stroke: currentColor; fill: none; stroke-width: 2;"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
      </button>
      <h2 style="font-size: 1.5rem;">How to use Nearo</h2>
    </div>

    <div class="card flex-col gap-lg" style="margin-bottom: var(--spacing-xl);">
      <section>
        <h3 class="mono" style="font-size: 0.9rem; color: var(--accent); margin-bottom: var(--spacing-sm);">MISSION</h3>
        <p style="font-size: 0.95rem; line-height: 1.6; color: var(--text-secondary);">
          Nearo is a hyper-local, anonymous social platform designed for campus life. Share thoughts, ask questions, or report issues in your immediate 3km zone.
        </p>
      </section>

      <section>
        <h3 class="mono" style="font-size: 0.9rem; color: var(--accent); margin-bottom: var(--spacing-sm);">RULES & GUIDELINES</h3>
        <ul style="list-style: none; padding: 0; display: flex; flex-direction: column; gap: var(--spacing-sm);">
          <li style="display: flex; gap: var(--spacing-sm);">
            <span style="color: var(--accent);">•</span>
            <span style="font-size: 0.9rem;">You can post up to 5 times per day. Deleting a post does not reset this count.</span>
          </li>
          <li style="display: flex; gap: var(--spacing-sm);">
            <span style="color: var(--accent);">•</span>
            <span style="font-size: 0.9rem;">You can include 1 image per day across all your posts.</span>
          </li>
          <li style="display: flex; gap: var(--spacing-sm);">
            <span style="color: var(--accent);">•</span>
            <span style="font-size: 0.9rem;">Be respectful. No bullying, harassment, or hate speech.</span>
          </li>
          <li style="display: flex; gap: var(--spacing-sm);">
            <span style="color: var(--accent);">•</span>
            <span style="font-size: 0.9rem;">Do not post personally identifiable information (PII) about yourself or others.</span>
          </li>
          <li style="display: flex; gap: var(--spacing-sm);">
            <span style="color: var(--accent);">•</span>
            <span style="font-size: 0.9rem;">Posts are ephemeral and will be cleaned up regularly.</span>
          </li>
        </ul>
      </section>

      <section>
        <h3 class="mono" style="font-size: 0.9rem; color: var(--accent); margin-bottom: var(--spacing-sm);">REPORTING BUGS</h3>
        <p style="font-size: 0.9rem; color: var(--text-secondary);">
          Found a bug or have a query? Reach out to us:
          <br>
          <a href="mailto:harishkumarps@student.tce.edu" style="color: var(--text-primary); font-weight: 700; text-decoration: underline;">harishkumarps@student.tce.edu</a>
        </p>
      </section>
    </div>

    <p class="mono" style="text-align: center; font-size: 0.75rem; color: var(--text-secondary); opacity: 0.5;">
      VERSION 1.0.0
    </p>
  `;

  container.querySelector('#btn-back').addEventListener('click', onBack);

  return container;
}
