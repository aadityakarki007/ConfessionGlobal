import mongoose from 'mongoose';

const BannedIPSchema = new mongoose.Schema({
  ip: {
    type: String,
    required: true,
    unique: true,
  },
  bannedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.BannedIP || mongoose.model('BannedIP', BannedIPSchema);
