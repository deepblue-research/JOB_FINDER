   
**PRODUCT REQUIREMENTS DOCUMENT**

**Job Match**

*AI-Powered Job Recommendation Platform for Engineering Freshers*

 

 **1\. The Problem**

## **1.1 What Problem Does This Solve?**

Every year, hundreds of thousands of engineering students graduate in India and immediately face the same painful experience: spending weeks manually browsing dozens of job portals, filtering through thousands of irrelevant postings, and applying to roles they are either overqualified or underqualified for — with no guidance on what they are missing.

 

Existing platforms like LinkedIn, Naukri, and Indeed are employer-centric. They require the candidate to actively search, filter, and apply. The job seeker must know what to look for, understand which companies are hiring, and manually assess whether each role fits their profile. For a fresher with no industry experience, this is overwhelming.

 

## **1.2 Who Has This Problem?**

* Final-year engineering students (B.Tech / B.E.) in India preparing to enter the job market  
* Recent graduates (0–1 year experience) in tech streams — CSE, IT, ECE — actively job searching  
* Students from non-IIT/NIT colleges who lack strong alumni networks or campus placement access  
* Candidates who are technically capable but do not know how to position themselves or which companies to target

 

## **1.3 Why Is It Important to Solve?**

* India produces over 1.5 million engineering graduates annually; a significant fraction struggle with job placement despite having relevant skills  
* The mismatch between candidate skills and job requirements is largely a discovery and communication problem, not a capability problem  
* Freshers are the segment most poorly served by existing platforms, which optimise for experienced candidates and employer acquisition  
* A personalised, resume-first recommendation approach reduces wasted applications and helps candidates focus on genuinely relevant opportunities

 

# **2\. Product Vision**

 

| Vision | Job Match is a resume-first job recommendation platform that reads an engineering fresher's resume and automatically surfaces the most relevant job opportunities from across the web — so the candidate spends time applying, not searching. |
| :---- | :---- |

 

## **2.1 How It Is Different from Existing Solutions**

 

| Feature | Existing Platforms | Job Match |
| :---- | :---- | :---- |
| **Starting point** | Candidate searches manually | Resume uploaded → matches served automatically |
| **Job inventory** | Platform-specific postings | Aggregated from public ATS APIs (Greenhouse, Lever, Ashby) |
| **Ranking signal** | Keyword match / recency | Resume skills vs job description (AI-driven) |
| **Fresher filter** | Manual filter required | Automatic — senior roles excluded by default |
| **Skill feedback** | None | Skill-gap analysis with course recommendations |

 

# **3\. Core Features**

The platform is scoped to five features for the internship demo. Each feature is independently testable and delivers value to the user.

 

## **Feature 1 — Resume Upload and AI Parsing**

* The user uploads their resume as a PDF file. The platform extracts the text, runs an ATS-friendliness check, and uses the Gemini AI API to structure it into a clean profile: name, skills, education, projects, internships, and inferred interests  
* The resume is the only input the user has to provide. All recommendations flow from it. Automating the extraction removes the burden of manually entering skills and experience  
* If the resume scores below 60/100 on readability (missing sections, image-based PDF, no email), the platform prompts the user to fix it before proceeding — ensuring the AI gets clean input

 

## **Feature 2 — AI-Driven Job Matching**

* The platform fetches live job listings from four public, free ATS APIs — Greenhouse, Lever,JSearch and Ashby — which power the career pages of thousands of real companies. It then ranks these jobs by how many of the candidate's resume skills appear in each job description  
* Instead of browsing 30 company career pages, the candidate sees a ranked list of roles most suited to their actual skill set, with a plain-English explanation for each match  
* Roles requiring more than 1 year of experience and roles with senior titles (Senior, Lead, Manager, Principal) are automatically excluded. The candidate only sees genuinely accessible openings  
* Each result shows which skills matched and why the role was recommended — e.g., 'Matches your Python and SQL skills. Located in Bangalore'

 

