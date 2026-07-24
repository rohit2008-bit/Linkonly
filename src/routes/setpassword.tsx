import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Lock, ArrowLeft, ShieldCheck, Check, Sparkles, KeyRound, Layers, AlertCircle } from "lucide-react";
import { hashPasswordServer } from "@/lib/password";
import { PasswordInput } from "@/components/PasswordInput";
import type { Theme, LinkItem } from "@/lib/store";

export const Route = createFileRoute("/setpassword")({
  component: SetPasswordPage,
});

function SetPasswordPage() {
  const { user, ready, update } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && !user) {
      navigate({ to: "/auth/$mode", params: { mode: "login" }, replace: true });
    }
  }, [ready, user, navigate]);

  if (!ready || !user) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-foreground text-sm font-semibold">
        Loading security settings…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 dashboard-container">
      {/* Header bar */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b-2 border-foreground bg-background/95 backdrop-blur-md px-4 sm:px-8 shadow-[0_2px_0_0_theme(colors.foreground)]">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-full border-2 border-foreground bg-card px-3.5 py-1.5 text-xs font-black text-foreground shadow-[2px_2px_0_0_theme(colors.foreground)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Dashboard</span>
            <span className="sm:hidden">Back</span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <h1 className="text-sm sm:text-base font-black text-foreground tracking-tight">Security Settings</h1>
        </div>
      </header>

      {/* Main container */}
      <main className="mx-auto max-w-4xl p-4 sm:p-6 mt-4 space-y-6">
        {/* Page Hero Banner */}
        <div className="rounded-3xl border-2 border-foreground bg-card p-5 sm:p-6 shadow-[0_6px_0_0_theme(colors.foreground)] relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-foreground/20 bg-muted px-2.5 py-0.5 text-[10px] font-black uppercase text-muted-foreground">
                  <KeyRound className="h-3 w-3 text-primary" /> Password Protection
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight font-display">
                Security & Access Control
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
                Protect your entire Linkonly public page or lock individual links with secure hashed passwords. Unprotected links remain visible as usual.
              </p>
            </div>
          </div>
        </div>

        {/* Protection Cards */}
        <ProfileProtectionSection user={user} update={update} />
        <LinksProtectionSection user={user} update={update} />
      </main>
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl border-2 border-foreground bg-card p-5 sm:p-7 shadow-[0_6px_0_0_theme(colors.foreground)] transition-all ${className}`}>
      {children}
    </div>
  );
}

function ProfileProtectionSection({ user, update }: { user: any; update: any }) {
  const [password, setPassword] = useState("");
  const [lockType, setLockType] = useState<"full" | "partial">("full");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const theme: Theme = user.theme || {};
  const isProtected = !!theme.protection?.password_hash;

  const handleSave = async () => {
    if (!password) {
      setError("Please enter a password");
      return;
    }
    setSaving(true);
    setError("");

    try {
      const hash = await hashPasswordServer({ data: password });
      await update({
        theme: {
          ...theme,
          protection: {
            password_hash: hash,
            lock_type: lockType,
          },
        },
      });
      setPassword("");
    } catch (e: any) {
      setError(e.message || "Failed to save password");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    setSaving(true);
    try {
      const newTheme = { ...theme };
      delete newTheme.protection;
      await update({ theme: newTheme });
    } catch (e: any) {
      setError(e.message || "Failed to remove password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className={isProtected ? "border-emerald-500 bg-emerald-50/30 shadow-[0_6px_0_0_theme(colors.emerald.500)]" : ""}>
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b-2 border-dashed border-foreground/10">
        <div className="flex items-start sm:items-center gap-3">
          <div
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl border-2 ${
              isProtected ? "border-emerald-600 bg-emerald-100 text-emerald-700 shadow-[2px_2px_0_0_theme(colors.emerald.600)]" : "border-foreground bg-rose-100 text-rose-700 shadow-[2px_2px_0_0_theme(colors.foreground)]"
            }`}
          >
            {isProtected ? <ShieldCheck className="h-6 w-6 stroke-[2.5]" /> : <Lock className="h-6 w-6 stroke-[2.5]" />}
          </div>
          <div>
            <h3
              className="text-base sm:text-lg font-black text-primary tracking-tight"
              style={{ WebkitTextStroke: "1px var(--foreground)" }}
            >
              Profile Protection (Your URL Link)
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">
              {isProtected ? "Your public profile URL is password protected." : "Require visitors to enter a password before viewing your Linkonly profile."}
            </p>
          </div>
        </div>

        {isProtected && (
          <span className="self-start sm:self-center shrink-0 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider border-2 border-foreground bg-emerald-100 text-emerald-800">
            PROTECTED
          </span>
        )}
      </div>

      {/* Body section */}
      <div className="mt-5">
        {isProtected ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border-2 border-emerald-500 bg-background p-4 shadow-[3px_3px_0_0_theme(colors.emerald.500)]">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-xs sm:text-sm font-black text-foreground">
                  Active ({theme.protection?.lock_type === "full" ? "Full Lock" : "Partial Lock"})
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {theme.protection?.lock_type === "full"
                  ? "Visitors must enter the password before seeing any of your profile content."
                  : "Visitors can see your avatar & bio, but must enter the password to view your links."}
              </p>
            </div>
            <button
              disabled={saving}
              onClick={handleRemove}
              className="w-full sm:w-auto shrink-0 rounded-full bg-rose-500 px-5 py-2.5 text-xs font-black text-white shadow-[2px_2px_0_0_theme(colors.foreground)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all disabled:opacity-50 cursor-pointer"
            >
              {saving ? "Removing..." : "Remove Protection"}
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Full Lock Option */}
              <label className={`rounded-2xl border-2 border-foreground p-4 cursor-pointer transition-all relative focus-within:ring-2 focus-within:ring-ring outline-none ${lockType === "full" ? "bg-primary/10 shadow-[3px_3px_0_0_theme(colors.foreground)]" : "bg-background hover:bg-muted"}`}>
                <input
                  type="radio"
                  name="lockType"
                  value="full"
                  checked={lockType === "full"}
                  onChange={() => setLockType("full")}
                  className="sr-only"
                />
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                    <Lock className="h-4 w-4 text-rose-600" /> Full Lock
                  </span>
                  {lockType === "full" && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Hides everything. Visitors see a password modal before accessing your profile.
                </p>
                {lockType === "full" && <div className="absolute inset-0 rounded-2xl border-2 border-emerald-500 pointer-events-none" />}
              </label>

              {/* Partial Lock Option */}
              <label className={`rounded-2xl border-2 border-foreground p-4 cursor-pointer transition-all relative focus-within:ring-2 focus-within:ring-ring outline-none ${lockType === "partial" ? "bg-primary/10 shadow-[3px_3px_0_0_theme(colors.foreground)]" : "bg-background hover:bg-muted"}`}>
                <input
                  type="radio"
                  name="lockType"
                  value="partial"
                  checked={lockType === "partial"}
                  onChange={() => setLockType("partial")}
                  className="sr-only"
                />
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-blue-600" /> Partial Lock
                  </span>
                  {lockType === "partial" && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Shows your avatar & bio, but asks for password when visitors click on links.
                </p>
                {lockType === "partial" && <div className="absolute inset-0 rounded-2xl border-2 border-emerald-500 pointer-events-none" />}
              </label>
            </div>

            {/* Input & button row */}
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <PasswordInput
                placeholder="Enter a secret password"
                value={password}
                onChange={setPassword}
                className="flex-1"
              />
              <button
                disabled={saving || !password}
                onClick={handleSave}
                className="w-full sm:w-auto rounded-full bg-foreground px-6 py-3 text-xs sm:text-sm font-black text-background shadow-[3px_3px_0_0_theme(colors.foreground)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all disabled:opacity-50 cursor-pointer whitespace-nowrap"
              >
                {saving ? "Saving..." : "Set Password"}
              </button>
            </div>

            {error && (
              <p className="text-xs font-bold text-rose-500 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" /> {error}
              </p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

function LinksProtectionSection({ user, update }: { user: any; update: any }) {
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"all" | "selected">("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const links: LinkItem[] = user.links || [];

  const handleSave = async () => {
    if (!password) {
      setError("Please enter a password");
      return;
    }
    if (mode === "selected" && selectedIds.size === 0) {
      setError("Please select at least one link");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const hash = await hashPasswordServer({ data: password });

      const updatedLinks = links.map((link) => {
        const shouldProtect = mode === "all" || selectedIds.has(link.id);
        if (shouldProtect) {
          return { ...link, isProtected: true, password_hash: hash };
        }
        return link;
      });

      await update({ links: updatedLinks });
      setPassword("");
      setSelectedIds(new Set());
    } catch (e: any) {
      setError(e.message || "Failed to protect links");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (linkId: string) => {
    const updatedLinks = links.map((link) => {
      if (link.id === linkId) {
        const { isProtected, password_hash, ...rest } = link;
        return rest;
      }
      return link;
    });
    await update({ links: updatedLinks });
  };

  const handleRemoveAll = async () => {
    const updatedLinks = links.map((link) => {
      if (link.isProtected) {
        const { isProtected, password_hash, ...rest } = link;
        return rest;
      }
      return link;
    });
    await update({ links: updatedLinks });
  };

  const protectedLinks = links.filter((l) => l.isProtected);
  const unprotectedLinks = links.filter((l) => !l.isProtected);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  return (
    <Card>
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b-2 border-dashed border-foreground/10">
        <div className="flex items-start sm:items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border-2 border-foreground bg-blue-100 text-blue-700 shadow-[2px_2px_0_0_theme(colors.foreground)]">
            <Lock className="h-6 w-6 stroke-[2.5]" />
          </div>
          <div>
            <h3
              className="text-base sm:text-lg font-black text-primary tracking-tight"
              style={{ WebkitTextStroke: "1px var(--foreground)" }}
            >
              Individual Link Protection
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">
              Require a password for specific links instead of locking your entire profile.
            </p>
          </div>
        </div>
      </div>

      {/* Mode Switcher Pills */}
      <div className="mt-5 space-y-4">
        <div className="flex rounded-full border-2 border-foreground bg-muted p-1 gap-1 max-w-md">
          <button
            type="button"
            className={`flex-1 rounded-full py-2 px-3 text-xs font-black transition-all cursor-pointer ${
              mode === "all" ? "bg-card text-foreground border-2 border-foreground shadow-[2px_2px_0_0_theme(colors.foreground)]" : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setMode("all")}
          >
            Protect All Links
          </button>
          <button
            type="button"
            className={`flex-1 rounded-full py-2 px-3 text-xs font-black transition-all cursor-pointer ${
              mode === "selected" ? "bg-card text-foreground border-2 border-foreground shadow-[2px_2px_0_0_theme(colors.foreground)]" : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setMode("selected")}
          >
            Select Specific Links
          </button>
        </div>

        {/* Link Multi-select list */}
        {mode === "selected" && unprotectedLinks.length > 0 && (
          <div className="max-h-56 overflow-y-auto space-y-2 rounded-2xl border-2 border-foreground bg-background p-3 shadow-[inset_0_2px_4px_0_rgba(0,0,0,0.05)]">
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider mb-1 px-1">
              Select links to lock ({selectedIds.size} selected):
            </p>
            {unprotectedLinks.map((link) => (
              <label
                key={link.id}
                className={`flex items-center gap-3 p-2.5 rounded-xl border-2 transition-all cursor-pointer ${
                  selectedIds.has(link.id) ? "border-foreground bg-primary/10 font-bold" : "border-transparent hover:bg-muted"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(link.id)}
                  onChange={() => toggleSelect(link.id)}
                  className="h-4 w-4 rounded border-2 border-foreground accent-foreground shrink-0 cursor-pointer"
                />
                <span className="text-xs sm:text-sm font-semibold truncate flex-1 text-foreground">{link.title}</span>
              </label>
            ))}
          </div>
        )}

        {mode === "selected" && unprotectedLinks.length === 0 && (
          <p className="text-xs font-bold text-emerald-600 bg-emerald-50 border-2 border-emerald-200 p-3 rounded-2xl">
            ✨ All your links are currently protected!
          </p>
        )}

        {/* Input & Action */}
        {((mode === "selected" && unprotectedLinks.length > 0) || mode === "all") && (
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <PasswordInput
              placeholder="Enter a secret password"
              value={password}
              onChange={setPassword}
              className="flex-1"
            />
            <button
              disabled={saving || !password || (mode === "selected" && selectedIds.size === 0)}
              onClick={handleSave}
              className="w-full sm:w-auto rounded-full bg-foreground px-6 py-3 text-xs sm:text-sm font-black text-background shadow-[3px_3px_0_0_theme(colors.foreground)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all disabled:opacity-50 cursor-pointer whitespace-nowrap"
            >
              {saving ? "Locking..." : "Lock Links"}
            </button>
          </div>
        )}

        {error && (
          <p className="text-xs font-bold text-rose-500 flex items-center gap-1">
            <AlertCircle className="h-3.5 w-3.5" /> {error}
          </p>
        )}
      </div>

      {/* Currently Protected Links List */}
      {protectedLinks.length > 0 && (
        <div className="mt-8 border-t-2 border-dashed border-foreground/10 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-foreground">
                Currently Protected Links
              </h4>
              <span className="rounded-full bg-foreground px-2 py-0.5 text-[10px] font-bold text-background">
                {protectedLinks.length}
              </span>
            </div>
            <button
              onClick={handleRemoveAll}
              className="rounded-full bg-rose-100 px-3.5 py-1 text-xs font-black text-rose-700 border border-rose-300 hover:bg-rose-200 transition-all cursor-pointer shadow-[1px_1px_0_0_theme(colors.foreground)]"
            >
              Remove All
            </button>
          </div>

          <div className="space-y-2.5">
            {protectedLinks.map((link) => (
              <div
                key={link.id}
                className="flex items-center justify-between gap-3 rounded-2xl border-2 border-foreground bg-background p-3.5 shadow-[2px_2px_0_0_theme(colors.foreground)] hover:-translate-y-0.5 transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-7 w-7 items-center justify-center rounded-xl border border-foreground bg-emerald-100 text-emerald-700 shrink-0">
                    <ShieldCheck className="h-4 w-4 stroke-[2.5]" />
                  </div>
                  <span className="truncate font-bold text-xs sm:text-sm text-foreground">{link.title}</span>
                </div>
                <button
                  onClick={() => handleRemove(link.id)}
                  className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-600 border border-rose-200 hover:bg-rose-100 transition-colors shrink-0 cursor-pointer"
                >
                  Remove Lock
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
