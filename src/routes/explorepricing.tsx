import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Crown, Check, Star, Sparkles, Zap } from "lucide-react";

export const Route = createFileRoute("/explorepricing")({
  ssr: false,
  component: ExplorePricingPage,
});

function ExplorePricingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>
          <img src="/logo.png" alt="Logo" className="h-8 w-8 object-contain" />
          LinkOnly
        </Link>
        <nav className="flex items-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-full border-2 border-foreground bg-card px-4 py-2 text-xs font-black shadow-[2px_2px_0_0_theme(colors.foreground)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Back to Home
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12 text-center">
        {/* Badge */}
        <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-foreground bg-amber-50 px-3.5 py-1 text-xs font-black text-amber-700 animate-pulse">
          <Sparkles className="h-3.5 w-3.5 fill-amber-500 text-amber-600" /> Explore Our Plans
        </span>

        <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl" style={{ fontFamily: "var(--font-display)" }}>
          What You Get with LinkOnly
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-sm text-muted-foreground font-semibold">
          See what's included in each plan — start free and upgrade anytime to unlock the full power of your link-in-bio.
        </p>

        {/* Plan Cards */}
        <div className="mt-12 grid gap-8 md:grid-cols-2">

          {/* Free Plan */}
          <div className="flex flex-col rounded-3xl border-2 border-foreground bg-card p-6 text-left shadow-[6px_6px_0_0_theme(colors.foreground)] relative transition-all hover:-translate-y-0.5">
            <h3 className="text-xl font-bold">Free Plan</h3>
            <p className="mt-1 text-xs text-muted-foreground">The essentials to get started online.</p>

            <div className="mt-6 flex items-baseline gap-1">
              <span className="text-4xl font-black">₹0</span>
              <span className="text-xs font-semibold text-muted-foreground">/ month</span>
            </div>

            {/* Info pill instead of purchase button */}
            <div className="mt-6 w-full rounded-full border-2 border-foreground bg-muted py-3 text-center text-sm font-bold text-muted-foreground select-none">
              Always Free — No Credit Card
            </div>

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

            <div className="mt-auto pt-8">
              <Link
                to="/auth/signup"
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border-2 border-foreground bg-card py-3 text-sm font-black shadow-[3px_3px_0_0_theme(colors.foreground)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all"
              >
                Get Started Free →
              </Link>
            </div>
          </div>

          {/* Premium Plan */}
          <div className="flex flex-col rounded-3xl border-2 border-foreground bg-amber-50/20 p-6 text-left shadow-[8px_8px_0_0_theme(colors.foreground)] relative transition-all hover:-translate-y-1">
            <div className="absolute -top-3.5 right-6 rounded-full border-2 border-foreground bg-amber-400 px-3.5 py-1 text-[10px] font-black uppercase tracking-wider text-foreground shadow-[2px_2px_0_0_theme(colors.foreground)]">
              👑 Most Popular
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

            {/* Info pill instead of purchase button */}
            <div className="mt-6 w-full rounded-full border-2 border-amber-400 bg-amber-50 py-3 text-center text-sm font-black text-amber-700 select-none flex items-center justify-center gap-2">
              <Zap className="h-4 w-4 fill-amber-400" /> Available after sign-up
            </div>

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
                <span>Premium Font custom selections for Name &amp; Bio</span>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white"><Check className="h-3 w-3 stroke-[2.5]" /></div>
                <span>Advanced Analytics geo-tracking &amp; Device metrics</span>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white"><Check className="h-3 w-3 stroke-[2.5]" /></div>
                <span>Auto-favicons &amp; custom branding removal</span>
              </li>
            </ul>

            <div className="mt-auto pt-8">
              <Link
                to="/auth/signup"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-foreground bg-amber-400 py-3 text-sm font-black text-foreground shadow-[3px_3px_0_0_theme(colors.foreground)] hover:bg-amber-300 hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all"
              >
                <Crown className="h-4 w-4 fill-foreground" /> Sign Up to Unlock Premium
              </Link>
            </div>
          </div>

        </div>

        {/* Bottom note */}
        <p className="mt-10 text-xs text-muted-foreground font-medium">
          Already have an account?{" "}
          <Link to="/auth/login" className="font-black underline underline-offset-2 hover:text-foreground transition-colors">
            Log in
          </Link>{" "}
          and upgrade from your dashboard.
        </p>
      </main>

      {/* Footer */}
      <footer className="mx-auto max-w-4xl px-6 py-8 mt-8 border-t border-foreground/10 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} LinkOnly. All rights reserved.
      </footer>
    </div>
  );
}
