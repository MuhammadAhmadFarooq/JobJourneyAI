import { Router } from "express";
import { UserProfile } from "../models";
import { requireAuth, getCurrentUserId } from "../middleware/auth";

const router = Router();

// Get user profile
router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    let profile = await UserProfile.findOne({ userId });
    
    // Create empty profile if doesn't exist
    if (!profile) {
      profile = new UserProfile({
        userId,
        skills: [],
        experience: [],
        education: [],
        projects: [],
        savedJobs: [],
        suggestedRoles: [],
        strengthAreas: [],
      });
      await profile.save();
    }

    res.json(profile);
  } catch (error: any) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Failed to get profile" });
  }
});

// Update user profile (after resume parsing)
router.put("/", requireAuth, async (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const updateData = {
      ...req.body,
      userId,
    };

    const profile = await UserProfile.findOneAndUpdate(
      { userId },
      updateData,
      { new: true, upsert: true }
    );

    res.json(profile);
  } catch (error: any) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
});

// Save a job
router.post("/saved-jobs", requireAuth, async (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const jobData = req.body;
    
    // Find or create profile
    let profile = await UserProfile.findOne({ userId });
    if (!profile) {
      profile = new UserProfile({
        userId,
        skills: [],
        experience: [],
        education: [],
        projects: [],
        savedJobs: [],
        suggestedRoles: [],
        strengthAreas: [],
      });
    }

    // Check if job already saved
    const existingJob = profile.savedJobs.find(j => j.jobId === jobData.jobId);
    if (existingJob) {
      return res.status(400).json({ message: "Job already saved" });
    }

    // Add job to saved jobs
    profile.savedJobs.push({
      ...jobData,
      savedAt: new Date(),
    });

    await profile.save();

    res.status(201).json({ message: "Job saved successfully", job: jobData });
  } catch (error: any) {
    console.error("Save job error:", error);
    res.status(500).json({ message: "Failed to save job" });
  }
});

// Get saved jobs
router.get("/saved-jobs", requireAuth, async (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const profile = await UserProfile.findOne({ userId });
    
    if (!profile) {
      return res.json([]);
    }

    // Sort by savedAt descending
    const savedJobs = profile.savedJobs.sort(
      (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
    );

    res.json(savedJobs);
  } catch (error: any) {
    console.error("Get saved jobs error:", error);
    res.status(500).json({ message: "Failed to get saved jobs" });
  }
});

// Remove a saved job
router.delete("/saved-jobs/:jobId", requireAuth, async (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { jobId } = req.params;

    const profile = await UserProfile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    profile.savedJobs = profile.savedJobs.filter(j => j.jobId !== jobId);
    await profile.save();

    res.json({ message: "Job removed successfully" });
  } catch (error: any) {
    console.error("Remove job error:", error);
    res.status(500).json({ message: "Failed to remove job" });
  }
});

