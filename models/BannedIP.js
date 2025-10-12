// models/BannedIP.js
import mongoose from 'mongoose';

const BannedIPSchema = new mongoose.Schema({
  // Original IP ban field (keep for backward compatibility)
  ip: {
    type: String,
    index: true,
  },
  
  // === NEW MULTI-LAYER BAN FIELDS ===
  // Browser fingerprint ban
  fingerprint: {
    type: String,
    index: true,
  },
  // Cookie tracking ID ban
  trackingId: {
    type: String,
    index: true,
  },
  // LocalStorage tracking ID ban
  localStorageId: {
    type: String,
    index: true,
  },
  
  // Ban metadata
  reason: {
    type: String,
    default: 'Spam/Abuse',
  },
  bannedBy: {
    type: String,
    default: 'admin',
  },
  notes: {
    type: String,
  },
  bannedAt: {
    type: Date,
    default: Date.now,
  },
  
  // Optional: For temporary bans
  expiresAt: {
    type: Date,
  },
  active: {
    type: Boolean,
    default: true,
  }
});

// Compound indexes for efficient ban checking
BannedIPSchema.index({ ip: 1, active: 1 });
BannedIPSchema.index({ fingerprint: 1, active: 1 });
BannedIPSchema.index({ trackingId: 1, active: 1 });
BannedIPSchema.index({ localStorageId: 1, active: 1 });

export default mongoose.models.BannedIP || mongoose.model('BannedIP', BannedIPSchema);