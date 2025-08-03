"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Button, 
  SearchBar, 
  TableSkeleton 
} from '@/components/ui';
import { 
  AlertCircle, 
  Calendar, 
  Eye,
  Clock,
  User,
  Home,
  Settings
} from 'lucide-react';

interface Notice {
  id: string;
  title: string;
  content: string;
  type: 'general' | 'urgent' | 'announcement' | 'maintenance';
  target_audience: 'all' | 'staff' | 'students';
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export default function StaffNoticePage() {
  const router = useRouter();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [filteredNotices, setFilteredNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'general' | 'urgent' | 'announcement' | 'maintenance'>('all');

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // TODO: Implement actual API call when notice API is ready
      setNotices([]);
      setFilteredNotices([]);
    } catch (err) {
      console.error('Error fetching notices:', err);
      setError('Failed to load notices. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter notices based on search query and filter
  useEffect(() => {
    let filtered = notices;
    
    if (filter !== 'all') {
      filtered = filtered.filter(notice => notice.type === filter);
    }
    
    if (searchQuery.trim()) {
      filtered = filtered.filter(notice =>
        notice.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notice.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredNotices(filtered);
  }, [searchQuery, filter, notices]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleViewNotice = (noticeId: string) => {
    // In a real app, this would navigate to notice detail page
    console.log('View notice:', noticeId);
  };

  const getNoticeTypeColor = (type: string) => {
    const colors = {
      urgent: 'bg-red-100 text-red-800 border-red-200',
      announcement: 'bg-blue-100 text-blue-800 border-blue-200',
      maintenance: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      general: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[type as keyof typeof colors] || colors.general;
  };

  const getTargetIcon = (targetType: string) => {
    switch (targetType) {
      case 'all':
        return <User className="w-4 h-4" />;
      case 'staff':
        return <User className="w-4 h-4" />;
      case 'students':
        return <Home className="w-4 h-4" />;
      default:
        return <Settings className="w-4 h-4" />;
    }
  };

  const getTargetDisplay = (notice: Notice) => {
    switch (notice.target_audience) {
      case 'all':
        return 'All Users';
      case 'staff':
        return 'All Staff';
      case 'students':
        return 'All Students';
      default:
        return 'Unknown';
    }
  };

  if (loading && filteredNotices.length === 0) {
    return (
      <div className="p-6 w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Staff Notices</h1>
          <p className="text-gray-600">Stay updated with important announcements and information</p>
        </div>
        <TableSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Staff Notices</h1>
          <p className="text-gray-600">Stay updated with important announcements and information</p>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
            <p className="text-red-800">{error}</p>
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
    <div className="p-6 w-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Staff Notices</h1>
            <p className="text-gray-600">Stay updated with important announcements and information</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">{notices.length} total notices</p>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <SearchBar
          value={searchQuery}
          onChange={handleSearch}
          placeholder="Search notices by title or content..."
        />
        
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => setFilter('all')}
            variant={filter === 'all' ? 'primary' : 'secondary'}
            size="sm"
          >
            All Notices
          </Button>
          <Button
            onClick={() => setFilter('urgent')}
            variant={filter === 'urgent' ? 'primary' : 'secondary'}
            size="sm"
          >
            Urgent
          </Button>
          <Button
            onClick={() => setFilter('announcement')}
            variant={filter === 'announcement' ? 'primary' : 'secondary'}
            size="sm"
          >
            Announcements
          </Button>
          <Button
            onClick={() => setFilter('maintenance')}
            variant={filter === 'maintenance' ? 'primary' : 'secondary'}
            size="sm"
          >
            Maintenance
          </Button>
          <Button
            onClick={() => setFilter('general')}
            variant={filter === 'general' ? 'primary' : 'secondary'}
            size="sm"
          >
            General
          </Button>
        </div>
      </div>

      {/* Notices List */}
      {filteredNotices.length === 0 ? (
        <div className="text-center py-12">
          <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No notices found</h3>
          <p className="text-gray-500">
            {searchQuery || filter !== 'all' 
              ? 'Try adjusting your search criteria or filters' 
              : 'No notices have been posted yet'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotices.map((notice) => (
            <div
              key={notice.id}
              className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Notice Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        {getTargetIcon(notice.target_audience)}
                        <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 cursor-pointer"
                            onClick={() => handleViewNotice(notice.id)}>
                          {notice.title}
                        </h3>
                      </div>
                      
                      {/* Notice Type Badge */}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getNoticeTypeColor(notice.type)}`}>
                        {notice.type === 'urgent' && <AlertCircle className="w-3 h-3 mr-1" />}
                        {notice.type === 'announcement' && <Calendar className="w-3 h-3 mr-1" />}
                        {notice.type === 'maintenance' && <Settings className="w-3 h-3 mr-1" />}
                        {notice.type}
                      </span>
                    </div>

                    {/* Notice Description */}
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {notice.content}
                    </p>

                    {/* Notice Meta Information */}
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>For: {getTargetDisplay(notice)}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Posted: {new Date(notice.created_at).toLocaleDateString()}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${notice.is_active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        <span>{notice.is_active ? 'Active' : 'Inactive'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="ml-4">
                    <Button
                      onClick={() => handleViewNotice(notice.id)}
                      variant="secondary"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
