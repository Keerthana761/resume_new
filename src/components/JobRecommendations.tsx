import React, { useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2, Briefcase, MapPin, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface JobRecommendation {
  _id: string;
  _creationTime: number;
  title: string;
  company: string;
  description: string;
  requiredSkills: string[];
  location: string;
  experienceLevel: string;
  source: string;
  url?: string;
  postedAt: number;
  compatibilityScore: number;
  matchReasons: string[];
}

interface JobRecommendationsProps {
  resumeId?: string;
  onAnalyzeMatch?: (jobId: string) => void;
}

export default function JobRecommendations({ resumeId, onAnalyzeMatch }: JobRecommendationsProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(!!resumeId);
  const [recommendations, setRecommendations] = useState<JobRecommendation[]>([]);
  
  const jobRecommendations = useQuery(
    api.jobs.findJobsForResume,
    resumeId ? { resumeId: resumeId as any, limit: 10 } : 'skip'
  );

  useEffect(() => {
    if (!resumeId) {
      setIsLoading(false);
      setRecommendations([]);
      return;
    }
    if (jobRecommendations) {
      setRecommendations(jobRecommendations as JobRecommendation[]);
      setIsLoading(false);
    }
  }, [jobRecommendations, resumeId]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent Match';
    if (score >= 60) return 'Good Match';
    if (score >= 40) return 'Moderate Match';
    return 'Learning Opportunity';
  };

  const getExperienceLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'entry': return 'bg-blue-100 text-blue-800';
      case 'mid': return 'bg-green-100 text-green-800';
      case 'senior': return 'bg-purple-100 text-purple-800';
      case 'executive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleAnalyzeMatch = (jobId: string) => {
    if (onAnalyzeMatch) {
      onAnalyzeMatch(jobId);
    } else {
      toast({
        title: "Analysis Started",
        description: "Analyzing your resume against this job...",
      });
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-lg">Finding jobs that match your resume...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!resumeId) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center justify-center h-64 text-center">
          <Briefcase className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Resume</h3>
          <p className="text-gray-600 mb-4">Choose a resume from your list to see personalized job recommendations.</p>
        </CardContent>
      </Card>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center justify-center h-64 text-center">
          <Briefcase className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Job Recommendations Yet</h3>
          <p className="text-gray-600 mb-4">Upload your resume to get personalized job recommendations based on your skills and experience.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Recommended Jobs for You</h2>
        <p className="text-gray-600">Based on your resume analysis and career profile</p>
      </div>

      <div className="grid gap-6">
        {recommendations.map((job) => (
          <Card key={job._id} className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <CardTitle className="text-xl text-gray-900">{job.title}</CardTitle>
                  <CardDescription className="text-lg font-medium text-gray-700">
                    {job.company}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${getScoreColor(job.compatibilityScore)}`}>
                    {job.compatibilityScore}%
                  </div>
                  <div className="text-sm text-gray-600">{getScoreLabel(job.compatibilityScore)}</div>
                </div>
              </div>
              
              <Progress 
                value={job.compatibilityScore} 
                className="h-2"
                indicatorClassName={job.compatibilityScore >= 80 ? 'bg-green-600' : 
                                  job.compatibilityScore >= 60 ? 'bg-yellow-600' : 
                                  job.compatibilityScore >= 40 ? 'bg-orange-600' : 'bg-red-600'}
              />
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                {/* Job Details */}
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {job.location}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {formatDate(job.postedAt)}
                  </div>
                  <Badge className={getExperienceLevelColor(job.experienceLevel)}>
                    {job.experienceLevel}
                  </Badge>
                </div>

                {/* Job Description */}
                <p className="text-gray-700 line-clamp-3">{job.description}</p>

                {/* Required Skills */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Required Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {job.requiredSkills.slice(0, 8).map((skill, index) => {
                      const isMatching = job.matchReasons.some(reason => 
                        reason.toLowerCase().includes(skill.toLowerCase())
                      );
                      return (
                        <Badge 
                          key={index} 
                          variant={isMatching ? "default" : "secondary"}
                          className={isMatching ? "bg-green-100 text-green-800 hover:bg-green-200" : ""}
                        >
                          {skill}
                          {isMatching && <CheckCircle className="ml-1 h-3 w-3" />}
                        </Badge>
                      );
                    })}
                    {job.requiredSkills.length > 8 && (
                      <Badge variant="outline">+{job.requiredSkills.length - 8} more</Badge>
                    )}
                  </div>
                </div>

                {/* Match Reasons */}
                <div className="bg-blue-50 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Why this matches you:</h4>
                  <ul className="space-y-1">
                    {job.matchReasons.slice(0, 3).map((reason, index) => (
                      <li key={index} className="text-sm text-blue-800 flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <Button 
                    onClick={() => handleAnalyzeMatch(job._id)}
                    className="flex-1"
                    variant="default"
                  >
                    Analyze Match
                  </Button>
                  {job.url && (
                    <Button 
                      onClick={() => window.open(job.url, '_blank')}
                      variant="outline"
                      className="flex-1"
                    >
                      View Job
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load More Button */}
      <div className="text-center mt-8">
        <Button 
          variant="outline" 
          size="lg"
          onClick={() => {
            // Implement load more functionality
            toast({
              title: "Loading more jobs...",
              description: "Fetching additional job recommendations",
            });
          }}
        >
          Load More Recommendations
        </Button>
      </div>
    </div>
  );
}