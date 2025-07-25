import mongoose from 'mongoose';

const ConfessionSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    trim: true,
    maxLength: 2000
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
  userAgent: String
}, {
  timestamps: true
});

// Avoid model overwrite error in dev/hot-reload
export default mongoose.models?.Confession || mongoose.model('Confession', ConfessionSchema);
