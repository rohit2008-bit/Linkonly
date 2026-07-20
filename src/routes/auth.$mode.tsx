import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "../lib/supabase";

export const Route = createFileRoute("/auth/$mode")({
  component: AuthPage,
});

function AuthPage() {
  const { mode } = Route.useParams();
  const navigate = useNavigate();
  const { user, ready, login, signup, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Username availability state
  const [usernameStatus, setUsernameStatus] = useState<{
    status: "idle" | "checking" | "available" | "taken" | "invalid";
    message: string;
  }>({ status: "idle", message: "" });

  useEffect(() => {
    if (ready && user) navigate({ to: "/dashboard" });
  }, [ready, user, navigate]);

  // Debounced check for username availability
  useEffect(() => {
    if (mode !== "signup") return;

    const trimmed = username.trim().toLowerCase();
    if (!trimmed) {
      setUsernameStatus({ status: "idle", message: "" });
      return;
    }

    // Format validation
    if (!/^[a-z0-9_-]{3,20}$/.test(trimmed)) {
      setUsernameStatus({
        status: "invalid",
        message: "Username must be 3–20 chars (letters, numbers, _ or -)",
      });
      return;
    }

    setUsernameStatus({ status: "checking", message: "Checking availability..." });

    const delayDebounce = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("username")
          .eq("username", trimmed)
          .maybeSingle();

        if (error) {
          setUsernameStatus({ status: "idle", message: "" });
          return;
        }

        if (data) {
          setUsernameStatus({
            status: "taken",
            message: "username is already taken",
          });
        } else {
          setUsernameStatus({
            status: "available",
            message: "username is available",
          });
        }
      } catch (e) {
        setUsernameStatus({ status: "idle", message: "" });
      }
    }, 400); // 400ms debounce

    return () => clearTimeout(delayDebounce);
  }, [username, mode]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const errors: Record<string, string> = {};

    // 1. Mandatory field validations
    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = "Invalid email format";
    }
    if (!password) errors.password = "Password is required";
    if (mode === "signup") {
      if (!name.trim()) errors.name = "Name is required";
      if (!username.trim()) errors.username = "Username is required";
      
      // Prevent submit if username check failed
      if (usernameStatus.status === "taken") {
        errors.username = "username is already taken";
      } else if (usernameStatus.status === "invalid") {
        errors.username = usernameStatus.message;
      } else if (usernameStatus.status === "checking") {
        errors.username = "Checking username availability...";
      }
    }

    // 2. Password complexity validation for Sign Up
    if (mode === "signup" && password) {
      if (password.length < 8) {
        errors.password = "Password must be at least 8 characters long";
      } else if (!/[A-Z]/.test(password)) {
        errors.password = "Password must contain at least one uppercase letter";
      } else if (!/[0-9]/.test(password)) {
        errors.password = "Password must contain at least one number";
      } else if (!/[^A-Za-z0-9]/.test(password)) {
        errors.password = "Password must contain at least one special character";
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setLoading(false);
      return;
    }
    setFieldErrors({});

    // 3. Authenticate / Sign up
    const res = mode === "login" 
      ? await login(email, password) 
      : await signup({ email, password, username, name });

    setLoading(false);
    if (!res.ok) {
      setError(res.error || "Something went wrong");
    } else {
      navigate({ to: "/dashboard" });
    }
  };

  const google = () => {
    loginWithGoogle();
  };

  return (
    <div className="min-h-screen bg-background auth-container animate-fade-in-up delay-100 fill-mode-backwards">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2 text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>
          <img src="/logo.png" alt="Logo" className="h-8 w-8 object-contain" />
          LinkOnly
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

          <form onSubmit={submit} className="space-y-3" noValidate>
            {mode === "signup" && (
              <>
                <Field 
                  label="Your name" 
                  value={name} 
                  onChange={setName} 
                  placeholder="Harsh" 
                  error={fieldErrors.name} 
                />
                <Field 
                  label="Username" 
                  value={username} 
                  onChange={setUsername} 
                  placeholder="harsh" 
                  prefix="linkonly.in/" 
                  error={fieldErrors.username} 
                  status={usernameStatus}
                />
              </>
            )}
            <Field 
              label="Email" 
              type="email" 
              value={email} 
              onChange={setEmail} 
              placeholder="you@example.com" 
              error={fieldErrors.email} 
            />
            <Field 
              label="Password" 
              type="password" 
              value={password} 
              onChange={setPassword} 
              placeholder="••••••" 
              error={fieldErrors.password} 
            />
            {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive font-semibold">{error}</p>}
            <button 
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-full bg-foreground px-4 py-3 font-semibold text-background transition-transform hover:-translate-y-0.5 disabled:opacity-50"
            >
              {loading ? "Please wait..." : (mode === "login" ? "Log in" : "Create account")}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "login" ? (
              <>New here? <Link to="/auth/$mode" params={{ mode: "signup" }} className="font-semibold text-foreground underline">Sign up</Link></>
            ) : (
              <>Have an account? <Link to="/auth/$mode" params={{ mode: "login" }} className="font-semibold text-foreground underline">Log in</Link></>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, type = "text", placeholder, prefix, error, status,
}: { 
  label: string; 
  value: string; 
  onChange: (v: string) => void; 
  type?: string; 
  placeholder?: string; 
  prefix?: string; 
  error?: string;
  status?: { status: "idle" | "checking" | "available" | "taken" | "invalid"; message: string };
}) {
  const [showPassword, setShowPassword] = useState(false);
  const inputType = type === "password" ? (showPassword ? "text" : "password") : type;

  // Determine border colors based on status/error
  const hasError = error || (status && (status.status === "taken" || status.status === "invalid"));
  const isAvailable = status && status.status === "available";

  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      <div className={`flex items-stretch overflow-hidden rounded-full border-2 bg-card focus-within:ring-2 focus-within:ring-ring ${
        hasError ? "border-destructive focus-within:ring-destructive" :
        isAvailable ? "border-emerald-500 focus-within:ring-emerald-500" :
        "border-foreground"
      }`}>
        {prefix && <span className="grid place-items-center bg-muted px-3 text-xs text-muted-foreground">{prefix}</span>}
        <input
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground"
        />
        {type === "password" && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="flex items-center justify-center pr-4 text-muted-foreground hover:text-foreground focus:outline-none"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        )}
      </div>
      
      {/* Show validation errors / check status */}
      {error && !status && <span className="mt-1 ml-4 block text-xs text-destructive font-bold">{error}</span>}
      {status && status.message && (
        <span className={`mt-1 ml-4 block text-xs font-bold ${
          status.status === "available" ? "text-emerald-500" :
          status.status === "checking" ? "text-muted-foreground animate-pulse" :
          "text-destructive"
        }`}>
          {status.message}
        </span>
      )}
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.4 30.1 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.8 6C12.3 13.3 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.5 3-2.2 5.5-4.7 7.2l7.3 5.7c4.3-4 6.9-9.9 6.9-17.4z"/><path fill="#FBBC05" d="M10.4 28.7c-.5-1.5-.8-3.1-.8-4.7s.3-3.2.8-4.7l-7.8-6C.9 16.8 0 20.3 0 24s.9 7.2 2.6 10.7l7.8-6z"/><path fill="#34A853" d="M24 48c6.1 0 11.3-2 15-5.5l-7.3-5.7c-2 1.4-4.6 2.2-7.7 2.2-6.3 0-11.7-3.8-13.6-9.1l-7.8 6C6.5 42.6 14.6 48 24 48z"/></svg>
  );
}
