import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";

// Lightweight types for stronger TS signals in helpers
type ResumeDoc = {
  skills: string[];
  experience: Array<{ title?: string; description?: string }>;
  contactInfo?: { location?: string };
  jobLevel?: string;
  yearsOfExperience?: number;
  userId?: string;
};

type JobPosting = {
  title: string;
  company: string;
  description: string;
  requiredSkills: string[];
  location: string;
  experienceLevel: string;
  source: string;
  url?: string;
  postedAt: number;
};

export const addJobPosting = mutation({
  args: {
    title: v.string(),
    company: v.string(),
    description: v.string(),
    requiredSkills: v.array(v.string()),
    location: v.string(),
    experienceLevel: v.string(),
    source: v.string(),
    url: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("jobPostings", {
      ...args,
      postedAt: Date.now(),
    });
  },
});

export const searchJobs = query({
  args: {
    searchTerm: v.optional(v.string()),
    location: v.optional(v.string()),
    experienceLevel: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;

    if (args.searchTerm) {
      return await ctx.db
        .query("jobPostings")
        .withSearchIndex("search_jobs", (q) => {
          let query = q.search("description", args.searchTerm!);
          if (args.location) {
            query = query.eq("location", args.location);
          }
          if (args.experienceLevel) {
            query = query.eq("experienceLevel", args.experienceLevel);
          }
          return query;
        })
        .take(limit);
    }

    let query = ctx.db.query("jobPostings");
    
    return await query.order("desc").take(limit);
  },
});

export const getJobById = query({
  args: { jobId: v.id("jobPostings") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.jobId);
  },
});

export const getRecentJobs = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    return await ctx.db
      .query("jobPostings")
      .order("desc")
      .take(limit);
  },
});

export const seedSampleJobs = mutation({
  args: {},
  handler: async (ctx) => {
    const sampleJobs = [
      {
        title: "Frontend Developer",
        company: "TechCorp",
        description: "We are looking for a skilled Frontend Developer to join our team.",
        requiredSkills: ["React", "JavaScript", "HTML", "CSS", "TypeScript", "Git"],
        location: "Mumbai",
        experienceLevel: "entry",
        source: "sample",
        postedAt: Date.now(),
      },
    ];

    for (const job of sampleJobs) {
      await ctx.db.insert("jobPostings", job);
    }

    return sampleJobs.length;
  },
});

