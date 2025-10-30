// supabase/functions/job_ingest/index.ts
// Enhanced version with API rotation, multiple sources, and preference matching

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// ============================================================================
// TYPES
// ============================================================================

interface APIRotationLog {
  id: string;
  api_name: string;
  last_used_at: string;
  requests_used: number;
  monthly_limit: number;
  status: 'active' | 'rate_limited' | 'error' | 'disabled';
  error_count: number;
}

interface JobPosting {
  company_id?: string | null;
  title: string;
  description: string;
  department?: string | null;
  seniority_level?: string | null;
  location: string;
  country?: string | null;
  is_remote: boolean;
  remote_type?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_currency?: string | null;
  job_type?: string | null;
  source_type: string;
  source_url: string;
  external_id?: string | null;
  posted_date?: string | null;
  is_active: boolean;
  tech_stack?: string[] | null;
  dedup_hash: string;
}

interface FetchResult {
  api_name: string;
  jobs: JobPosting[];
  error?: string;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const getEnv = (key: string): string => {
  // @ts-ignore
  return Deno.env.get(key) || "";
};

const ADZUNA_APP_ID = getEnv("ADZUNA_APP_ID");
const ADZUNA_APP_KEY = getEnv("ADZUNA_APP_KEY");
const JSEARCH_API_KEY = getEnv("JSEARCH_API_KEY");

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

async function generateHash(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("MD5", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

function extractCountry(location: string): string | null {
  const patterns = [
    { regex: /\bUSA?\b|\bUnited States\b/i, country: "United States" },
    { regex: /\bUK\b|\bUnited Kingdom\b/i, country: "United Kingdom" },
    { regex: /\bCanada\b/i, country: "Canada" },
    { regex: /\bAustralia\b/i, country: "Australia" },
  ];
  
  for (const { regex, country } of patterns) {
    if (regex.test(location)) return country;
  }
  return null;
}

function detectRemote(location: string, description: string): { is_remote: boolean; remote_type: string | null } {
  const text = `${location} ${description}`.toLowerCase();
  
  if (/hybrid/i.test(text)) {
    return { is_remote: true, remote_type: "hybrid" };
  }
  if (/remote|work from home|wfh/i.test(text)) {
    return { is_remote: true, remote_type: "fully_remote" };
  }
  return { is_remote: false, remote_type: null };
}

// ============================================================================
// API ROTATION LOGIC
// ============================================================================

async function selectNextAPI(supabase: any): Promise<string | null> {
  const { data: apis, error } = await supabase
    .from("api_rotation_log")
    .select("*")
    .eq("status", "active")
    .order("last_used_at", { ascending: true })
    .limit(3);

  if (error || !apis || apis.length === 0) {
    console.error("No available APIs:", error);
    return null;
  }

  // Find API with lowest usage ratio
  const availableAPIs = apis.filter((api: APIRotationLog) => 
    api.requests_used < api.monthly_limit
  );

  if (availableAPIs.length === 0) {
    console.warn("All APIs have reached their limits");
    return null;
  }

  // Select API with most remaining capacity
  const selected = availableAPIs.sort((a: APIRotationLog, b: APIRotationLog) => {
    const ratioA = a.requests_used / a.monthly_limit;
    const ratioB = b.requests_used / b.monthly_limit;
    return ratioA - ratioB;
  })[0];

  return selected.api_name;
}

async function updateAPIUsage(supabase: any, apiName: string, success: boolean, error?: string) {
  const updateData: any = {
    last_used_at: new Date().toISOString(),
    requests_used: supabase.rpc("increment", { row_id: apiName }),
  };

  if (!success) {
    updateData.error_count = supabase.rpc("increment_error", { row_id: apiName });
    updateData.last_error = error;
    updateData.status = 'error';
  }

  await supabase
    .from("api_rotation_log")
    .update(updateData)
    .eq("api_name", apiName);
}

// ============================================================================
// API FETCHERS
// ============================================================================

async function fetchAdzunaJobs(): Promise<JobPosting[]> {
  if (!ADZUNA_APP_ID || !ADZUNA_APP_KEY) {
    throw new Error("Adzuna credentials not configured");
  }

  const jobs: JobPosting[] = [];
  const url = `https://api.adzuna.com/v1/api/jobs/us/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&results_per_page=50&what=software%20engineer%20OR%20developer%20OR%20intern&content-type=application/json`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Adzuna API error: ${response.status}`);
  }

  const data = await response.json();
  
  for (const job of data.results) {
    const location = job.location?.display_name || "Remote";
    const description = job.description || "";
    const { is_remote, remote_type } = detectRemote(location, description);
    
    const dedupString = `${job.title}||${job.company?.display_name || 'Unknown'}||${location}`;
    const dedup_hash = await generateHash(dedupString);

    jobs.push({
      title: job.title,
      description,
      location,
      country: extractCountry(location),
      is_remote,
      remote_type,
      salary_min: job.salary_min || null,
      salary_max: job.salary_max || null,
      salary_currency: "USD",
      source_type: "adzuna",
      source_url: job.redirect_url,
      external_id: job.id,
      posted_date: job.created,
      is_active: true,
      dedup_hash,
    });
  }

  return jobs;
}

async function fetchJSearchJobs(): Promise<JobPosting[]> {
  if (!JSEARCH_API_KEY) {
    throw new Error("JSearch API key not configured");
  }

  const jobs: JobPosting[] = [];
  const url = "https://jsearch.p.rapidapi.com/search";
  
  const response = await fetch(`${url}?query=entry%20level%20software%20engineer&num_pages=1`, {
    headers: {
      "X-RapidAPI-Key": JSEARCH_API_KEY,
      "X-RapidAPI-Host": "jsearch.p.rapidapi.com"
    }
  });

  if (!response.ok) {
    throw new Error(`JSearch API error: ${response.status}`);
  }

  const data = await response.json();
  
  for (const job of data.data || []) {
    const location = job.job_city || job.job_country || "Remote";
    const description = job.job_description || "";
    const { is_remote, remote_type } = detectRemote(location, description);
    
    const dedupString = `${job.job_title}||${job.employer_name}||${location}`;
    const dedup_hash = await generateHash(dedupString);

    jobs.push({
      title: job.job_title,
      description,
      location,
      country: job.job_country || null,
      is_remote,
      remote_type,
      salary_min: job.job_min_salary || null,
      salary_max: job.job_max_salary || null,
      salary_currency: "USD",
      job_type: job.job_employment_type,
      source_type: "jsearch",
      source_url: job.job_apply_link,
      external_id: job.job_id,
      posted_date: job.job_posted_at_datetime_utc,
      is_active: true,
      dedup_hash,
    });
  }

  return jobs;
}

async function fetchTheMuseJobs(): Promise<JobPosting[]> {
  const jobs: JobPosting[] = [];
  const url = "https://www.themuse.com/api/public/jobs?page=1&level=Entry%20Level";
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`The Muse API error: ${response.status}`);
  }

  const data = await response.json();
  
  for (const job of data.results || []) {
    const location = job.locations?.[0]?.name || "Remote";
    const description = job.contents || "";
    const { is_remote, remote_type } = detectRemote(location, description);
    
    const dedupString = `${job.name}||${job.company?.name || 'Unknown'}||${location}`;
    const dedup_hash = await generateHash(dedupString);

    jobs.push({
      title: job.name,
      description,
      location,
      country: extractCountry(location),
      is_remote,
      remote_type,
      salary_min: null,
      salary_max: null,
      salary_currency: null,
      job_type: job.type,
      source_type: "themuse",
      source_url: job.refs?.landing_page || "",
      external_id: job.id?.toString(),
      posted_date: job.publication_date,
      is_active: true,
      dedup_hash,
    });
  }

  return jobs;
}

// ============================================================================
// JOB INSERTION & MATCHING
// ============================================================================

async function insertJobsWithDedup(
  supabase: any, 
  jobs: JobPosting[]
): Promise<{ inserted: number; skipped: number; insertedIds: string[] }> {
  let inserted = 0;
  let skipped = 0;
  const insertedIds: string[] = [];

  for (const job of jobs) {
    // Check for duplicates
    const { data: existing } = await supabase
      .from("job_postings")
      .select("id")
      .eq("dedup_hash", job.dedup_hash)
      .single();

    if (existing) {
      skipped++;
      continue;
    }

    // Insert new job
    const { data: newJob, error } = await supabase
      .from("job_postings")
      .insert(job)
      .select("id")
      .single();

    if (error) {
      console.error("Insert error:", error);
      skipped++;
    } else {
      inserted++;
      insertedIds.push(newJob.id);
    }
  }

  return { inserted, skipped, insertedIds };
}

async function matchJobsToUserPreferences(supabase: any, jobIds: string[]) {
  if (jobIds.length === 0) return;

  // Get all users with preferences
  const { data: users } = await supabase
    .from("profiles")
    .select("id, email, job_preferences")
    .not("job_preferences", "is", null);

  if (!users) return;

  // Get newly inserted jobs
  const { data: jobs } = await supabase
    .from("job_postings")
    .select("*")
    .in("id", jobIds);

  if (!jobs) return;

  const alerts: any[] = [];

  // Match jobs to user preferences
  for (const user of users) {
    const prefs = user.job_preferences;
    if (!prefs) continue;

    for (const job of jobs) {
      let matches = true;

      // Check keywords
      if (prefs.keywords && prefs.keywords.length > 0) {
        const titleDesc = `${job.title} ${job.description}`.toLowerCase();
        matches = prefs.keywords.some((kw: string) => 
          titleDesc.includes(kw.toLowerCase())
        );
      }

      // Check remote preference
      if (prefs.remote_only && !job.is_remote) {
        matches = false;
      }

      // Check salary
      if (prefs.salary_min && job.salary_max && job.salary_max < prefs.salary_min) {
        matches = false;
      }

      // Create alert if matched
      if (matches) {
        alerts.push({
          user_id: user.id,
          company_id: job.company_id,
          alert_type: "job_opportunity",
          title: `New Job Match: ${job.title}`,
          message: `A new job matching your preferences has been posted: ${job.title} at ${job.location}`,
          data: { job_id: job.id }
        });
      }
    }
  }

  // Insert alerts
  if (alerts.length > 0) {
    await supabase.from("alerts").insert(alerts);
    console.log(`Created ${alerts.length} job match alerts`);
  }
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req: Request) => {
  const startTime = Date.now();
  
  try {
    const supabaseUrl = getEnv("SUPABASE_URL");
    const supabaseKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Starting job ingestion with API rotation...");

    // Select next API to use
    const selectedAPI = await selectNextAPI(supabase);
    if (!selectedAPI) {
      throw new Error("No available APIs for fetching jobs");
    }

    console.log(`Selected API: ${selectedAPI}`);

    // Fetch jobs from selected API
    let jobs: JobPosting[] = [];
    let fetchError: string | undefined;

    try {
      switch (selectedAPI) {
        case "adzuna":
          jobs = await fetchAdzunaJobs();
          break;
        case "jsearch":
          jobs = await fetchJSearchJobs();
          break;
        case "themuse":
          jobs = await fetchTheMuseJobs();
          break;
        default:
          throw new Error(`Unknown API: ${selectedAPI}`);
      }

      await updateAPIUsage(supabase, selectedAPI, true);
    } catch (error) {
      fetchError = (error as Error).message;
      await updateAPIUsage(supabase, selectedAPI, false, fetchError);
      throw error;
    }

    // Insert jobs with deduplication
    const { inserted, skipped, insertedIds } = await insertJobsWithDedup(supabase, jobs);

    // Match new jobs to user preferences
    await matchJobsToUserPreferences(supabase, insertedIds);

    const duration = Date.now() - startTime;

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      source_api: selectedAPI,
      stats: {
        total_fetched: jobs.length,
        inserted,
        skipped,
        alerts_created: insertedIds.length,
      },
      fetch_duration_ms: duration,
    };

    console.log("Job ingestion complete:", result);

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Fatal error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});