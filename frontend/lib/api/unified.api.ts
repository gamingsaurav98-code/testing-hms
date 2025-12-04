/**
 * Unified API Service for HMS
 * Ensures data consistency across Admin, Staff, and Student portals
 */

import { API_BASE_URL, handleResponse, safeFetch } from './core';
import { getAuthHeaders } from './auth.api';
// Note: explicit per-API imports removed where unused to avoid lint noise

export type UserRole = 'admin' | 'staff' | 'student';

export interface UnifiedStudentData {
  id: string;
  profile: unknown;
  checkInOut: unknown[];
  financial: unknown[];
  complaints: unknown[];
}

export interface UnifiedStaffData {
  id: string;
  profile: unknown;
  checkInOut: unknown[];
  financial: unknown[];
  complaints: unknown[];
  salary: unknown[];
}

export interface UnifiedComplaintData {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  student?: unknown;
  staff?: unknown;
  chats?: unknown[];
}

export interface DashboardSyncData {
  lastUpdated: string;
  students: {
    total: number;
    checkedIn: number;
    outstandingDues: number;
  };
  staff: {
    total: number;
    present: number;
    salaryPending: number;
  };
  complaints: {
    total: number;
    pending: number;
    resolved: number;
  };
  financial: {
    income: number;
    expense: number;
    salaryExpense: number;
  };
}

export class UnifiedApi {
  /**
   * Get student data with role-based access control
   */
  static async getStudentData(studentId: string, userRole: UserRole): Promise<UnifiedStudentData> {
    try {
      let profile, checkInOut, financial, complaints;

      if (userRole === 'admin') {
        // Admin has full access
        const [profileRes, checkInOutRes, financialRes, complaintsRes] = await Promise.all([
          safeFetch(`${API_BASE_URL}/students/${studentId}`, { headers: getAuthHeaders() }),
          safeFetch(`${API_BASE_URL}/student-checkincheckouts?student_id=${studentId}`, { headers: getAuthHeaders() }),
          safeFetch(`${API_BASE_URL}/student-financials?student_id=${studentId}`, { headers: getAuthHeaders() }),
          safeFetch(`${API_BASE_URL}/complains?student_id=${studentId}`, { headers: getAuthHeaders() })
        ]);

        profile = await handleResponse(profileRes);
        checkInOut = await handleResponse(checkInOutRes);
        financial = await handleResponse(financialRes);
        complaints = await handleResponse(complaintsRes);
      } else if (userRole === 'student') {
        // Student has limited access to own data
        const [profileRes, checkInOutRes, financialRes, complaintsRes] = await Promise.all([
          safeFetch(`${API_BASE_URL}/student/profile`, { headers: getAuthHeaders() }),
          safeFetch(`${API_BASE_URL}/student/checkincheckout-history`, { headers: getAuthHeaders() }),
          safeFetch(`${API_BASE_URL}/student/payment-history`, { headers: getAuthHeaders() }),
          safeFetch(`${API_BASE_URL}/student/complains`, { headers: getAuthHeaders() })
        ]);

        profile = await handleResponse(profileRes);
        checkInOut = await handleResponse(checkInOutRes);
        financial = await handleResponse(financialRes);
        complaints = await handleResponse(complaintsRes);
      } else {
        // Staff has no access to student data
        throw new Error('Unauthorized access to student data');
      }

      return {
        id: studentId,
        profile,
        checkInOut: Array.isArray(checkInOut) ? checkInOut : (checkInOut as { data?: unknown[] })?.data || [],
        financial: Array.isArray(financial) ? financial : (financial as { data?: unknown[] })?.data || [],
        complaints: Array.isArray(complaints) ? complaints : (complaints as { data?: unknown[] })?.data || []
      };
    } catch (error) {
      console.error('Error fetching unified student data:', error);
      throw error;
    }
  }

