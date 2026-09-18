"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";

type User = { id: string; email: string; name: string } | null;

type AuthCtx = {
  token: string | null;
  user: User;
  login: (token: string, user: User) => void;
  logout: () => void;
  ready: boolean;
};

const Ctx = createContext<AuthCtx>({ token: null, user: null, login: () => {}, logout: () => {}, ready: false });

const LS_KEY = "pos-access-token";
const USER_KEY = "pos-user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User>(null);
  const [ready, setReady] = useState(false);

  // fragment handoff: /#t=<token> consumed on boot, stripped when storage works
  useEffect(() => {
    const hash = window.location.hash;
    const fragMatch = hash.match(/[#&]t=([^&]+)/);
    let fragToken: string | null = null;
    if (fragMatch) {
      try { fragToken = decodeURIComponent(fragMatch[1]); } catch { fragToken = fragMatch[1]; }
    }

    let lsToken: string | null = null;
    try { lsToken = localStorage.getItem(LS_KEY); } catch {}

    let lsUser: User = null;
    try {
      const raw = localStorage.getItem(USER_KEY);
      if (raw) lsUser = JSON.parse(raw);
    } catch {}

    // priority: ls > fragment
    const finalToken = lsToken || fragToken;
    if (finalToken) {
      setToken(finalToken);
      if (fragToken) {
        try { localStorage.setItem(LS_KEY, fragToken); } catch {}
        // strip fragment without reload, keep other hash if present? spec says strip when storage works
        // we keep non-t hash parts
        const newHash = hash.replace(/[#&]t=[^&]+/g, "").replace(/^#&/, "#").replace(/^#$/, "");
        history.replaceState(null, "", window.location.pathname + window.location.search + newHash);
      }
    }
    if (lsUser) setUser(lsUser);
    setReady(true);
  }, []);

  const login = useCallback((t: string, u: User) => {
    setToken(t);
    setUser(u);
    try {
      localStorage.setItem(LS_KEY, t);
      if (u) localStorage.setItem(USER_KEY, JSON.stringify(u));
    } catch {}
    // also carry via fragment for iframe reload survival
    const url = new URL(window.location.href);
    url.hash = `t=${encodeURIComponent(t)}`;
    history.replaceState(null, "", url.toString());
    // strip if storage works (it does, we just wrote)
    setTimeout(() => {
      try {
        if (localStorage.getItem(LS_KEY)) {
          const clean = new URL(window.location.href);
          clean.hash = clean.hash.replace(/[#&]t=[^&]+/g, "").replace(/^#&/, "#").replace(/^#$/, "");
          history.replaceState(null, "", clean.toString());
        }
      } catch {}
    }, 50);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    try {
      localStorage.removeItem(LS_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {}
    // clear fragment
    history.replaceState(null, "", window.location.pathname + window.location.search);
  }, []);

  return <Ctx.Provider value={{ token, user, login, logout, ready }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);

// apiFetch helper with Bearer + retry-once-on-401-via-refresh
export async function apiFetch(path: string, opts: RequestInit = {}) {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const url = path.startsWith("http") ? path : `${base}${path}`;
  const token = (() => { try { return localStorage.getItem(LS_KEY); } catch { return null; } })();
  const headers: Record<string, string> = {
    ...(opts.headers as Record<string, string> || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (opts.body && !(opts.body instanceof FormData)) headers["Content-Type"] = headers["Content-Type"] || "application/json";

  let res = await fetch(url, { ...opts, headers, credentials: "include" });
  if (res.status === 401) {
    // try refresh
    try {
      const r = await fetch(`${base}/auth/refresh`, { method: "POST", credentials: "include" });
      if (r.ok) {
        const j = await r.json();
        if (j.access_token) {
          try { localStorage.setItem(LS_KEY, j.access_token); } catch {}
          headers["Authorization"] = `Bearer ${j.access_token}`;
          res = await fetch(url, { ...opts, headers, credentials: "include" });
        }
      }
    } catch {}
  }
  return res;
}