## **Feature 3 — Skill Gap Analysis**

* For any matched job, the candidate can click 'Show Skill Gap' to see: which of their skills already match the job, which key skills are missing, and 2–3 free learning resources (Coursera, NPTEL, YouTube) for each missing skill  
* A fresher seeing a job they almost qualify for needs actionable next steps, not just a rejection. The skill gap feature turns a near-miss into a learning roadmap

 

## **Feature 4 — Onboarding Preferences**

* Before or after uploading the resume, the user answers four questions: target role, tech interests, preferred locations, and work mode preference (on-site, remote, or either)  
* Preferences add explicit signals to the AI-inferred resume signals. A candidate interested in cybersecurity but whose resume shows mostly web projects gets cybersecurity-relevant jobs boosted. Location preference ensures only relevant geography is shown

# **4\. Success Metrics**

 

| Metric | Target | How Measured |
| :---- | :---- | :---- |
| **Resume parsing success rate** | ≥ 90% of well-formatted PDFs parse correctly | Manual test across 10 resumes |
| **Match relevance (Precision@10)** | ≥ 5 of top 10 rated relevant by tester | 0/1/2 rating scale per tester |
| **Senior role leakage** | 0 senior roles in top 10 results | Manual review of results |
| **Resume upload to results time** | Under 30 seconds end-to-end | Stopwatch during demo |
| **Skill gap quality** | Skills listed match job description, courses are real | Manual review |
| **ATS scorer accuracy** | Scores single-column clean resumes ≥ 80/100 | Test on 5 known-good resumes |

 

# **5\. User Journey**

## **5.1 User Persona**

 

| Name | Arjun — Final year B.Tech CSE student, Tier-2 engineering college, Kerala |
| :---- | :---- |

 

| Background | Strong in Python and web development. No campus placement. Has applied to 15 companies manually with 2 responses. Does not know which companies are actively hiring freshers. |
| :---- | :---- |

 

| Goal | Find 5–10 genuinely relevant fresher-eligible openings, understand what skills he is missing, and get a job. |
| :---- | :---- |

 

## **5.2 Step-by-Step Journey**

 

| Step | Action | What the Platform Does | Arjun's Experience |
| :---- | :---- | :---- | :---- |
| **1** | Registers with email or GitHub OAuth | Creates account, stores college and batch year | Signed up in under 2 minutes |
| **2** | Completes onboarding form | Stores target role, interests, preferred locations, work mode | 4 questions, takes 60 seconds |
| **3** | Uploads resume PDF | Extracts text, runs ATS check (score: 85/100), parses skills via Gemini AI | Sees his skills listed accurately |
| **4** | Views matched jobs | Fetches live jobs from Greenhouse/Lever/Ashby, ranks by skill overlap, filters senior roles | Sees 10 relevant fresher roles with match reasons |
| **5** | Clicks 'Skill Gap' on a promising role | Gemini compares his skills vs job requirements, lists missing skills \+ courses | Learns he needs Docker; gets a free Udemy course link |
| **6** | Applies via direct link | 'Apply' button opens the company's official ATS page | Applies directly on company site — no middleman |

 

# **6\. Technical Constraints**

## **6.1 Platform**

* Web application (browser-based). No mobile app in v1 — responsive design only  
* Frontend: React 18 \+ Vite \+ TailwindCSS  
* Backend: Python 3.11 \+ FastAPI  
* Database: PostgreSQL 16 with pgvector extension for embedding storage  
* AI: Gemini 1.5 Flash API (free tier) for resume parsing and skill-gap analysis  
* Embeddings: sentence-transformers all-MiniLM-L6-v2 (local, free, no per-query cost)

 

## **6.2 Data Sources**

* Greenhouse Job Board API — public, free, no authentication required  
* Lever Postings API — public, free, no authentication required  
* Ashby Job Board API — public, free, no authentication required  
* JSearch Job Board API — public, free, authentication required  
* No LinkedIn scraping (legally off-limits). No paid job API subscriptions

 

