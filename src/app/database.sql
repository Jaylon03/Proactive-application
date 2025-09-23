-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  subscription_tier TEXT CHECK (subscription_tier IN ('free', 'starter', 'professional')) DEFAULT 'free',
  subscription_status TEXT CHECK (subscription_status IN ('active', 'inactive', 'canceled')) DEFAULT 'inactive',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE TABLE alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT CHECK (type IN ('info', 'warning', 'error', 'success')) DEFAULT 'info',
    read BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Users can only see their own alerts
CREATE POLICY "Users can view own alerts" ON alerts
    FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own alerts
CREATE POLICY "Users can create own alerts" ON alerts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own alerts
CREATE POLICY "Users can update own alerts" ON alerts
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own alerts
CREATE POLICY "Users can delete own alerts" ON alerts
    FOR DELETE USING (auth.uid() = user_id);

-- Companies table
CREATE TABLE public.companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  website TEXT, 
  industry TEXT,
  size_category TEXT CHECK (size_category IN ('startup', 'small', 'medium', 'large', 'enterprise')),
  description TEXT,
  logo_url TEXT,
  linkedin_url TEXT,
  careers_page_url TEXT,
  last_funding_round JSONB, -- {amount, date, round_type, investors}
  employee_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User company tracking
CREATE TABLE public.user_company_tracks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  notification_preferences JSONB DEFAULT '{"email": true, "push": false}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, company_id)
);

-- Hiring signals
CREATE TABLE public.hiring_signals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  signal_type TEXT NOT NULL CHECK (signal_type IN ('funding', 'job_posting', 'team_expansion', 'office_opening', 'leadership_change', 'product_launch')),
  title TEXT NOT NULL,
  description TEXT,
  confidence_score INTEGER CHECK (confidence_score >= 1 AND confidence_score <= 10),
  source_url TEXT,
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB -- Store additional signal-specific data
);

-- Job opportunities (potential jobs we detect)
CREATE TABLE public.job_opportunities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  department TEXT,
  level TEXT CHECK (level IN ('entry', 'mid', 'senior', 'lead', 'executive')),
  location TEXT,
  salary_range TEXT,
  job_type TEXT CHECK (job_type IN ('full-time', 'part-time', 'contract', 'internship')),
  description TEXT,
  requirements TEXT[],
  posted_url TEXT, -- URL when job goes live
  predicted_post_date DATE, -- Our AI prediction
  confidence_score INTEGER CHECK (confidence_score >= 1 AND confidence_score <= 10),
  status TEXT CHECK (status IN ('predicted', 'posted', 'closed')) DEFAULT 'predicted',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employee contacts for networking
CREATE TABLE public.employee_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  job_title TEXT,
  department TEXT,
  linkedin_url TEXT,
  email TEXT,
  is_hiring_manager BOOLEAN DEFAULT FALSE,
  seniority_level TEXT CHECK (seniority_level IN ('entry', 'mid', 'senior', 'lead', 'executive')),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alerts sent to users
CREATE TABLE public.alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('hiring_signal', 'job_opportunity', 'networking_tip')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB, -- Store additional alert data
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE
);

-- Waitlist for pre-launch
CREATE TABLE public.waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  source TEXT DEFAULT 'landing_page',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_companies_name ON public.companies(name);
CREATE INDEX idx_hiring_signals_company_id ON public.hiring_signals(company_id);
CREATE INDEX idx_hiring_signals_detected_at ON public.hiring_signals(detected_at DESC);
CREATE INDEX idx_job_opportunities_company_id ON public.job_opportunities(company_id);
CREATE INDEX idx_employee_contacts_company_id ON public.employee_contacts(company_id);
CREATE INDEX idx_alerts_user_id ON public.alerts(user_id);
CREATE INDEX idx_alerts_sent_at ON public.alerts(sent_at DESC);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_company_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Profiles: Users can only see and edit their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- User company tracks: Users can only see their own tracks
CREATE POLICY "Users can view own tracks" ON public.user_company_tracks
  FOR ALL USING (auth.uid() = user_id);

-- Alerts: Users can only see their own alerts
CREATE POLICY "Users can view own alerts" ON public.alerts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own alerts" ON public.alerts
  FOR UPDATE USING (auth.uid() = user_id);

-- Public read access for companies and related data
CREATE POLICY "Anyone can view companies" ON public.companies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can view hiring signals" ON public.hiring_signals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can view job opportunities" ON public.job_opportunities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can view employee contacts" ON public.employee_contacts FOR SELECT TO authenticated USING (true);

-- Functions
-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();