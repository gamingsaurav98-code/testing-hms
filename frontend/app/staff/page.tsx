'use client';

import React from 'react';

export default function StaffDashboard() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        Staff Dashboard
      </h1>
      <p className="text-gray-600 mb-8">
        Welcome back! Here's what's happening today.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Available Rooms</h3>
          <p className="text-3xl font-bold text-blue-600">28</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Students</h3>
          <p className="text-3xl font-bold text-green-600">156</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Occupied Rooms</h3>
          <p className="text-3xl font-bold text-purple-600">142</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Pending Issues</h3>
          <p className="text-3xl font-bold text-red-600">7</p>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md border">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activities</h2>
        <div className="space-y-3">
          <div className="border-l-4 border-blue-500 pl-4">
            <p className="font-medium">Room 205 checked in</p>
            <p className="text-sm text-gray-500">2 minutes ago</p>
          </div>
          <div className="border-l-4 border-green-500 pl-4">
            <p className="font-medium">New student registered</p>
            <p className="text-sm text-gray-500">15 minutes ago</p>
          </div>
          <div className="border-l-4 border-red-500 pl-4">
            <p className="font-medium">Maintenance request - Room 101</p>
            <p className="text-sm text-gray-500">1 hour ago</p>
          </div>
        </div>
      </div>
    </div>
  );
}
