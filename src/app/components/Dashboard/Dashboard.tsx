'use client'
import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { useCompanies } from '@/app/hooks/useCompanies';
import { useTrackedCompanies } from '@/app/hooks/useTrackedCompanies';
import { useAlerts } from '@/app/hooks/useAlerts';
import HiringSignalsCard from '@/app/components/HiringSignalsCard/HiringSignalsCard'
import { useHiringSignals } from '@/app/hooks/useHiringSignals'

// Types
interface Company {
  id: string;
  name: string;
  industry: string | null;
  employee_count: number | null;
  website?: string | null;
  size_category?: string | null;
  description?: string | null;
}

interface Alert {
  id: string;
  title: string;
  message: string;
  alert_type: string;
  sent_at: string;
  read_at: string | null;
  company: {
    name: string;
  } | null;
}

interface DashboardProps {
  user: User;
  onSignOut: () => void;
}

interface CompanyCardProps {
  company: Company;
  onTrack: (companyId: string) => void;
  onUntrack: (companyId: string) => void;
  isTracked: boolean;
}

// Helper function to format time ago
const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  return `${Math.floor(diffInSeconds / 86400)} days ago`;
};

// Company Card Component
const CompanyCard: React.FC<CompanyCardProps> = ({ company, onTrack, onUntrack, isTracked }) => {
  const [loading, setLoading] = useState(false);

  const handleTrackToggle = async () => {
    setLoading(true);
    try {
      if (isTracked) {
        await onUntrack(company.id);
      } else {
        await onTrack(company.id);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{company.name}</h3>
          {company.industry && (
            <p className="text-gray-600">{company.industry}</p>
          )}
          {company.employee_count && (
            <p className="text-sm text-gray-500">{company.employee_count.toLocaleString()} employees</p>
          )}
          {company.description && (
            <p className="text-sm text-gray-600 mt-2 line-clamp-2">{company.description}</p>
          )}
        </div>
        <button
          onClick={handleTrackToggle}
          disabled={loading}
          className={`px-4 py-2 rounded-lg font-medium transition-all ml-4 ${
            isTracked
              ? 'bg-green-100 text-green-700 border border-green-200'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? '...' : (isTracked ? '✓ Tracking' : 'Track')}
        </button>
      </div>
    </div>
  );
};

// Dashboard Component
const Dashboard: React.FC<DashboardProps> = ({ user, onSignOut }) => {
  const [isReady, setIsReady] = useState(false);
  
  // Add a small delay to ensure session is fully established
  useEffect(() => {
    if (user) {
      // Small delay to ensure server-side session is established
      const timer = setTimeout(() => {
        setIsReady(true);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [user]);
  
  // Only call data hooks when user is authenticated and ready
  const shouldFetchData = !!user && isReady;
  
  const { companies, loading: companiesLoading } = useCompanies();
  const { trackedCompanies, trackCompany, untrackCompany } = useTrackedCompanies();
  const { alerts, markAsRead } = useAlerts(shouldFetchData);
  const { signals } = useHiringSignals();
  
  const handleTrackCompany = async (companyId: string) => {
    await trackCompany(companyId);
  };

  const handleUntrackCompany = async (companyId: string) => {
    await untrackCompany(companyId);
  };

  // Handle the possibility of undefined email
  const userEmail = user.email || 'No email provided';

  // Show loading state while authentication is being established
  if (!user || !isReady) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

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
              <span className="text-xl font-bold text-gray-900">EarlyJob Alerts</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {userEmail}</span>
              <button
                onClick={onSignOut}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="text-3xl font-bold text-indigo-600">{trackedCompanies.size}</div>
                <div className="text-gray-600">Companies Tracked</div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="text-3xl font-bold text-green-600">{signals.length}</div>
                <div className="text-gray-600">Hiring Signals</div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="text-3xl font-bold text-orange-600">{alerts.length}</div>
                <div className="text-gray-600">Recent Alerts</div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="text-3xl font-bold text-purple-600">
                  {alerts.filter(alert => alert.alert_type === 'hiring_signal').length}
                </div>
                <div className="text-gray-600">Signal Alerts</div>
              </div>
            </div>
            <HiringSignalsCard />

            {/* Company Tracking */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Track Companies</h2>
              {companiesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-gray-100 rounded-xl h-32 animate-pulse"></div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {companies.map(company => (
                    <CompanyCard
                      key={company.id}
                      company={company}
                      onTrack={handleTrackCompany}
                      onUntrack={handleUntrackCompany}
                      isTracked={trackedCompanies.has(company.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Alerts */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Alerts</h3>
              <div className="space-y-3">
                {alerts.length === 0 ? (
                  <p className="text-gray-500 text-sm">No alerts yet. Start tracking companies to get notified!</p>
                ) : (
                  alerts.map(alert => (
                    <div 
                      key={alert.id} 
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        alert.read_at ? 'bg-gray-50 border-gray-200' : 'bg-indigo-50 border-indigo-100'
                      }`}
                      onClick={() => !alert.read_at && markAsRead(alert.id)}
                    >
                      <div className="font-medium text-gray-900 text-sm">{alert.title}</div>
                      <div className="text-gray-600 text-xs mt-1">{alert.message}</div>
                      {alert.company && (
                        <div className="text-indigo-600 text-xs mt-1 font-medium">{alert.company.name}</div>
                      )}
                      <div className="text-gray-400 text-xs mt-2">{formatTimeAgo(alert.sent_at)}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
              <h3 className="text-lg font-semibold mb-3">Need Help?</h3>
              <p className="text-indigo-100 text-sm mb-4">
                Get personalized networking strategies and referral templates.
              </p>
              <button className="bg-white text-indigo-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;