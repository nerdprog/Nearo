export function timeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  
  if (seconds < 60) return 'Just now';
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  return 'Older'; // Should rarely be seen since posts delete daily
}

export function getResetCountdown() {
  const now = new Date();
  
  // Calculate next UTC midnight
  const nextMidnight = new Date();
  nextMidnight.setUTCHours(24, 0, 0, 0);
  
  const diffMs = nextMidnight - now;
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${hours}h ${minutes}m`;
}

export function isToday(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  
  // Assuming reset at UTC midnight
  return date.getUTCFullYear() === now.getUTCFullYear() &&
         date.getUTCMonth() === now.getUTCMonth() &&
         date.getUTCDate() === now.getUTCDate();
}
