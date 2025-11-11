"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";

// Comprehensive skill database with categories
const SKILL_DATABASE = {
  programming: [
    "javascript", "typescript", "python", "java", "cpp", "csharp", "go", "rust", 
    "kotlin", "swift", "php", "ruby", "scala", "perl", "r", "matlab"
  ],
  web: [
    "react", "vue", "angular", "svelte", "nextjs", "nuxt", "gatsby",
    "html", "css", "sass", "less", "tailwind", "bootstrap", "nodejs", "express", "koa"
  ],
  databases: [
    "mysql", "postgresql", "mongodb", "redis", "cassandra", "dynamodb", 
    "sqlite", "oracle", "elasticsearch", "neo4j", "influxdb"
  ],
  cloud: [
    "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "ansible",
    "jenkins", "github actions", "gitlab ci", "circleci", "travis ci"
  ],
  mobile: [
    "react native", "flutter", "ionic", "cordova", "phonegap", "xamarin"
  ],
  data: [
    "pandas", "numpy", "scikit-learn", "tensorflow", "pytorch", "keras",
    "matplotlib", "seaborn", "plotly", "tableau", "power bi"
  ],
  devops: [
    "git", "svn", "mercurial", "nginx", "apache", "linux", "unix", "bash",
    "powershell", "cmd", "ssh", "ftp", "sftp"
  ],
  soft: [
    "leadership", "communication", "teamwork", "problem solving", "critical thinking",
    "project management", "agile", "scrum", "kanban", "time management"
  ]
};

// Flatten all skills for easier matching
const ALL_SKILLS = Object.values(SKILL_DATABASE).flat();

export const parseResumeText = action({
  args: { text: v.string() },
  handler: async (ctx, args) => {
    const text = args.text.toLowerCase();
    
    // Enhanced skill extraction with fuzzy matching
    const skills = extractSkills(text);
    
    // Extract education with more detail
    const education = extractEducation(text);
    
    // Extract contact info with better parsing
    const contactInfo = extractContactInfo(args.text);
    
    // Extract work experience with more detail
    const experience = extractExperience(args.text);
    
    // Infer job level with better logic
    const jobLevel = inferJobLevel(text, experience);
    
    // Calculate years of experience more accurately
    const yearsOfExperience = calculateYearsOfExperience(experience);

    return {
      skills,
      education,
      contactInfo,
      experience,
      jobLevel,
      yearsOfExperience,
    };
  },
});

export const importLinkedInProfile = action({
  args: {
    url: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate LinkedIn URL
    const linkedInPattern = /^https?:\/\/(www\.)?linkedin\.com\/in\/([a-zA-Z0-9-]+)\/?$/;
    if (!linkedInPattern.test(args.url)) {
      throw new Error("Invalid LinkedIn URL format");
    }

    // In a real implementation, you would:
    // 1. Use LinkedIn API to fetch profile data
    // 2. Or use a web scraping service (with proper authorization)
    // 3. Parse the HTML content and extract relevant information
    
    // For this demo, we'll simulate LinkedIn data extraction
    const mockLinkedInData = {
      name: "John Doe",
      headline: "Software Engineer | React | Node.js | AI Enthusiast",
      location: "San Francisco, CA",
      experience: [
        {
          title: "Software Engineer",
          company: "Tech Corp",
          duration: "2022 - Present",
          description: "Developed web applications using React and Node.js"
        },
        {
          title: "Junior Developer",
          company: "Startup Inc",
          duration: "2020 - 2022",
          description: "Built frontend features and maintained codebase"
        }
      ],
      education: [
        {
          degree: "Bachelor of Technology in Computer Science",
          institution: "University of Technology",
          graduationYear: "2020"
        }
      ],
      skills: ["React", "JavaScript", "Node.js", "Python", "Machine Learning", "SQL", "Git"]
    };

    // Create a PDF file from LinkedIn data (mock implementation)
    const extractedText = generateLinkedInText(mockLinkedInData);
    
    // Generate a mock file ID (in production, this would be a real file)
    const mockFileId = "mock_linkedin_file" as any;

    // Determine job level and years of experience
    const jobLevel = extractJobLevel(extractedText, mockLinkedInData.experience);
    const yearsOfExperience = extractYearsOfExperience(extractedText, mockLinkedInData.experience);

    return {
      fileId: mockFileId,
      extractedText,
      skills: mockLinkedInData.skills,
      education: {
        degree: mockLinkedInData.education[0]?.degree,
        institution: mockLinkedInData.education[0]?.institution,
        graduationYear: mockLinkedInData.education[0]?.graduationYear ? parseInt(mockLinkedInData.education[0].graduationYear) : undefined,
      },
      experience: mockLinkedInData.experience,
      contactInfo: {
        location: mockLinkedInData.location,
      },
      jobLevel,
      yearsOfExperience,
    };
  },
});

