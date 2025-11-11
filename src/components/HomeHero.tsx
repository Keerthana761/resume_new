import { Sparkles, FileText, BrainCircuit, Search, ShieldCheck } from "lucide-react";

export function HomeHero() {
  // Home page should not include login button now

  return (
    <div className="relative min-h-[80vh]">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?q=80&w=2069&auto=format&fit=crop')",
        }}
      />
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/60" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 text-white">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1 mb-6">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm">AI-powered resume screening & job matching</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-4">
            Land the Right Job Faster with Smart Resume Insights
          </h1>
          <p className="text-lg sm:text-xl text-white/90 mb-8">
            Upload your resume and instantly see best-matching roles, tailored recommendations, and improvements to stand out.
          </p>

          <div className="flex flex-wrap items-center gap-4 mb-12">
            <a
              href="#features"
              className="px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors border border-white/20"
            >
              Explore Features
            </a>
          </div>

          <div id="features" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Feature icon={<FileText className="w-5 h-5" />} title="Upload Resume" desc="Support for PDF/DOC and LinkedIn import." />
            <Feature icon={<BrainCircuit className="w-5 h-5" />} title="AI Analysis" desc="Extract skills, roles, and seniority instantly." />
            <Feature icon={<Search className="w-5 h-5" />} title="Smart Matching" desc="See roles that fit your profile immediately." />
            <Feature icon={<ShieldCheck className="w-5 h-5" />} title="Secure & Private" desc="Your data stays safe and controlled by you." />
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-xl bg-white/10 backdrop-blur border border-white/20 p-4">
      <div className="flex items-center gap-2 text-white mb-1">
        {icon}
        <span className="font-semibold">{title}</span>
      </div>
      <p className="text-white/80 text-sm">{desc}</p>
    </div>
  );
}