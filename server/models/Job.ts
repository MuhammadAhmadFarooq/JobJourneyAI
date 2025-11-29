import mongoose, { Document, Schema } from "mongoose";

export interface IJob extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  company: string;
  location: string;
  salary?: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  skills: string[];
  jobType: "Full-time" | "Part-time" | "Contract" | "Internship" | "Remote";
  experienceLevel: "Entry" | "Mid" | "Senior" | "Lead";
  sourceUrl?: string;
  sourcePlatform?: string;
  postedAt?: Date;
  expiresAt?: Date;
  logo?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const jobSchema = new Schema<IJob>(
  {
    title: { type: String, required: true, index: true },
    company: { type: String, required: true, index: true },
    location: { type: String, required: true },
    salary: { type: String },
    description: { type: String, required: true },
    requirements: [{ type: String }],
    responsibilities: [{ type: String }],
    skills: [{ type: String }],
    jobType: { 
      type: String, 
      required: true, 
      enum: ["Full-time", "Part-time", "Contract", "Internship", "Remote"],
      default: "Full-time",
    },
    experienceLevel: { 
      type: String, 
      required: true, 
      enum: ["Entry", "Mid", "Senior", "Lead"],
      default: "Entry",
    },
    sourceUrl: { type: String },
    sourcePlatform: { type: String },
    postedAt: { type: Date },
    expiresAt: { type: Date },
    logo: { type: String },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

// Text index for search
jobSchema.index({ title: "text", company: "text", description: "text", skills: "text" });

export const Job = mongoose.model<IJob>("Job", jobSchema);