// Get dashboard stats
router.get("/stats", requireAuth, async (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const profile = await UserProfile.findOne({ userId });
    
    if (!profile) {
      return res.json({
        profileStrength: 0,
        savedJobsCount: 0,
        skillsCount: 0,
        hasResume: false,
      });
    }

    // Calculate strict multi-factor profile strength (Max 100%)
    let profileStrength = 0;

    // 1. Resume File Uploaded (10%)
    const hasResume = !!profile.resumeFileName;
    if (hasResume) profileStrength += 10;

    // 2. Personal & Contact Info + Online Profiles (15%)
    let contactScore = 0;
    if (profile.name) contactScore += 3;
    if (profile.email) contactScore += 3;
    if (profile.location) contactScore += 3;
    if (profile.phone) contactScore += 3;
    // Check summary or description for LinkedIn / GitHub / Portfolio links
    const fullProfileText = `${profile.summary || ""} ${profile.profileSummary || ""}`.toLowerCase();
    if (fullProfileText.includes("linkedin.com") || fullProfileText.includes("github.com") || fullProfileText.includes("http")) {
      contactScore += 3;
    }
    profileStrength += contactScore;

    // 3. Professional Bio / Summary (10%)
    const summaryText = profile.summary || profile.profileSummary || "";
    let summaryScore = 0;
    if (summaryText.length > 150) {
      summaryScore = 10;
    } else if (summaryText.length > 40) {
      summaryScore = 5;
    }
    profileStrength += summaryScore;

    // 4. Technical & Core Skills Depth (20%)
    const skillsCount = Array.isArray(profile.skills) ? profile.skills.length : 0;
    let skillsScore = 0;
    if (skillsCount >= 15) {
      skillsScore = 20;
    } else if (skillsCount >= 10) {
      skillsScore = 15;
    } else if (skillsCount >= 5) {
      skillsScore = 10;
    } else if (skillsCount >= 1) {
      skillsScore = 5;
    }
    profileStrength += skillsScore;

    // 5. Work Experience Depth (20%)
    const expCount = Array.isArray(profile.experience) ? profile.experience.length : 0;
    let expScore = 0;
    if (expCount >= 4) {
      expScore = 20;
    } else if (expCount === 3) {
      expScore = 16;
    } else if (expCount === 2) {
      expScore = 12;
    } else if (expCount === 1) {
      expScore = 6;
    }
    profileStrength += expScore;

    // 6. Education & Credentials (10%)
    const eduCount = Array.isArray(profile.education) ? profile.education.length : 0;
    let eduScore = 0;
    if (eduCount >= 2) {
      eduScore = 10;
    } else if (eduCount === 1) {
      eduScore = 7;
    }
    profileStrength += eduScore;

    // 7. Projects & Portfolio Showcase (5%)
    const projCount = Array.isArray(profile.projects) ? profile.projects.length : 0;
    let projScore = 0;
    if (projCount >= 3) {
      projScore = 5;
    } else if (projCount >= 1) {
      projScore = 3;
    }
    profileStrength += projScore;

    // 8. Job Preferences Configured (10%)
    const prefs = profile.jobPreferences || {};
    let prefScore = 0;
    if (Array.isArray(prefs.targetRoles) && prefs.targetRoles.length > 0) prefScore += 4;
    if (Array.isArray(prefs.preferredLocations) && prefs.preferredLocations.length > 0) prefScore += 3;
    if (prefs.remotePreference && prefs.remotePreference !== "any") prefScore += 3;
    profileStrength += prefScore;

    const finalStrength = Math.min(Math.round(profileStrength), 100);

    res.json({
      profileStrength: finalStrength,
      savedJobsCount: profile.savedJobs.length,
      skillsCount: profile.skills.length,
      hasResume,
      topSkills: profile.skills.slice(0, 6),
      suggestedRoles: profile.suggestedRoles.slice(0, 3),
      breakdown: {
        resume: hasResume ? 10 : 0,
        contact: contactScore,
        summary: summaryScore,
        skills: skillsScore,
        experience: expScore,
        education: eduScore,
        projects: projScore,
        preferences: prefScore,
      }
    });
  } catch (error: any) {
    console.error("Get stats error:", error);
    res.status(500).json({ message: "Failed to get stats" });
  }
});

// Get job preferences
router.get("/preferences", requireAuth, async (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const profile = await UserProfile.findOne({ userId });
    
    if (!profile) {
      return res.json({
        targetRoles: [],
        preferredLocations: [],
        remotePreference: "any",
        experienceLevel: "any",
        jobTypes: ["Full-time"],
        minSalary: 0,
        industries: [],
      });
    }

    res.json(profile.jobPreferences || {
      targetRoles: [],
      preferredLocations: [],
      remotePreference: "any",
      experienceLevel: "any",
      jobTypes: ["Full-time"],
      minSalary: 0,
      industries: [],
    });
  } catch (error: any) {
    console.error("Get preferences error:", error);
    res.status(500).json({ message: "Failed to get preferences" });
  }
});

