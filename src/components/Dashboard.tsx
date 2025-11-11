import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ResumeUploadWithJobs } from "./ResumeUploadWithJobs";
import { ResumeList } from "./ResumeList";
import { JobSearch } from "./JobSearch";
import { AnalysisResults } from "./AnalysisResults";
import JobRecommendations from "./JobRecommendations";

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<"resumes" | "jobs" | "analysis" | "recommendations">("resumes");
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const resumes = useQuery(api.resumes.getUserResumes);

  const tabs = [
    { id: "resumes", label: "My Resumes", icon: "📄" },
    { id: "jobs", label: "Job Search", icon: "🔍" },
    { id: "recommendations", label: "Recommended Jobs", icon: "🎯" },
    { id: "analysis", label: "Analysis", icon: "📊" },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {loggedInUser?.email?.split("@")[0] || "Student"}!
        </h1>
        <p className="text-gray-600">
          Upload your resume, find matching jobs, and get AI-powered optimization suggestions.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px]">
        {activeTab === "resumes" && (
          <div className="space-y-6">
            <ResumeUploadWithJobs />
            <ResumeList 
              resumes={resumes || []} 
              onResumeSelect={(resumeId) => {
                setSelectedResumeId(resumeId);
                setActiveTab("recommendations");
              }}
            />
          </div>
        )}
        
        {activeTab === "jobs" && <JobSearch />}
        
        {activeTab === "recommendations" && (
          <JobRecommendations 
            resumeId={selectedResumeId ?? undefined}
            onBack={() => setActiveTab("resumes")}
          />
        )}
        
        {activeTab === "analysis" && <AnalysisResults />}
      </div>
    </div>
  );
}
