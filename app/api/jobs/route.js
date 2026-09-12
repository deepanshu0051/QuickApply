import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/paymentToken";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "Software Developer";
    let rid = searchParams.get("rid");
    if (rid) {
      rid = rid.trim();
      if (rid.length > 500) {
        return NextResponse.json({ success: false, error: "Invalid request data." }, { status: 400 });
      }
    }
    
    // Check payment token
    const token = request.headers.get("x-quickapply-access-token");
    const payload = verifyToken(token);
    
    if (!payload || !rid || payload.rid !== rid) {
      return NextResponse.json(
        { success: false, error: "Payment required." },
        { status: 402 }
      );
    }
    
    if (!process.env.RAPIDAPI_KEY) {
      return NextResponse.json(
        { success: false, error: "Service configuration error. Please try again later." },
        { status: 500 }
      );
    }

    const url = `https://jsearch.p.rapidapi.com/search-v2?query=${encodeURIComponent(query)}%20in%20India&page=1&num_pages=5`;
    
    const options = {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
      }
    };

    const response = await fetch(url, options);
    const data = await response.json();

    if (data.status === "OK" || data.data) {
      // search-v2 nests jobs under data.jobs; fallback to data itself for older format
      const jobsList = (data.data && data.data.jobs) ? data.data.jobs : (Array.isArray(data.data) ? data.data : []);
      const formattedJobs = jobsList.map((job, index) => {
        // Fallback for title and company
        const title = job.job_title || "Unknown Position";
        const company = job.employer_name || "Unknown Company";
        
        // Location
        let location = "Remote";
        if (job.job_city && job.job_state) {
          location = `${job.job_city}, ${job.job_state}`;
        } else if (job.job_country) {
          location = job.job_country;
        }

        // Job Type (Full-time, Contract, etc.)
        let type = "Full-time";
        if (job.job_employment_type) {
          type = job.job_employment_type.toLowerCase().replace(/_/g, "-");
          // Title case
          type = type.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join("-");
        }

        // Mode (Remote, Onsite, Hybrid)
        let mode = "Onsite";
        if (job.job_is_remote) {
          mode = "Remote";
        }

        // Salary
        let salary = "Not Disclosed";
        if (job.job_min_salary && job.job_max_salary) {
          salary = `$${(job.job_min_salary/1000).toFixed(0)}k - $${(job.job_max_salary/1000).toFixed(0)}k`;
          if (job.job_salary_currency) {
            salary += ` ${job.job_salary_currency}`;
          }
        }

        // Match Score (mocked randomly between 70-98 since we don't have a real matching algo)
        const matchScore = Math.max(70, 95 - index - Math.floor(Math.random() * 5));

        // Posted At
        let postedAt = "Recently";
        if (job.job_posted_at_datetime_utc) {
          const days = Math.floor((new Date() - new Date(job.job_posted_at_datetime_utc)) / (1000 * 60 * 60 * 24));
          if (days === 0) postedAt = "Today";
          else if (days === 1) postedAt = "Yesterday";
          else postedAt = `${days} days ago`;
        }

        // Skills (Extract from description if needed)
        const skills = [];
        const techKeywords = ["React", "JavaScript", "Node.js", "Python", "Java", "SQL", "AWS", "Docker", "TypeScript", "HTML", "CSS", "Next.js", "MongoDB", "Express", "Tailwind", "C++", "C#", "Azure", "GCP"];
        const desc = (job.job_description || "").toLowerCase();
        for (const kw of techKeywords) {
          if (desc.includes(kw.toLowerCase())) {
            skills.push(kw);
          }
        }
        
        if (skills.length === 0) {
          skills.push("Communication", "Problem Solving");
        }

        return {
          id: job.job_id || String(index),
          title,
          company,
          location,
          type,
          mode,
          matchScore,
          salary,
          postedAt,
          skills: skills.slice(0, 5),
          description: job.job_description || "No description provided.",
          applyUrl: job.job_apply_link || "#",
          source: job.job_publisher || "JSearch"
        };
      });

      return NextResponse.json({ success: true, jobs: formattedJobs });
    } else {
      console.error("Job fetch API returned non-OK status or missing data", data);
      return NextResponse.json({ success: false, error: "Failed to fetch jobs. Please try again." }, { status: 400 });
    }
    
  } catch (error) {
    console.error("Jobs API error:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