// Update job preferences
router.put("/preferences", requireAuth, async (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const {
      targetRoles,
      preferredLocations,
      remotePreference,
      experienceLevel,
      jobTypes,
      minSalary,
      industries,
    } = req.body;

    let profile = await UserProfile.findOne({ userId });
    if (!profile) {
      profile = new UserProfile({
        userId,
        skills: [],
        experience: [],
        education: [],
        projects: [],
        savedJobs: [],
        suggestedRoles: [],
        strengthAreas: [],
        jobPreferences: {},
      });
    }

    // Update job preferences
    profile.jobPreferences = {
      targetRoles: targetRoles || [],
      preferredLocations: preferredLocations || [],
      remotePreference: remotePreference || "any",
      experienceLevel: experienceLevel || "any",
      jobTypes: jobTypes || ["Full-time"],
      minSalary: minSalary || 0,
      industries: industries || [],
    };

    await profile.save();

    res.json({ 
      message: "Preferences updated successfully",
      preferences: profile.jobPreferences,
    });
  } catch (error: any) {
    console.error("Update preferences error:", error);
    res.status(500).json({ message: "Failed to update preferences" });
  }
});

// ==================== Interview Prep Routes ====================

// Get all interview preps for a user
router.get("/interview-preps", requireAuth, async (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const profile = await UserProfile.findOne({ userId });
    
    if (!profile) {
      return res.json([]);
    }

    // Return all interview preps, sorted by most recent
    const preps = (profile.interviewPreps || []).sort(
      (a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
    );

    res.json(preps);
  } catch (error: any) {
    console.error("Get interview preps error:", error);
    res.status(500).json({ message: "Failed to get interview preps" });
  }
});

// Get interview prep for a specific job
router.get("/interview-preps/:jobId", requireAuth, async (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { jobId } = req.params;
    const profile = await UserProfile.findOne({ userId });
    
    if (!profile) {
      return res.status(404).json({ message: "No prep found" });
    }

    const prep = profile.interviewPreps?.find(p => p.jobId === jobId);
    
    if (!prep) {
      return res.status(404).json({ message: "No prep found for this job" });
    }

    res.json(prep);
  } catch (error: any) {
    console.error("Get interview prep error:", error);
    res.status(500).json({ message: "Failed to get interview prep" });
  }
});

// Save interview prep for a job
router.post("/interview-preps", requireAuth, async (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const prepData = req.body;
    
    if (!prepData.jobId || !prepData.jobTitle) {
      return res.status(400).json({ message: "Job ID and title are required" });
    }

    let profile = await UserProfile.findOne({ userId });
    if (!profile) {
      profile = new UserProfile({
        userId,
        skills: [],
        experience: [],
        education: [],
        projects: [],
        savedJobs: [],
        interviewPreps: [],
        suggestedRoles: [],
        strengthAreas: [],
      });
    }

    // Initialize interviewPreps if not exists
    if (!profile.interviewPreps) {
      profile.interviewPreps = [];
    }

    // Check if prep already exists for this job - update it if so
    const existingIndex = profile.interviewPreps.findIndex(p => p.jobId === prepData.jobId);
    
    const newPrep = {
      ...prepData,
      generatedAt: new Date(),
    };

    if (existingIndex >= 0) {
      // Update existing prep
      profile.interviewPreps[existingIndex] = newPrep;
    } else {
      // Add new prep
      profile.interviewPreps.push(newPrep);
    }

    await profile.save();

    res.status(201).json({ 
      message: "Interview prep saved successfully",
      prep: newPrep,
    });
  } catch (error: any) {
    console.error("Save interview prep error:", error);
    res.status(500).json({ message: "Failed to save interview prep" });
  }
});

// Delete interview prep for a job
router.delete("/interview-preps/:jobId", requireAuth, async (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { jobId } = req.params;
    const profile = await UserProfile.findOne({ userId });
    
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    if (profile.interviewPreps) {
      profile.interviewPreps = profile.interviewPreps.filter(p => p.jobId !== jobId);
      await profile.save();
    }

    res.json({ message: "Interview prep deleted successfully" });
  } catch (error: any) {
    console.error("Delete interview prep error:", error);
    res.status(500).json({ message: "Failed to delete interview prep" });
  }
});

export default router;
