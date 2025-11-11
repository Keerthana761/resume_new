import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function AnalysisResults() {
  const resumes = useQuery(api.resumes.getUserResumes);
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  
  const analyses = useQuery(
    api.analysis.getAnalysisForResume,
    selectedResumeId ? { resumeId: selectedResumeId as any } : "skip"
  );

  if (!resumes || resumes.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <div className="text-4xl mb-4">📊</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No analysis available</h3>
        <p className="text-gray-500">Upload a resume and analyze it against job postings to see results here</p>
      </div>
    );
  }

  const selectedResume = resumes.find(r => r._id === selectedResumeId);

  return (
    <div className="space-y-6">
      {/* Resume Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Analysis Results</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Resume
          </label>
          <select
            value={selectedResumeId}
            onChange={(e) => setSelectedResumeId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Choose a resume...</option>
            {resumes.map((resume) => (
              <option key={resume._id} value={resume._id}>
                {resume.fileName} {resume.jobLevel && `(${resume.jobLevel} level)`}
              </option>
            ))}
          </select>
        </div>

        {/* Resume Summary */}
        {selectedResume && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Resume Summary</h4>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>Level: <strong>{selectedResume.jobLevel || "Not set"}</strong></span>
              {selectedResume.yearsOfExperience !== undefined && (
                <span>Experience: <strong>{selectedResume.yearsOfExperience} years</strong></span>
              )}
              <span>Skills: <strong>{selectedResume.skills.length}</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* Analysis Results */}
      {selectedResumeId && analyses && (
        <div className="space-y-4">
          {analyses.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No analysis found</h3>
              <p className="text-gray-500">Analyze this resume against job postings to see match results</p>
            </div>
          ) : (
            analyses.map((analysis) => (
              <div key={analysis._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {analysis.job?.title || "Unknown Job"}
                    </h3>
                    <p className="text-gray-600">{analysis.job?.company}</p>
                    <p className="text-sm text-gray-500 capitalize">
                      {analysis.job?.experienceLevel} level position
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${
                      analysis.matchScore >= 70 ? "text-green-600" :
                      analysis.matchScore >= 50 ? "text-yellow-600" : "text-red-600"
                    }`}>
                      {Math.round(analysis.matchScore)}%
                    </div>
                    <p className="text-sm text-gray-500">Match Score</p>
                  </div>
                </div>

                {/* Level Match Analysis */}
                {analysis.levelMatch && (
                  <div className="mb-6 p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      🎯 Level Compatibility
                    </h4>
                    <div className="flex items-center gap-4 mb-2">
                      <span className="text-sm">
                        Your Level: <strong className="capitalize">{analysis.levelMatch.resumeLevel}</strong>
                      </span>
                      <span className="text-sm">
                        Job Level: <strong className="capitalize">{analysis.levelMatch.jobLevel}</strong>
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        analysis.levelMatch.isMatch 
                          ? "bg-green-100 text-green-800" 
                          : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {analysis.levelMatch.isMatch ? "Good Match" : "Level Mismatch"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{analysis.levelMatch.recommendation}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Matching Skills */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      ✅ Matching Skills ({analysis.matchingSkills.length})
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {analysis.matchingSkills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Missing Skills */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      ❌ Missing Skills ({analysis.missingSkills.length})
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {analysis.missingSkills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Strengths & Weaknesses */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      💪 Strengths
                    </h4>
                    <ul className="space-y-1">
                      {analysis.strengthsWeaknesses.strengths.map((strength, index) => (
                        <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-green-500 mt-0.5">•</span>
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      ⚠️ Areas for Improvement
                    </h4>
                    <ul className="space-y-1">
                      {analysis.strengthsWeaknesses.weaknesses.map((weakness, index) => (
                        <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-red-500 mt-0.5">•</span>
                          {weakness}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Suggestions */}
                <div className="mt-6">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    💡 Improvement Suggestions
                  </h4>
                  <ul className="space-y-2">
                    {analysis.suggestions.map((suggestion, index) => (
                      <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-blue-500 mt-0.5">•</span>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Analyzed on {new Date(analysis.analyzedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
