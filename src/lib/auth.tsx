import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { store, defaultTheme, type Profile } from "./store";

type AuthCtx = {
  user: Profile | null;
  ready: boolean;
  signup: (data: { email: string; password: string; username: string; name: string }) => { ok: boolean; error?: string };
  login: (email: string, password: string) => { ok: boolean; error?: string };
  loginWithGoogle: () => { ok: boolean; error?: string };
  logout: () => void;
  refresh: () => void;
  update: (patch: Partial<Profile>) => void;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = () => {
    const u = store.session.get();
    setUser(u ? store.get(u) : null);
  };

  useEffect(() => {
    refresh();
    setReady(true);
  }, []);

  const signup: AuthCtx["signup"] = ({ email, password, username, name }) => {
    const u = username.trim().toLowerCase();
    if (!/^[a-z0-9_-]{3,20}$/.test(u)) return { ok: false, error: "Username must be 3–20 chars: letters, numbers, _ or -" };
    if (store.usernameExists(u)) return { ok: false, error: "Username taken" };
    if (store.emailExists(email)) return { ok: false, error: "Email already registered" };
    if (password.length < 6) return { ok: false, error: "Password must be at least 6 characters" };
    const p: Profile = {
      username: u,
      email,
      password,
      name: name || u,
      bio: "",
      avatar: "",
      links: [],
      theme: { ...defaultTheme },
      premium: false,
      views: 0,
      createdAt: Date.now(),
    };
    store.save(p);
    store.session.set(u);
    setUser(p);
    return { ok: true };
  };

  const login: AuthCtx["login"] = (email, password) => {
    const p = store.findByEmail(email);
    if (!p || p.password !== password) return { ok: false, error: "Invalid email or password" };
    store.session.set(p.username);
    setUser(p);
    return { ok: true };
  };

  const loginWithGoogle: AuthCtx["loginWithGoogle"] = () => {
    // Demo-only mock Google sign-in — creates or resumes a demo Google account
    const email = "demo.google@user.dev";
    let p = store.findByEmail(email);
    if (!p) {
      const u = "google_" + Math.random().toString(36).slice(2, 6);
      p = {
        username: u,
        email,
        password: "__google__",
        name: "Google Demo",
        bio: "Signed in via Google (demo)",
        avatar: "",
        links: [],
        theme: { ...defaultTheme },
        premium: false,
        views: 0,
        createdAt: Date.now(),
      };
      store.save(p);
    }
    store.session.set(p.username);
    setUser(p);
    return { ok: true };
  };

  const logout = () => {
    store.session.clear();
    setUser(null);
  };

  const update: AuthCtx["update"] = (patch) => {
    if (!user) return;
    const next = { ...user, ...patch };
    store.save(next);
    setUser(next);
  };

  return <Ctx.Provider value={{ user, ready, signup, login, loginWithGoogle, logout, refresh, update }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used inside AuthProvider");
  return c;
}
