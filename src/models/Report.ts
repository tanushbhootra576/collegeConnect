import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReport extends Document {
    reporterId: string; // User who reported
    targetType: 'DiscussionThread' | 'Project' | 'Resource' | 'User' | 'Comment';
    targetId: string; // ID of the reported item
    reason: 'spam' | 'harassment' | 'false_information' | 'inappropriate' | 'other';
    description?: string;
    status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
    createdAt: Date;
}

const ReportSchema: Schema<IReport> = new Schema({
    reporterId: { type: String, required: true },
    targetType: { 
        type: String, 
        required: true, 
        enum: ['DiscussionThread', 'Project', 'Resource', 'User', 'Comment'] 
    },
    targetId: { type: String, required: true },
    reason: { 
        type: String, 
        required: true, 
        enum: ['spam', 'harassment', 'false_information', 'inappropriate', 'other'] 
    },
    description: { type: String },
    status: { 
        type: String, 
        default: 'pending',
        enum: ['pending', 'reviewed', 'resolved', 'dismissed']
    },
    createdAt: { type: Date, default: Date.now },
});

// Delete the model if it exists to prevent hot-reload errors
if (mongoose.models.Report) {
    delete mongoose.models.Report;
}

const Report: Model<IReport> = mongoose.model<IReport>('Report', ReportSchema);

export default Report;
