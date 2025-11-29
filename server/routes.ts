import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { parseResumeWithGemini } from "./services/gemini";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // ==================== Health Check ====================
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // ==================== Resume Parsing with AI ====================
  app.post("/api/resumes/parse", async (req, res) => {
    try {
      const { rawText, fileName } = req.body;
      
      if (!rawText) {
        return res.status(400).json({ message: "Resume text is required" });
      }

      console.log("🤖 Parsing resume with Gemini AI...");
      const parsedData = await parseResumeWithGemini(rawText);
      console.log("✅ Resume parsed successfully");

      res.json({
        success: true,
        data: parsedData,
      });
    } catch (error: any) {
      console.error("❌ Resume parsing error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== Resume Routes ====================
  app.post("/api/resumes", async (req, res) => {
    try {
      // For now, use a placeholder userId until auth is implemented
      const userId = req.body.userId || "000000000000000000000000";
      const resume = await storage.resumes.create({
        userId,
        fileName: req.body.fileName,
        rawText: req.body.rawText,
        skills: req.body.skills || [],
        experience: req.body.experience || [],
        education: req.body.education || [],
        projects: req.body.projects || [],
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        summary: req.body.summary,
      });
      res.status(201).json(resume);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/resumes/:userId", async (req, res) => {
    try {
      const resumes = await storage.resumes.getByUserId(req.params.userId);
      res.json(resumes);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/resumes/:userId/latest", async (req, res) => {
    try {
      const resume = await storage.resumes.getLatestByUserId(req.params.userId);
      if (!resume) {
        return res.status(404).json({ message: "No resume found" });
      }
      res.json(resume);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== Job Routes ====================
  app.get("/api/jobs", async (req, res) => {
    try {
      const jobs = await storage.jobs.getAll({
        search: req.query.search as string,
        jobType: req.query.jobType as string,
        experienceLevel: req.query.experienceLevel as string,
        location: req.query.location as string,
        limit: parseInt(req.query.limit as string) || 50,
        skip: parseInt(req.query.skip as string) || 0,
      });
      res.json(jobs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/jobs/:id", async (req, res) => {
    try {
      const job = await storage.jobs.getById(req.params.id);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.json(job);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/jobs", async (req, res) => {
    try {
      const job = await storage.jobs.create(req.body);
      res.status(201).json(job);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // ==================== Job Match Routes ====================
  app.get("/api/matches/:userId", async (req, res) => {
    try {
      const matches = await storage.jobMatches.getByUserId(req.params.userId, {
        status: req.query.status as string,
        minScore: parseInt(req.query.minScore as string) || undefined,
        limit: parseInt(req.query.limit as string) || 50,
        skip: parseInt(req.query.skip as string) || 0,
      });
      res.json(matches);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/matches/:userId/stats", async (req, res) => {
    try {
      const stats = await storage.jobMatches.getStats(req.params.userId);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/matches/:id/status", async (req, res) => {
    try {
      const match = await storage.jobMatches.updateStatus(req.params.id, req.body.status);
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }
      res.json(match);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // ==================== Interview Prep Routes ====================
  app.get("/api/interview-prep/:userId", async (req, res) => {
    try {
      const preps = await storage.interviewPreps.getByUserId(req.params.userId);
      res.json(preps);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/interview-prep/session/:id", async (req, res) => {
    try {
      const prep = await storage.interviewPreps.getById(req.params.id);
      if (!prep) {
        return res.status(404).json({ message: "Interview prep not found" });
      }
      res.json(prep);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/interview-prep", async (req, res) => {
    try {
      const userId = req.body.userId || "000000000000000000000000";
      const prep = await storage.interviewPreps.create({
        userId,
        role: req.body.role,
        company: req.body.company,
        technologies: req.body.technologies || [],
        status: "generating",
        topics: [],
        progress: 0,
        questionsAnswered: 0,
        totalQuestions: 0,
      });
      res.status(201).json(prep);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/interview-prep/:id", async (req, res) => {
    try {
      const prep = await storage.interviewPreps.update(req.params.id, req.body);
      if (!prep) {
        return res.status(404).json({ message: "Interview prep not found" });
      }
      res.json(prep);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  return httpServer;
}
