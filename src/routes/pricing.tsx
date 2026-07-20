import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, Crown, Check, Sparkles, Star, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/pricing")({
  ssr: false,
  component: PricingPage,
});

function PricingPage() {
  const { user, ready, update } = useAuth();
  const navigate = useNavigate();
  const [upgrading, setUpgrading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleUpgrade = async () => {
    if (!user) {
      navigate({ to: "/auth/$mode", params: { mode: "signup" } });
      return;
    }
    if (user.premium) return;

    setUpgrading(true);
    try {
      await update({ premium: true });
      setSuccess(true);
    } catch (e) {
      console.error("Upgrade failed:", e);
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2 text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>
          <img src="/logo.png" alt="Logo" className="h-8 w-8 object-contain" />
          LinkOnly
        </Link>
        <nav className="flex items-center gap-3">
          {user ? (
            <Link to="/dashboard" className="inline-flex items-center gap-1.5 rounded-full border-2 border-foreground bg-card px-4 py-2 text-xs font-black shadow-[2px_2px_0_0_theme(colors.foreground)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all">
              <ChevronLeft className="h-3.5 w-3.5" /> Back to Dashboard
            </Link>
          ) : (
            <>
              <Link to="/auth/login" className="rounded-full px-4 py-2 text-sm font-medium hover:bg-muted">Log in</Link>
              <Link to="/auth/signup" className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background hover:opacity-90">Sign up</Link>
            </>
          )}
        </nav>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-foreground bg-amber-50 px-3.5 py-1 text-xs font-black text-amber-700 animate-pulse">
          <Crown className="h-3.5 w-3.5 fill-amber-500 text-amber-600" /> Choose the Perfect Plan
        </span>
        
        <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl" style={{ fontFamily: "var(--font-display)" }}>
          Upgrade Your LinkOnly Presence
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-sm text-muted-foreground font-semibold">
          Unlock premium themes, advanced insights, dynamic AI optimizations, and a verified verification badge.
        </p>

        {success && (
          <div className="mx-auto mt-8 max-w-md rounded-2xl border-2 border-emerald-500 bg-emerald-50 p-4 text-sm font-bold text-emerald-800 shadow-[4px_4px_0_0_theme(colors.foreground)] animate-bounce">
            🎉 Premium features unlocked successfully! Head back to your dashboard to enjoy them.
          </div>
        )}

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {/* Free Plan */}
          <div className="flex flex-col rounded-3xl border-2 border-foreground bg-card p-6 text-left shadow-[6px_6px_0_0_theme(colors.foreground)] relative transition-all hover:-translate-y-0.5">
            <h3 className="text-xl font-bold">Free Plan</h3>
            <p className="mt-1 text-xs text-muted-foreground">The essentials to get started online.</p>
            
            <div className="mt-6 flex items-baseline gap-1">
              <span className="text-4xl font-black">₹0</span>
              <span className="text-xs font-semibold text-muted-foreground">/ month</span>
            </div>

            <button 
              disabled
              className="mt-6 w-full rounded-full border-2 border-foreground bg-muted py-3 text-center text-sm font-bold text-muted-foreground cursor-not-allowed"
            >
              {user && !user.premium ? "Active Plan" : "Included"}
            </button>

            <ul className="mt-8 space-y-3.5 border-t border-dashed border-foreground/10 pt-6 text-xs font-semibold">
              <li className="flex items-center gap-2.5">
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white"><Check className="h-3 w-3 stroke-[2.5]" /></div>
                <span>Unlimited profile links</span>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white"><Check className="h-3 w-3 stroke-[2.5]" /></div>
                <span>Default font layout (Inter)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white"><Check className="h-3 w-3 stroke-[2.5]" /></div>
                <span>Basic profile statistics</span>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white"><Check className="h-3 w-3 stroke-[2.5]" /></div>
                <span>Custom profile QR code generator</span>
              </li>
            </ul>
          </div>

          {/* Premium Plan */}
          <div className="flex flex-col rounded-3xl border-3 border-foreground bg-amber-50/20 p-6 text-left shadow-[8px_8px_0_0_theme(colors.foreground)] relative transition-all hover:-translate-y-1">
            <div className="absolute -top-3.5 right-6 rounded-full border-2 border-foreground bg-amber-400 px-3.5 py-1 text-[10px] font-black uppercase tracking-wider text-foreground shadow-[2px_2px_0_0_theme(colors.foreground)]">
              👑 Popular
            </div>

            <h3 className="text-xl font-bold flex items-center gap-1.5">
              Premium Plan
              <Crown className="h-4.5 w-4.5 fill-amber-400 text-amber-500" />
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">Maximize conversion rates and stand out from the crowd.</p>
            
            <div className="mt-6 flex items-baseline gap-1">
              <span className="text-4xl font-black">₹50</span>
              <span className="text-xs font-semibold text-muted-foreground">/ month</span>
            </div>

            <button 
              onClick={handleUpgrade}
              disabled={upgrading || (user && user.premium)}
              className={`mt-6 w-full rounded-full border-2 border-foreground py-3 text-center text-sm font-black transition-all cursor-pointer shadow-[3px_3px_0_0_theme(colors.foreground)] active:translate-y-0.5 active:shadow-none ${
                user?.premium 
                  ? "bg-amber-100 text-amber-700 shadow-none border-dashed" 
                  : "bg-amber-400 hover:bg-amber-300 text-foreground"
              }`}
            >
              {user?.premium ? "Premium Active ✨" : upgrading ? "Upgrading..." : "Upgrade to Premium"}
            </button>

            <ul className="mt-8 space-y-3.5 border-t border-dashed border-foreground/10 pt-6 text-xs font-semibold">
              <li className="flex items-center gap-2.5">
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-white"><Star className="h-3 w-3 fill-white stroke-[2.5]" /></div>
                <span className="text-amber-800">✨ AI Bio Generator access</span>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-white"><Star className="h-3 w-3 fill-white stroke-[2.5]" /></div>
                <span className="text-amber-800">💡 Dynamic Optimization Tips (real-time CTR advice)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white"><Check className="h-3 w-3 stroke-[2.5]" /></div>
                <span>Verified checkmark badge on your public page</span>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white"><Check className="h-3 w-3 stroke-[2.5]" /></div>
                <span>Premium Font custom selections for Name & Bio</span>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white"><Check className="h-3 w-3 stroke-[2.5]" /></div>
                <span>Advanced Analytics geo-tracking & Device metrics</span>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white"><Check className="h-3 w-3 stroke-[2.5]" /></div>
                <span>Auto-favicons & custom branding removal</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
