'use client'
import React, { useState } from 'react';
import { useAuth } from '@/app/hooks/useAuth';

interface SignUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onSwitchToSignIn: () => void;
}

const SignUpModal: React.FC<SignUpModalProps> = ({ isOpen, onClose, onSuccess, onSwitchToSignIn }) => {
  const [email, setEmail] = useState('');
  const [first_name, setFirst_name] = useState('');
  const [last_name, setLast_name] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await signUp(email, password);

      if (error) throw error;
      
      setShowConfirmation(true);
      setError(''); 
      // Don't close modal yet, show confirmation message
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setPassword('');
    setFirst_name('')
    setLast_name('')
    setError('');
    setShowConfirmation(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-400 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Sign Up</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {showConfirmation ? (
          <div className="text-center">
            <div className="mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-green-600 text-2xl">✓</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Check Your Email!</h3>
              <p className="text-gray-600">
                We've sent a confirmation link to <strong>{email}</strong>. 
                Click the link in your email to activate your account.
              </p>
            </div>
            <button
              onClick={handleClose}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              Got it!
            </button>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-4 mb-6">

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="text-black w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                required
              />

              <input
                type="firstname"
                value={first_name}
                onChange={(e) => setFirst_name(e.target.value)}
                placeholder="First Name"
                className="text-black w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                required
              /><input
                type="lastname"
                value={last_name}
                onChange={(e) => setLast_name(e.target.value)}
                placeholder="Last Name"
                className="text-black w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                required
              />

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (min 6 characters)"
                minLength={6}
                className="text-black w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                required
              />
              
              {error && (
                <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {loading ? 'Creating Account...' : 'Sign Up'}
              </button>
            </form>

            <p className="text-center text-gray-600">
              Already have an account?{' '}
              <button 
                type="button" 
                onClick={onSwitchToSignIn}
                className="text-indigo-600 hover:underline"
              >
                Sign In
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default SignUpModal;