import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    return await ctx.storage.generateUploadUrl();
  },
});

export const saveResume = mutation({
  args: {
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
    jobLevel: v.optional(v.string()),
    yearsOfExperience: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    return await ctx.db.insert("resumes", {
      userId,
      fileName: args.fileName,
      fileId: args.fileId,
      extractedText: args.extractedText,
      skills: args.skills,
      education: args.education,
      experience: args.experience,
      contactInfo: args.contactInfo,
      jobLevel: args.jobLevel,
      yearsOfExperience: args.yearsOfExperience,
      uploadedAt: Date.now(),
    });
  },
});

export const getUserResumes = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const resumes = await ctx.db
      .query("resumes")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    return Promise.all(
      resumes.map(async (resume) => ({
        ...resume,
        fileUrl: await ctx.storage.getUrl(resume.fileId),
      }))
    );
  },
});

export const getResumeById = query({
  args: { resumeId: v.id("resumes") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const resume = await ctx.db.get(args.resumeId);
    if (!resume || resume.userId !== userId) {
      throw new Error("Resume not found");
    }

    return {
      ...resume,
      fileUrl: await ctx.storage.getUrl(resume.fileId),
    };
  },
});

export const deleteResume = mutation({
  args: { resumeId: v.id("resumes") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const resume = await ctx.db.get(args.resumeId);
    if (!resume || resume.userId !== userId) {
      throw new Error("Resume not found");
    }

    await ctx.storage.delete(resume.fileId);
    await ctx.db.delete(args.resumeId);
  },
});

export const updateResumeJobLevel = mutation({
  args: {
    resumeId: v.id("resumes"),
    jobLevel: v.string(),
    yearsOfExperience: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const resume = await ctx.db.get(args.resumeId);
    if (!resume || resume.userId !== userId) {
      throw new Error("Resume not found");
    }

    await ctx.db.patch(args.resumeId, {
      jobLevel: args.jobLevel,
      yearsOfExperience: args.yearsOfExperience,
    });
  },
});
