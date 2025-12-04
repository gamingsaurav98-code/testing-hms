'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FinancialSettingsForm } from '@/components/financial/FinancialSettingsForm';
import { useAuth } from '@/lib/auth';

// User role types
type UserRole = 'admin' | 'staff' | 'student';

const useUserRole = (): UserRole => {
  const { user } = useAuth();
  const role = user?.role;
  return role === 'admin' || role === 'staff' || role === 'student' ? role : 'admin';
};

export default function FinancialSettingsPage() {
  const [activeTab, setActiveTab] = useState('settings');
  const userRole = useUserRole();
  const isAdmin = userRole === 'admin';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Financial Settings</h1>
        <p className="text-muted-foreground">
          {isAdmin 
            ? 'Manage financial settings and deduction rules'
            : 'View your financial information and deduction rules'}
        </p>
      </div>

      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
          <TabsTrigger value="settings">Deduction Rules</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Deduction Rules</CardTitle>
              <CardDescription>
                {isAdmin 
                  ? 'Configure checkout duration and deduction percentages.'
                  : 'View the current deduction rules applied to your account.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FinancialSettingsForm isAdmin={isAdmin} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                View your financial transactions and deductions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Transaction history will be displayed here.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Only show admin tools to admins */}
      {isAdmin && (
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Admin Tools</CardTitle>
              <CardDescription>
                Additional financial management tools for administrators.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <Button variant="outline">
                  <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export Financial Data
                </Button>
                <Button variant="outline">
                  <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Generate Financial Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
