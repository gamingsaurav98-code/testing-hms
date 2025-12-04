'use client';

import React, { useState, useEffect } from 'react';
import { profileApi, type UserProfile } from '@/lib/api';
import { Button, TableSkeleton } from '@/components/ui';
import { PasswordInput } from '@/components/ui/password-input';
import { User, AlertCircle } from 'lucide-react';

export default function AdminProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Email update state
  const [email, setEmail] = useState('');
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState(false);
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await profileApi.getProfile();
      setProfile(data);
      setEmail(data.email || '');
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    setEmailSuccess(false);

    if (!email || !email.includes('@')) {
      setEmailError('Please enter a valid email address');
      return;
    }

    try {
      setIsUpdatingEmail(true);
      const updatedProfile = await profileApi.updateProfile({ email });
      setProfile(updatedProfile);
      setEmailSuccess(true);
      
      setTimeout(() => {
        setEmailSuccess(false);
      }, 3000);
    } catch (err: unknown) {
      console.error('Error updating email:', err);
      setEmailError(err instanceof Error ? err.message : 'Failed to update email. Please try again.');
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All password fields are required');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match');
      return;
    }

    try {
      setIsChangingPassword(true);
      await profileApi.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      });
      
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      setTimeout(() => {
        setPasswordSuccess(false);
      }, 3000);
    } catch (err: unknown) {
      console.error('Error changing password:', err);
      setPasswordError(err instanceof Error ? err.message : 'Failed to change password. Please check your current password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-medium text-gray-900">Profile Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Loading profile information...</p>
        </div>
        <TableSkeleton />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="p-4 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
            <p className="text-red-800">{error || 'Profile not found'}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-medium text-gray-900">Profile Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account settings and preferences</p>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-medium text-gray-900">Account Info</h2>
                <p className="text-sm text-gray-500">
                  {profile.role === 'staff' && profile.staff_name ? profile.staff_name : 
                   profile.role === 'student' && profile.student_name ? profile.student_name :
                   profile.role}
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500">User ID</label>
                <p className="text-sm font-medium text-gray-900 mt-1">{profile.user_id}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Email</label>
                <p className="text-sm text-gray-900 mt-1">{profile.email}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Role</label>
                <p className="text-sm text-gray-900 mt-1 capitalize">
                  {profile.role === 'staff' ? 'Staff' : 
                   profile.role === 'student' ? 'Student' : 
                   profile.role}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Member Since</label>
                <p className="text-sm text-gray-900 mt-1">
                  {new Date(profile.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Email Update and Password Change Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Update Email Form */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <h2 className="text-lg font-medium text-gray-900">Update Email Address</h2>
            </div>

            {emailSuccess && (
              <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-green-800">Email updated successfully!</p>
              </div>
            )}

            {emailError && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-sm text-red-800">{emailError}</p>
              </div>
            )}

            <form onSubmit={handleUpdateEmail}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your email address"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isUpdatingEmail || email === profile.email}
                  className="bg-[#235999] hover:bg-[#1e4d87]"
                >
                  {isUpdatingEmail ? 'Updating...' : 'Update Email'}
                </Button>
              </div>
            </form>
          </div>

          {/* Change Password Form */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <h2 className="text-lg font-medium text-gray-900">Change Password</h2>
            </div>

            {passwordSuccess && (
              <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-green-800">Password changed successfully!</p>
              </div>
            )}

            {passwordError && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-sm text-red-800">{passwordError}</p>
              </div>
            )}

            <form onSubmit={handleChangePassword}>
              <div className="space-y-4">
                <div>
                  <PasswordInput
                    id="current-password"
                    label="Current Password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password"
                    required
                    autoComplete="current-password"
                  />
                </div>

                <div>
                  <PasswordInput
                    id="new-password"
                    label="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 8 characters)"
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </div>

                <div>
                  <PasswordInput
                    id="confirm-password"
                    label="Confirm New Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isChangingPassword}
                  className="bg-[#235999] hover:bg-[#1e4d87]"
                >
                  {isChangingPassword ? 'Changing Password...' : 'Change Password'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
