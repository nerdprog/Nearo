export function createSearch(onSearch) {
  const container = document.createElement('div');
  container.className = 'search-container';
  container.style.padding = 'var(--spacing-md)';
  container.style.position = 'sticky';
  container.style.top = '60px'; // Below header
  container.style.backgroundColor = 'var(--bg-primary)';
  container.style.zIndex = '10';
  
  container.innerHTML = `
    <div style="position: relative;">
      <svg style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; stroke: var(--text-secondary); fill: none; stroke-width: 2;" viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
      <input type="text" id="search-input" placeholder="Search today's posts..." 
             style="width: 100%; padding: 12px 12px 12px 40px; border-radius: var(--radius-full); 
                    border: 1px solid var(--border); background-color: var(--bg-secondary); 
                    font-size: 0.9rem;" />
    </div>
  `;

  let timeout = null;
  const input = container.querySelector('#search-input');
  
  input.addEventListener('input', (e) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      onSearch(e.target.value);
    }, 300); // 300ms debounce
  });

  return container;
}
