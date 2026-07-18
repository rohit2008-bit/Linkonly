import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, Palette, QrCode, Sparkles, Link as LinkIcon } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-foreground text-background">L</span>
          LinkHub
        </Link>
        <nav className="flex items-center gap-2">
          <Link to="/auth" className="rounded-full px-4 py-2 text-sm font-medium hover:bg-muted">Log in</Link>
          <Link to="/auth" search={{ mode: "signup" }} className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background hover:opacity-90">
            Sign up free
          </Link>
        </nav>
      </header>

      <section
        className="mx-auto max-w-6xl px-6 pb-20 pt-10 md:pt-20"
      >
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-foreground bg-card px-3 py-1 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" /> Everything you are, in one link
            </span>
            <h1 className="mt-5 text-5xl font-bold leading-[1.05] md:text-6xl">
              The only link<br />you'll ever need<br />to share.
            </h1>
            <p className="mt-5 max-w-md text-lg text-muted-foreground">
              Build a beautiful profile that holds every link you share on Instagram, X, LinkedIn, YouTube — anywhere.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/auth"
                search={{ mode: "signup" }}
                className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-base font-semibold text-background transition-transform hover:-translate-y-0.5"
              >
                Claim your link <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 rounded-full border-2 border-foreground bg-card px-6 py-3 text-base font-semibold hover:bg-accent/40"
              >
                Log in
              </Link>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">Free forever · No credit card required</p>
          </div>

          {/* Phone mock */}
          <div className="relative mx-auto w-full max-w-sm">
            <div
              className="rounded-[2.5rem] border-4 border-foreground p-3 shadow-[0_20px_0_0_theme(colors.foreground)]"
              style={{ background: "var(--gradient-hero)" }}
            >
              <div className="rounded-[2rem] bg-card px-6 py-8">
                <div className="mx-auto h-20 w-20 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500" />
                <p className="mt-4 text-center text-lg font-bold">@yourname</p>
                <p className="mt-1 text-center text-sm text-muted-foreground">Creator · Builder · Explorer</p>
                <div className="mt-6 space-y-3">
                  {["My latest project", "YouTube channel", "Newsletter", "Say hi 👋"].map((t) => (
                    <div key={t} className="rounded-full border-2 border-foreground bg-card px-4 py-3 text-center text-sm font-semibold shadow-[0_4px_0_0_theme(colors.foreground)]">
                      {t}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-6 md:grid-cols-4">
          {[
            { icon: LinkIcon, title: "Unlimited links", desc: "Add as many as you want. Reorder anytime." },
            { icon: Palette, title: "Fully customizable", desc: "Colors, fonts, buttons — make it yours." },
            { icon: QrCode, title: "QR code included", desc: "Print, share, scan. Works everywhere." },
            { icon: BarChart3, title: "Live analytics", desc: "See views and clicks in real time." },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border-2 border-foreground bg-card p-5 shadow-[0_6px_0_0_theme(colors.foreground)]">
              <f.icon className="h-6 w-6" />
              <h3 className="mt-4 text-lg font-bold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-6 py-10 text-center text-sm text-muted-foreground">
        Built with LinkHub · Demo MVP
      </footer>
    </div>
  );
}
