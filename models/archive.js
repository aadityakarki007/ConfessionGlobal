import mongoose from 'mongoose';

const archiveSchema = new mongoose.Schema({
    originalId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    ipAddress: {
        type: String,
        required: true
    },
    userAgent: String,
    isRead: {
        type: Boolean,
        default: true // Archives are typically already read
    },
    originalCreatedAt: {
        type: Date,
        required: true
    },
    archivedAt: {
        type: Date,
        default: Date.now
    },
    archivedBy: {
        type: String,
        default: 'admin'
    }
}, {
    timestamps: true
});

// Index for faster queries
archiveSchema.index({ archivedAt: -1 });
archiveSchema.index({ originalId: 1 });

export default mongoose.models.Archive || mongoose.model('Archive', archiveSchema);