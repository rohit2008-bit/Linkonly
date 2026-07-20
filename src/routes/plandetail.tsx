import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowRight, CalendarDays, Check, ChevronLeft, Crown, ShieldCheck, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/plandetail")({
  ssr: false,
  component: PlanDetailPage,
});

const freeFeatures = ["Unlimited profile links", "Basic profile statistics", "Custom profile QR code"];
const premiumFeatures = ["AI Bio Generator and optimization tips", "Premium Name and Bio fonts", "Verified badge and advanced analytics"];

function PlanDetailPage() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && !user) {
      navigate({ to: "/auth/$mode", params: { mode: "login" } });
    }
  }, [ready, user, navigate]);

  if (!ready || !user) {
    return <div className="grid min-h-screen place-items-center bg-background text-sm font-semibold text-muted-foreground">Loading plan details...</div>;
  }

  const isPremium = user.premium;
  const planName = isPremium ? "Premium" : "Free";
  const planPrice = isPremium ? "₹50" : "₹0";
  const expiry = isPremium ? "Active — renewal date pending" : "Never expires";
  const features = isPremium ? premiumFeatures : freeFeatures;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b-2 border-foreground bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link to={user ? "/dashboard" : "/"} className="flex min-w-0 items-center gap-2 font-bold" style={{ fontFamily: "var(--font-display)" }}>
            <img src="/logo.png" alt="LinkOnly" className="h-8 w-8 shrink-0 object-contain" />
            <span>LinkOnly</span>
          </Link>
          <Link to="/dashboard" className="inline-flex items-center gap-1.5 rounded-full border-2 border-foreground bg-card px-3 py-2 text-xs font-black shadow-[2px_2px_0_0_theme(colors.foreground)] transition-all hover:-translate-y-0.5 active:translate-y-0 active:shadow-none sm:px-4">
            <ChevronLeft className="h-3.5 w-3.5" /> Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-foreground bg-lime-300 px-3 py-1 text-xs font-black shadow-[2px_2px_0_0_theme(colors.foreground)]">
            <Sparkles className="h-3.5 w-3.5" /> Your subscription
          </span>
          <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl" style={{ fontFamily: "var(--font-display)" }}>Plan details</h1>
          <p className="mt-3 text-sm font-semibold text-muted-foreground">Everything about your LinkOnly plan in one place.</p>
        </div>

        <section className="mt-9 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <article className={`relative overflow-hidden rounded-3xl border-2 border-foreground p-6 shadow-[7px_7px_0_0_theme(colors.foreground)] sm:p-8 ${isPremium ? "bg-amber-50" : "bg-card"}`}>
            {isPremium && <div className="absolute right-5 top-5 rounded-full border-2 border-foreground bg-amber-400 px-3 py-1 text-[10px] font-black uppercase shadow-[2px_2px_0_0_theme(colors.foreground)]">Active</div>}
            <div className="flex items-center gap-3">
              <div className={`grid h-12 w-12 place-items-center rounded-2xl border-2 border-foreground ${isPremium ? "bg-amber-400" : "bg-lime-300"}`}>
                {isPremium ? <Crown className="h-6 w-6 fill-foreground" /> : <ShieldCheck className="h-6 w-6" />}
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">Current plan</p>
                <h2 className="text-2xl font-black">LinkOnly {planName}</h2>
              </div>
            </div>

            <div className="mt-8 flex items-baseline gap-1 border-y-2 border-dashed border-foreground/15 py-5">
              <span className="text-5xl font-black">{planPrice}</span>
              <span className="text-sm font-bold text-muted-foreground">/ month</span>
            </div>

            <div className="mt-6 space-y-3">
              {features.map((feature) => (
                <div key={feature} className="flex items-center gap-2.5 text-sm font-bold">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-foreground bg-lime-300"><Check className="h-3.5 w-3.5 stroke-[3]" /></span>
                  {feature}
                </div>
              ))}
            </div>
          </article>

          <div className="space-y-5">
            <article className="rounded-3xl border-2 border-foreground bg-sky-100 p-6 shadow-[5px_5px_0_0_theme(colors.foreground)]">
              <div className="flex items-center gap-2 text-sm font-black"><CalendarDays className="h-5 w-5" /> Plan expiry</div>
              <p className="mt-4 text-2xl font-black">{expiry}</p>
              <p className="mt-2 text-xs font-semibold text-muted-foreground">
                {isPremium ? "Connect billing to display your exact next renewal date." : "Your Free plan stays active for as long as you need it."}
              </p>
            </article>

            <article className="rounded-3xl border-2 border-foreground bg-card p-6 shadow-[5px_5px_0_0_theme(colors.foreground)]">
              <p className="text-sm font-black">Want to explore more?</p>
              <p className="mt-1 text-xs font-semibold text-muted-foreground">Compare every feature and find the plan that fits your page.</p>
              <Link to="/pricing" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-foreground bg-lime-400 px-4 py-3 text-sm font-black shadow-[3px_3px_0_0_theme(colors.foreground)] transition-all hover:-translate-y-0.5 hover:bg-lime-300 active:translate-y-0 active:shadow-none">
                Explore pricing <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}
