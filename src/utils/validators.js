export function validateTitle(title) {
  if (!title || title.trim() === '') {
    return { valid: false, error: 'Title is required' };
  }
  
  const words = title.trim().split(/\s+/);
  if (words.length > 50) {
    return { valid: false, error: 'Title must be 50 words or less' };
  }
  
  return { valid: true };
}

export function validateContent(content) {
  if (!content || content.trim() === '') {
    return { valid: false, error: 'Content is required' };
  }
  
  const words = content.trim().split(/\s+/);
  if (words.length > 250) {
    return { valid: false, error: 'Content must be 250 words or less' };
  }
  
  return { valid: true };
}

export function validateUsername(username) {
  if (!username || username.trim() === '') {
    return { valid: false, error: 'Username is required' };
  }
  
  if (username.length < 3 || username.length > 20) {
    return { valid: false, error: 'Username must be 3-20 characters' };
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { valid: false, error: 'Username can only contain letters, numbers, and underscores' };
  }
  
  return { valid: true };
}

export function validatePassword(password) {
  if (!password || password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long' };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' };
  }
  
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one special character' };
  }
  
  if (/(012|123|234|345|456|567|678|789|890|098|987|876|765|654|543|432|321|210)/.test(password)) {
    return { valid: false, error: 'Password cannot contain sequential numbers like 123' };
  }
  
  return { valid: true };
}

export function validateEmail(email) {
  if (!email || email.trim() === '') {
    return { valid: false, error: 'Email is required' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }
  
  return { valid: true };
}