function generateLinkedInText(data: any): string {
  return `
${data.name}
${data.headline}
${data.location}

EXPERIENCE:
${data.experience.map((exp: any) => `
${exp.title}
${exp.company} | ${exp.duration}
${exp.description}
`).join('')}

EDUCATION:
${data.education.map((edu: any) => `
${edu.degree}
${edu.institution} | ${edu.graduationYear}
`).join('')}

SKILLS: ${data.skills.join(', ')}
  `.trim();
}

function extractDegree(text: string): string | undefined {
  const degreePatterns = [
    /bachelor.*?(?:computer science|engineering|technology)/i,
    /master.*?(?:computer science|engineering|technology)/i,
    /b\.?tech/i,
    /m\.?tech/i,
    /bca/i,
    /mca/i,
    /phd/i,
  ];
  
  for (const pattern of degreePatterns) {
    const match = text.match(pattern);
    if (match) return match[0];
  }
  
  return undefined;
}

function extractInstitution(text: string): string | undefined {
  const institutionPatterns = [
    /university/i,
    /college/i,
    /institute/i,
    /iit/i,
    /nit/i,
  ];
  
  const lines = text.split('\n');
  for (const line of lines) {
    for (const pattern of institutionPatterns) {
      if (pattern.test(line)) {
        return line.trim();
      }
    }
  }
  
  return undefined;
}

function extractGraduationYear(text: string): number | undefined {
  const yearMatch = text.match(/20\d{2}/g);
  if (yearMatch) {
    const years = yearMatch.map(y => parseInt(y)).filter(y => y >= 2000 && y <= 2030);
    return Math.max(...years);
  }
  return undefined;
}

function extractEmail(text: string): string | undefined {
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return emailMatch ? emailMatch[0] : undefined;
}

function extractPhone(text: string): string | undefined {
  const phoneMatch = text.match(/[\+]?[1-9]?[\d\s\-\(\)]{8,15}/);
  return phoneMatch ? phoneMatch[0].trim() : undefined;
}

function extractLocation(text: string): string | undefined {
  const locationKeywords = ['mumbai', 'delhi', 'bangalore', 'hyderabad', 'chennai', 'pune', 'kolkata'];
  for (const location of locationKeywords) {
    if (text.includes(location)) {
      return location.charAt(0).toUpperCase() + location.slice(1);
    }
  }
  return undefined;
}

function extractSkills(text: string): string[] {
  const foundSkills: string[] = [];
  const textLower = text.toLowerCase();
  
  // Check each skill in our database
  ALL_SKILLS.forEach(skill => {
    // Use word boundaries to avoid partial matches
    const regex = new RegExp(`\\b${skill}\\b`, 'gi');
    if (regex.test(textLower)) {
      foundSkills.push(skill);
    }
  });
  
  return [...new Set(foundSkills)]; // Remove duplicates
}

function extractEducation(text: string): { degree?: string; institution?: string; graduationYear?: number } {
  const education: { degree?: string; institution?: string; graduationYear?: number } = {};
  
  // Extract degree
  education.degree = extractDegree(text);
  
  // Extract institution
  education.institution = extractInstitution(text);
  
  // Extract graduation year
  education.graduationYear = extractGraduationYear(text);
  
  return education;
}

function extractContactInfo(text: string): { email?: string; phone?: string; location?: string } {
  return {
    email: extractEmail(text),
    phone: extractPhone(text),
    location: extractLocation(text),
  };
}

