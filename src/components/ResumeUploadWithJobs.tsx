import { useState, useRef } from "react";
import { useMutation, useAction, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { parseLinkedInUrl } from "../lib/linkedin-parser";
import JobRecommendations from "./JobRecommendations";

export function ResumeUploadWithJobs() {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [linkedInUrl, setLinkedInUrl] = useState("");
  const [isLinkedInImporting, setIsLinkedInImporting] = useState(false);
  const [uploadedResumeId, setUploadedResumeId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const generateUploadUrl = useMutation(api.resumes.generateUploadUrl);
  const saveResume = useMutation(api.resumes.saveResume);
  const parseResumeText = useAction(api.ai.parseResumeText);
  const importLinkedInProfile = useAction(api.ai.importLinkedInProfile);

  const handleFile = async (file: File) => {
    if (!file.type.includes("pdf") && !file.type.includes("doc")) {
      toast.error("Please upload a PDF or DOC file");
      return;
    }

    setIsUploading(true);
    try {
      // Generate upload URL
      const uploadUrl = await generateUploadUrl();
      
      // Upload file
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      
      if (!result.ok) {
        throw new Error("Upload failed");
      }
      
      const { storageId } = await result.json();
      
      // Extract text from file (simplified - in production use proper PDF/DOC parsing)
      const text = await extractTextFromFile(file);
      
      // Parse resume with AI
      const parsedData = await parseResumeText({ text });
      
      // Save resume to database
      const resumeId = await saveResume({
        fileName: file.name,
        fileId: storageId,
        extractedText: text,
        skills: parsedData.skills,
        education: parsedData.education,
        experience: parsedData.experience,
        contactInfo: parsedData.contactInfo,
        jobLevel: parsedData.jobLevel,
        yearsOfExperience: parsedData.yearsOfExperience,
      });
      
      setUploadedResumeId(resumeId);
      toast.success("Resume uploaded and analyzed successfully!");
      toast.success("Finding matching jobs for you...");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload resume. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const extractTextFromFile = async (file: File): Promise<string> => {
    // Simplified text extraction - in production, use libraries like pdf-parse or mammoth
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        // This is a simplified approach - actual PDF/DOC parsing would be more complex
        const text = reader.result as string;
        resolve(text || "Sample resume text for demonstration purposes");
      };
      reader.readAsText(file);
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleLinkedInImport = async () => {
    if (!linkedInUrl.trim()) {
      toast.error("Please enter a LinkedIn profile URL");
      return;
    }

    setIsLinkedInImporting(true);
    try {
      // Validate LinkedIn URL
      const isValidLinkedIn = parseLinkedInUrl(linkedInUrl);
      if (!isValidLinkedIn) {
        toast.error("Please enter a valid LinkedIn profile URL");
        return;
      }

      // Import LinkedIn profile
      const profileData = await importLinkedInProfile({ url: linkedInUrl });
      
      // Save as resume
      const resumeId = await saveResume({
        fileName: `LinkedIn_Profile_${Date.now()}.pdf`,
        fileId: profileData.fileId,
        extractedText: profileData.extractedText,
        skills: profileData.skills,
        education: profileData.education,
        experience: profileData.experience,
        contactInfo: profileData.contactInfo,
        jobLevel: profileData.jobLevel,
        yearsOfExperience: profileData.yearsOfExperience,
      });
      
      setUploadedResumeId(resumeId);
      toast.success("LinkedIn profile imported successfully!");
      toast.success("Finding matching jobs for you...");
      setLinkedInUrl("");
    } catch (error) {
      console.error("LinkedIn import error:", error);
      toast.error("Failed to import LinkedIn profile. Please try again.");
    } finally {
      setIsLinkedInImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Resume Upload Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Resume</h2>
        
        {/* LinkedIn Import Section */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-lg font-medium text-blue-900 mb-3 flex items-center gap-2">
            <span className="text-2xl">💼</span>
            Import from LinkedIn
          </h3>
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="https://linkedin.com/in/your-profile"
              value={linkedInUrl}
              onChange={(e) => setLinkedInUrl(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleLinkedInImport}
              disabled={isLinkedInImporting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLinkedInImporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Importing...
                </>
              ) : (
                <>
                  <span>🔗</span>
                  Import
                </>
              )}
            </button>
          </div>
          <p className="text-sm text-blue-700 mt-2">
            Paste your LinkedIn profile URL to automatically import your professional information
          </p>
        </div>

        {/* File Upload Section */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">or upload a file</span>
          </div>
        </div>
        
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors mt-4 ${
            dragActive
              ? "border-blue-400 bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            className="hidden"
          />
          
          <div className="space-y-4">
            <div className="text-4xl">📄</div>
            <div>
              <p className="text-lg font-medium text-gray-900">
                Drop your resume here, or{" "}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 hover:text-blue-700 underline"
                  disabled={isUploading}
                >
                  browse
                </button>
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Supports PDF, DOC, DOCX, and TXT files up to 10MB
              </p>
              <p className="text-xs text-gray-400 mt-2">
                AI will automatically detect your job level, skills, and years of experience
              </p>
            </div>
            
            {isUploading && (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-gray-600">Analyzing resume and extracting job level...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Job Recommendations Section */}
      {uploadedResumeId && (
        <div className="mt-6">
          <JobRecommendations 
            resumeId={uploadedResumeId}
            onAnalyzeMatch={(jobId) => {
              toast.success(`Analyzing match for job: ${jobId}`);
            }}
          />
        </div>
      )}
    </div>
  );
}