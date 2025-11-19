import Link from "next/link";
import { Shield, Clock, Tag, Upload, Zap, CheckCircle2, Home as HomeIcon } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen homepage-bg relative overflow-hidden">
      {/* Floating Elements - Unique to Homepage */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 8 }, (_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/5 animate-pulse"
            style={{
              width: `${40 + (i * 20)}px`,
              height: `${40 + (i * 20)}px`,
              left: `${10 + (i * 12)}%`,
              top: `${20 + (i * 8)}%`,
              animationDelay: `${i * 2}s`,
              animationDuration: `${4 + (i % 3)}s`
            }}
          />
        ))}
      </div>

      <header className="bg-black/20 backdrop-blur-xl relative z-10">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-semibold text-white flex items-center gap-2 hover:text-gray-300 transition-colors">
            <HomeIcon className="w-5 h-5" /> Digital Identity Vault
          </Link>
          <nav className="space-x-4 text-sm">
            <Link href="/auth" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-medium transition-colors">
              Login / Register
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-16 relative z-10">
        <section className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">Your secure home for important documents</h1>
            <p className="mt-4 text-gray-300">Upload, tag, track expiry dates, and securely share your identity documents. Admin approval keeps everything compliant.</p>
            <div className="mt-6">
              <Link href="/auth" className="inline-flex items-center rounded-md bg-blue-600 text-white px-5 py-3 text-sm font-medium hover:bg-blue-700 transition-colors shadow-lg">
                Get Started
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Feature icon={<Upload className="w-5 h-5" />} title="Upload documents" desc="Store files in secure cloud storage" />
            <Feature icon={<Tag className="w-5 h-5" />} title="Tags & filters" desc="Find files by tags, type, or category" />
            <Feature icon={<Clock className="w-5 h-5" />} title="Expiry alerts" desc="See what's expiring soon" />
            <Feature icon={<Shield className="w-5 h-5" />} title="Secure sharing" desc="Generate time-limited links" />
          </div>
        </section>
        <section className="mt-16 grid md:grid-cols-3 gap-6">
          {["Upload", "Tag", "Approve"].map((s, i) => (
            <div key={i} className="dark-card rounded-xl p-6">
              <div className="flex items-center gap-2 text-blue-400 font-medium">
                <Zap className="w-4 h-4" /> Step {i + 1}
              </div>
              <h3 className="mt-2 font-semibold text-lg text-white">{s} your documents</h3>
              <p className="text-sm text-gray-300">Simple flows for uploading files, tagging, and getting admin approval.</p>
            </div>
          ))}
        </section>
        <p className="mt-10 flex items-center gap-2 text-sm text-gray-300"><CheckCircle2 className="w-4 h-4 text-green-400" /> Privacy-first. You control access at all times.</p>
      </main>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="dark-card-lighter rounded-xl p-5">
      <div className="flex items-center gap-2 font-medium text-blue-400">{icon} {title}</div>
      <p className="mt-2 text-sm text-gray-300">{desc}</p>
    </div>
  );
}
