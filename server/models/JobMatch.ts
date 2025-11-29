import mongoose, { Document, Schema } from "mongoose";

export interface IJobMatch extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  jobId: mongoose.Types.ObjectId;
  resumeId: mongoose.Types.ObjectId;
  
  matchScore: number; // 0-100
  matchReasons: string[];
  
  // Detailed breakdown
  skillMatchScore: number;
  experienceMatchScore: number;
  educationMatchScore: number;
  
  matchedSkills: string[];
  missingSkills: string[];
  
  status: "new" | "viewed" | "saved" | "applied" | "rejected";
  appliedAt?: Date;
  notes?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const jobMatchSchema = new Schema<IJobMatch>(
  {
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true,
      index: true,
    },
    jobId: { 
      type: Schema.Types.ObjectId, 
      ref: "Job", 
      required: true,
    },
    resumeId: { 
      type: Schema.Types.ObjectId, 
      ref: "Resume", 
      required: true,
    },
    
    matchScore: { type: Number, required: true, min: 0, max: 100 },
    matchReasons: [{ type: String }],
    
    skillMatchScore: { type: Number, default: 0, min: 0, max: 100 },
    experienceMatchScore: { type: Number, default: 0, min: 0, max: 100 },
    educationMatchScore: { type: Number, default: 0, min: 0, max: 100 },
    
    matchedSkills: [{ type: String }],
    missingSkills: [{ type: String }],
    
    status: { 
      type: String, 
      enum: ["new", "viewed", "saved", "applied", "rejected"],
      default: "new",
    },
    appliedAt: { type: Date },
    notes: { type: String },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
jobMatchSchema.index({ userId: 1, jobId: 1 }, { unique: true });
jobMatchSchema.index({ userId: 1, matchScore: -1 });

export const JobMatch = mongoose.model<IJobMatch>("JobMatch", jobMatchSchema);
