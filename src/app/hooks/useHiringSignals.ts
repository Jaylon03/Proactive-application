// FILE: src/app/hooks/useHiringSignals.ts
import { useState, useEffect } from 'react'

interface HiringSignal {
  id: string
  company_id: string
  signal_type: 'funding' | 'team_expansion' | 'product_launch' | 'office_opening' | 'leadership_change' | 'job_posting'
  title: string
  description: string
  confidence_score: number
  source_url?: string
  detected_at: string
  metadata?: Record<string, any>
  companies: {
    id: string
    name: string
    industry: string | null
    employee_count: number | null
  }
}

export const useHiringSignals = (companyId?: string) => {
  const [signals, setSignals] = useState<HiringSignal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSignals = async (companyId: string) => {
  try {
    const response = await fetch(`/api/hiring-signals/${companyId}`);
    
    if (!response.ok) {
      // Get more detailed error information
      const errorText = await response.text();
      console.error('API Error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`Failed to fetch hiring signals: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
};

  useEffect(() => {
    if (companyId) {
      fetchSignals(companyId);
    }
  }, [companyId])

  return {
    signals,
    loading,
    error,
    refetch: fetchSignals
  }
}