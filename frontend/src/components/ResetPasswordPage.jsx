import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';

const ResetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [validToken, setValidToken] = useState(false);
  const [tokenChecking, setTokenChecking] = useState(true);
  const [email, setEmail] = useState('');
  const { token } = useParams();
  const navigate = useNavigate();

  // Check if token is valid
  useEffect(() => {
    const checkToken = async () => {
      if (!token) {
        setError('Missing reset token in URL');
        setTokenChecking(false);
        return;
      }

      try {
        setTokenChecking(true);
        const response = await axios.get(
          `https://bloodonationwebapp.vercel.app/api/auth/validate-token/${token}`
        );
        
        if (response.data.valid) {
          setValidToken(true);
          setEmail(response.data.email);
        } else {
          setError('Invalid or expired reset token');
        }
      } catch (err) {
        console.error('Token validation error:', err);
        // Handle specific error cases
        if (err.response?.status === 400) {
          setError('Invalid or expired reset token');
        } else {
          setError('Failed to validate reset token. Please try again later.');
        }
      } finally {
        setTokenChecking(false);
      }
    };
    
    checkToken();
  }, [token]);

  // Update the handleSubmit function
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    try {
      setLoading(true);
      // Send both password and confirmPassword as expected by backend
      const response = await axios.post(
        `https://bloodonationwebapp.vercel.app/api/auth/reset-password/${token}`,
        { 
          password: password,
          confirmPassword: confirmPassword 
        }
      );

      if (response.data.message) {
        setSuccess('Password reset successfully! Redirecting to login...');
        setTimeout(() => navigate('/'), 2000);
      }
    } catch (err) {
      console.error('Password reset error:', err);
      // Handle specific error cases
      if (err.response?.status === 400) {
        setError(err.response.data.message || 'Invalid request');
      } else if (err.response?.status === 500) {
        setError('Server error. Please try again later.');
      } else {
        setError('Password reset failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking token
  if (tokenChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-10 bg-white rounded-xl shadow-lg text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-medium text-gray-900">Validating reset link...</h2>
          <p className="text-gray-600 mt-2">Please wait while we verify your reset token.</p>
        </div>
      </div>
    );
  }

  // Show error if token is invalid
  if (!validToken && error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-10 bg-white rounded-xl shadow-lg text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Reset Link</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <Link 
              to="/forgot-password" 
              className="block w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition duration-300"
            >
              Request New Reset Link
            </Link>
            <Link 
              to="/login" 
              className="block w-full text-red-600 hover:text-red-800 font-medium"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-red-50 to-white">
      {/* Hero Section - Left Side */}
      <div className="hidden lg:flex lg:w-1/2 bg-red-700 p-12 text-white">
        <div className="max-w-xl mx-auto flex flex-col justify-center">
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            Secure Your Account
          </h1>
          
          <div className="space-y-6 mb-10">
            <div className="flex items-start">
              <div className="bg-white rounded-full p-3 mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <p className="text-xl">
                Create a strong password to protect your donor account.
              </p>
            </div>
            
            <div className="flex items-start">
              <div className="bg-white rounded-full p-3 mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <p className="text-xl">
                Use a combination of letters, numbers, and symbols for maximum security.
              </p>
            </div>
            
            <div className="flex items-start">
              <div className="bg-white rounded-full p-3 mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <p className="text-xl">
                Your security ensures you can continue your life-saving donations.
              </p>
            </div>
          </div>
          
          <div className="bg-white bg-opacity-20 rounded-lg p-6">
            <p className="text-xl italic">
              "Protecting donor accounts helps ensure a steady supply of life-saving blood for those in need."
            </p>
          </div>
        </div>
      </div>
      
      {/* Password Reset Form - Right Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="max-w-lg w-full space-y-8 bg-white rounded-2xl shadow-xl p-10 border border-red-100">
          <div className="text-center">
            <div className="mx-auto bg-red-100 p-3 rounded-full w-16 h-16 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Create New Password
            </h2>
            <p className="mt-2 text-gray-600">
              For account: <span className="font-medium text-red-600">{email}</span>
            </p>
          </div>
          
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md border border-red-200">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 text-green-700 p-3 rounded-md border border-green-200">
              {success}
            </div>
          )}

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 text-black"
                  placeholder="At least 8 characters"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Must contain at least 8 characters
              </p>
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 text-black"
                  placeholder="Re-enter your password"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white ${
                  loading ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition duration-300`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Resetting Password...
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>
            </div>
          </form>

          <div className="text-center mt-4">
            <Link 
              to="/login" 
              className="text-sm text-red-600 hover:text-red-800 font-medium transition duration-300"
            >
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
