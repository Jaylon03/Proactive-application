// functions/job_ingest/index.ts
/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
// Use the global crypto object available in Deno and Node.js

// Types
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
  expires_date?: string | null;
  is_active: boolean;
  tech_stack?: string[] | null;
  dedup_hash: string;
}

interface AdzunaJob {
  id: string;
  title: string;
  description: string;
  location: { display_name: string; area?: string[] };
  company: { display_name: string };
  salary_min?: number;
  salary_max?: number;
  category?: { label: string };
  contract_time?: string;
  redirect_url: string;
  created: string;
}

interface AdzunaResponse {
  results: AdzunaJob[];
  count: number;
}

interface GreenhouseItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  company?: string;
  location?: string;
  department?: string;
}

// Configuration
const getEnv = (key: string): string | undefined => {
  // @ts-ignore
  if (typeof Deno !== "undefined" && Deno.env && typeof Deno.env.get === "function") {
    // @ts-ignore
    return Deno.env.get(key);
  }
  // @ts-ignore
  if (typeof process !== "undefined" && process.env) {
    // @ts-ignore
    return process.env[key];
  }
  return undefined;
};

const ADZUNA_APP_ID = getEnv("ADZUNA_APP_ID") || "";
const ADZUNA_APP_KEY = getEnv("ADZUNA_APP_KEY") || "";
const GREENHOUSE_FEEDS = [
  { url: "https://boards.greenhouse.io/embed/job_board?for=airbnb&format=rss", company: "Airbnb" }
];

