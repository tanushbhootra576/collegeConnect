import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IResource extends Document {
    courseCode: string;
    courseName: string;
    year: number;
    branch: string;
    uploaderId: mongoose.Types.ObjectId;
    
    syllabus?: {
        linkUrl: string;
        description?: string;
    };
    
    modules: {
        moduleNumber: number;
        title: string;
        linkUrl: string;
    }[];
    
    pyqs: {
        exam: string;
        year: string;
        linkUrl: string;
    }[];
    
    others: {
        title: string;
        description?: string;
        linkUrl: string;
        type?: string; // 'NOTES', 'LINK', etc.
    }[];

    createdAt: Date;
}

const ResourceSchema: Schema = new Schema({
    courseCode: { type: String, required: true, unique: true },
    courseName: { type: String, required: true },
    year: { type: Number, required: true },
    branch: { type: String },
    uploaderId: { type: Schema.Types.ObjectId, ref: 'User' },
    
    syllabus: {
        linkUrl: String,
        description: String
    },
    
    modules: [{
        moduleNumber: Number,
        title: String,
        linkUrl: String
    }],
    
    pyqs: [{
        exam: String,
        year: String,
        linkUrl: String
    }],
    
    others: [{
        title: String,
        description: String,
        linkUrl: String,
        type: String
    }],

    createdAt: { type: Date, default: Date.now },
});

// Delete the model if it exists to prevent hot-reload errors with schema changes
if (mongoose.models.Resource) {
    delete mongoose.models.Resource;
}

const Resource: Model<IResource> = mongoose.model<IResource>('Resource', ResourceSchema);

export default Resource;
