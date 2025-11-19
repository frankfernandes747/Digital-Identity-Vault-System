import { AppShell } from "@/components/layout/AppShell";
import { createServerSupabase } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return (
      <div className="p-6">
        <p>Please login first.</p>
      </div>
    );
  }
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  async function updateProfile(formData: FormData) {
    "use server";
    const supa = createServerSupabase();
    const { data: { user: currentUser } } = await supa.auth.getUser();
    if (!currentUser) return;

    const full_name = formData.get("full_name") as string;
    const email = formData.get("email") as string;
    await supa.from("profiles").update({ full_name, email }).eq("id", currentUser.id);
  }

  return (
    <div className="min-h-screen profile-bg">
      <AppShell>
        <div className="max-w-7xl mx-auto">
          {/* Compact Header */}
          <div className="dark-card rounded-xl p-8 mb-8">
            <div className="flex items-center space-x-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-xl">
                {(profile?.full_name || user.email || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Your Profile</h1>
                <p className="text-gray-300 mt-1">Manage your account information and preferences</p>
              </div>
            </div>
          </div>

          {/* Side-by-side Layout */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Account Information Card */}
            <div className="dark-card rounded-xl border border-white/10">
              <div className="bg-white/5 px-6 py-4 border-b border-white/10 rounded-t-xl">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Account Information
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">User ID</label>
                    <div className="bg-white/5 rounded-lg p-3 mt-2 border border-white/10">
                      <p className="font-mono text-sm text-gray-300 break-all">
                        {user.id}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Role</label>
                      <div className="mt-2">
                        <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${profile?.role === 'admin'
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                            : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
                          }`}>
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                          {profile?.role || 'user'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Email Status</label>
                      <div className="mt-2">
                        <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${user.email_confirmed_at
                            ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                            : 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                          }`}>
                          <svg className={`w-4 h-4 mr-2 ${user.email_confirmed_at ? '' : 'animate-pulse'}`} fill="currentColor" viewBox="0 0 20 20">
                            {user.email_confirmed_at ? (
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            ) : (
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            )}
                          </svg>
                          {user.email_confirmed_at ? 'Verified' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Account Created</label>
                    <div className="bg-white/5 rounded-lg p-3 mt-2 border border-white/10">
                      <p className="text-gray-300 font-medium">
                        {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        }) : 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        {profile?.created_at ? new Date(profile.created_at).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : ''}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Settings Card */}
            <div className="dark-card rounded-xl border border-white/10">
              <div className="bg-white/5 px-6 py-4 border-b border-white/10 rounded-t-xl">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Profile Settings
                </h2>
                <p className="text-gray-400 text-sm mt-1">Update your personal information</p>
              </div>
              <div className="p-6">
                <form action={updateProfile} className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Full Name</label>
                      <input
                        name="full_name"
                        defaultValue={profile?.full_name || ""}
                        className="w-full px-4 py-3 mt-2 rounded-lg border border-white/20 bg-white/5 text-white placeholder-white/50 focus:bg-white/10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 outline-none"
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Email Address</label>
                      <input
                        name="email"
                        defaultValue={profile?.email || ""}
                        className="w-full px-4 py-3 mt-2 rounded-lg border border-white/20 bg-white/5 text-white placeholder-white/50 focus:bg-white/10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 outline-none"
                        placeholder="Enter your email address"
                      />
                    </div>
                  </div>
                  <div className="pt-4 border-t border-white/10">
                    <button className="w-full inline-flex items-center justify-center px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-500/20 transition-all duration-200 shadow-lg hover:shadow-xl">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </div>
  );
}


