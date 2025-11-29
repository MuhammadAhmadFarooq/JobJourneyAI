import mongoose, { Document, Schema } from "mongoose";

export interface ITopic {
  title: string;
  description: string;
  importance: "High" | "Medium" | "Low";
  questions: IQuestion[];
}

export interface IQuestion {
  question: string;
  difficulty: "Easy" | "Medium" | "Hard";
  type: "Technical" | "Behavioral" | "System Design" | "Coding";
  hints: string[];
  sampleAnswer?: string;
  resources: string[];
}

export interface IInterviewPrep extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  resumeId?: mongoose.Types.ObjectId;
  
  role: string;
  company: string;
  technologies: string[];
  
  // Research results
  companyInsights?: string;
  roleInsights?: string;
  techStackAnalysis?: string;
  
  // Generated content
  topics: ITopic[];
  studyGuide?: string;
  
  // Tracking
  status: "generating" | "ready" | "in_progress" | "completed";
  progress: number; // 0-100
  questionsAnswered: number;
  totalQuestions: number;
  
  createdAt: Date;
  updatedAt: Date;
}

const questionSchema = new Schema<IQuestion>({
  question: { type: String, required: true },
  difficulty: { 
    type: String, 
    enum: ["Easy", "Medium", "Hard"],
    default: "Medium",
  },
  type: { 
    type: String, 
    enum: ["Technical", "Behavioral", "System Design", "Coding"],
    default: "Technical",
  },
  hints: [{ type: String }],
  sampleAnswer: { type: String },
  resources: [{ type: String }],
});

const topicSchema = new Schema<ITopic>({
  title: { type: String, required: true },
  description: { type: String, default: "" },
  importance: { 
    type: String, 
    enum: ["High", "Medium", "Low"],
    default: "Medium",
  },
  questions: [questionSchema],
});

const interviewPrepSchema = new Schema<IInterviewPrep>(
  {
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true,
      index: true,
    },
    resumeId: { 
      type: Schema.Types.ObjectId, 
      ref: "Resume",
    },
    
    role: { type: String, required: true },
    company: { type: String, required: true },
    technologies: [{ type: String }],
    
    companyInsights: { type: String },
    roleInsights: { type: String },
    techStackAnalysis: { type: String },
    
    topics: [topicSchema],
    studyGuide: { type: String },
    
    status: { 
      type: String, 
      enum: ["generating", "ready", "in_progress", "completed"],
      default: "generating",
    },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    questionsAnswered: { type: Number, default: 0 },
    totalQuestions: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

export const InterviewPrep = mongoose.model<IInterviewPrep>("InterviewPrep", interviewPrepSchema);
