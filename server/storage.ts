import { 
  User, 
  Resume, 
  Job, 
  JobMatch, 
  InterviewPrep,
  type IUser,
  type IResume,
  type IJob,
  type IJobMatch,
  type IInterviewPrep,
} from "./models";
import mongoose from "mongoose";

// User operations
export const userStorage = {
  async getById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return User.findById(id);
  },

  async getByUsername(username: string) {
    return User.findOne({ username });
  },

  async getByEmail(email: string) {
    return User.findOne({ email });
  },

  async create(data: { username: string; email: string; password: string }) {
    const user = new User(data);
    return user.save();
  },

  async update(id: string, data: Partial<IUser>) {
    return User.findByIdAndUpdate(id, data, { new: true });
  },
};

// Resume operations
export const resumeStorage = {
  async getById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Resume.findById(id);
  },

  async getByUserId(userId: string) {
    return Resume.find({ userId }).sort({ createdAt: -1 });
  },

  async getLatestByUserId(userId: string) {
    return Resume.findOne({ userId }).sort({ createdAt: -1 });
  },

  async create(data: Partial<IResume>) {
    const resume = new Resume(data);
    return resume.save();
  },

  async update(id: string, data: Partial<IResume>) {
    return Resume.findByIdAndUpdate(id, data, { new: true });
  },

  async delete(id: string) {
    const result = await Resume.findByIdAndDelete(id);
    return !!result;
  },
};

// Job operations
export const jobStorage = {
  async getById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Job.findById(id);
  },

  async getAll(filter: {
    search?: string;
    jobType?: string;
    experienceLevel?: string;
    location?: string;
    limit?: number;
    skip?: number;
  } = {}) {
    const query: any = { isActive: true };
    
    if (filter.search) {
      query.$text = { $search: filter.search };
    }
    if (filter.jobType) {
      query.jobType = filter.jobType;
    }
    if (filter.experienceLevel) {
      query.experienceLevel = filter.experienceLevel;
    }
    if (filter.location) {
      query.location = { $regex: filter.location, $options: "i" };
    }

    return Job.find(query)
      .sort({ createdAt: -1 })
      .skip(filter.skip || 0)
      .limit(filter.limit || 50);
  },

  async create(data: Partial<IJob>) {
    const job = new Job(data);
    return job.save();
  },

  async createMany(jobs: Partial<IJob>[]) {
    return Job.insertMany(jobs);
  },

  async update(id: string, data: Partial<IJob>) {
    return Job.findByIdAndUpdate(id, data, { new: true });
  },

  async delete(id: string) {
    const result = await Job.findByIdAndDelete(id);
    return !!result;
  },
};

// Job Match operations
export const jobMatchStorage = {
  async getById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return JobMatch.findById(id).populate("jobId");
  },

  async getByUserId(userId: string, filter: {
    status?: string;
    minScore?: number;
    limit?: number;
    skip?: number;
  } = {}) {
    const query: any = { userId };
    
    if (filter.status) {
      query.status = filter.status;
    }
    if (filter.minScore) {
      query.matchScore = { $gte: filter.minScore };
    }

    return JobMatch.find(query)
      .populate("jobId")
      .sort({ matchScore: -1 })
      .skip(filter.skip || 0)
      .limit(filter.limit || 50);
  },

  async create(data: Partial<IJobMatch>) {
    const match = new JobMatch(data);
    return match.save();
  },

  async updateStatus(id: string, status: IJobMatch["status"]) {
    const updateData: any = { status };
    if (status === "applied") {
      updateData.appliedAt = new Date();
    }
    return JobMatch.findByIdAndUpdate(id, updateData, { new: true });
  },

  async getStats(userId: string) {
    const stats = await JobMatch.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          avgScore: { $avg: "$matchScore" },
          highMatches: { $sum: { $cond: [{ $gte: ["$matchScore", 80] }, 1, 0] } },
          applied: { $sum: { $cond: [{ $eq: ["$status", "applied"] }, 1, 0] } },
          saved: { $sum: { $cond: [{ $eq: ["$status", "saved"] }, 1, 0] } },
        },
      },
    ]);
    return stats[0] || { total: 0, avgScore: 0, highMatches: 0, applied: 0, saved: 0 };
  },
};

// Interview Prep operations
export const interviewPrepStorage = {
  async getById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return InterviewPrep.findById(id);
  },

  async getByUserId(userId: string) {
    return InterviewPrep.find({ userId }).sort({ createdAt: -1 });
  },

  async create(data: Partial<IInterviewPrep>) {
    const prep = new InterviewPrep(data);
    return prep.save();
  },

  async update(id: string, data: Partial<IInterviewPrep>) {
    return InterviewPrep.findByIdAndUpdate(id, data, { new: true });
  },

  async delete(id: string) {
    const result = await InterviewPrep.findByIdAndDelete(id);
    return !!result;
  },

  async updateProgress(id: string, questionsAnswered: number) {
    const prep = await InterviewPrep.findById(id);
    if (!prep) return null;
    
    const progress = prep.totalQuestions > 0 
      ? Math.round((questionsAnswered / prep.totalQuestions) * 100) 
      : 0;
    
    return InterviewPrep.findByIdAndUpdate(
      id, 
      { questionsAnswered, progress },
      { new: true }
    );
  },
};

// Export all storage modules
export const storage = {
  users: userStorage,
  resumes: resumeStorage,
  jobs: jobStorage,
  jobMatches: jobMatchStorage,
  interviewPreps: interviewPrepStorage,
};
