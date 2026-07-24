import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Lock, ArrowLeft, ShieldCheck, Check, ShieldAlert, KeyRound, Sparkles, Layers, ListFilter, Trash2 } from "lucide-react";
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
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <span className="text-sm font-bold text-muted-foreground">Loading security settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 dashboard-container">
      {/* Sticky Header */}
      <header className="sticky top-0 z-30 border-b-2 border-foreground bg-background/95 backdrop-blur px-4 sm:px-8 py-3.5">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-foreground bg-card shadow-[2px_2px_0_0_theme(colors.foreground)] hover:bg-muted hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all cursor-pointer"
              title="Back to Dashboard"
            >
              <ArrowLeft className="h-4 w-4 stroke-[2.5]" />
            </Link>
            <div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight font-display flex items-center gap-2">
                <span>Security & Protection</span>
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-foreground/20 bg-muted px-2.5 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
                  <ShieldCheck className="h-3 w-3 text-emerald-500" /> Password Controls
                </span>
              </h1>
            </div>
          </div>
          
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-full border-2 border-foreground bg-primary px-3.5 py-1.5 text-xs font-black text-foreground shadow-[2px_2px_0_0_theme(colors.foreground)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all"
          >
            <span>Dashboard</span>
          </Link>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="mx-auto max-w-4xl px-4 sm:px-6 pt-6 sm:pt-8 space-y-8">
        
        {/* Banner */}
        <div className="rounded-3xl border-2 border-foreground bg-card p-5 sm:p-6 shadow-[0_6px_0_0_theme(colors.foreground)] relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-foreground bg-amber-100 text-amber-700 shadow-[2px_2px_0_0_theme(colors.foreground)]">
                <KeyRound className="h-6 w-6 stroke-[2.5]" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black tracking-wide">Password Vault</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Lock your whole profile URL or secure individual destination links with high-grade salted encryption.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Protection Sections */}
        <ProfileProtectionSection user={user} update={update} />
        <LinksProtectionSection user={user} update={update} />
      </main>
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl border-2 border-foreground bg-card p-5 sm:p-8 shadow-[0_8px_0_0_theme(colors.foreground)] transition-all ${className}`}>
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
          }
        }
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
    <Card className={isProtected ? "border-emerald-500 bg-emerald-50/20 shadow-[0_8px_0_0_theme(colors.emerald.500)]" : ""}>
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b-2 border-dashed border-foreground/10">
        <div className="flex items-center gap-3">
          <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl border-2 ${isProtected ? "border-emerald-500 bg-emerald-100 text-emerald-600 shadow-[2px_2px_0_0_theme(colors.emerald.500)]" : "border-foreground bg-rose-100 text-rose-600 shadow-[2px_2px_0_0_theme(colors.foreground)]"}`}>
            {isProtected ? <ShieldCheck className="h-6 w-6 stroke-[2.5]" /> : <Lock className="h-6 w-6 stroke-[2.5]" />}
          </div>
          <div>
            <h2 className="text-base sm:text-xl font-black text-primary tracking-wide" style={{ WebkitTextStroke: "1px var(--foreground)" }}>
              Profile Protection (Your URL Link)
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isProtected ? "Your public profile page is currently password-locked." : "Require a secret password before visitors can see your Linkonly page."}
            </p>
          </div>
        </div>
        
        {isProtected && (
          <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-emerald-500 bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800 shrink-0 w-fit">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            PROTECTED
          </span>
        )}
      </div>

      {/* Main Content Body */}
      <div className="mt-6">
        {isProtected ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border-2 border-emerald-500/40 bg-emerald-100/50 p-4 sm:p-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
                <p className="text-sm font-black text-emerald-900">
                  Protection Active — {theme.protection?.lock_type === "full" ? "Full Profile Lock" : "Partial Link Lock"}
                </p>
              </div>
              <p className="text-xs text-emerald-800/80 pl-7 leading-relaxed">
                Visitors accessing your link must enter the valid password to unlock page content.
              </p>
            </div>
            
            <button
              disabled={saving}
              onClick={handleRemove}
              className="w-full sm:w-auto rounded-full bg-rose-500 px-5 py-2.5 text-xs font-black text-white border-2 border-foreground shadow-[2px_2px_0_0_theme(colors.foreground)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all disabled:opacity-50 cursor-pointer shrink-0"
            >
              {saving ? "Removing..." : "Remove Protection"}
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Lock Mode Selector */}
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-2">
                Select Lock Style
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className={`group rounded-2xl border-2 p-4 cursor-pointer transition-all relative focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 outline-none ${lockType === "full" ? "border-emerald-500 bg-emerald-50/50 shadow-[3px_3px_0_0_theme(colors.emerald.500)]" : "border-foreground bg-card hover:bg-muted shadow-[2px_2px_0_0_theme(colors.foreground)]"}`}>
                  <input type="radio" name="lockType" value="full" checked={lockType === "full"} onChange={() => setLockType("full")} className="sr-only" />
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-black text-sm flex items-center gap-1.5">
                      <Lock className="h-4 w-4 text-emerald-600" /> Full Lock
                    </span>
                    {lockType === "full" && <Check className="h-4.5 w-4.5 text-emerald-600 stroke-[3]" />}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">Hides everything. Visitors see only a clean password entry popup.</p>
                </label>

                <label className={`group rounded-2xl border-2 p-4 cursor-pointer transition-all relative focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 outline-none ${lockType === "partial" ? "border-emerald-500 bg-emerald-50/50 shadow-[3px_3px_0_0_theme(colors.emerald.500)]" : "border-foreground bg-card hover:bg-muted shadow-[2px_2px_0_0_theme(colors.foreground)]"}`}>
                  <input type="radio" name="lockType" value="partial" checked={lockType === "partial"} onChange={() => setLockType("partial")} className="sr-only" />
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-black text-sm flex items-center gap-1.5">
                      <Layers className="h-4 w-4 text-emerald-600" /> Partial Lock
                    </span>
                    {lockType === "partial" && <Check className="h-4.5 w-4.5 text-emerald-600 stroke-[3]" />}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">Displays your header avatar & bio, but locks access to all links.</p>
                </label>
              </div>
            </div>

            {/* Input & Action */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <PasswordInput
                placeholder="Enter a secret password"
                value={password}
                onChange={setPassword}
                className="flex-1"
              />
              <button
                disabled={saving || !password}
                onClick={handleSave}
                className="w-full sm:w-auto rounded-full bg-foreground px-7 py-3 text-xs sm:text-sm font-black text-background border-2 border-foreground shadow-[3px_3px_0_0_theme(colors.foreground)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all disabled:opacity-50 cursor-pointer shrink-0"
              >
                {saving ? "Saving..." : "Set Profile Password"}
              </button>
            </div>
            
            {error && (
              <p className="text-xs font-bold text-rose-500 animate-fade-in flex items-center gap-1">
                ⚠️ {error}
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
      
      const updatedLinks = links.map(link => {
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
    const updatedLinks = links.map(link => {
      if (link.id === linkId) {
        const { isProtected, password_hash, ...rest } = link;
        return rest;
      }
      return link;
    });
    await update({ links: updatedLinks });
  };

  const handleRemoveAll = async () => {
    const updatedLinks = links.map(link => {
      if (link.isProtected) {
        const { isProtected, password_hash, ...rest } = link;
        return rest;
      }
      return link;
    });
    await update({ links: updatedLinks });
  };

  const protectedLinks = links.filter(l => l.isProtected);
  const unprotectedLinks = links.filter(l => !l.isProtected);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  return (
    <Card>
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b-2 border-dashed border-foreground/10">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border-2 border-foreground bg-blue-100 text-blue-600 shadow-[2px_2px_0_0_theme(colors.foreground)]">
            <Lock className="h-6 w-6 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-base sm:text-xl font-black text-primary tracking-wide" style={{ WebkitTextStroke: "1px var(--foreground)" }}>
              Individual Link Protection
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Require a secret password for specific links instead of locking your whole profile.
            </p>
          </div>
        </div>
      </div>

      {/* Main Form Body */}
      <div className="mt-6 space-y-5">
        {/* Mode Switcher Tabs */}
        <div>
          <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-2">
            Target Links
          </label>
          <div className="inline-flex w-full sm:w-auto p-1.5 gap-1 rounded-2xl border-2 border-foreground bg-muted/60">
            <button 
              type="button"
              className={`flex-1 sm:flex-initial rounded-xl px-4 py-2 text-xs sm:text-sm font-black transition-all cursor-pointer ${
                mode === "all" 
                  ? "bg-card text-foreground border-2 border-foreground shadow-[2px_2px_0_0_theme(colors.foreground)]" 
                  : "text-muted-foreground hover:text-foreground border-2 border-transparent"
              }`}
              onClick={() => setMode("all")}
            >
              Protect All Links
            </button>
            <button 
              type="button"
              className={`flex-1 sm:flex-initial rounded-xl px-4 py-2 text-xs sm:text-sm font-black transition-all cursor-pointer ${
                mode === "selected" 
                  ? "bg-card text-foreground border-2 border-foreground shadow-[2px_2px_0_0_theme(colors.foreground)]" 
                  : "text-muted-foreground hover:text-foreground border-2 border-transparent"
              }`}
              onClick={() => setMode("selected")}
            >
              Select Specific Links
            </button>
          </div>
        </div>

        {/* Link Checklist Selection */}
        {mode === "selected" && unprotectedLinks.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-muted-foreground px-1">
              <span>Unprotected Links List ({unprotectedLinks.length})</span>
              <span>{selectedIds.size} selected</span>
            </div>
            <div className="max-h-56 overflow-y-auto space-y-2 rounded-2xl border-2 border-foreground/30 bg-muted/20 p-3">
              {unprotectedLinks.map(link => {
                const isSelected = selectedIds.has(link.id);
                return (
                  <label 
                    key={link.id} 
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      isSelected 
                        ? "border-foreground bg-card shadow-[2px_2px_0_0_theme(colors.foreground)] font-bold" 
                        : "border-foreground/20 bg-background/60 hover:bg-background"
                    }`}
                  >
                    <input 
                      type="checkbox" 
                      checked={isSelected} 
                      onChange={() => toggleSelect(link.id)}
                      className="h-4 w-4 rounded border-2 border-foreground accent-foreground cursor-pointer" 
                    />
                    <span className="text-xs sm:text-sm font-bold truncate flex-1 text-foreground">{link.title}</span>
                    <span className="text-[10px] text-muted-foreground truncate max-w-[120px] sm:max-w-[200px] hidden sm:inline-block">{link.url}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {mode === "selected" && unprotectedLinks.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-foreground/30 bg-muted/20 p-4 text-center">
            <p className="text-xs sm:text-sm font-bold text-muted-foreground">All your existing links are currently password protected.</p>
          </div>
        )}

        {/* Password Input & Save Button */}
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
              className="w-full sm:w-auto rounded-full bg-foreground px-7 py-3 text-xs sm:text-sm font-black text-background border-2 border-foreground shadow-[3px_3px_0_0_theme(colors.foreground)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all disabled:opacity-50 cursor-pointer shrink-0"
            >
              {saving ? "Saving..." : "Lock Links"}
            </button>
          </div>
        )}
        
        {error && (
          <p className="text-xs font-bold text-rose-500 animate-fade-in flex items-center gap-1">
            ⚠️ {error}
          </p>
        )}
      </div>

      {/* Currently Protected Links Section */}
      {protectedLinks.length > 0 && (
        <div className="mt-8 border-t-2 border-dashed border-foreground/10 pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-muted-foreground">
                Currently Protected Links ({protectedLinks.length})
              </h3>
            </div>
            <button
              onClick={handleRemoveAll}
              className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-3.5 py-1.5 text-xs font-black text-rose-700 border-2 border-rose-200 hover:bg-rose-200 transition-colors w-fit shrink-0 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" /> Remove All Locks
            </button>
          </div>

          <div className="space-y-2.5">
            {protectedLinks.map(link => (
              <div key={link.id} className="flex items-center justify-between gap-3 rounded-2xl border-2 border-foreground bg-card p-3.5 shadow-[3px_3px_0_0_theme(colors.foreground)] hover:-translate-y-0.5 transition-all">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                    <ShieldCheck className="h-4 w-4 stroke-[2.5]" />
                  </div>
                  <span className="truncate font-bold text-xs sm:text-sm text-foreground">{link.title}</span>
                </div>
                <button
                  onClick={() => handleRemove(link.id)}
                  className="rounded-full bg-rose-100 px-3 py-1.5 text-xs font-black text-rose-700 border border-rose-200 hover:bg-rose-200 transition-colors shrink-0 cursor-pointer"
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
