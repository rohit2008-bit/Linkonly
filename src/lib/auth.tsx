import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { defaultTheme, type Profile } from "./store";
import { supabase } from "./supabase";

type AuthCtx = {
  user: Profile | null;
  ready: boolean;
  signup: (data: { email: string; password: string; username: string; name: string }) => Promise<{ ok: boolean; error?: string }>;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  update: (patch: Partial<Profile>) => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);

  const fetchProfile = async (uid: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", uid)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        return null;
      }
      return data as Profile;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const refresh = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const p = await fetchProfile(session.user.id);
      setUser(p);
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    refresh().finally(() => setReady(true));

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const p = await fetchProfile(session.user.id);
        setUser(p);
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signup: AuthCtx["signup"] = async ({ email, password, username, name }) => {
    const u = username.trim().toLowerCase();
    if (!/^[a-z0-9_-]{3,20}$/.test(u)) {
      return { ok: false, error: "Username must be 3–20 chars: letters, numbers, _ or -" };
    }

    try {
      // 1. Verify unique username in database
      const { data: existingUser, error: checkError } = await supabase
        .from("profiles")
        .select("username")
        .eq("username", u)
        .maybeSingle();

      if (checkError) {
        return { ok: false, error: "Database error checking username." };
      }
      if (existingUser) {
        return { ok: false, error: "Username taken" };
      }

      // 2. Perform Supabase authentication sign-up
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        return { ok: false, error: authError.message };
      }
      if (!authData.user) {
        return { ok: false, error: "Sign up failed." };
      }

      // 3. Create the database profile record
      const newProfile: Profile = {
        username: u,
        email: email.toLowerCase(),
        password: "", // Plain passwords are not stored in the profiles table
        name: name || u,
        bio: "",
        avatar: "",
        links: [],
        theme: { ...defaultTheme },
        premium: false,
        views: 0,
        createdAt: Date.now(),
      };

      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: authData.user.id,
          username: newProfile.username,
          email: newProfile.email,
          name: newProfile.name,
          bio: newProfile.bio,
          avatar: newProfile.avatar,
          links: newProfile.links,
          theme: newProfile.theme,
          premium: newProfile.premium,
          views: newProfile.views,
        });

      if (profileError) {
        // Rollback: try to delete auth user if profile creation failed (optional but clean)
        return { ok: false, error: `Profile creation failed: ${profileError.message}` };
      }

      setUser(newProfile);
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e.message || "An unexpected error occurred." };
    }
  };

  const login: AuthCtx["login"] = async (email, password) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { ok: false, error: error.message };
      }
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e.message || "An unexpected error occurred." };
    }
  };

  const loginWithGoogle: AuthCtx["loginWithGoogle"] = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin + "/dashboard",
        },
      });

      if (error) {
        return { ok: false, error: error.message };
      }
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e.message || "An unexpected error occurred." };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const update: AuthCtx["update"] = async (patch) => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;

    try {
      // Don't store password parameter in profile table update
      const { password, ...updatePatch } = patch;
      const { error } = await supabase
        .from("profiles")
        .update(updatePatch)
        .eq("id", authUser.id);

      if (!error) {
        setUser((prev) => (prev ? { ...prev, ...patch } : null));
      } else {
        console.error("Error updating profile:", error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Ctx.Provider value={{ user, ready, signup, login, loginWithGoogle, logout, refresh, update }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used inside AuthProvider");
  return c;
}
