import React, { useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate, Link } from 'react-router-dom';

const VerifyPage = () => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!code) {
      setError('Please enter verification code');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post('https://blood-donation-web-app-beta.vercel.app/api/auth/verify', { code });
      
      if (response.data.token) {
        // Save token and user data
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Redirect to dashboard
        navigate('/');
      }
    } catch (err) {
      console.error('Verification error:', err);
      const errorMessage = err.response?.data?.message || 
                           err.response?.data?.error || 
                           'Verification failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      setResending(true);
      const response = await axios.post('https://blood-donation-web-app-beta.vercel.app/api/resend-code', { email });
      
      if (response.data.message) {
        setError('');
        alert('New verification code sent! Check your email.');
      }
    } catch (err) {
      console.error('Resend error:', err);
      const errorMessage = err.response?.data?.message || 
                           'Failed to resend code. Please try again.';
      setError(errorMessage);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-red-50 to-white">
      {/* Hero Section - Left Side */}
      <div className="hidden lg:flex lg:w-1/2 bg-red-700 p-12 text-white">
        <div className="max-w-xl mx-auto flex flex-col justify-center">
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            Just One More Step to Save Lives
          </h1>
          
          <div className="space-y-6 mb-10">
            <div className="flex items-start">
              <div className="bg-white rounded-full p-3 mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <p className="text-xl">
                Email verification ensures the security of your donor account and personal information.
              </p>
            </div>
            
            <div className="flex items-start">
              <div className="bg-white rounded-full p-3 mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-xl">
                Check your inbox (and spam folder) for an email from <span className="font-semibold">bloodonerl@gmail.com</span>
              </p>
            </div>
            
            <div className="flex items-start">
              <div className="bg-white rounded-full p-3 mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-xl">
                Your verification code expires in 1 hour. Can't find it? Resend a new code.
              </p>
            </div>
          </div>
          
          <div className="bg-white bg-opacity-20 rounded-lg p-6">
            <p className="text-xl italic">
              "Verification is more than a security step - it's the first commitment in your journey to save lives."
            </p>
          </div>
        </div>
      </div>
      
      {/* Verification Form - Right Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="max-w-lg w-full space-y-8 bg-white rounded-2xl shadow-xl p-10 border border-red-100">
          <div className="text-center">
            <div className="mx-auto bg-red-100 p-3 rounded-full w-16 h-16 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Verify Your Account
            </h2>
            <p className="mt-2 text-gray-600">
              Enter the 6-digit code sent to <span className="font-medium text-red-600">{email}</span>
            </p>
          </div>
          
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md border border-red-200">
              {error}
            </div>
          )}

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                Verification Code
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <input
                  id="code"
                  name="code"
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="block text-black w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Enter the 6-digit code we sent to your email
              </p>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white ${
                  loading ? 'bg-red-400' : 'bg-red-600 hover:bg-red-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying...
                  </>
                ) : (
                  'Verify & Start Saving Lives'
                )}
              </button>
            </div>
          </form>

          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              Didn't receive the code? 
              <button 
                onClick={handleResendCode}
                disabled={resending}
                className={`ml-1 font-medium ${
                  resending ? 'text-gray-500' : 'text-white hover:text-cyan-700'
                }`}
              >
                {resending ? 'Sending...' : 'Resend Code'}
              </button>
            </p>
            <div className="mt-4 border-t pt-4">
              <button 
                onClick={() => navigate('/register')}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to registration
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyPage;
