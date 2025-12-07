'use client';

import { useState } from 'react';
import { FormField } from '@/components/ui/form-field';

interface FinancialSettingsFormProps {
  isAdmin: boolean;
}

export function FinancialSettingsForm({ isAdmin }: FinancialSettingsFormProps) {
  const [settings, setSettings] = useState({
    checkoutDuration: 30,
    deductionPercentage: 10,
    lateFeePerDay: 5,
  });



  if (!isAdmin) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium">Checkout Duration</h3>
            <p className="text-sm text-muted-foreground">
              {settings.checkoutDuration} days
            </p>
          </div>
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium">Deduction Percentage</h3>
            <p className="text-sm text-muted-foreground">
              {settings.deductionPercentage}%
            </p>
          </div>
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium">Late Fee Per Day</h3>
            <p className="text-sm text-muted-foreground">
              ${settings.lateFeePerDay}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField
          label="Checkout Duration (days)"
          name="checkoutDuration"
          type="number"
          value={settings.checkoutDuration.toString()}
          onChange={(e) =>
            setSettings({ ...settings, checkoutDuration: parseInt(e.target.value) || 0 })
          }
        />
        <FormField
          label="Deduction Percentage (%)"
          name="deductionPercentage"
          type="number"
          value={settings.deductionPercentage.toString()}
          onChange={(e) =>
            setSettings({ ...settings, deductionPercentage: parseFloat(e.target.value) || 0 })
          }
        />
        <FormField
          label="Late Fee Per Day ($)"
          name="lateFeePerDay"
          type="number"
          value={settings.lateFeePerDay.toString()}
          onChange={(e) =>
            setSettings({ ...settings, lateFeePerDay: parseFloat(e.target.value) || 0 })
          }
        />
      </div>
    </div>
  );
}
