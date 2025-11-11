import { v } from "convex/values";
import { action, mutation, query, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api, internal } from "./_generated/api";

export const analyzeResumeForJob = action({
  args: {
    resumeId: v.id("resumes"),
    jobId: v.id("jobPostings"),
  },
  handler: async (ctx, args): Promise<any> => {
    const resume = await ctx.runQuery(api.resumes.getResumeById, {
      resumeId: args.resumeId,
    });
    const job = await ctx.runQuery(api.jobs.getJobById, {
      jobId: args.jobId,
    });

    if (!resume || !job) {
      throw new Error("Resume or job not found");
    }

    // Enhanced skill matching with weighted scoring
    const skillAnalysis = analyzeSkills(resume.skills, job.requiredSkills);
    
    // Analyze job level compatibility
    const levelMatch = analyzeLevelMatch(resume.jobLevel, job.experienceLevel, resume.yearsOfExperience);
    
    // Analyze location compatibility
    const locationMatch = analyzeLocationMatch(resume.contactInfo?.location, job.location);
    
    // Calculate overall match score with weighted components
    const matchScore = calculateOverallMatchScore(skillAnalysis, levelMatch, locationMatch, resume, job);

    // Generate AI-powered suggestions
    const suggestions = await generateEnhancedSuggestions(resume, job, skillAnalysis, levelMatch, locationMatch);
    const strengthsWeaknesses = await analyzeEnhancedStrengthsWeaknesses(resume, job, skillAnalysis);

    return await ctx.runMutation(internal.analysis.saveAnalysisInternal, {
      resumeId: args.resumeId,
      jobId: args.jobId,
      matchScore,
      matchingSkills: skillAnalysis.matchingSkills,
      missingSkills: skillAnalysis.missingSkills,
      suggestions,
      strengthsWeaknesses,
      levelMatch,
    });
  },
});

// Enhanced skill analysis with weighted scoring
function analyzeSkills(resumeSkills: string[], jobSkills: string[]): any {
  const resumeSkillsLower = resumeSkills.map(s => s.toLowerCase());
  const jobSkillsLower = jobSkills.map(s => s.toLowerCase());
  
  // Categorize skills by importance (based on job description frequency)
  const skillCategories = {
    essential: jobSkillsLower.filter(skill => 
      resumeSkillsLower.some(resumeSkill => 
        resumeSkill === skill || resumeSkill.includes(skill) || skill.includes(resumeSkill)
      )
    ),
    niceToHave: jobSkillsLower.filter(skill => 
      resumeSkillsLower.some(resumeSkill => 
        resumeSkill.includes(skill.replace(/s$/, '')) || // Handle plural forms
        skill.includes(resumeSkill.replace(/s$/, ''))
      )
    ),
    missing: jobSkillsLower.filter(skill => 
      !resumeSkillsLower.some(resumeSkill => 
        resumeSkill === skill || 
        resumeSkill.includes(skill) || 
        skill.includes(resumeSkill) ||
        resumeSkill.includes(skill.replace(/s$/, '')) ||
        skill.includes(resumeSkill.replace(/s$/, ''))
      )
    )
  };
  
  // Calculate weighted skill score
  const essentialScore = (skillCategories.essential.length / Math.max(jobSkills.length, 1)) * 0.7;
  const niceToHaveScore = (skillCategories.niceToHave.length / Math.max(jobSkills.length, 1)) * 0.3;
  const skillScore = (essentialScore + niceToHaveScore) * 100;
  
  return {
    matchingSkills: skillCategories.essential,
    niceToHaveSkills: skillCategories.niceToHave,
    missingSkills: skillCategories.missing,
    skillScore: Math.round(skillScore),
    essentialSkillsMatch: skillCategories.essential.length,
    totalRequiredSkills: jobSkills.length
  };
}