  /**
   * Get staff data with role-based access control
   */
  static async getStaffData(staffId: string, userRole: UserRole): Promise<UnifiedStaffData> {
    try {
      let profile, checkInOut, financial, complaints, salary;

      if (userRole === 'admin') {
        // Admin has full access
        const [profileRes, checkInOutRes, financialRes, complaintsRes, salaryRes] = await Promise.all([
          safeFetch(`${API_BASE_URL}/staff/${staffId}`, { headers: getAuthHeaders() }),
          safeFetch(`${API_BASE_URL}/staff-checkincheckouts?staff_id=${staffId}`, { headers: getAuthHeaders() }),
          safeFetch(`${API_BASE_URL}/staff-financials?staff_id=${staffId}`, { headers: getAuthHeaders() }),
          safeFetch(`${API_BASE_URL}/complains?staff_id=${staffId}`, { headers: getAuthHeaders() }),
          safeFetch(`${API_BASE_URL}/staff/${staffId}/salaries`, { headers: getAuthHeaders() })
        ]);

        profile = await handleResponse(profileRes);
        checkInOut = await handleResponse(checkInOutRes);
        financial = await handleResponse(financialRes);
        complaints = await handleResponse(complaintsRes);
        salary = await handleResponse(salaryRes);
      } else if (userRole === 'staff') {
        // Staff has limited access to own data
        const [profileRes, checkInOutRes, financialRes, complaintsRes, salaryRes] = await Promise.all([
          safeFetch(`${API_BASE_URL}/staff/profile`, { headers: getAuthHeaders() }),
          safeFetch(`${API_BASE_URL}/staff/checkincheckout-history`, { headers: getAuthHeaders() }),
          safeFetch(`${API_BASE_URL}/staff/financials`, { headers: getAuthHeaders() }),
          safeFetch(`${API_BASE_URL}/staff/complains`, { headers: getAuthHeaders() }),
          safeFetch(`${API_BASE_URL}/staff/salary-history`, { headers: getAuthHeaders() })
        ]);

        profile = await handleResponse(profileRes);
        checkInOut = await handleResponse(checkInOutRes);
        financial = await handleResponse(financialRes);
        complaints = await handleResponse(complaintsRes);
        salary = await handleResponse(salaryRes);
      } else {
        // Student has no access to staff data
        throw new Error('Unauthorized access to staff data');
      }

      return {
        id: staffId,
        profile,
        checkInOut: Array.isArray(checkInOut) ? checkInOut : (checkInOut as { data?: unknown[] })?.data || [],
        financial: Array.isArray(financial) ? financial : (financial as { data?: unknown[] })?.data || [],
        complaints: Array.isArray(complaints) ? complaints : (complaints as { data?: unknown[] })?.data || [],
        salary: Array.isArray(salary) ? salary : (salary as { data?: unknown[] })?.data || []
      };
    } catch (error) {
      console.error('Error fetching unified staff data:', error);
      throw error;
    }
  }

  /**
   * Get complaint data with proper role-based filtering
   */
  static async getComplaintData(complaintId: string, userRole: UserRole): Promise<UnifiedComplaintData> {
    try {
      let endpoint;
      
      if (userRole === 'admin') {
        endpoint = `${API_BASE_URL}/complains/${complaintId}`;
      } else if (userRole === 'student') {
        endpoint = `${API_BASE_URL}/student/complains/${complaintId}`;
      } else if (userRole === 'staff') {
        endpoint = `${API_BASE_URL}/staff/complains/${complaintId}`;
      } else {
        throw new Error('Invalid user role');
      }

      const response = await safeFetch(endpoint, { headers: getAuthHeaders() });
      const complaint = await handleResponse<unknown>(response);

      return {
        id: complaintId,
        title: complaint.title,
        description: complaint.description,
        status: complaint.status,
        created_at: complaint.created_at,
        student: complaint.student,
        staff: complaint.staff,
        chats: complaint.chats || []
      };
    } catch (error) {
      console.error('Error fetching unified complaint data:', error);
      throw error;
    }
  }

