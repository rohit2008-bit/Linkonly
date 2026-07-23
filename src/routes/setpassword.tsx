import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Lock, Unlock, ArrowLeft, ShieldCheck, Check } from "lucide-react";
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
    return <div className="grid min-h-screen place-items-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 dashboard-container">
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b-2 border-foreground bg-background px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="grid h-8 w-8 place-items-center rounded-full bg-muted hover:bg-foreground hover:text-background transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-xl font-bold font-display">Security Settings</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl p-4 sm:p-6 mt-6 space-y-8">
        <ProfileProtectionSection user={user} update={update} />
        <LinksProtectionSection user={user} update={update} />
      </main>
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-3xl border-2 border-foreground bg-card p-5 sm:p-6 shadow-[0_6px_0_0_theme(colors.foreground)] ${className}`}>{children}</div>;
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
    <Card className={isProtected ? "border-emerald-500 bg-emerald-50/50 shadow-[0_6px_0_0_theme(colors.emerald.500)]" : ""}>
      <div className="flex items-center gap-3 mb-2">
        <div className={`grid h-10 w-10 place-items-center rounded-xl border-2 ${isProtected ? "border-emerald-500 bg-emerald-100 text-emerald-600" : "border-foreground bg-rose-100 text-rose-600"}`}>
          {isProtected ? <ShieldCheck className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
        </div>
        <div>
          <h3 className="text-lg font-bold text-primary" style={{ WebkitTextStroke: "1px var(--foreground)" }}>Profile Protection (Your URL Link)</h3>
          <p className="text-sm text-muted-foreground">{isProtected ? "Your profile is currently protected." : "Require a password to view your Linkonly profile."}</p>
        </div>
      </div>

      <div className="mt-6 border-t-2 border-dashed border-foreground/10 pt-6">
        {isProtected ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-700">Protection Active ({theme.protection?.lock_type === "full" ? "Full Lock" : "Partial Lock"})</p>
              <p className="text-xs text-muted-foreground mt-1">Visitors must enter the password to view your content.</p>
            </div>
            <button
              disabled={saving}
              onClick={handleRemove}
              className="rounded-full bg-rose-100 px-4 py-2 text-sm font-bold text-rose-600 border-2 border-rose-200 hover:bg-rose-200 hover:border-rose-300 transition-colors disabled:opacity-50"
            >
              Remove Protection
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="flex-1 rounded-2xl border-2 border-foreground p-4 cursor-pointer hover:bg-muted transition-colors relative">
                <input type="radio" name="lockType" value="full" checked={lockType === "full"} onChange={() => setLockType("full")} className="absolute opacity-0" />
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm">Full Lock</span>
                  {lockType === "full" && <Check className="h-4 w-4 text-emerald-500" />}
                </div>
                <p className="text-xs text-muted-foreground">Hides everything. Visitors only see a password prompt.</p>
                {lockType === "full" && <div className="absolute inset-0 rounded-2xl border-2 border-emerald-500 pointer-events-none" />}
              </label>

              <label className="flex-1 rounded-2xl border-2 border-foreground p-4 cursor-pointer hover:bg-muted transition-colors relative">
                <input type="radio" name="lockType" value="partial" checked={lockType === "partial"} onChange={() => setLockType("partial")} className="absolute opacity-0" />
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm">Partial Lock</span>
                  {lockType === "partial" && <Check className="h-4 w-4 text-emerald-500" />}
                </div>
                <p className="text-xs text-muted-foreground">Shows your avatar & bio, but locks access to the links.</p>
                {lockType === "partial" && <div className="absolute inset-0 rounded-2xl border-2 border-emerald-500 pointer-events-none" />}
              </label>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <PasswordInput
                placeholder="Enter a secret password"
                value={password}
                onChange={setPassword}
                className="flex-1"
              />
              <button
                disabled={saving || !password}
                onClick={handleSave}
                className="rounded-full bg-foreground px-6 py-2.5 text-sm font-bold text-background shadow-[0_2px_0_0_theme(colors.foreground)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all disabled:opacity-50"
              >
                {saving ? "Saving..." : "Set Password"}
              </button>
            </div>
            {error && <p className="text-xs font-bold text-rose-500 mt-2">{error}</p>}
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
      <div className="flex items-center gap-3 mb-2">
        <div className="grid h-10 w-10 place-items-center rounded-xl border-2 border-foreground bg-blue-100 text-blue-600">
          <Lock className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-primary" style={{ WebkitTextStroke: "1px var(--foreground)" }}>Individual Link Protection</h3>
          <p className="text-sm text-muted-foreground">Require a password for specific links instead of your entire profile.</p>
        </div>
      </div>

      <div className="mt-6 border-t-2 border-dashed border-foreground/10 pt-6">
        <div className="flex gap-4 mb-4">
          <button 
            className={`text-sm font-bold pb-2 border-b-2 transition-colors ${mode === "all" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            onClick={() => setMode("all")}
          >
            Protect All
          </button>
          <button 
            className={`text-sm font-bold pb-2 border-b-2 transition-colors ${mode === "selected" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            onClick={() => setMode("selected")}
          >
            Select Specific Links
          </button>
        </div>

        {mode === "selected" && unprotectedLinks.length > 0 && (
          <div className="mb-4 max-h-48 overflow-y-auto space-y-2 rounded-xl border-2 border-foreground/20 bg-muted/30 p-3">
            {unprotectedLinks.map(link => (
              <label key={link.id} className="flex items-center gap-3 p-2 hover:bg-background rounded-lg cursor-pointer transition-colors">
                <input 
                  type="checkbox" 
                  checked={selectedIds.has(link.id)} 
                  onChange={() => toggleSelect(link.id)}
                  className="h-4 w-4 rounded border-2 border-foreground accent-foreground" 
                />
                <span className="text-sm font-bold truncate flex-1">{link.title}</span>
              </label>
            ))}
          </div>
        )}

        {mode === "selected" && unprotectedLinks.length === 0 && (
          <p className="text-sm text-muted-foreground mb-4">All your links are already protected.</p>
        )}

        {((mode === "selected" && unprotectedLinks.length > 0) || mode === "all") && (
          <div className="flex flex-col sm:flex-row gap-3">
            <PasswordInput
              placeholder="Enter a secret password"
              value={password}
              onChange={setPassword}
              className="flex-1"
            />
            <button
              disabled={saving || !password || (mode === "selected" && selectedIds.size === 0)}
              onClick={handleSave}
              className="rounded-full bg-foreground px-6 py-2.5 text-sm font-bold text-background shadow-[0_2px_0_0_theme(colors.foreground)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all disabled:opacity-50"
            >
              {saving ? "Saving..." : "Lock Links"}
            </button>
          </div>
        )}
        
        {error && <p className="text-xs font-bold text-rose-500 mt-2">{error}</p>}
      </div>

      {protectedLinks.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Currently Protected Links</h3>
            <button
              onClick={handleRemoveAll}
              className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-600 hover:bg-rose-200 transition-colors shrink-0"
            >
              Remove All
            </button>
          </div>
          <div className="space-y-2">
            {protectedLinks.map(link => (
              <div key={link.id} className="flex items-center justify-between gap-3 rounded-2xl border-2 border-foreground bg-card p-3 shadow-[2px_2px_0_0_theme(colors.foreground)]">
                <div className="flex items-center gap-2 min-w-0">
                  <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span className="truncate font-semibold text-sm">{link.title}</span>
                </div>
                <button
                  onClick={() => handleRemove(link.id)}
                  className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-600 hover:bg-rose-200 transition-colors shrink-0"
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
