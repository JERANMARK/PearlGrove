// Simple encryption utilities for localStorage
// For production, consider using a more robust solution like crypto-js or Web Crypto API

const ENCRYPTION_KEY = process.env.VITE_ENCRYPTION_KEY || 'default-key-change-in-production';

// Simple XOR encryption (NOT SECURE for production - placeholder only)
// In production, use Web Crypto API or a proper library
export const encrypt = (text: string): string => {
  if (!text) return '';
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length));
  }
  return btoa(result); // Base64 encode
};

export const decrypt = (encrypted: string): string => {
  if (!encrypted) return '';
  try {
    const text = atob(encrypted); // Base64 decode
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length));
    }
    return result;
  } catch {
    return '';
  }
};

// Safe localStorage operations with encryption
export const secureLocalStorage = {
  setItem: (key: string, value: string): void => {
    try {
      const encrypted = encrypt(value);
      localStorage.setItem(key, encrypted);
    } catch (error) {
      console.error('Failed to encrypt and store data:', error);
    }
  },
  
  getItem: (key: string): string => {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return '';
      return decrypt(encrypted);
    } catch (error) {
      console.error('Failed to decrypt data:', error);
      return '';
    }
  },
  
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove data:', error);
    }
  },
  
  clear: (): void => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  },
};
