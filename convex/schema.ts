import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  resumes: defineTable({
    userId: v.id("users"),
    fileName: v.string(),
    fileId: v.id("_storage"),
    extractedText: v.string(),
    skills: v.array(v.string()),
    education: v.object({
      degree: v.optional(v.string()),
      institution: v.optional(v.string()),
      graduationYear: v.optional(v.number()),
    }),
    experience: v.array(v.object({
      title: v.string(),
      company: v.string(),
      duration: v.string(),
      description: v.string(),
    })),
    contactInfo: v.object({
      email: v.optional(v.string()),
      phone: v.optional(v.string()),
      location: v.optional(v.string()),
    }),
    jobLevel: v.optional(v.string()), // "entry", "mid", "senior", "executive"
    yearsOfExperience: v.optional(v.number()),
    uploadedAt: v.number(),
  }).index("by_user", ["userId"])
    .index("by_job_level", ["jobLevel"]),

  jobPostings: defineTable({
    title: v.string(),
    company: v.string(),
    description: v.string(),
    requiredSkills: v.array(v.string()),
    location: v.string(),
    experienceLevel: v.string(),
    source: v.string(), // "linkedin", "naukri", "manual"
    url: v.optional(v.string()),
    postedAt: v.number(),
  }).index("by_title", ["title"])
    .index("by_company", ["company"])
    .searchIndex("search_jobs", {
      searchField: "description",
      filterFields: ["experienceLevel", "location"],
    }),

  resumeAnalysis: defineTable({
    resumeId: v.id("resumes"),
    jobId: v.id("jobPostings"),
    matchScore: v.number(),
    matchingSkills: v.array(v.string()),
    missingSkills: v.array(v.string()),
    suggestions: v.array(v.string()),
    strengthsWeaknesses: v.object({
      strengths: v.array(v.string()),
      weaknesses: v.array(v.string()),
    }),
    levelMatch: v.optional(v.object({
      resumeLevel: v.string(),
      jobLevel: v.string(),
      isMatch: v.boolean(),
      recommendation: v.string(),
    })),
    analyzedAt: v.number(),
  }).index("by_resume", ["resumeId"])
    .index("by_job", ["jobId"])
    .index("by_score", ["matchScore"]),

  skillSuggestions: defineTable({
    userId: v.id("users"),
    skill: v.string(),
    category: v.string(), // "technical", "soft", "certification"
    priority: v.string(), // "high", "medium", "low"
    reason: v.string(),
    resources: v.array(v.object({
      title: v.string(),
      url: v.string(),
      type: v.string(), // "course", "tutorial", "certification"
    })),
    createdAt: v.number(),
  }).index("by_user", ["userId"])
    .index("by_priority", ["priority"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
