# QuickApply 🚀

QuickApply is an AI-powered resume analysis and job matching platform built with **Next.js**. It streamlines the application process by analyzing your resume, providing constructive feedback, and finding the best matching jobs for your profile.

## 🌟 Features

- **Resume Upload & Parsing**: Upload your PDF resume. The app securely extracts text using `pdf-parse` and handles various PDF structures.
- **AI Resume Analysis**: Leverages Google's **Gemini AI** to analyze the resume content. It generates a match score, identifies your key strengths, pinpoints areas for improvement, and extracts your technical skills.
- **Smart Job Matching**: Integrates with the **JSearch RapidAPI** to automatically find matching jobs based on your extracted role and skills.
- **Seamless User Flow**: 
  - `/upload` → Upload your PDF.
  - `/processing` → Beautiful loading states while AI analyzes your profile.
  - `/score` → View your Resume Score, Strengths, and Areas to Improve.
  - `/jobs` → Browse through perfectly matched jobs with smooth client-side pagination.
- **Modern UI/UX**: Designed with glassmorphism, animated backgrounds, and smooth transitions for a premium user experience.

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Styling**: Tailwind CSS / Custom Vanilla CSS (Glassmorphism aesthetics)
- **Database & Storage**: [Supabase](https://supabase.com/) (PostgreSQL & Object Storage)
- **AI Integration**: Google Gemini API
- **External APIs**: JSearch RapidAPI (Job postings)
- **PDF Processing**: `pdf-parse`

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:
- Node.js (v18 or higher)
- npm or yarn

### Environment Variables

Create a `.env.local` file in the root directory and add the following keys:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key

# Google Gemini
GEMINI_API_KEY=your_gemini_api_key

# JSearch API (RapidAPI)
RAPIDAPI_KEY=your_rapidapi_key
```

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/deepanshu0051/QuickApply.git
   cd QuickApply
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

## 📁 Project Structure

- `app/upload/` - Resume upload interface
- `app/processing/` - Analysis loading screens
- `app/score/` - Displays AI-generated resume score & feedback
- `app/jobs/` - Client-side paginated job listings
- `app/api/` - Backend routes (Upload, Analyze, Resume fetch, Jobs fetch)
- `components/` - Reusable UI components (Navbar, AnimatedBackground, etc.)

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/deepanshu0051/QuickApply/issues).
