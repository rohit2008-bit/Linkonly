import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, Palette, QrCode, Sparkles, Link as LinkIcon, ChevronDown } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: "Is LinkOnly free?",
      answer: "Yes. The core features are completely free."
    },
    {
      question: "Can I add unlimited links?",
      answer: "Absolutely."
    },
    {
      question: "Can I customize colors?",
      answer: "Yes. Premium unlocks more customization options."
    },
    {
      question: "Can I generate QR codes?",
      answer: "Yes. Every profile includes one."
    },
    {
      question: "Can I track visitors?",
      answer: "Yes. Basic analytics are free. Premium provides advanced insights."
    }
  ];
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>
          <img src="/logo.png" alt="Logo" className="h-8 w-8 object-contain" />
          LinkHub
        </Link>
        <nav className="flex items-center gap-2">
          <Link to="/auth/$mode" params={{ mode: "login" }} className="rounded-full px-4 py-2 text-sm font-medium hover:bg-muted">Log in</Link>
          <Link to="/auth/$mode" params={{ mode: "signup" }} className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background hover:opacity-90">
            Sign up free
          </Link>
        </nav>
      </header>

      <section
        className="mx-auto max-w-6xl px-6 pb-20 pt-10 md:pt-20"
      >
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-foreground bg-card px-3 py-1 text-xs font-semibold animate-fade-in-up delay-100 fill-mode-backwards">
              <Sparkles className="h-3.5 w-3.5" /> Everything you are, in one link
            </span>
            <h1 className="mt-5 text-5xl font-bold leading-[1.05] md:text-6xl animate-fade-in-up delay-200 fill-mode-backwards">
              The only link<br />you'll ever need<br />to share.
            </h1>
            <p className="mt-5 max-w-md text-lg text-muted-foreground animate-fade-in-up delay-300 fill-mode-backwards">
              Build a beautiful profile that holds every link you share on Instagram, X, LinkedIn, YouTube — anywhere.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 animate-fade-in-up delay-400 fill-mode-backwards">
              <Link
                to="/auth/$mode"
                params={{ mode: "signup" }}
                className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-base font-semibold text-background transition-transform hover:-translate-y-0.5 animate-fade-in-up delay-400 fill-mode-backwards"
              >
                Claim your link <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/auth/$mode"
                params={{ mode: "login" }}
                className="inline-flex items-center gap-2 rounded-full border-2 border-foreground bg-card px-6 py-3 text-base font-semibold hover:bg-accent/40"
              >
                Log in
              </Link>
            </div>
          </div>
 
          {/* Phone mock */}
          <div className="relative mx-auto w-full max-w-sm animate-float">
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

      <section className="mx-auto max-w-6xl px-6 py-16 border-t-2 border-foreground">
        <h2 className="text-3xl font-bold text-center mb-10" style={{ fontFamily: "var(--font-display)" }}>
          Why LinkOnly?
        </h2>
        <div className="grid gap-8 md:grid-cols-3">
          {/* Card 1: LinkOnly */}
          <div className="rounded-3xl border-2 border-foreground bg-card p-6 shadow-[0_8px_0_0_theme(colors.foreground)] relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-4 py-1 text-xs font-bold rounded-bl-xl border-l-2 border-b-2 border-foreground">
              RECOMMENDED
            </div>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white text-xs">✓</span>
              LinkOnly
            </h3>
            <ul className="space-y-3">
              {[
                "Unlimited Links",
                "QR Code",
                "Analytics",
                "Beautiful Themes",
                "Responsive",
                "Fast"
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm font-semibold">
                  <span className="text-emerald-500">✅</span> {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Card 2: Multiple Social Links */}
          <div className="rounded-3xl border-2 border-foreground bg-card p-6 shadow-[0_8px_0_0_theme(colors.foreground)]">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-muted-foreground">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-white text-xs">✗</span>
              Multiple Social Links
            </h3>
            <ul className="space-y-3">
              {[
                "Hard to manage",
                "Different URLs",
                "No analytics"
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                  <span>❌</span> {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Card 3: Traditional Portfolio */}
          <div className="rounded-3xl border-2 border-foreground bg-card p-6 shadow-[0_8px_0_0_theme(colors.foreground)]">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-muted-foreground">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-white text-xs">✗</span>
              Traditional Portfolio
            </h3>
            <ul className="space-y-3">
              {[
                "Hard to update",
                "Not mobile optimized"
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                  <span>❌</span> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="mx-auto max-w-4xl px-6 py-20 border-t-2 border-foreground">
        <h2 className="text-3xl font-bold text-center mb-10" style={{ fontFamily: "var(--font-display)" }}>
          FAQ
        </h2>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="rounded-2xl border-2 border-foreground bg-card overflow-hidden shadow-[0_4px_0_0_theme(colors.foreground)]"
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="flex w-full items-center justify-between px-6 py-4 text-left font-bold transition-colors hover:bg-accent/20"
              >
                <span>{faq.question}</span>
                <ChevronDown
                  className={`h-5 w-5 transition-transform duration-200 ${
                    openFaq === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`grid transition-[grid-template-rows] duration-200 ease-in-out ${
                  openFaq === i ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
              >
                <div className="overflow-hidden">
                  <div className="border-t-2 border-foreground px-6 py-4">
                    <p className="text-sm text-muted-foreground font-medium">{faq.answer}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="mx-auto max-w-6xl px-6 py-20 text-center border-t-2 border-foreground">
        <div className="rounded-3xl border-2 border-foreground bg-card p-10 md:p-16 shadow-[0_10px_0_0_theme(colors.foreground)] max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold mb-4" style={{ fontFamily: "var(--font-display)" }}>
            Ready to share everything with one link?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of creators using LinkOnly.
          </p>
          <Link
            to="/auth/$mode"
            params={{ mode: "signup" }}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-500 hover:bg-emerald-600 px-8 py-4 text-lg font-bold text-white border-2 border-foreground shadow-[0_4px_0_0_theme(colors.foreground)] transition-transform hover:-translate-y-0.5"
          >
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="mx-auto max-w-6xl px-6 py-12 border-t-2 border-foreground">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 text-xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
              <img src="/logo.png" alt="Logo" className="h-8 w-8 object-contain" />
              LinkOnly
            </Link>
            <p className="mt-4 text-sm text-muted-foreground max-w-xs">
              "The only link you'll ever need to share."
            </p>
            <div className="mt-6">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-foreground bg-card shadow-[0_3px_0_0_theme(colors.foreground)] hover:bg-accent/40"
              >
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
            </div>
          </div>
          <div>
            <h4 className="font-bold mb-4">About</h4>
            <ul className="space-y-2 text-sm text-muted-foreground font-semibold">
              <li><a href="#" className="hover:text-foreground">Pricing</a></li>
              <li><a href="#" className="hover:text-foreground">Blog</a></li>
              <li><a href="#" className="hover:text-foreground">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground font-semibold">
              <li><a href="#" className="hover:text-foreground">Help Center</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground font-semibold">
              <li><a href="#" className="hover:text-foreground">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-foreground">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-6 border-t border-foreground/10 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} LinkOnly. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
