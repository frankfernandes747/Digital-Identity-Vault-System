"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Home, Mail } from "lucide-react";

export default function AuthPage() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const [loginMode, setLoginMode] = useState<"user" | "admin">("user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isVerificationMessage, setIsVerificationMessage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [particles, setParticles] = useState<Array<{ left: string; delay: string; duration: string }>>([]);

  // Set initial mode based on URL parameters
  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'register') {
      setIsLogin(false);
    } else if (mode === 'signin') {
      setIsLogin(true);
    }
  }, [searchParams]);

  // Generate particles on client side only
  useEffect(() => {
    const particleData = Array.from({ length: 12 }, (_, i) => ({
      left: `${Math.random() * 100}%`,
      delay: `${i * 1.5}s`,
      duration: `${6 + (i % 4) * 2}s`
    }));
    setParticles(particleData);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsVerificationMessage(false);
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) {
          if (String(error.message).toLowerCase().includes("confirm")) {
            throw new Error("Please confirm your email before logging in.");
          }
          throw new Error("Invalid login credentials. Double-check your email and password.");
        }
        if (loginMode === "admin") {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error("Login failed. Try again.");
          const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
          const normalizedRole = String(profile?.role || "").trim().toLowerCase();
          if (normalizedRole === "admin") {
            router.replace("/admin");
            return;
          }
          // Fallback: let the server-side guard decide and redirect accordingly
          router.replace("/admin");
          return;
        }
      } else {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
        if (error) throw error;
        if (data.user) {
          await supabase.from("profiles").upsert({ id: data.user.id, full_name: fullName, email, role: "user" });
        }
        if (!data.session) {
          setIsLogin(true);
          setIsVerificationMessage(true);
          setError("Signup successful. Please check your email to confirm your account, then log in.");
          return;
        }
      }
      router.replace("/dashboard");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Enhanced Animated Background */}
      <div className="absolute inset-0">
        {/* Gradient Background with Animation */}
        <div className="gradient-bg absolute inset-0" />

        {/* Floating Particles */}
        <div className="floating-particles">
          {particles.map((particle, i) => (
            <div
              key={i}
              className="particle"
              style={{
                left: particle.left,
                animationDelay: particle.delay,
                animationDuration: particle.duration
              }}
            />
          ))}
        </div>

        {/* Floating Geometric Shapes */}
        <div className="absolute inset-0">
          {Array.from({ length: 4 }, (_, i) => (
            <div
              key={i}
              className="geometric-shape"
              style={{
                width: `${120 + (i * 40)}px`,
                height: `${120 + (i * 40)}px`,
                left: `${15 + (i * 20)}%`,
                top: `${10 + (i * 15)}%`,
                animationDelay: `${i * 4}s`,
              }}
            />
          ))}
        </div>
      </div>


      {/* Header with logo/title */}
      <header className="bg-black/20 backdrop-blur-xl relative z-10">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-semibold text-white flex items-center gap-2 hover:text-gray-300 transition-colors">
            <Home className="w-5 h-5" /> Digital Identity Vault
          </Link>
        </div>
      </header>

      {/* Auth form content */}
      <div className="grid place-items-center p-6 pt-16 relative z-10">
        <div className="w-full max-w-md rounded-2xl bg-black/20 backdrop-blur-xl p-8 shadow-2xl border border-white/10">
          <h1 className="text-2xl font-semibold text-white mb-2">{isLogin ? "Login" : "Create account"}</h1>
          <p className="text-sm text-gray-300 mb-6">Use your email and password to {isLogin ? "sign in" : "register"}.</p>
          {isLogin && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLoginMode("user")}
                className={`rounded-md border px-3 py-2 text-sm transition-colors ${loginMode === "user"
                  ? "border-blue-400 text-blue-300 bg-blue-600/30"
                  : "border-gray-500 text-gray-300 hover:border-gray-400 bg-black/20"
                  }`}
              >
                Login as User
              </button>
              <button
                type="button"
                onClick={() => setLoginMode("admin")}
                className={`rounded-md border px-3 py-2 text-sm transition-colors ${loginMode === "admin"
                  ? "border-blue-400 text-blue-300 bg-blue-600/30"
                  : "border-gray-500 text-gray-300 hover:border-gray-400 bg-black/20"
                  }`}
              >
                Login as Admin
              </button>
            </div>
          )}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {!isLogin && (
              <div>
                <label className="text-sm font-medium text-gray-200">Full name</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="mt-1 w-full rounded-md border border-gray-600 bg-black/30 backdrop-blur-sm px-3 py-2 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 focus:outline-none transition-colors"
                  placeholder="Jane Doe"
                />
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-200">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 w-full rounded-md border border-gray-600 bg-black/30 backdrop-blur-sm px-3 py-2 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 focus:outline-none transition-colors"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-200">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 w-full rounded-md border border-gray-600 bg-black/30 backdrop-blur-sm px-3 py-2 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 focus:outline-none transition-colors"
                placeholder="••••••••"
              />
            </div>
            {error && (
              <div className={`text-sm p-3 rounded-md border flex items-center gap-2 ${isVerificationMessage
                ? "text-blue-300 bg-blue-900/20 border-blue-500/30"
                : "text-red-300 bg-red-900/20 border-red-500/30"
                }`}>
                {isVerificationMessage && <Mail className="h-4 w-4 text-blue-400" />}
                <span>{error}</span>
              </div>
            )}
            <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-2.5 transition-colors">
              {loading ? "Please wait..." : isLogin ? (loginMode === "admin" ? "Login as Admin" : "Login") : "Register"}
            </Button>
          </form>
          <div className="mt-4 text-sm text-gray-400">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button className="text-blue-400 hover:text-blue-300 underline transition-colors" onClick={() => setIsLogin((v) => !v)}>
              {isLogin ? "Create one" : "Login"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


