// lib/fingerprint.js

/**
 * Generate a unique browser fingerprint
 */
export async function generateFingerprint() {
  const components = [];

  // Screen resolution and color depth
  components.push(`${screen.width}x${screen.height}x${screen.colorDepth}`);
  
  // Timezone
  components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);
  
  // Language
  components.push(navigator.language);
  
  // Platform
  components.push(navigator.platform);
  
  // Hardware concurrency (CPU cores)
  components.push(String(navigator.hardwareConcurrency || 0));
  
  // Device memory (if available)
  components.push(String(navigator.deviceMemory || 0));
  
  // User agent
  components.push(navigator.userAgent);
  
  // Canvas fingerprinting
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      canvas.width = 200;
      canvas.height = 50;
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('Browser Fingerprint', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('Canvas Test', 4, 17);
      components.push(canvas.toDataURL());
    }
  } catch (e) {
    components.push('canvas-blocked');
  }

  // WebGL fingerprinting
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        components.push(gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL));
        components.push(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL));
      }
    }
  } catch (e) {
    components.push('webgl-blocked');
  }

  // Audio context fingerprinting
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const analyser = audioContext.createAnalyser();
    const gainNode = audioContext.createGain();
    const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);
    
    gainNode.gain.value = 0;
    oscillator.connect(analyser);
    analyser.connect(scriptProcessor);
    scriptProcessor.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start(0);
    const audioFingerprint = analyser.frequencyBinCount;
    oscillator.stop();
    audioContext.close();
    
    components.push(String(audioFingerprint));
  } catch (e) {
    components.push('audio-blocked');
  }

  // Plugin detection
  const plugins = Array.from(navigator.plugins || [])
    .map(p => p.name)
    .sort()
    .join(',');
  components.push(plugins || 'no-plugins');

  // Touch support
  components.push(String('ontouchstart' in window));

  // Screen orientation
  components.push(String(screen.orientation?.type || 'unknown'));

  // Max touch points
  components.push(String(navigator.maxTouchPoints || 0));

  // Generate hash from components
  const fingerprint = await hashString(components.join('|||'));
  return fingerprint;
}

/**
 * Hash a string using SHA-256
 */
async function hashString(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate random ID
 */
function generateRandomId() {
  return 'tid_' + Math.random().toString(36).substr(2, 9) + 
         Date.now().toString(36) + 
         Math.random().toString(36).substr(2, 9);
}

/**
 * Get or create tracking ID (cookie-based)
 */
export function getTrackingId() {
  const cookieName = '_tracking_id';
  const cookies = document.cookie.split(';');
  
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === cookieName) {
      return value;
    }
  }
  
  // Generate new tracking ID
  const newId = generateRandomId();
  
  // Set cookie for 1 year
  const expiryDate = new Date();
  expiryDate.setFullYear(expiryDate.getFullYear() + 1);
  document.cookie = `${cookieName}=${newId}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Strict`;
  
  return newId;
}

/**
 * Check if localStorage is available and working
 */
export function checkLocalStorage() {
  try {
    const testKey = '__ls_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Get localStorage ID (if available)
 */
export function getLocalStorageId() {
  if (!checkLocalStorage()) return null;
  
  const lsKey = '_ls_tracking_id';
  let lsId = localStorage.getItem(lsKey);
  
  if (!lsId) {
    lsId = generateRandomId();
    try {
      localStorage.setItem(lsKey, lsId);
    } catch (e) {
      return null;
    }
  }
  
  return lsId;
}

/**
 * Collect all tracking data
 */
export async function collectTrackingData() {
  const fingerprint = await generateFingerprint();
  const trackingId = getTrackingId();
  const localStorageId = getLocalStorageId();
  const hasLocalStorage = checkLocalStorage();
  
  return {
    fingerprint,
    trackingId,
    localStorageId,
    hasLocalStorage,
    timestamp: Date.now()
  };
}