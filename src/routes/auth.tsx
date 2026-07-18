import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useAuth } from "@/lib/auth";

const searchSchema = z.object({ mode: z.enum(["login", "signup"]).optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  component: AuthPage,
});

function AuthPage() {
  const { mode: initialMode } = Route.useSearch();
  const [mode, setMode] = useState<"login" | "signup">(initialMode || "login");
  const navigate = useNavigate();
  const { user, ready, login, signup, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ready && user) navigate({ to: "/dashboard" });
  }, [ready, user, navigate]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = mode === "login" ? login(email, password) : signup({ email, password, username, name });
    if (!res.ok) setError(res.error || "Something went wrong");
    else navigate({ to: "/dashboard" });
  };

  const google = () => {
    loginWithGoogle();
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-foreground text-background">L</span>
          LinkHub
        </Link>
      </header>

      <div className="mx-auto max-w-md px-6 pb-16 pt-8">
        <div className="rounded-3xl border-2 border-foreground bg-card p-8 shadow-[0_10px_0_0_theme(colors.foreground)]">
          <h1 className="text-3xl font-bold">{mode === "login" ? "Welcome back" : "Create your link"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "login" ? "Log in to manage your profile." : "It takes less than 30 seconds."}
          </p>

          <button
            type="button"
            onClick={google}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full border-2 border-foreground bg-card px-4 py-3 font-semibold hover:bg-accent/30"
          >
            <GoogleIcon /> Continue with Google
          </button>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> OR <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={submit} className="space-y-3">
            {mode === "signup" && (
              <>
                <Field label="Your name" value={name} onChange={setName} placeholder="Harsh" />
                <Field label="Username" value={username} onChange={setUsername} placeholder="harsh" prefix="linkhub.app/" />
              </>
            )}
            <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
            <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••" />
            {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
            <button className="mt-2 w-full rounded-full bg-foreground px-4 py-3 font-semibold text-background transition-transform hover:-translate-y-0.5">
              {mode === "login" ? "Log in" : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "login" ? (
              <>New here? <button onClick={() => setMode("signup")} className="font-semibold text-foreground underline">Sign up</button></>
            ) : (
              <>Have an account? <button onClick={() => setMode("login")} className="font-semibold text-foreground underline">Log in</button></>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, type = "text", placeholder, prefix,
}: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; prefix?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      <div className="flex items-stretch overflow-hidden rounded-full border-2 border-foreground bg-card focus-within:ring-2 focus-within:ring-ring">
        {prefix && <span className="grid place-items-center bg-muted px-3 text-xs text-muted-foreground">{prefix}</span>}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground"
          required
        />
      </div>
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.4 30.1 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.8 6C12.3 13.3 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.5 3-2.2 5.5-4.7 7.2l7.3 5.7c4.3-4 6.9-9.9 6.9-17.4z"/><path fill="#FBBC05" d="M10.4 28.7c-.5-1.5-.8-3.1-.8-4.7s.3-3.2.8-4.7l-7.8-6C.9 16.8 0 20.3 0 24s.9 7.2 2.6 10.7l7.8-6z"/><path fill="#34A853" d="M24 48c6.1 0 11.3-2 15-5.5l-7.3-5.7c-2 1.4-4.6 2.2-7.7 2.2-6.3 0-11.7-3.8-13.6-9.1l-7.8 6C6.5 42.6 14.6 48 24 48z"/></svg>
  );
}
