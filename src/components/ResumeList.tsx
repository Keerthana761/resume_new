import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

interface Resume {
  _id: Id<"resumes">;
  fileName: string;
  skills: string[];
  uploadedAt: number;
  fileUrl: string | null;
  jobLevel?: string;
  yearsOfExperience?: number;
  education: {
    degree?: string;
    institution?: string;
    graduationYear?: number;
  };
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    description: string;
  }>;
}

interface ResumeListProps {
  resumes: Resume[];
  onResumeSelect?: (resumeId: string) => void;
}

export function ResumeList({ resumes, onResumeSelect }: ResumeListProps) {
  const deleteResume = useMutation(api.resumes.deleteResume);
  const updateResumeJobLevel = useMutation(api.resumes.updateResumeJobLevel);
  
  const [editingLevel, setEditingLevel] = useState<string | null>(null);
  const [tempJobLevel, setTempJobLevel] = useState("");
  const [tempYearsExp, setTempYearsExp] = useState<number | undefined>();

  const handleDelete = async (resumeId: Id<"resumes">) => {
    try {
      await deleteResume({ resumeId });
      toast.success("Resume deleted successfully");
    } catch (error) {
      toast.error("Failed to delete resume");
    }
  };

  const handleEditLevel = (resume: Resume) => {
    setEditingLevel(resume._id);
    setTempJobLevel(resume.jobLevel || "entry");
    setTempYearsExp(resume.yearsOfExperience);
  };

  const handleSaveLevel = async (resumeId: Id<"resumes">) => {
    try {
      await updateResumeJobLevel({
        resumeId,
        jobLevel: tempJobLevel,
        yearsOfExperience: tempYearsExp,
      });
      setEditingLevel(null);
      toast.success("Job level updated successfully");
    } catch (error) {
      toast.error("Failed to update job level");
    }
  };

  const handleCancelEdit = () => {
    setEditingLevel(null);
    setTempJobLevel("");
    setTempYearsExp(undefined);
  };

  const getJobLevelColor = (level?: string) => {
    switch (level) {
      case "entry": return "bg-green-100 text-green-800";
      case "mid": return "bg-blue-100 text-blue-800";
      case "senior": return "bg-purple-100 text-purple-800";
      case "executive": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getJobLevelLabel = (level?: string) => {
    switch (level) {
      case "entry": return "Entry Level";
      case "mid": return "Mid Level";
      case "senior": return "Senior Level";
      case "executive": return "Executive Level";
      default: return "Not Set";
    }
  };

  if (resumes.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <div className="text-4xl mb-4">📋</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No resumes uploaded yet</h3>
        <p className="text-gray-500">Upload your first resume to get started with AI-powered analysis</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">My Resumes</h2>
      </div>
      
      <div className="divide-y divide-gray-200">
        {resumes.map((resume) => (
          <div key={resume._id} className="p-6 hover:bg-gray-50">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-lg font-medium text-gray-900">{resume.fileName}</h3>
                  <span className="text-xs text-gray-500">
                    {new Date(resume.uploadedAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Job Level Section */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-700">Career Level</h4>
                    {editingLevel !== resume._id && (
                      <button
                        onClick={() => handleEditLevel(resume)}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  
                  {editingLevel === resume._id ? (
                    <div className="space-y-2">
                      <select
                        value={tempJobLevel}
                        onChange={(e) => setTempJobLevel(e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      >
                        <option value="entry">Entry Level</option>
                        <option value="mid">Mid Level</option>
                        <option value="senior">Senior Level</option>
                        <option value="executive">Executive Level</option>
                      </select>
                      <input
                        type="number"
                        placeholder="Years of experience"
                        value={tempYearsExp || ""}
                        onChange={(e) => setTempYearsExp(e.target.value ? parseInt(e.target.value) : undefined)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        min="0"
                        max="50"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveLevel(resume._id)}
                          className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${getJobLevelColor(resume.jobLevel)}`}>
                        {getJobLevelLabel(resume.jobLevel)}
                      </span>
                      {resume.yearsOfExperience !== undefined && (
                        <span className="text-xs text-gray-600">
                          {resume.yearsOfExperience} years experience
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-1">
                      {resume.skills.slice(0, 5).map((skill, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                      {resume.skills.length > 5 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{resume.skills.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Education</h4>
                    <p className="text-sm text-gray-600">
                      {resume.education.degree || "Not specified"}
                      {resume.education.institution && (
                        <span className="block text-xs text-gray-500">
                          {resume.education.institution}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                
                {resume.experience.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Experience</h4>
                    <div className="space-y-2">
                      {resume.experience.slice(0, 2).map((exp, index) => (
                        <div key={index} className="text-sm">
                          <p className="font-medium text-gray-900">{exp.title}</p>
                          <p className="text-gray-600">{exp.company} • {exp.duration}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2 ml-4">
                {onResumeSelect && (
                  <button
                    onClick={() => onResumeSelect(resume._id)}
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  >
                    Find Jobs
                  </button>
                )}
                {resume.fileUrl && (
                  <a
                    href={resume.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    View
                  </a>
                )}
                <button
                  onClick={() => handleDelete(resume._id)}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
