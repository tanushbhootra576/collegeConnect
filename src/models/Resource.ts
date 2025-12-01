import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IResource extends Document {
    courseCode: string;
    courseName: string;
    year: number;
    branch: string;
    uploaderId: mongoose.Types.ObjectId;
    isApproved: boolean;
    
    syllabus?: {
        linkUrl: string;
        description?: string;
        isApproved: boolean;
    };
    
    modules: {
        _id: mongoose.Types.ObjectId;
        moduleNumber: number;
        title: string;
        linkUrl: string;
        isApproved: boolean;
    }[];
    
    pyqs: {
        _id: mongoose.Types.ObjectId;
        exam: string;
        year: string;
        linkUrl: string;
        isApproved: boolean;
    }[];
    
    others: {
        _id: mongoose.Types.ObjectId;
        title: string;
        description?: string;
        linkUrl: string;
        type?: string; // 'NOTES', 'LINK', etc.
        isApproved: boolean;
    }[];

    createdAt: Date;
}

const ResourceSchema: Schema = new Schema({
    courseCode: { type: String, required: true, unique: true },
    courseName: { type: String, required: true },
    year: { type: Number, required: true },
    branch: { type: String },
    uploaderId: { type: Schema.Types.ObjectId, ref: 'User' },
    isApproved: { type: Boolean, default: false },
    
    syllabus: {
        linkUrl: String,
        description: String,
        isApproved: { type: Boolean, default: false }
    },
    
    modules: [{
        moduleNumber: Number,
        title: String,
        linkUrl: String,
        isApproved: { type: Boolean, default: false }
    }],
    
    pyqs: [{
        exam: String,
        year: String,
        linkUrl: String,
        isApproved: { type: Boolean, default: false }
    }],
    
    others: [{
        title: String,
        description: String,
        linkUrl: String,
        type: String,
        isApproved: { type: Boolean, default: false }
    }],

    createdAt: { type: Date, default: Date.now },
});

// Delete the model if it exists to prevent hot-reload errors with schema changes
if (mongoose.models.Resource) {
    delete mongoose.models.Resource;
}

const Resource: Model<IResource> = mongoose.model<IResource>('Resource', ResourceSchema);

export default Resource;