// AI-powered job matching based on resume content
export const findJobsForResume = query({
  args: {
    resumeId: v.id("resumes"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<(JobPosting & { compatibilityScore: number; matchReasons: string[] })[]> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const resume = await ctx.db.get(args.resumeId) as ResumeDoc | null;
    if (!resume || resume.userId !== userId) {
      throw new Error("Resume not found");
    }

    const limit = args.limit || 20;

    // Get all available jobs
    const allJobs = await ctx.db.query("jobPostings").order("desc").collect() as JobPosting[];

    // Score each job based on resume compatibility
    const scoredJobs = allJobs.map((job: JobPosting) => {
      const score = calculateResumeJobCompatibility(resume, job);
      return {
        ...job,
        compatibilityScore: score,
        matchReasons: generateMatchReasons(resume, job, score),
      };
    });

    // Sort by compatibility score and return top matches
    return scoredJobs
      .sort((a: any, b: any) => b.compatibilityScore - a.compatibilityScore)
      .slice(0, limit);
  },
});

// Helper function to calculate compatibility score between resume and job
function calculateResumeJobCompatibility(resume: ResumeDoc, job: JobPosting): number {
  let score = 0;
  let maxScore = 100;

  // Skill matching (40% weight)
  const resumeSkills = (resume.skills || []).map((s: string) => s.toLowerCase());
  const jobSkills = (job.requiredSkills || []).map((s: string) => s.toLowerCase());
  
  const matchingSkills = jobSkills.filter((skill: string) =>
    resumeSkills.some((resumeSkill: string) =>
      resumeSkill === skill ||
      resumeSkill.includes(skill) ||
      skill.includes(resumeSkill)
    )
  );
  
  const skillScore = (matchingSkills.length / Math.max(jobSkills.length, 1)) * 40;
  score += skillScore;

  // Experience level matching (25% weight)
  const experienceScore = calculateExperienceMatch(resume.jobLevel || "entry", job.experienceLevel, resume.yearsOfExperience || 0);
  score += experienceScore;

  // Location matching (20% weight)
  const locationScore = calculateLocationMatch(resume.contactInfo?.location || "", job.location);
  score += locationScore;

  // Industry/domain matching (15% weight)
  const domainScore = calculateDomainMatch(resume, job);
  score += domainScore;

  return Math.round(score);
}

function calculateExperienceMatch(resumeLevel: string, jobLevel: string, yearsOfExperience: number): number {
  const levelHierarchy = { entry: 1, mid: 2, senior: 3, executive: 4 };
  
  const resumeLevelNum = levelHierarchy[resumeLevel as keyof typeof levelHierarchy] || 1;
  const jobLevelNum = levelHierarchy[jobLevel as keyof typeof levelHierarchy] || 1;
  
  // Perfect match
  if (resumeLevelNum === jobLevelNum) return 25;
  
  // One level difference (acceptable)
  if (Math.abs(resumeLevelNum - jobLevelNum) === 1) return 20;
  
  // Two levels difference (challenging but possible)
  if (Math.abs(resumeLevelNum - jobLevelNum) === 2) return 10;
  
  // Too large gap
  return 5;
}

function calculateLocationMatch(resumeLocation: string, jobLocation: string): number {
  if (!resumeLocation || !jobLocation) return 10;
  
  const resumeLoc = resumeLocation.toLowerCase();
  const jobLoc = jobLocation.toLowerCase();
  
  // Remote work
  if (jobLoc.includes("remote") || jobLoc.includes("work from home")) return 20;
  
  // Exact match
  if (resumeLoc === jobLoc || resumeLoc.includes(jobLoc) || jobLoc.includes(resumeLoc)) return 20;
  
  // Same major city/region
  const majorCities = ["mumbai", "delhi", "bangalore", "hyderabad", "chennai", "pune", "kolkata"];
  const resumeInMajor = majorCities.some(city => resumeLoc.includes(city));
  const jobInMajor = majorCities.some(city => jobLoc.includes(city));
  
  if (resumeInMajor && jobInMajor) return 15;
  
  // Different locations
  return 5;
}

function calculateDomainMatch(resume: ResumeDoc, job: JobPosting): number {
  let score = 0;
  
  // Check job title keywords against resume skills and experience
  const titleKeywords = job.title.toLowerCase().split(/[\s,-]+/);
  const resumeText = [
    ...(resume.skills || []),
    ...(resume.experience || []).map((exp) => exp.title || ""),
    ...(resume.experience || []).map((exp) => exp.description || ""),
  ].join(" ").toLowerCase();
  
  const matchingKeywords = titleKeywords.filter((keyword: string) =>
    keyword.length > 2 && resumeText.includes(keyword)
  );
  
  score += (matchingKeywords.length / Math.max(titleKeywords.length, 1)) * 10;
  
  // Check for technology stack alignment
  const techKeywords = ["frontend", "backend", "fullstack", "mobile", "devops", "data", "ai", "machine learning"];
  const jobTech = techKeywords.find(keyword => job.title.toLowerCase().includes(keyword));
  const resumeTech = techKeywords.find(keyword => resumeText.includes(keyword));
  
  if (jobTech && resumeTech && jobTech === resumeTech) {
    score += 5;
  }
  
  return Math.min(score, 15);
}

function generateMatchReasons(resume: ResumeDoc, job: JobPosting, score: number): string[] {
  const reasons = [];
  
  if (score >= 80) {
    reasons.push("🎯 Excellent match - your skills align perfectly with this role");
  } else if (score >= 60) {
    reasons.push("✅ Strong match - good alignment with job requirements");
  } else if (score >= 40) {
    reasons.push("🔍 Moderate match - some relevant skills and experience");
  } else {
    reasons.push("📈 Learning opportunity - room to grow into this role");
  }
  
  // Skill-based reasons
  const resumeSkills = (resume.skills || []).map((s: string) => s.toLowerCase());
  const jobSkills = (job.requiredSkills || []).map((s: string) => s.toLowerCase());
  
  const matchingSkills = jobSkills.filter((skill: string) =>
    resumeSkills.some((resumeSkill: string) =>
      resumeSkill === skill ||
      resumeSkill.includes(skill) ||
      skill.includes(resumeSkill)
    )
  );
  
  if (matchingSkills.length > 0) {
    reasons.push(`💡 You have ${matchingSkills.length} matching skills: ${matchingSkills.slice(0, 3).join(", ")}`);
  }
  
  // Experience level reason
  if ((resume.jobLevel || "") === job.experienceLevel) {
    reasons.push("🎯 Perfect experience level match");
  }
  
  // Location reason
  if (job.location.toLowerCase().includes("remote")) {
    reasons.push("🌍 Remote-friendly position");
  }
  
  return reasons;
}

// Get all jobs query (needed for the matching algorithm)
export const getAllJobs = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("jobPostings").order("desc").collect();
  },
});
