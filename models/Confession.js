// models/Confession.js
import mongoose from 'mongoose';

const ConfessionSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    trim: true,
    maxLength: 1500
  },
  category: {
    type: String,
    enum: ['love', 'work', 'family', 'friendship', 'personal', 'other'],
    default: 'other'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  ipAddress: String,
  userAgent: String,
  
  // === NEW ANTI-SPAM TRACKING FIELDS ===
  // Browser fingerprint (SHA-256 hash from canvas, WebGL, audio, etc.)
  fingerprint: {
    type: String,
    index: true,
  },
  // Cookie-based tracking ID
  trackingId: {
    type: String,
    index: true,
  },
  // LocalStorage-based tracking ID
  localStorageId: {
    type: String,
    index: true,
  },
  // Does user have localStorage enabled?
  hasLocalStorage: {
    type: Boolean,
    default: false,
  },
  // Timestamp from client-side tracking
  trackingTimestamp: {
    type: Number,
  }
}, {
  timestamps: true
});

// Indexes for efficient rate limiting and ban checking
ConfessionSchema.index({ ipAddress: 1, createdAt: -1 });
ConfessionSchema.index({ fingerprint: 1, createdAt: -1 });
ConfessionSchema.index({ trackingId: 1, createdAt: -1 });
ConfessionSchema.index({ localStorageId: 1, createdAt: -1 });

// Avoid model overwrite error in dev/hot-reload
export default mongoose.models?.Confession || mongoose.model('Confession', ConfessionSchema);