  /**
   * Get synchronized dashboard data across all portals
   */
  static async getDashboardSyncData(userRole: UserRole): Promise<DashboardSyncData> {
    try {
      const timestamp = new Date().toISOString();
      
      if (userRole === 'admin') {
        // Admin gets full system statistics
        const [studentsRes, staffRes, complaintsRes, incomeRes, expenseRes, salaryStatsRes] = await Promise.all([
          safeFetch(`${API_BASE_URL}/students?paginate=false`, { headers: getAuthHeaders() }),
          safeFetch(`${API_BASE_URL}/staff?paginate=false`, { headers: getAuthHeaders() }),
          safeFetch(`${API_BASE_URL}/complains?paginate=false`, { headers: getAuthHeaders() }),
          safeFetch(`${API_BASE_URL}/incomes/statistics`, { headers: getAuthHeaders() }),
          safeFetch(`${API_BASE_URL}/expenses/statistics`, { headers: getAuthHeaders() }),
          safeFetch(`${API_BASE_URL}/salaries/statistics`, { headers: getAuthHeaders() })
        ]);

        const [students, staff, complaints, incomeStats, expenseStats, salaryStats] = await Promise.all([
          handleResponse<unknown>(studentsRes),
          handleResponse<unknown>(staffRes),
          handleResponse<unknown>(complaintsRes),
          handleResponse<unknown>(incomeRes),
          handleResponse<unknown>(expenseRes),
          handleResponse<unknown>(salaryStatsRes)
        ]);

        return {
          lastUpdated: timestamp,
          students: {
            total: Array.isArray(students) ? students.length : students?.data?.length || 0,
            checkedIn: 0, // Calculate from check-in data
            outstandingDues: 0 // Calculate from financial data
          },
          staff: {
            total: Array.isArray(staff) ? staff.length : staff?.data?.length || 0,
            present: 0, // Calculate from check-in data
            salaryPending: salaryStats?.pending_salaries_this_month || 0
          },
          complaints: {
            total: Array.isArray(complaints) ? complaints.length : complaints?.data?.length || 0,
            pending: Array.isArray(complaints) 
              ? complaints.filter((c: unknown) => (c as { status?: string }).status === 'pending').length 
              : 0,
            resolved: Array.isArray(complaints) 
              ? complaints.filter((c: unknown) => (c as { status?: string }).status === 'resolved').length 
              : 0
          },
          financial: {
            income: incomeStats?.total_amount_this_month || 0,
            expense: expenseStats?.total_amount_this_month || 0,
            salaryExpense: salaryStats?.total_amount_this_month || 0
          }
        };
      } else if (userRole === 'student') {
        // Student gets limited personal data — only fetch what's used for the dashboard
        const complaintsRes = await safeFetch(`${API_BASE_URL}/student/complains`, { headers: getAuthHeaders() });
        const complaints = await handleResponse<unknown>(complaintsRes);

        return {
          lastUpdated: timestamp,
          students: {
            total: 1,
            checkedIn: 1, // Assume current user is checked in
            outstandingDues: 0 // Calculate from payment history
          },
          staff: { total: 0, present: 0, salaryPending: 0 },
          complaints: {
            total: Array.isArray(complaints) ? complaints.length : complaints?.data?.length || 0,
            pending: Array.isArray(complaints) 
              ? complaints.filter((c: unknown) => (c as { status?: string }).status === 'pending').length 
              : 0,
            resolved: Array.isArray(complaints) 
              ? complaints.filter((c: unknown) => (c as { status?: string }).status === 'resolved').length 
              : 0
          },
          financial: {
            income: 0,
            expense: 0,
            salaryExpense: 0
          }
        };
      } else if (userRole === 'staff') {
        // Staff gets limited operational data
        // For dashboard we just need complaints and salary history; avoid fetching profile if unused
        const [complaintsRes, salaryRes] = await Promise.all([
          safeFetch(`${API_BASE_URL}/staff/complains`, { headers: getAuthHeaders() }),
          safeFetch(`${API_BASE_URL}/staff/salary-history`, { headers: getAuthHeaders() })
        ]);

        const [complaints, salary] = await Promise.all([
          handleResponse<unknown>(complaintsRes),
          handleResponse<unknown>(salaryRes)
        ]);

        return {
          lastUpdated: timestamp,
          students: { total: 0, checkedIn: 0, outstandingDues: 0 },
          staff: {
            total: 1,
            present: 1, // Assume current user is present
            salaryPending: Array.isArray(salary)
              ? salary.filter((s: unknown) => ((s as { status?: string }).status) === 'pending').length
              : 0
          },
          complaints: {
            total: Array.isArray(complaints) ? complaints.length : complaints?.data?.length || 0,
            pending: Array.isArray(complaints) 
              ? complaints.filter((c: unknown) => (c as { status?: string }).status === 'pending').length 
              : 0,
            resolved: Array.isArray(complaints) 
              ? complaints.filter((c: unknown) => (c as { status?: string }).status === 'resolved').length 
              : 0
          },
          financial: {
            income: 0,
            expense: 0,
            salaryExpense: 0
          }
        };
      } else {
        throw new Error('Invalid user role');
      }
    } catch (error) {
      console.error('Error fetching dashboard sync data:', error);
      throw error;
    }
  }

  /**
   * Invalidate cache and refresh data across all portals
   */
  static async invalidateCache(entityType: 'student' | 'staff' | 'complaint' | 'financial', entityId?: string): Promise<void> {
    try {
      // This would trigger a cache invalidation in a real-time system
      // For now, we'll emit a custom event that components can listen to
      const event = new CustomEvent('hms-data-invalidated', {
        detail: {
          entityType,
          entityId,
          timestamp: new Date().toISOString()
        }
      });
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(event);
      }
    } catch (error) {
      console.error('Error invalidating cache:', error);
    }
  }

  /**
   * Subscribe to real-time updates (placeholder for WebSocket implementation)
   */
  static subscribeToUpdates(entityType: 'student' | 'staff' | 'complaint' | 'financial', callback: (data: unknown) => void): () => void {
    const handleUpdate = (event: CustomEvent) => {
      if (event.detail.entityType === entityType) {
        callback(event.detail);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('hms-data-invalidated', handleUpdate as EventListener);
      
      return () => {
        window.removeEventListener('hms-data-invalidated', handleUpdate as EventListener);
      };
    }
    
    return () => {};
  }
}

export default UnifiedApi;
