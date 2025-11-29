import { Request, Response, NextFunction } from "express";

// Extend Express Request to include user session
declare module "express-session" {
  interface SessionData {
    userId?: string;
    username?: string;
  }
}

// Middleware to check if user is authenticated
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized. Please log in." });
  }
  next();
}

// Middleware to check if user is NOT authenticated (for login/register pages)
export function requireGuest(req: Request, res: Response, next: NextFunction) {
  if (req.session.userId) {
    return res.status(400).json({ message: "Already logged in." });
  }
  next();
}

// Helper to get current user ID from session
export function getCurrentUserId(req: Request): string | null {
  return req.session.userId || null;
}
