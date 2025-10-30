// src/app/api/jobs/route.ts
import { createClient } from '@/app/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID!;
const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY!;

// Helper function to create a dedup hash for job postings
function createDedupHash(title: string, company: string, location: string): string {
  const normalized = `${title}-${company}-${location}`.toLowerCase().replace(/\s+/g, '');
  return crypto.createHash('md5').update(normalized).digest('hex');
}

// Helper function to try to extract the actual job URL from Adzuna redirect
function extractActualJobUrl(adzunaRedirectUrl: string): string | null {
  try {
    const url = new URL(adzunaRedirectUrl);
    // Adzuna often includes the actual URL as a query parameter
    const redirectParam = url.searchParams.get('redirect') || url.searchParams.get('url');
    if (redirectParam) {
      return decodeURIComponent(redirectParam);
    }
  } catch (err) {
    // Invalid URL, return null
  }
  return null;
}

// Transform Adzuna job to database format
async function transformAndStoreAdzunaJob(adzunaJob: any, supabase: any) {
  try {
    const companyName = adzunaJob.company?.display_name || 'Unknown Company';
    const location = adzunaJob.location?.display_name || null;
    const dedupHash = createDedupHash(adzunaJob.title, companyName, location || '');

    // Check if job already exists
    const { data: existingJob } = await supabase
      .from('job_postings')
      .select('id')
      .eq('dedup_hash', dedupHash)
      .single();

    if (existingJob) {
      return existingJob.id; // Job already exists
    }

    // Find or create company
    let companyId = null;
    let companyCareersUrl = null;
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('id, careers_page_url')
      .eq('name', companyName)
      .single();

    if (existingCompany) {
      companyId = existingCompany.id;
      companyCareersUrl = existingCompany.careers_page_url;
    } else {
      // Create new company
      const { data: newCompany, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: companyName,
          website: null,
          industry: adzunaJob.category?.label || null,
          logo_url: null,
        })
        .select('id, careers_page_url')
        .single();

      if (companyError) {
        console.error('Error creating company:', companyError);
      } else {
        companyId = newCompany.id;
        companyCareersUrl = newCompany.careers_page_url;
      }
    }

    // Determine job type and seniority
    const title = adzunaJob.title.toLowerCase();
    let jobType: 'full-time' | 'internship' | 'contract' = 'full-time';
    let seniorityLevel: 'entry' | 'intern' | 'new_grad' = 'entry';

    if (title.includes('intern')) {
      jobType = 'internship';
      seniorityLevel = 'intern';
    } else if (title.includes('contract') || title.includes('contractor')) {
      jobType = 'contract';
    } else if (title.includes('junior') || title.includes('entry') || title.includes('graduate') || title.includes('new grad')) {
      seniorityLevel = title.includes('graduate') || title.includes('new grad') ? 'new_grad' : 'entry';
    }

    // Insert job posting
    // Try to extract the actual job URL from Adzuna's redirect URL
    const actualJobUrl = extractActualJobUrl(adzunaJob.redirect_url);
    // Use in order: 1) company careers page, 2) extracted actual URL, 3) Adzuna redirect
    const jobUrl = companyCareersUrl || actualJobUrl || adzunaJob.redirect_url;

    const { data: newJob, error: jobError } = await supabase
      .from('job_postings')
      .insert({
        company_id: companyId,
        title: adzunaJob.title,
        description: adzunaJob.description,
        seniority_level: seniorityLevel,
        location: location,
        country: adzunaJob.location?.area?.[0] || 'US',
        is_remote: location?.toLowerCase().includes('remote') || false,
        remote_type: location?.toLowerCase().includes('remote') ? 'fully_remote' : 'onsite',
        salary_min: adzunaJob.salary_min ? Math.round(adzunaJob.salary_min) : null,
        salary_max: adzunaJob.salary_max ? Math.round(adzunaJob.salary_max) : null,
        salary_currency: 'USD',
        job_type: jobType,
        source_type: 'indeed',
        source_url: jobUrl,
        external_id: adzunaJob.id?.toString() || null,
        posted_date: adzunaJob.created ? new Date(adzunaJob.created).toISOString() : new Date().toISOString(),
        is_active: true,
        tech_stack: null,
        dedup_hash: dedupHash,
      })
      .select('id')
      .single();

    if (jobError) {
      console.error('Error creating job:', jobError);
      return null;
    }

    return newJob.id;
  } catch (err) {
    console.error('Error transforming Adzuna job:', err);
    return null;
  }
}

// Fetch jobs from Adzuna and store them
async function fetchFromAdzuna(searchQuery: string, location: string, supabase: any) {
  try {
    const country = 'us';
    const page = '1';

    const params = new URLSearchParams({
      app_id: ADZUNA_APP_ID,
      app_key: ADZUNA_APP_KEY,
      results_per_page: '20',
    });

    if (searchQuery) {
      params.append('what', searchQuery);
    }
    if (location) {
      params.append('where', location);
    }

    const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}?${params.toString()}`;
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`Adzuna API error ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    const jobs = data.results || [];

    // Transform and store jobs
    const jobIds = await Promise.all(
      jobs.map((job: any) => transformAndStoreAdzunaJob(job, supabase))
    );

    return jobIds.filter(id => id !== null);
  } catch (err: any) {
    console.error('Error fetching from Adzuna:', err.message);
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Get query parameters
    const search = searchParams.get('search') || '';
    const location = searchParams.get('location') || '';
    const remote = searchParams.get('remote');
    const jobType = searchParams.get('job_type');
    const seniority = searchParams.get('seniority');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const fetchExternal = searchParams.get('fetch_external') === 'true';

    // If fetch_external is true and there's a search query, fetch from Adzuna first
    if (fetchExternal && (search || location)) {
      await fetchFromAdzuna(search, location, supabase);
    }

    // Build database query
    let query = supabase
      .from('job_postings')
      .select(`
        *,
        companies (
          id,
          name,
          industry,
          size_category,
          logo_url,
          headquarters_location
        )
      `)
      .eq('is_active', true)
      .order('posted_date', { ascending: false });

    // Apply filters
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (location) {
      query = query.ilike('location', `%${location}%`);
    }

    if (remote === 'true') {
      query = query.eq('is_remote', true);
    }

    if (jobType) {
      query = query.eq('job_type', jobType);
    }

    if (seniority) {
      query = query.eq('seniority_level', seniority);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: jobs, error } = await query;

    if (error) {
      console.error('Database error:', error);
      throw new Error('Failed to fetch jobs from database');
    }

    return NextResponse.json({
      jobs: jobs || [],
      count: jobs?.length || 0
    });

  } catch (err: any) {
    console.error('Job API error:', err.message);
    return NextResponse.json(
      { error: 'Failed to fetch jobs', details: err.message },
      { status: 500 }
    );
  }
}
