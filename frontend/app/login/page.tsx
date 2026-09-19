"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, apiFetch } from "@/hooks/useAuth";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("alex@example.com");
  const [password, setPassword] = useState("password");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({ detail: "Login failed" }));
        throw new Error(j.detail || "Login failed");
      }
      const data = await res.json();
      // data: {access_token, user}
      login(data.access_token, data.user);
      router.push("/");
    } catch (err: any) {
      // Fallback to mock for demo when backend not running
      if (process.env.NEXT_PUBLIC_API_URL === undefined || err.message.includes("Failed to fetch")) {
        // Check if backend is down, allow mock for design preview
        console.warn("Backend not reachable, using mock login for preview");
        const token = "mock-token-" + Math.random().toString(36).slice(2);
        login(token, { id: "1", email, name: "Alex Kim" });
        router.push("/");
        return;
      }
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <div className="w-full max-w-[360px] bg-surface border border-border rounded-md shadow-e2 p-6">
        <div className="flex items-center gap-2.5 mb-6">
          <span className="w-[34px] h-[34px] rounded-sm bg-gradient-to-br from-[#5B52E8] to-[#4338CA] text-white grid place-items-center shadow-brand"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 4v16M4 12h16" /></svg></span>
          <span><strong className="block text-[14px] font-semibold">Personal OS</strong><small className="block text-text-3 text-[10px] font-bold uppercase tracking-[0.09em]">your second brain</small></span>
        </div>
        <h1 className="text-[20px] font-bold tracking-[-0.02em] mb-1">Welcome back</h1>
        <p className="text-text-2 text-[13px] mb-5">Sign in to your second brain.</p>
        {error && <div className="mb-4 p-3 bg-danger-bg border border-danger-fg/20 rounded-sm text-danger-fg text-[12.5px]">{error}</div>}
        <form onSubmit={handle} className="grid gap-4">
          <div className="grid gap-1.5"><label className="text-[11px] font-bold uppercase tracking-[0.08em] text-text-2">Email</label><input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="w-full min-h-[46px] p-3 border border-border bg-surface-2 rounded-sm text-[13.5px] focus:border-brand focus:bg-surface outline-none" /></div>
          <div className="grid gap-1.5"><label className="text-[11px] font-bold uppercase tracking-[0.08em] text-text-2">Password</label><input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required className="w-full min-h-[46px] p-3 border border-border bg-surface-2 rounded-sm text-[13.5px] focus:border-brand focus:bg-surface outline-none" /></div>
          <button type="submit" disabled={loading} className="min-h-[44px] bg-brand text-on-brand rounded-sm font-semibold hover:bg-brand-hover disabled:opacity-50 transition-colors">{loading ? "Signing in…" : "Sign in"}</button>
        </form>
        <p className="mt-4 text-center text-[12.5px] text-text-2">No account? <Link href="/signup" className="text-brand font-semibold">Sign up</Link></p>
      </div>
    </div>
  );
}
