import mongoose, { Document, Schema } from "mongoose";

export interface ISkill {
  name: string;
  level: number; // 0-100
  category: "Frontend" | "Backend" | "Database" | "Cloud" | "Language" | "Other";
}

export interface IExperience {
  role: string;
  company: string;
  duration: string;
  startDate?: Date;
  endDate?: Date;
  description: string;
  highlights: string[];
}

export interface IEducation {
  degree: string;
  institution: string;
  graduationDate?: Date;
  gpa?: string;
  relevantCoursework: string[];
}

export interface IProject {
  name: string;
  description: string;
  technologies: string[];
  link?: string;
}

export interface IResume extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  fileName: string;
  rawText: string;
  
  // Extracted & structured data
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  summary?: string;
  
  skills: ISkill[];
  experience: IExperience[];
  education: IEducation[];
  projects: IProject[];
  
  // AI-generated insights
  profileSummary?: string;
  suggestedRoles: string[];
  strengthAreas: string[];
  improvementAreas: string[];
  
  createdAt: Date;
  updatedAt: Date;
}

const skillSchema = new Schema<ISkill>({
  name: { type: String, required: true },
  level: { type: Number, required: true, min: 0, max: 100 },
  category: { 
    type: String, 
    required: true, 
    enum: ["Frontend", "Backend", "Database", "Cloud", "Language", "Other"] 
  },
});

const experienceSchema = new Schema<IExperience>({
  role: { type: String, required: true },
  company: { type: String, required: true },
  duration: { type: String, required: true },
  startDate: { type: Date },
  endDate: { type: Date },
  description: { type: String, default: "" },
  highlights: [{ type: String }],
});

const educationSchema = new Schema<IEducation>({
  degree: { type: String, required: true },
  institution: { type: String, required: true },
  graduationDate: { type: Date },
  gpa: { type: String },
  relevantCoursework: [{ type: String }],
});

const projectSchema = new Schema<IProject>({
  name: { type: String, required: true },
  description: { type: String, default: "" },
  technologies: [{ type: String }],
  link: { type: String },
});

const resumeSchema = new Schema<IResume>(
  {
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true,
      index: true,
    },
    fileName: { type: String, required: true },
    rawText: { type: String, required: true },
    
    name: { type: String },
    email: { type: String },
    phone: { type: String },
    location: { type: String },
    summary: { type: String },
    
    skills: [skillSchema],
    experience: [experienceSchema],
    education: [educationSchema],
    projects: [projectSchema],
    
    profileSummary: { type: String },
    suggestedRoles: [{ type: String }],
    strengthAreas: [{ type: String }],
    improvementAreas: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

export const Resume = mongoose.model<IResume>("Resume", resumeSchema);
