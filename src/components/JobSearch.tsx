import { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function JobSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [location, setLocation] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  
  const jobs = useQuery(api.jobs.searchJobs, {
    searchTerm: searchTerm || undefined,
    location: location || undefined,
    experienceLevel: experienceLevel || undefined,
    limit: 20,
  });
  
  const recentJobs = useQuery(api.jobs.getRecentJobs, { limit: 10 });
  const addJobPosting = useMutation(api.jobs.addJobPosting);
  const analyzeResumeForJob = useAction(api.analysis.analyzeResumeForJob);
  const resumes = useQuery(api.resumes.getUserResumes);

  const [showAddJob, setShowAddJob] = useState(false);
  const [newJob, setNewJob] = useState({
    title: "",
    company: "",
    description: "",
    requiredSkills: "",
    location: "",
    experienceLevel: "entry",
    url: "",
  });

  const handleAddJob = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addJobPosting({
        ...newJob,
        requiredSkills: newJob.requiredSkills.split(",").map(s => s.trim()),
        source: "manual",
      });
      toast.success("Job posting added successfully!");
      setShowAddJob(false);
      setNewJob({
        title: "",
        company: "",
        description: "",
        requiredSkills: "",
        location: "",
        experienceLevel: "entry",
        url: "",
      });
    } catch (error) {
      toast.error("Failed to add job posting");
    }
  };

  const handleAnalyze = async (jobId: string) => {
    if (!resumes || resumes.length === 0) {
      toast.error("Please upload a resume first");
      return;
    }

    try {
      await analyzeResumeForJob({
        resumeId: resumes[0]._id,
        jobId: jobId as any,
      });
      toast.success("Analysis completed! Check the Analysis tab for results.");
    } catch (error) {
      toast.error("Failed to analyze resume for this job");
    }
  };

  const displayJobs = jobs || recentJobs || [];

  return (
    <div className="space-y-6">
      {/* Search Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Search</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <input
            type="text"
            placeholder="Search jobs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          <input
            type="text"
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          <select
            value={experienceLevel}
            onChange={(e) => setExperienceLevel(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Levels</option>
            <option value="entry">Entry Level</option>
            <option value="mid">Mid Level</option>
            <option value="senior">Senior Level</option>
          </select>
          
          <button
            onClick={() => setShowAddJob(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Add Job
          </button>
        </div>
      </div>

      {/* Add Job Modal */}
      {showAddJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Add Job Posting</h3>
            <form onSubmit={handleAddJob} className="space-y-4">
              <input
                type="text"
                placeholder="Job Title"
                value={newJob.title}
                onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="text"
                placeholder="Company"
                value={newJob.company}
                onChange={(e) => setNewJob({ ...newJob, company: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <textarea
                placeholder="Job Description"
                value={newJob.description}
                onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
                required
              />
              <input
                type="text"
                placeholder="Required Skills (comma-separated)"
                value={newJob.requiredSkills}
                onChange={(e) => setNewJob({ ...newJob, requiredSkills: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="text"
                placeholder="Location"
                value={newJob.location}
                onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <select
                value={newJob.experienceLevel}
                onChange={(e) => setNewJob({ ...newJob, experienceLevel: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="entry">Entry Level</option>
                <option value="mid">Mid Level</option>
                <option value="senior">Senior Level</option>
              </select>
              <input
                type="url"
                placeholder="Job URL (optional)"
                value={newJob.url}
                onChange={(e) => setNewJob({ ...newJob, url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Add Job
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddJob(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Job Listings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {searchTerm ? "Search Results" : "Recent Job Postings"}
          </h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {displayJobs.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
              <p className="text-gray-500">Try adjusting your search criteria or add some job postings</p>
            </div>
          ) : (
            displayJobs.map((job) => (
              <div key={job._id} className="p-6 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-1">{job.title}</h4>
                    <p className="text-gray-600 mb-2">{job.company} • {job.location}</p>
                    <p className="text-sm text-gray-700 mb-3 line-clamp-2">{job.description}</p>
                    
                    <div className="flex flex-wrap gap-1 mb-3">
                      {job.requiredSkills.slice(0, 5).map((skill, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                      {job.requiredSkills.length > 5 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{job.requiredSkills.length - 5} more
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span className="capitalize">{job.experienceLevel} Level</span>
                      <span>•</span>
                      <span>{new Date(job.postedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() => handleAnalyze(job._id)}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                    >
                      Analyze Match
                    </button>
                    {job.url && (
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors text-center"
                      >
                        View Job
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