// Enhanced level matching with experience validation
function analyzeLevelMatch(resumeLevel: string | undefined, jobLevel: string, yearsOfExperience: number | undefined): any {
  const levelHierarchy = { entry: 1, mid: 2, senior: 3, executive: 4 };
  
  const resumeLevelNum = levelHierarchy[resumeLevel as keyof typeof levelHierarchy] || 1;
  const jobLevelNum = levelHierarchy[jobLevel as keyof typeof levelHierarchy] || 1;
  
  // Validate against years of experience
  const experienceBasedLevel = yearsOfExperience ? 
    (yearsOfExperience >= 7 ? 3 : yearsOfExperience >= 3 ? 2 : 1) : 1;
  
  const isMatch = Math.abs(resumeLevelNum - jobLevelNum) <= 1 && Math.abs(experienceBasedLevel - jobLevelNum) <= 1;
  
  let recommendation = "";
  let riskLevel = "low";
  
  if (resumeLevelNum < jobLevelNum && experienceBasedLevel < jobLevelNum) {
    recommendation = "This position requires more experience than you currently have. Consider gaining additional experience or skills.";
    riskLevel = "high";
  } else if (resumeLevelNum > jobLevelNum && experienceBasedLevel > jobLevelNum) {
    recommendation = "You may be overqualified for this position. Consider if this role aligns with your career goals.";
    riskLevel = "medium";
  } else if (isMatch) {
    recommendation = "Your experience level aligns well with this position requirements.";
    riskLevel = "low";
  } else {
    recommendation = "Your profile shows potential for this role with some additional preparation.";
    riskLevel = "medium";
  }

  return {
    resumeLevel: resumeLevel || "entry",
    jobLevel,
    isMatch,
    recommendation,
    riskLevel,
    experienceGap: Math.abs(experienceBasedLevel - jobLevelNum)
  };
}

// Location matching analysis
function analyzeLocationMatch(resumeLocation: string | undefined, jobLocation: string): any {
  if (!resumeLocation || !jobLocation) {
    return { isMatch: true, type: "unknown", recommendation: "Location information incomplete" };
  }
  
  const resumeLoc = resumeLocation.toLowerCase();
  const jobLoc = jobLocation.toLowerCase();
  
  // Check for remote work possibility
  if (jobLoc.includes("remote") || jobLoc.includes("work from home")) {
    return { isMatch: true, type: "remote", recommendation: "Remote position - location flexible" };
  }
  
  // Check for exact match
  if (resumeLoc === jobLoc || resumeLoc.includes(jobLoc) || jobLoc.includes(resumeLoc)) {
    return { isMatch: true, type: "exact", recommendation: "Perfect location match" };
  }
  
  // Check for same country/region (simplified)
  const majorCities = ["mumbai", "delhi", "bangalore", "hyderabad", "chennai", "pune", "kolkata"];
  const resumeInMajor = majorCities.some(city => resumeLoc.includes(city));
  const jobInMajor = majorCities.some(city => jobLoc.includes(city));
  
  if (resumeInMajor && jobInMajor) {
    return { isMatch: true, type: "regional", recommendation: "Same region - manageable commute or relocation" };
  }
  
  return { isMatch: false, type: "different", recommendation: "Different location - consider relocation or remote work options" };
}

// Enhanced overall match score calculation
function calculateOverallMatchScore(skillAnalysis: any, levelMatch: any, locationMatch: any, resume: any, job: any): number {
  // Weighted scoring system
  const weights = {
    skills: 0.5,
    level: 0.25,
    location: 0.15,
    experience: 0.1
  };
  
  let score = 0;
  
  // Skills score (50% weight)
  score += (skillAnalysis.skillScore * weights.skills);
  
  // Level score (25% weight)
  const levelScore = levelMatch.isMatch ? 100 : (100 - (levelMatch.experienceGap * 25));
  score += (Math.max(0, levelScore) * weights.level);
  
  // Location score (15% weight)
  const locationScore = locationMatch.isMatch ? 100 : 50;
  score += (locationScore * weights.location);
  
  // Experience bonus (10% weight)
  if (resume.yearsOfExperience && resume.yearsOfExperience > 0) {
    const experienceBonus = Math.min(resume.yearsOfExperience * 5, 100);
    score += (experienceBonus * weights.experience);
  }
  
  return Math.round(Math.min(score, 100));
}

export const saveAnalysisInternal = internalMutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("resumeAnalysis", {
      ...args,
      analyzedAt: Date.now(),
    });
  },
});

export const getAnalysisForResume = query({
  args: { resumeId: v.id("resumes") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const analyses = await ctx.db
      .query("resumeAnalysis")
      .withIndex("by_resume", (q) => q.eq("resumeId", args.resumeId))
      .order("desc")
      .collect();

    return Promise.all(
      analyses.map(async (analysis) => {
        const job = await ctx.db.get(analysis.jobId);
        return {
          ...analysis,
          job,
        };
      })
    );
  },
});