// Utility: Generate MD5 hash for deduplication
async function generateHash(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("MD5", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// Extract country from location string
function extractCountry(location: string): string | null {
  const countryPatterns = [
    { pattern: /\bUSA?\b|\bUnited States\b/i, country: "United States" },
    { pattern: /\bUK\b|\bUnited Kingdom\b/i, country: "United Kingdom" },
    { pattern: /\bCanada\b/i, country: "Canada" },
    { pattern: /\bAustralia\b/i, country: "Australia" },
    { pattern: /\bGermany\b/i, country: "Germany" },
    { pattern: /\bFrance\b/i, country: "France" },
  ];

  for (const { pattern, country } of countryPatterns) {
    if (pattern.test(location)) return country;
  }
  return null;
}

// Detect if job is remote
function detectRemote(location: string, description: string): { is_remote: boolean; remote_type: string | null } {
  const remoteKeywords = /remote|work from home|wfh|anywhere/i;
  const hybridKeywords = /hybrid/i;
  
  const text = `${location} ${description}`.toLowerCase();
  
  if (hybridKeywords.test(text)) {
    return { is_remote: true, remote_type: "hybrid" };
  }
  if (remoteKeywords.test(text)) {
    return { is_remote: true, remote_type: "fully_remote" };
  }
  return { is_remote: false, remote_type: null };
}

// Fetch jobs from Adzuna API
async function fetchAdzunaJobs(): Promise<JobPosting[]> {
  if (!ADZUNA_APP_ID || !ADZUNA_APP_KEY) {
    console.warn("Adzuna credentials not configured, skipping...");
    return [];
  }

  const jobs: JobPosting[] = [];
  
  try {
    const url = `https://api.adzuna.com/v1/api/jobs/us/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&results_per_page=50&content-type=application/json`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Adzuna API error: ${response.status} ${response.statusText}`);
    }

    const data: AdzunaResponse = await response.json();
    console.log(`Fetched ${data.results.length} jobs from Adzuna`);

    for (const job of data.results) {
      const location = job.location.display_name;
      const description = job.description || "";
      const { is_remote, remote_type } = detectRemote(location, description);
      
      const dedupString = `${job.title}||${job.company.display_name}||${location}`;
      const dedup_hash = await generateHash(dedupString);

      jobs.push({
        title: job.title,
        description: description,
        department: job.category?.label || null,
        seniority_level: null,
        location: location,
        country: extractCountry(location),
        is_remote,
        remote_type,
        salary_min: job.salary_min || null,
        salary_max: job.salary_max || null,
        salary_currency: job.salary_min || job.salary_max ? "USD" : null,
        job_type: job.contract_time || null,
        source_type: "adzuna",
        source_url: job.redirect_url,
        external_id: job.id,
        posted_date: job.created,
        expires_date: null,
        is_active: true,
        tech_stack: null,
        dedup_hash,
      });
    }
  } catch (error) {
    console.error("Error fetching Adzuna jobs:", error);
  }

  return jobs;
}

// Parse RSS XML
function parseRSS(xml: string): GreenhouseItem[] {
  const items: GreenhouseItem[] = [];
  
  // Simple regex-based RSS parsing (for Edge Function compatibility)
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  const titleRegex = /<title><!\[CDATA\[(.*?)\]\]><\/title>/;
  const linkRegex = /<link>(.*?)<\/link>/;
  const descRegex = /<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/;
  const pubDateRegex = /<pubDate>(.*?)<\/pubDate>/;
  const locationRegex = /<location><!\[CDATA\[(.*?)\]\]><\/location>/;
  const departmentRegex = /<department><!\[CDATA\[(.*?)\]\]><\/department>/;

  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    
    const title = titleRegex.exec(itemXml)?.[1] || "";
    const link = linkRegex.exec(itemXml)?.[1] || "";
    const description = descRegex.exec(itemXml)?.[1] || "";
    const pubDate = pubDateRegex.exec(itemXml)?.[1] || "";
    const location = locationRegex.exec(itemXml)?.[1] || "";
    const department = departmentRegex.exec(itemXml)?.[1] || "";

    if (title && link) {
      items.push({ title, link, description, pubDate, location, department });
    }
  }

  return items;
}

// Fetch jobs from Greenhouse RSS feeds
async function fetchGreenhouseJobs(): Promise<JobPosting[]> {
  const jobs: JobPosting[] = [];

  for (const feed of GREENHOUSE_FEEDS) {
    try {
      const response = await fetch(feed.url);
      if (!response.ok) {
        throw new Error(`Greenhouse RSS error: ${response.status} ${response.statusText}`);
      }

      const xml = await response.text();
      const items = parseRSS(xml);
      console.log(`Fetched ${items.length} jobs from Greenhouse (${feed.company})`);

      for (const item of items) {
        const location = item.location || "Remote";
        const description = item.description || "";
        const { is_remote, remote_type } = detectRemote(location, description);
        
        const dedupString = `${item.title}||${feed.company}||${location}`;
        const dedup_hash = await generateHash(dedupString);

        // Extract external ID from URL (e.g., last segment)
        const urlParts = item.link.split("/");
        const external_id = urlParts[urlParts.length - 1] || null;

        jobs.push({
          title: item.title,
          description: `${feed.company} - ${description}`,
          department: item.department || null,
          seniority_level: null,
          location,
          country: extractCountry(location),
          is_remote,
          remote_type,
          salary_min: null,
          salary_max: null,
          salary_currency: null,
          job_type: null,
          source_type: "greenhouse",
          source_url: item.link,
          external_id,
          posted_date: item.pubDate ? new Date(item.pubDate).toISOString() : null,
          expires_date: null,
          is_active: true,
          tech_stack: null,
          dedup_hash,
        });
      }
    } catch (error) {
      console.error(`Error fetching Greenhouse feed (${feed.company}):`, error);
    }
  }

  return jobs;
}

// Insert jobs into Supabase with deduplication
async function insertJobs(supabase: ReturnType<typeof createClient>, jobs: JobPosting[]): Promise<{ inserted: number; skipped: number }> {
  let inserted = 0;
  let skipped = 0;

  for (const job of jobs) {
    try {
      // Check for existing job by external_id or dedup_hash
      const { data: existing } = await supabase
        .from("job_postings")
        .select("id")
        .or(`external_id.eq.${job.external_id},dedup_hash.eq.${job.dedup_hash}`)
        .limit(1)
        .single();

      if (existing) {
        skipped++;
        continue;
      }

      // Insert new job
      const { error } = await supabase
        .from("job_postings")
        .insert(job);

      if (error) {
        console.error("Insert error:", error);
        skipped++;
      } else {
        inserted++;
      }
    } catch (error) {
      console.error("Error processing job:", error);
      skipped++;
    }
  }

  return { inserted, skipped };
}

// Main handler
serve(async (req: Request) => {
  try {
    // Initialize Supabase client
    // Support both Deno and Node.js environments for environment variables
    const getEnv = (key: string): string | undefined => {
      // @ts-ignore
      if (typeof Deno !== "undefined" && Deno.env && typeof Deno.env.get === "function") {
        // @ts-ignore
        return Deno.env.get(key);
      }
      // @ts-ignore
      if (typeof process !== "undefined" && process.env) {
        // @ts-ignore
        return process.env[key];
      }
      return undefined;
    };

    const supabaseUrl = getEnv("SUPABASE_URL")!;
    const supabaseKey = getEnv("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Starting job ingestion...");

    // Fetch from both sources
    const [adzunaJobs, greenhouseJobs] = await Promise.all([
      fetchAdzunaJobs(),
      fetchGreenhouseJobs(),
    ]);

    const allJobs = [...adzunaJobs, ...greenhouseJobs];
    console.log(`Total jobs fetched: ${allJobs.length}`);

    // Insert jobs with deduplication
    const { inserted, skipped } = await insertJobs(supabase, allJobs);

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      stats: {
        adzuna: adzunaJobs.length,
        greenhouse: greenhouseJobs.length,
        total_fetched: allJobs.length,
        inserted,
        skipped,
      },
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