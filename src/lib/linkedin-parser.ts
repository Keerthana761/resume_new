export function parseLinkedInUrl(url: string): boolean {
  // Validate LinkedIn URL format
  const linkedInPattern = /^https?:\/\/(www\.)?linkedin\.com\/in\/([a-zA-Z0-9-]+)\/?$/;
  return linkedInPattern.test(url);
}

export function extractLinkedInUsername(url: string): string | null {
  const match = url.match(/linkedin\.com\/in\/([a-zA-Z0-9-]+)\/?/);
  return match ? match[1] : null;
}

export function generateLinkedInPdfUrl(username: string): string {
  // This would typically use LinkedIn's API or a scraping service
  // For demo purposes, we'll use a mock URL
  return `https://www.linkedin.com/in/${username}/`;
}

export function parseLinkedInProfileData(htmlContent: string): {
  name: string;
  headline: string;
  location: string;
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    description: string;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    graduationYear: string;
  }>;
  skills: string[];
  contactInfo: {
    email?: string;
    phone?: string;
    location?: string;
  };
} {
  // This is a simplified parser - in production, you'd use a proper HTML parser
  const data = {
    name: extractName(htmlContent),
    headline: extractHeadline(htmlContent),
    location: extractLocation(htmlContent),
    experience: extractExperience(htmlContent),
    education: extractEducation(htmlContent),
    skills: extractSkills(htmlContent),
    contactInfo: {
      location: extractLocation(htmlContent),
    },
  };

  return data;
}

function extractName(htmlContent: string): string {
  // Look for name in various possible formats
  const namePatterns = [
    /<title>([^|]+)\s*-\s*LinkedIn<\/title>/i,
    /<h1[^>]*class="[^"]*pv-top-card__name[^"]*"[^>]*>([^<]+)<\/h1>/i,
    /<span[^>]*class="[^"]*text-heading-xlarge[^"]*"[^>]*>([^<]+)<\/span>/i,
  ];

  for (const pattern of namePatterns) {
    const match = htmlContent.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  return "Unknown Name";
}

function extractHeadline(htmlContent: string): string {
  const headlinePatterns = [
    /<h2[^>]*class="[^"]*pv-top-card__summary-title[^"]*"[^>]*>([^<]+)<\/h2>/i,
    /<div[^>]*class="[^"]*text-body-medium[^"]*"[^>]*>([^<]+)<\/div>/i,
  ];

  for (const pattern of headlinePatterns) {
    const match = htmlContent.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  return "";
}

function extractLocation(htmlContent: string): string {
  const locationPatterns = [
    /<span[^>]*class="[^"]*pv-top-card__location[^"]*"[^>]*>([^<]+)<\/span>/i,
    /<span[^>]*class="[^"]*text-body-small[^"]*"[^>]*>([^<]+)<\/span>/i,
  ];

  for (const pattern of locationPatterns) {
    const match = htmlContent.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  return "";
}

function extractExperience(htmlContent: string): Array<{
  title: string;
  company: string;
  duration: string;
  description: string;
}> {
  const experience: Array<{
    title: string;
    company: string;
    duration: string;
    description: string;
  }> = [];

  // Look for experience sections
  const experienceSectionPattern = /<section[^>]*id="experience-section"[^>]*>([\s\S]*?)<\/section>/i;
  const experienceMatch = htmlContent.match(experienceSectionPattern);

  if (experienceMatch) {
    const experienceSection = experienceMatch[1];
    
    // Extract individual experience entries
    const experienceEntryPattern = /<div[^>]*class="[^"]*pv-position-entity[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
    let entryMatch;

    while ((entryMatch = experienceEntryPattern.exec(experienceSection)) !== null) {
      const entryHtml = entryMatch[1];
      
      const titleMatch = entryHtml.match(/<h3[^>]*>([^<]+)<\/h3>/i);
      const companyMatch = entryHtml.match(/<p[^>]*class="[^"]*pv-entity__secondary-title[^"]*"[^>]*>([^<]+)<\/p>/i);
      const durationMatch = entryHtml.match(/<span[^>]*class="[^"]*pv-entity__bullet-item-v2[^"]*"[^>]*>([^<]+)<\/span>/i);
      
      if (titleMatch && companyMatch) {
        experience.push({
          title: titleMatch[1].trim(),
          company: companyMatch[1].trim(),
          duration: durationMatch ? durationMatch[1].trim() : "",
          description: "", // Would need more complex parsing for description
        });
      }
    }
  }

  return experience.slice(0, 5); // Limit to 5 experiences
}

function extractEducation(htmlContent: string): Array<{
  degree: string;
  institution: string;
  graduationYear: string;
}> {
  const education: Array<{
    degree: string;
    institution: string;
    graduationYear: string;
  }> = [];

  // Look for education sections
  const educationSectionPattern = /<section[^>]*id="education-section"[^>]*>([\s\S]*?)<\/section>/i;
  const educationMatch = htmlContent.match(educationSectionPattern);

  if (educationMatch) {
    const educationSection = educationMatch[1];
    
    // Extract individual education entries
    const educationEntryPattern = /<div[^>]*class="[^"]*pv-education-entity[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
    let entryMatch;

    while ((entryMatch = educationEntryPattern.exec(educationSection)) !== null) {
      const entryHtml = entryMatch[1];
      
      const degreeMatch = entryHtml.match(/<h3[^>]*>([^<]+)<\/h3>/i);
      const institutionMatch = entryHtml.match(/<p[^>]*class="[^"]*pv-entity__secondary-title[^"]*"[^>]*>([^<]+)<\/p>/i);
      const yearMatch = entryHtml.match(/<span[^>]*class="[^"]*pv-entity__dates[^"]*"[^>]*>([^<]+)<\/span>/i);
      
      if (degreeMatch && institutionMatch) {
        education.push({
          degree: degreeMatch[1].trim(),
          institution: institutionMatch[1].trim(),
          graduationYear: yearMatch ? yearMatch[1].trim() : "",
        });
      }
    }
  }

  return education;
}

function extractSkills(htmlContent: string): string[] {
  const skills: string[] = [];

  // Look for skills sections
  const skillsSectionPattern = /<section[^>]*id="skills-section"[^>]*>([\s\S]*?)<\/section>/i;
  const skillsMatch = htmlContent.match(skillsSectionPattern);

  if (skillsMatch) {
    const skillsSection = skillsMatch[1];
    
    // Extract individual skills
    const skillPattern = /<span[^>]*class="[^"]*pv-skill-category-entity__name-text[^"]*"[^>]*>([^<]+)<\/span>/gi;
    let skillMatch;

    while ((skillMatch = skillPattern.exec(skillsSection)) !== null) {
      skills.push(skillMatch[1].trim());
    }
  }

  // Common tech skills to look for if no skills section found
  const commonSkills = [
    "JavaScript", "Python", "Java", "React", "Node.js", "SQL", "HTML", "CSS",
    "Machine Learning", "Data Analysis", "Project Management", "Communication",
    "Leadership", "Teamwork", "Problem Solving", "Git", "Docker", "AWS",
    "MongoDB", "PostgreSQL", "Express", "Angular", "Vue", "TypeScript",
    "C++", "C#", "PHP", "Ruby", "Go", "Rust", "Kotlin", "Swift"
  ];

  // Fallback to common skills if no skills found
  if (skills.length === 0) {
    const textLower = htmlContent.toLowerCase();
    return commonSkills.filter(skill => 
      textLower.includes(skill.toLowerCase())
    );
  }

  return skills.slice(0, 15); // Limit to 15 skills
}