async function generateEnhancedSuggestions(resume: any, job: any, skillAnalysis: any, levelMatch: any, locationMatch: any): Promise<string[]> {
  const suggestions = [];

  // Priority-based suggestions
  if (skillAnalysis.missingSkills.length > 0) {
    const prioritySkills = skillAnalysis.missingSkills.slice(0, 3);
    suggestions.push(`🎯 **Priority**: Learn these high-demand skills: ${prioritySkills.join(", ")}`);
    
    // Suggest learning resources
    skillAnalysis.missingSkills.forEach((skill: string) => {
      if (["javascript", "python", "react", "nodejs"].includes(skill)) {
        suggestions.push(`📚 Consider online courses on ${skill} - platforms like Coursera, Udemy, or freeCodeCamp`);
      }
    });
  }

  // Level-based suggestions with specific actions
  if (!levelMatch.isMatch) {
    suggestions.push(`⚠️ ${levelMatch.recommendation}`);
    
    if (levelMatch.riskLevel === "high") {
      suggestions.push("💡 Consider applying for entry-level positions first to build experience");
      suggestions.push("🎓 Look for certification programs or bootcamps to bridge the skill gap");
    } else if (levelMatch.riskLevel === "medium") {
      suggestions.push("📈 Highlight transferable skills and relevant projects in your application");
    }
  }

  // Location-based suggestions
  if (!locationMatch.isMatch && locationMatch.type === "different") {
    suggestions.push(`🌍 ${locationMatch.recommendation}`);
    suggestions.push("💼 Consider mentioning your willingness to relocate in your cover letter");
  }

  // Experience optimization suggestions
  if (resume.experience.length === 0) {
    suggestions.push("🏗️ Build your experience through:");
    suggestions.push("   • Personal projects (GitHub portfolio)");
    suggestions.push("   • Freelance work on platforms like Upwork");
    suggestions.push("   • Open source contributions");
    suggestions.push("   • Internships or volunteer work");
  } else {
    // Experience enhancement suggestions
    suggestions.push("✨ Optimize your experience section:");
    suggestions.push("   • Use action verbs: Developed, Implemented, Led, Improved");
    suggestions.push("   • Quantify achievements: 'Increased efficiency by 30%'");
    suggestions.push("   • Focus on results and impact, not just responsibilities");
  }

  // Skill highlighting suggestions
  if (skillAnalysis.matchingSkills.length > 0) {
    const topSkill = skillAnalysis.matchingSkills[0];
    suggestions.push(`🌟 Highlight your ${topSkill} expertise by:"`);
    suggestions.push(`   • Adding specific projects using ${topSkill}`);
    suggestions.push(`   • Mentioning certifications or courses in ${topSkill}`);
    suggestions.push(`   • Including metrics: 'Built 5 projects using ${topSkill}'`);
  }

  // Resume structure suggestions
  suggestions.push("📄 Resume Structure Tips:");
  suggestions.push("   • Add a compelling summary statement tailored to this role");
  suggestions.push("   • Place most relevant skills at the top of your skills section");
  suggestions.push("   • Include keywords from the job description");
  suggestions.push("   • Keep it concise: 1-2 pages for most roles");

  // Industry-specific suggestions
  if (job.requiredSkills.some((skill: string) => ["react", "angular", "vue"].includes(skill.toLowerCase()))) {
    suggestions.push("🚀 Frontend Development Tips:");
    suggestions.push("   • Showcase responsive design projects");
    suggestions.push("   • Include links to live demos or GitHub");
    suggestions.push("   • Mention performance optimization experience");
  }

  if (job.requiredSkills.some((skill: string) => ["python", "java", "nodejs"].includes(skill.toLowerCase()))) {
    suggestions.push("🔧 Backend Development Tips:");
    suggestions.push("   • Highlight API development experience");
    suggestions.push("   • Mention database design and optimization");
    suggestions.push("   • Include system architecture knowledge");
  }

  return suggestions;
}

