'use client'
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/app/hooks/useAuth';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onSwitchToSignUp: () => void;
}

const SignInModal: React.FC<SignInModalProps> = ({ isOpen, onClose, onSuccess, onSwitchToSignUp }) => {
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn } = useAuth();

 

  useEffect(() => {
    console.log("email state:", email)
  }, [email])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    

    try {
      const { data, error } = await signIn(email, password);

      if (error) throw error;
      
      onSuccess();
      onClose();
      // Reset form
      setEmail('');
      setPassword('');
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setPassword('');
    setError('');
    onClose();
  };
 
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-400 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Sign In</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

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
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
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
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-gray-600">
          Don't have an account?{' '}
          <button 
            type="button" 
            onClick={onSwitchToSignUp}
            className="text-indigo-600 hover:underline"
          >
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
};

export default SignInModal;