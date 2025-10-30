// src/app/components/Dashboard/Dashboard.tsx
'use client'
import React, { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { useJobs, JobPosting } from '@/app/hooks/useJobs';
import { useSavedJobs } from '@/app/hooks/useSavedJobs';

interface DashboardProps {
  user: User;
  onSignOut: () => void;
}

// Helper function to format salary
const formatSalary = (min: number | null, max: number | null, currency: string = 'USD') => {
  if (!min && !max) return 'Salary not specified';
  if (min && max) return `$${(min / 1000).toFixed(0)}k - $${(max / 1000).toFixed(0)}k ${currency}`;
  if (min) return `$${(min / 1000).toFixed(0)}k+ ${currency}`;
  if (max) return `Up to $${(max / 1000).toFixed(0)}k ${currency}`;
  return 'Salary not specified';
};

// Helper function to format time ago
const formatTimeAgo = (dateString: string | null) => {
  if (!dateString) return 'Recently';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
};

// Compact Job List Item for left sidebar (LinkedIn style)
const JobListItem: React.FC<{
  job: JobPosting;
  isSelected: boolean;
  onClick: () => void;
}> = ({ job, isSelected, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`p-4 border-b border-gray-200 cursor-pointer transition-all hover:bg-gray-50 ${
        isSelected ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
      }`}
    >
      <div className="flex items-start space-x-3">
        {job.companies.logo_url && (
          <img
            src={job.companies.logo_url}
            alt={job.companies.name}
            className="w-12 h-12 rounded flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm mb-1 truncate">
            {job.title}
          </h3>
          <p className="text-sm text-gray-700 mb-1 truncate">{job.companies.name}</p>
          <div className="flex items-center text-xs text-gray-500 space-x-2 mb-2">
            <span>{job.location || 'Remote'}</span>
            {job.posted_date && (
              <>
                <span>•</span>
                <span>{formatTimeAgo(job.posted_date)}</span>
              </>
            )}
          </div>
          <div className="flex flex-wrap gap-1">
            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
              {job.job_type}
            </span>
            {job.is_remote && (
              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                Remote
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Detailed Job Panel for right side (LinkedIn style)
const JobDetailPanel: React.FC<{
  job: JobPosting;
  onSave: (jobId: string) => void;
  isSaved: boolean;
}> = ({ job, onSave, isSaved }) => {
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(job.id);
    setSaving(false);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start space-x-4">
            {job.companies.logo_url && (
              <img
                src={job.companies.logo_url}
                alt={job.companies.name}
                className="w-16 h-16 rounded"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{job.title}</h1>
              <p className="text-lg text-gray-700 mb-1">{job.companies.name}</p>
              {job.companies.industry && (
                <p className="text-sm text-gray-500">{job.companies.industry}</p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 mb-6">
          <button
            onClick={handleSave}
            disabled={saving || isSaved}
            className={`px-6 py-2 rounded-full font-medium transition-all ${
              isSaved
                ? 'bg-gray-100 text-gray-700 border border-gray-300'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {saving ? 'Saving...' : (isSaved ? 'Saved' : 'Save')}
          </button>
          <a
            href={job.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors font-medium"
          >
            Apply
          </a>
        </div>

        {/* Job Details */}
        <div className="space-y-6">
          {/* Meta Information */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-700">Location:</span>
              <span className="text-gray-600">{job.location || 'Remote'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-700">Type:</span>
              <span className="text-gray-600">{job.job_type}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-700">Level:</span>
              <span className="text-gray-600">{job.seniority_level}</span>
            </div>
          </div>

          {/* Salary */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Salary Range</h3>
            <p className="text-gray-700">{formatSalary(job.salary_min, job.salary_max, job.salary_currency)}</p>
          </div>

          {/* Tech Stack */}
          {job.tech_stack && job.tech_stack.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {job.tech_stack.map((tech, idx) => (
                  <span key={idx} className="px-3 py-1.5 bg-gray-100 text-gray-800 rounded-full text-sm border border-gray-200">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {job.description && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">About the job</h3>
              <div className="prose prose-sm max-w-none text-gray-700">
                <p className="whitespace-pre-line">{job.description}</p>
              </div>
            </div>
          )}

          {/* Posted Date */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Posted {formatTimeAgo(job.posted_date)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Dashboard Component
const Dashboard: React.FC<DashboardProps> = ({ user, onSignOut }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [jobTypeFilter, setJobTypeFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'saved'>('all');
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);

  const { jobs, loading: jobsLoading, refetch: refetchJobs } = useJobs({
    search: searchQuery,
    location: locationFilter,
    remote: remoteOnly || undefined,
    job_type: jobTypeFilter,
    limit: 50,
  });

  const {
    savedJobs,
    loading: savedJobsLoading,
    saveJob,
    updateSavedJob,
    removeSavedJob
  } = useSavedJobs();

  // Auto-select first job when jobs load (LinkedIn behavior)
  React.useEffect(() => {
    if (jobs.length > 0 && !selectedJob) {
      setSelectedJob(jobs[0]);
    }
  }, [jobs, selectedJob]);

  // Create a Set of saved job IDs for quick lookup
  const savedJobIds = new Set(savedJobs.map(sj => sj.job_id));

  const handleSaveJob = async (jobId: string) => {
    const result = await saveJob(jobId);
    if (result.success) {
      // Job saved successfully
      refetchJobs(); // Optional: refresh to update UI
    }
  };

  const handleSearch = () => {
    refetchJobs();
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setLocationFilter('');
    setRemoteOnly(false);
    setJobTypeFilter('');
  };

  const userEmail = user.email || 'No email provided';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">EJ</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Entry-Level Jobs</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700 text-sm">Welcome, {userEmail}</span>
              <button
                onClick={onSignOut}
                className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-3xl font-bold text-indigo-600">{jobs.length}</div>
            <div className="text-gray-600">Active Jobs</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-3xl font-bold text-green-600">{savedJobs.length}</div>
            <div className="text-gray-600">Saved Jobs</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-3xl font-bold text-orange-600">
              {savedJobs.filter(sj => sj.status === 'applied').length}
            </div>
            <div className="text-gray-600">Applications</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-3xl font-bold text-purple-600">
              {savedJobs.filter(sj => sj.status === 'interviewing').length}
            </div>
            <div className="text-gray-600">Interviews</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <div className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('all')}
                className={`py-4 border-b-2 font-medium transition-colors ${
                  activeTab === 'all'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                All Jobs ({jobs.length})
              </button>
              <button
                onClick={() => setActiveTab('saved')}
                className={`py-4 border-b-2 font-medium transition-colors ${
                  activeTab === 'saved'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Saved Jobs ({savedJobs.length})
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          {activeTab === 'all' && (
            <div className="p-6 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search jobs..."
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                />
                <input
                  type="text"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Location..."
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                />
                <select
                  value={jobTypeFilter}
                  onChange={(e) => setJobTypeFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                >
                  <option value="">All Job Types</option>
                  <option value="full-time">Full-Time</option>
                  <option value="internship">Internship</option>
                  <option value="contract">Contract</option>
                </select>
                <label className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={remoteOnly}
                    onChange={(e) => setRemoteOnly(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-600"
                  />
                  <span className="text-gray-700">Remote Only</span>
                </label>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleSearch}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Search
                </button>
                <button
                  onClick={handleClearFilters}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Content - Two Column Layout (LinkedIn Style) */}
        {activeTab === 'all' ? (
          <div className="flex gap-0 bg-white rounded-2xl shadow-sm overflow-hidden" style={{ height: 'calc(100vh - 400px)' }}>
            {/* Left Sidebar - Job List */}
            <div className="w-2/5 border-r border-gray-200 overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 z-10">
                <h2 className="text-lg font-semibold text-gray-900">
                  Top job picks for you
                </h2>
                <p className="text-sm text-gray-500">{jobs.length} results</p>
              </div>

              {jobsLoading ? (
                <div>
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="p-4 border-b border-gray-200">
                      <div className="bg-gray-100 rounded h-24 animate-pulse"></div>
                    </div>
                  ))}
                </div>
              ) : jobs.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="text-4xl mb-4">🔍</div>
                  <p className="text-gray-500 mb-2">No jobs found</p>
                  <p className="text-sm text-gray-400">Try adjusting your filters</p>
                </div>
              ) : (
                <div>
                  {jobs.map(job => (
                    <JobListItem
                      key={job.id}
                      job={job}
                      isSelected={selectedJob?.id === job.id}
                      onClick={() => setSelectedJob(job)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Right Panel - Job Details */}
            <div className="flex-1 bg-gray-50 overflow-y-auto">
              {selectedJob ? (
                <JobDetailPanel
                  job={selectedJob}
                  onSave={handleSaveJob}
                  isSaved={savedJobIds.has(selectedJob.id)}
                />
              ) : jobs.length > 0 ? (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <div className="text-5xl mb-4">👈</div>
                    <p className="text-lg">Select a job to view details</p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Your Saved Jobs
              </h2>
              {savedJobsLoading ? (
                <div className="grid grid-cols-1 gap-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-gray-100 rounded-xl h-48 animate-pulse"></div>
                  ))}
                </div>
              ) : savedJobs.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">📌</div>
                  <p className="text-gray-500 mb-2">No saved jobs yet</p>
                  <p className="text-sm text-gray-400">Start saving jobs from the "All Jobs" tab</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {savedJobs.map(savedJob => (
                    <div key={savedJob.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {savedJob.job_postings.title}
                          </h3>
                          <p className="text-indigo-600 font-medium mb-2">
                            {savedJob.job_postings.companies.name}
                          </p>
                          <div className="flex items-center space-x-2 mb-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              savedJob.status === 'applied' ? 'bg-blue-100 text-blue-800' :
                              savedJob.status === 'interviewing' ? 'bg-purple-100 text-purple-800' :
                              savedJob.status === 'offer' ? 'bg-green-100 text-green-800' :
                              savedJob.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {savedJob.status}
                            </span>
                            {savedJob.application_date && (
                              <span className="text-xs text-gray-500">
                                Applied: {new Date(savedJob.application_date).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          {savedJob.notes && (
                            <p className="text-sm text-gray-600 italic mb-2">
                              📝 {savedJob.notes}
                            </p>
                          )}
                          {savedJob.job_postings.location && (
                            <p className="text-sm text-gray-500">
                              📍 {savedJob.job_postings.location}
                            </p>
                          )}
                          {savedJob.job_postings.salary_min && savedJob.job_postings.salary_max && (
                            <p className="text-sm text-gray-600">
                              💰 {formatSalary(savedJob.job_postings.salary_min, savedJob.job_postings.salary_max)}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col space-y-2 ml-4">
                          <select
                            value={savedJob.status}
                            onChange={(e) => updateSavedJob(savedJob.id, { status: e.target.value })}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                          >
                            <option value="interested">Interested</option>
                            <option value="applied">Applied</option>
                            <option value="interviewing">Interviewing</option>
                            <option value="offer">Offer</option>
                            <option value="rejected">Rejected</option>
                            <option value="archived">Archived</option>
                          </select>
                          <a
                            href={savedJob.job_postings.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 text-center border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                          >
                            View Job →
                          </a>
                          <button
                            onClick={() => removeSavedJob(savedJob.id)}
                            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;