function extractExperience(text: string): Array<{title: string, company: string, duration: string, description: string}> {
  // Simplified experience extraction
  const experience = [];
  const lines = text.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (line.includes('intern') || line.includes('developer') || line.includes('engineer')) {
      experience.push({
        title: lines[i].trim(),
        company: lines[i + 1] ? lines[i + 1].trim() : 'Unknown Company',
        duration: '2023-2024', // Placeholder
        description: lines[i + 2] ? lines[i + 2].trim() : 'No description available',
      });
    }
  }
  
  return experience.slice(0, 3); // Limit to 3 experiences
}

function inferJobLevel(text: string, experience: Array<{title: string, company: string, duration: string, description: string}>): string {
  const textLower = text.toLowerCase();
  
  // Check for explicit level mentions
  if (textLower.includes('senior') || textLower.includes('lead') || textLower.includes('principal') || textLower.includes('staff')) {
    return 'senior';
  }
  if (textLower.includes('junior') || textLower.includes('entry') || textLower.includes('fresher') || textLower.includes('intern')) {
    return 'entry';
  }
  if (textLower.includes('mid') || textLower.includes('intermediate') || textLower.includes('associate')) {
    return 'mid';
  }
  if (textLower.includes('executive') || textLower.includes('director') || textLower.includes('manager') || textLower.includes('head')) {
    return 'executive';
  }

  // Infer from experience count and titles
  if (experience.length === 0) {
    return 'entry';
  } else if (experience.length <= 2) {
    // Check if any experience mentions senior roles
    const hasSeniorExperience = experience.some(exp => 
      exp.title.toLowerCase().includes('senior') || 
      exp.title.toLowerCase().includes('lead')
    );
    return hasSeniorExperience ? 'senior' : 'mid';
  } else {
    return 'senior';
  }
}

function calculateYearsOfExperience(experience: Array<{title: string, company: string, duration: string, description: string}>): number {
  if (experience.length === 0) {
    return 0;
  }
  
  let totalYears = 0;
  
  experience.forEach(exp => {
    // Try to extract years from duration
    const duration = exp.duration.toLowerCase();
    const yearMatch = duration.match(/(\d+(?:\.\d+)?)\s*(?:years?|yrs?)/i);
    
    if (yearMatch) {
      totalYears += parseFloat(yearMatch[1]);
    } else {
      // Estimate based on common patterns
      if (duration.includes('present') || duration.includes('current')) {
        // Assume 1 year for current role
        totalYears += 1;
      } else if (duration.includes('202') || duration.includes('201')) {
        // Try to calculate from year range
        const years = duration.match(/20\d{2}/g);
        if (years && years.length >= 2) {
          const startYear = parseInt(years[0]);
          const endYear = parseInt(years[1]);
          totalYears += Math.max(1, endYear - startYear);
        } else {
          // Default estimate
          totalYears += 1.5;
        }
      } else {
        // Default estimate
        totalYears += 1.5;
      }
    }
  });
  
  return Math.round(totalYears * 10) / 10; // Round to 1 decimal place
}

function extractJobLevel(text: string, experience: any[]): string {
  // Check for explicit level mentions
  if (text.includes('senior') || text.includes('lead') || text.includes('principal')) {
    return 'senior';
  }
  if (text.includes('junior') || text.includes('entry') || text.includes('fresher')) {
    return 'entry';
  }
  if (text.includes('mid') || text.includes('intermediate')) {
    return 'mid';
  }
  if (text.includes('executive') || text.includes('director') || text.includes('manager')) {
    return 'executive';
  }

  // Infer from experience
  if (experience.length === 0) {
    return 'entry';
  } else if (experience.length <= 2) {
    return 'mid';
  } else {
    return 'senior';
  }
}

function extractYearsOfExperience(text: string, experience: any[]): number {
  // Look for explicit years mentioned
  const yearMatches = text.match(/(\d+)\s*(?:years?|yrs?)\s*(?:of\s*)?(?:experience|exp)/gi);
  if (yearMatches) {
    const years = yearMatches.map(match => {
      const num = match.match(/\d+/);
      return num ? parseInt(num[0]) : 0;
    });
    return Math.max(...years);
  }

  // Estimate from experience entries
  return experience.length * 1.5; // Rough estimate
}
