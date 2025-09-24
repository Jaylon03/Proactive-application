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

export const useHiringSignals = () => {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSignals = async () => {
    try {
      console.log('Fetching hiring signals...');
      const response = await fetch('/api/hiring-signals'); // No companyId needed
      const data = await response.json();
      setSignals(data.signals || []);
    } catch (err) {
      console.error('Error fetching signals:', err);
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  useEffect(() => {
    fetchSignals();
  }, []);

  return { 
    signals, 
    loading, 
    error,
    refetch: fetchSignals // This function takes NO parameters
  };
};

 