## 

## **6.3 Budget and Resources**

* Total budget: ₹0 — all tools, APIs, and infrastructure used are on free tiers  
* Gemini API free tier: sufficient for demo-scale usage (\~50 resume parses)  
* Database: local PostgreSQL or shared Neon (free hosted Postgres with pgvector)

 

## **6.4 Timeline**

* Total: 14 days   
  * Days 1–2: Architecture, DB schema, GitHub setup, project skeleton  
  * Days 3–5: Resume parsing pipeline, ATS scorer, LLM integration  
  * Days 6–8: Job ingestion (Greenhouse, Lever, Ashby), match engine  
  * Days 9–11: Skill-gap feature, alumni module, frontend integration  
  * Days 12–13: End-to-end testing, evaluation (5–8 testers), bug fixes  
  * Day 14: Demo preparation and presentation


# **7\. Assumptions and Dependencies**

## **7.1 Assumptions**

* Users upload ATS-friendly, single-column PDF or DOCX resumes. Multi-column or image-based resumes are flagged and rejected with guidance  
* Target users are comfortable using a web browser and uploading a file — no app installation required  
* The Greenhouse, Lever, Jsearch, and Ashby public APIs remain accessible and return job data in the same format throughout the 2-week build period  
* Gemini 1.5 Flash free-tier rate limits are sufficient for demo-scale usage (under 50 users during the demo period)  
* English-language resumes only in v1. Non-English resumes are out of scope

 

## 

## 

## **7.2 Dependencies**

| Dependency | Purpose | Risk if Unavailable |
| :---- | :---- | :---- |
| **Gemini 1.5 Flash API** | Resume parsing, skill-gap generation | Core AI features fail; fallback to rule-based parsing only |
| **Greenhouse Public API** | Primary job data source | Reduced job inventory; Lever/Ashby still function |
| **Lever Public API** | Secondary job data source | Reduced job inventory; Greenhouse/Ashby still function |
| **Ashby Public API** | Tertiary job data source | Reduced job inventory; Greenhouse/Lever still function |
| **PostgreSQL \+ pgvector** | Data storage and similarity search | Application cannot persist data; keyword matching used as fallback |
| **sentence-transformers** | Resume and job embeddings | Semantic matching degrades to keyword-only; still functional for demo |
| **GitHub OAuth** | User authentication (optional) | Users fall back to email/password login; no feature loss |

 

# **8\. Known Limitations and Future Work**

The following are deliberate out-of-scope items for v1, documented transparently. They are future-work candidates, not failures of the current design.

 

## **8.1 Current Limitations**

* No mobile app — web only  
* Alumni network is manually seeded; no automated LinkedIn sync (LinkedIn API is not publicly available)  
* Job inventory limited to companies using Greenhouse, Lever, or Ashby ATS; large Indian service companies (TCS, Infosys, Wipro) use proprietary portals not covered  
* Resume parsing optimised for English, single-column, text-based PDFs only  
* No real-time job alerts or email notifications  
* No hiring outcome tracking — cannot measure whether users actually got jobs through the platform  
* JSearch API is free only upto a limit of 200 free monthly requests after which it is paid

 

## **8.2 Future Work**

* Migrate to a shared hosted database (Neon) for multi-machine team collaboration  
* Add semantic embedding-based matching (pgvector cosine similarity) for higher accuracy than keyword overlap  
* Integrate NewsAPI to surface companies with recent hiring announcements and flag companies with recent layoffs  
* Expand job sources — custom scrapers for Naukri and Internshala for India-specific fresher roles  
* Mobile-responsive frontend; long-term: native iOS/Android app  
* TPO (Training and Placement Officer) portal for colleges to submit job postings directly  
* Hiring outcome tracking — a follow-up flow asking users if they got the job, to close the feedback loop  
* Proper Alumni Network and Interaction options

   
the end