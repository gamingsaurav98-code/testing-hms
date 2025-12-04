'use client';

import React, { useState } from 'react';
// useRouter not required for this component: registration flow uses onSuccess callback
import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/components/ui/password-input';
import { authApi } from '@/lib/api';

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

interface RegisterFormProps {
  onSuccess: () => void;
  onBackToLogin: () => void;
}

export default function RegisterForm({ onSuccess, onBackToLogin }: RegisterFormProps) {
  const [formData, setFormData] = useState<RegisterFormData>({
    name: '',
    email: '',
    password: '',
    password_confirmation: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  // login is intentionally not used during register flow; users sign up then manually login

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Basic validation
    if (formData.password !== formData.password_confirmation) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    try {
      const response = await authApi.createAccount(formData);
      
      if (response.status === 'success') {
        const user = response.data.user;
        let dashboardName = '';
        
        switch (user.role) {
          case 'student':
            dashboardName = 'Student Dashboard';
            break;
          case 'staff':
            dashboardName = 'Staff Dashboard';
            break;
          case 'admin':
            dashboardName = 'Admin Dashboard';
            break;
          default:
            dashboardName = 'Dashboard';
        }
        
        setSuccess(`Account created successfully! Please use your Student ID or Staff ID to login to ${dashboardName}.`);
        setFormData({
          name: '',
          email: '',
          password: '',
          password_confirmation: ''
        });
        
        // Redirect to login after 3 seconds without auto-login
        setTimeout(() => {
          onSuccess();
        }, 3000);
      }
    } catch (error: unknown) {
      // Be defensive when inspecting unknown error shapes without using `any`
      if (typeof error === 'object' && error !== null) {
        const e = error as {
          message?: string;
          response?: { data?: { message?: string; errors?: Record<string, string[]> } };
        };

        if (e.message) {
          setError(e.message);
        } else if (e.response?.data?.message) {
          setError(e.response.data.message);
        } else if (e.response?.data?.errors) {
          // Handle validation errors
          const errors = e.response.data.errors as Record<string, string[]>;
          const errorMessages = Object.values(errors).flat();
          setError(errorMessages.join(', '));
        } else {
          setError('Account creation failed. Please try again.');
        }
      } else {
        setError('Account creation failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow-xl rounded-2xl p-8 border border-gray-100">
      <form className="space-y-6" onSubmit={handleSubmit}>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            <div className="flex items-center">
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              {error}
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
            <div className="flex items-center">
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {success}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleInputChange}
              className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleInputChange}
              className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="Enter your registered email"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the email address that was registered by the administrator. Your account type (Student/Staff) will be determined automatically based on your registration.
            </p>
          </div>

          <div>
            <PasswordInput
              id="password"
              name="password"
              label="Password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Create a password (min 8 characters)"
              required
              minLength={8}
              autoComplete="new-password"
              className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>

          <div>
            <PasswordInput
              id="password_confirmation"
              name="password_confirmation"
              label="Confirm Password"
              value={formData.password_confirmation}
              onChange={handleInputChange}
              placeholder="Confirm your password"
              required
              minLength={8}
              autoComplete="new-password"
              className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        <div className="space-y-3">
          <Button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating Account...
              </div>
            ) : (
              <div className="flex items-center">
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Create Account
              </div>
            )}
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={onBackToLogin}
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            <div className="flex items-center">
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Login
            </div>
          </Button>
        </div>
      </form>

      <div className="mt-6 text-center">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">How it works:</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Enter the email address registered by admin</li>
                  <li>If your email is in <strong>Student records</strong> → Access Student Dashboard</li>
                  <li>If your email is in <strong>Staff records</strong> → Access Staff Dashboard</li>
                  <li>Only pre-registered emails are accepted</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