async function analyzeEnhancedStrengthsWeaknesses(resume: any, job: any, skillAnalysis: any): Promise<{ strengths: string[], weaknesses: string[] }> {
  const strengths = [];
  const weaknesses = [];

  // Skill-based analysis
  if (skillAnalysis.essentialSkillsMatch >= skillAnalysis.totalRequiredSkills * 0.7) {
    strengths.push("🎯 Excellent skill match - you meet most essential requirements");
  } else if (skillAnalysis.essentialSkillsMatch >= skillAnalysis.totalRequiredSkills * 0.5) {
    strengths.push("✅ Good skill foundation with room for growth");
  } else {
    weaknesses.push("📚 Skill gap identified - focus on learning key technologies");
  }

  if (skillAnalysis.matchingSkills.length >= 8) {
    strengths.push("🌟 Diverse technical skill set");
  } else if (skillAnalysis.matchingSkills.length >= 5) {
    strengths.push("🔧 Solid technical foundation");
  } else {
    weaknesses.push("⚙️ Limited technical skills listed");
  }

  // Experience analysis
  if (resume.experience.length > 0) {
    const hasRecentExperience = resume.experience.some((exp: any) => {
      if (exp.duration) {
        const yearMatch = exp.duration.match(/20\d{2}/);
        if (yearMatch) {
          const year = parseInt(yearMatch[0]);
          return year >= new Date().getFullYear() - 2;
        }
      }
      return false;
    });

    if (hasRecentExperience) {
      strengths.push("💼 Recent and relevant work experience");
    } else {
      strengths.push("💼 Relevant work experience");
    }
  } else {
    weaknesses.push("🏗️ Limited professional experience - consider internships or projects");
  }

  // Education analysis
  if (resume.education?.degree && resume.education.degree !== "Unknown") {
    strengths.push("🎓 Strong educational background");
    
    if (resume.education.gpa && resume.education.gpa >= 3.5) {
      strengths.push("📊 Excellent academic performance");
    }
  } else {
    weaknesses.push("🎓 Educational details could be more specific");
  }

  // Contact and presentation analysis
  if (resume.contactInfo?.email && resume.contactInfo?.phone) {
    strengths.push("📞 Complete contact information");
  } else {
    weaknesses.push("📋 Missing contact details - add email and phone number");
  }

  if (resume.contactInfo?.linkedin || resume.contactInfo?.github || resume.contactInfo?.website) {
    strengths.push("🌐 Professional online presence");
  } else {
    weaknesses.push("🌐 Consider adding LinkedIn or GitHub profile");
  }

  // Job level and career progression
  if (resume.jobLevel) {
    strengths.push(`🎯 Clear career positioning: ${resume.jobLevel} level`);
  } else {
    weaknesses.push("🎯 Career level not clearly defined - add summary statement");
  }

  if (resume.yearsOfExperience && resume.yearsOfExperience > 0) {
    if (resume.yearsOfExperience >= 5) {
      strengths.push(`🏆 ${resume.yearsOfExperience} years of valuable experience`);
    } else {
      strengths.push(`📈 ${resume.yearsOfExperience} years of experience`);
    }
  }

  // Industry-specific strengths
  const jobSkills = job.requiredSkills.map((s: string) => s.toLowerCase());
  const resumeSkills = resume.skills.map((s: string) => s.toLowerCase());

  if (jobSkills.some((skill: string) => ["react", "angular", "vue"].includes(skill))) {
    if (resumeSkills.some((skill: string) => ["responsive", "mobile", "ui", "ux"].includes(skill))) {
      strengths.push("🎨 Frontend development with design awareness");
    }
  }

  if (jobSkills.some((skill: string) => ["python", "java", "nodejs"].includes(skill))) {
    if (resumeSkills.some((skill: string) => ["api", "database", "server"].includes(skill))) {
      strengths.push("🔧 Backend development capabilities");
    }
  }

  if (jobSkills.some((skill: string) => ["aws", "azure", "docker"].includes(skill))) {
    if (resumeSkills.some((skill: string) => ["deployment", "ci/cd", "devops"].includes(skill))) {
      strengths.push("☁️ Cloud and deployment experience");
    }
  }

  // Achievement-focused analysis
  const hasQuantifiedAchievements = resume.experience.some((exp: any) => {
    if (exp.description || exp.achievements) {
      const text = JSON.stringify(exp);
      return /\d+/.test(text) && /(increased|improved|reduced|saved|grew|boosted)/i.test(text);
    }
    return false;
  });

  if (hasQuantifiedAchievements) {
    strengths.push("📊 Results-oriented with quantified achievements");
  } else {
    weaknesses.push("📈 Add quantified achievements to demonstrate impact");
  }

  return { strengths, weaknesses };
}
