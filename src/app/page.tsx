'use client'
import React, { useState } from 'react';
import { useAuth } from '@/app/hooks/useAuth';
import Dashboard from '@/app/components/Dashboard/Dashboard';
import SignInModal from '@/app/components/Auth/SignInModal';
import SignUpModal from '@/app/components/Auth/SignupModal';

// Main App Component
export default function EarlyJobApp() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const { user, signOut, loading } = useAuth();

  const handleEmailSubmit = async () => {
    setSubmitError('');
    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join waitlist');
      }

      setIsSubmitted(true);
      setEmail('');
      setTimeout(() => setIsSubmitted(false), 3000);
    } catch (err: any) {
      setSubmitError(err.message);
    }
  };

  const handleGetStarted = () => {
    setShowSignUp(true);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleSwitchToSignIn = () => {
    setShowSignUp(false);
    setShowSignIn(true);
  };

  const handleSwitchToSignUp = () => {
    setShowSignIn(false);
    setShowSignUp(true);
  };

  const handleCloseModals = () => {
    setShowSignIn(false);
    setShowSignUp(false);
  };

  // Show loading while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-sm">EJ</span>
          </div>
          <div className="text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  // If user is logged in, show dashboard
  if (user) {
    return <Dashboard user={user} onSignOut={handleSignOut} />;
  }

  // Otherwise show landing page
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="px-6 lg:px-8 py-4 bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">EJ</span>
            </div>
            <span className="text-xl font-bold text-gray-900">EarlyJob Alerts</span>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowSignIn(true)}
              className="text-gray-700 hover:text-indigo-600 transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={handleGetStarted}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-6 lg:px-8 py-20 sm:py-32">
        <div className="mx-auto max-w-5xl text-center">
          <div className="mb-8">
            <div className="inline-flex items-center rounded-full bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-800 mb-6">
              <span className="mr-2">🎯</span>
              Beat the Competition
            </div>
          </div>
          
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
            Get <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Job Alerts</span>
            <br />
            Before Anyone Else
          </h1>
          
          <p className="mt-6 text-xl leading-8 text-gray-600 max-w-3xl mx-auto">
            Track your target companies and get notified when they're about to hire. Access hiring signals, 
            employee connections, and referral opportunities before jobs are posted publicly.
          </p>
          
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <div className="w-full flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="text-black flex-1 px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              />
              <button
                onClick={handleEmailSubmit}
                disabled={!email || isSubmitted}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:transform-none"
              >
                {isSubmitted ? '✓ Joined!' : 'Get Early Access'}
              </button>
            </div>
          </div>
          
          {submitError && (
            <p className="mt-2 text-sm text-red-600">{submitError}</p>
          )}
          
          <p className="mt-4 text-sm text-gray-500">
            Join 2,847+ job seekers getting ahead of the game
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Smart Job Tracking That Actually Works
            </h2>
            <p className="mt-4 text-lg leading-8 text-gray-600">
              We monitor hiring signals across multiple channels so you can apply first and network smart.
            </p>
          </div>
          
          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-3">
            <div className="group bg-gradient-to-br from-indigo-50 to-purple-50 p-8 rounded-2xl hover:shadow-xl transition-all duration-300 border border-indigo-100">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="text-white text-xl">🎯</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Hiring Signal Detection</h3>
              <p className="text-gray-600 leading-7">
                Track funding rounds, team expansions, new office openings, and other signals that indicate upcoming hiring waves.
              </p>
            </div>

            <div className="group bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-2xl hover:shadow-xl transition-all duration-300 border border-purple-100">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="text-white text-xl">👥</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Employee Network Mapping</h3>
              <p className="text-gray-600 leading-7">
                Find the right people to connect with for referrals, including hiring managers and team members in your target roles.
              </p>
            </div>

            <div className="group bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl hover:shadow-xl transition-all duration-300 border border-blue-100">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="text-white text-xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Real-time Alerts</h3>
              <p className="text-gray-600 leading-7">
                Get instant notifications when your tracked companies show hiring activity, so you can be among the first to apply.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to Get Ahead of the Competition?
            </h2>
            <p className="mt-6 text-lg leading-8 text-indigo-100">
              Join thousands of job seekers who are using EarlyJob Alerts to land interviews 
              before positions are posted publicly.
            </p>
            <div className="mt-10">
              <button
                onClick={handleGetStarted}
                className="rounded-md bg-white px-6 py-3 text-lg font-semibold text-indigo-600 shadow-lg hover:bg-gray-50 transition-all duration-200 transform hover:scale-105"
              >
                Start Tracking Companies
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Auth Modals */}
      <SignInModal
        isOpen={showSignIn}
        onClose={handleCloseModals}
        onSuccess={() => {
          // User will be automatically redirected to dashboard via useAuth state change
        }}
        onSwitchToSignUp={handleSwitchToSignUp}
      />

      <SignUpModal
        isOpen={showSignUp}
        onClose={handleCloseModals}
        onSuccess={() => {
          // User will be automatically redirected to dashboard via useAuth state change
        }}
        onSwitchToSignIn={handleSwitchToSignIn}
      />
    </div>
  );
}