import mongoose, { Document, Schema } from "mongoose";

export interface ISavedJob {
  jobId: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  description: string;
  url?: string;
  source?: string;
  matchScore?: number;
  matchReasons?: string[];
  savedAt: Date;
}

export interface IUserProfile extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  
  // Resume data
  resumeFileName?: string;
  resumeUploadedAt?: Date;
  
  // Parsed profile data
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  summary?: string;
  
  skills: {
    name: string;
    level: number;
    category: string;
  }[];
  
  experience: {
    role: string;
    company: string;
    duration: string;
    description: string;
    highlights: string[];
  }[];
  
  education: {
    degree: string;
    institution: string;
    year?: string;
    gpa?: string;
  }[];
  
  projects: {
    name: string;
    description: string;
    technologies: string[];
  }[];
  
  // AI-generated insights
  profileSummary?: string;
  suggestedRoles: string[];
  strengthAreas: string[];
  
  // Job Preferences
  jobPreferences: {
    targetRoles: string[];
    preferredLocations: string[];
    remotePreference: "remote" | "hybrid" | "onsite" | "any";
    experienceLevel: "Entry" | "Mid" | "Senior" | "Lead" | "any";
    jobTypes: string[];
    minSalary?: number;
    industries: string[];
  };
  
  // Saved jobs
  savedJobs: ISavedJob[];
  
  createdAt: Date;
  updatedAt: Date;
}

const savedJobSchema = new Schema<ISavedJob>({
  jobId: { type: String, required: true },
  title: { type: String, required: true },
  company: { type: String, required: true },
  location: { type: String, default: "" },
  salary: { type: String },
  description: { type: String, default: "" },
  url: { type: String },
  source: { type: String },
  matchScore: { type: Number },
  matchReasons: [{ type: String }],
  savedAt: { type: Date, default: Date.now },
});

const userProfileSchema = new Schema<IUserProfile>(
  {
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true,
      unique: true,
      index: true,
    },
    
    resumeFileName: { type: String },
    resumeUploadedAt: { type: Date },
    
    name: { type: String },
    email: { type: String },
    phone: { type: String },
    location: { type: String },
    summary: { type: String },
    
    skills: [{
      name: { type: String, required: true },
      level: { type: Number, default: 50 },
      category: { type: String, default: "Other" },
    }],
    
    experience: [{
      role: { type: String, required: true },
      company: { type: String, required: true },
      duration: { type: String, default: "" },
      description: { type: String, default: "" },
      highlights: [{ type: String }],
    }],
    
    education: [{
      degree: { type: String, required: true },
      institution: { type: String, required: true },
      year: { type: String },
      gpa: { type: String },
    }],
    
    projects: [{
      name: { type: String, required: true },
      description: { type: String, default: "" },
      technologies: [{ type: String }],
    }],
    
    profileSummary: { type: String },
    suggestedRoles: [{ type: String }],
    strengthAreas: [{ type: String }],
    
    jobPreferences: {
      targetRoles: [{ type: String }],
      preferredLocations: [{ type: String }],
      remotePreference: { 
        type: String, 
        enum: ["remote", "hybrid", "onsite", "any"],
        default: "any"
      },
      experienceLevel: { 
        type: String, 
        enum: ["Entry", "Mid", "Senior", "Lead", "any"],
        default: "any"
      },
      jobTypes: [{ type: String }],
      minSalary: { type: Number },
      industries: [{ type: String }],
    },
    
    savedJobs: [savedJobSchema],
  },
  {
    timestamps: true,
  }
);

export const UserProfile = mongoose.model<IUserProfile>("UserProfile", userProfileSchema);
