import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, ChevronLeft, Check, Palette, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { getFontFamily } from "@/lib/store";
import { BUILT_IN_THEMES, type BuiltInTheme } from "@/lib/builtInThemes";

export const Route = createFileRoute("/builtinthemes")({
  component: BuiltInThemesPage,
});

function BuiltInThemesPage() {
  const { user, update } = useAuth();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [appliedId, setAppliedId] = useState<string | null>(null);

  const categories = ["All", "Abstract", "Minimal Light", "Vintage", "Pop Art", "Dark Neon", "Nature", "Glassmorphism", "Modern Creative"];

  const filteredThemes = selectedCategory === "All" 
    ? BUILT_IN_THEMES 
    : BUILT_IN_THEMES.filter(t => t.category === selectedCategory);

  const handleApplyTheme = async (themeObj: BuiltInTheme) => {
    if (!user) {
      navigate({ to: "/auth/$mode", params: { mode: "login" } });
      return;
    }

    setApplyingId(themeObj.id);
    try {
      await update({ theme: themeObj.theme, theme_name: themeObj.name });
      setAppliedId(themeObj.id);
      setTimeout(() => setAppliedId(null), 3000);
    } catch (err) {
      console.error("Failed to apply theme:", err);
    } finally {
      setApplyingId(null);
    }
  };

  const isCurrentTheme = (themeObj: BuiltInTheme) => {
    if (!user?.theme) return false;
    return user.theme.bg === themeObj.theme.bg;
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Top Bar */}
      <div className="border-b-2 border-foreground bg-card sticky top-0 z-50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-foreground bg-card px-4 py-1.5 text-xs font-extrabold hover:bg-muted transition-transform hover:-translate-y-0.5 active:translate-y-0 shadow-[2px_2px_0_0_theme(colors.foreground)]"
            >
              <ChevronLeft className="h-4 w-4" /> Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="mx-auto max-w-7xl px-4 pt-8 pb-6 sm:px-6">
        <div className="rounded-3xl border-2 border-foreground bg-card p-6 sm:p-10 shadow-[0_6px_0_0_theme(colors.foreground)] relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-foreground bg-amber-400 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-foreground mb-3 shadow-[2px_2px_0_0_theme(colors.foreground)]">
              <Sparkles className="h-3.5 w-3.5" /> Built-In Themes Gallery
            </span>
            <h1 className="text-3xl font-black sm:text-4xl tracking-tight">
              Discover & Apply Handcrafted Themes
            </h1>
          </div>
        </div>

        {/* Category Filters styled with bright pill design and sharp offset shadow */}
        <div className="mt-8 flex items-center gap-3 overflow-x-auto pb-3 pt-1 px-1 scrollbar-none">
          <Palette className="h-4 w-4 shrink-0 text-muted-foreground ml-1 mr-1" />
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`shrink-0 rounded-full border-2 border-foreground px-4 py-2 text-xs font-black transition-all active:translate-y-0 active:shadow-none whitespace-nowrap ${
                selectedCategory === cat
                  ? "bg-[#22c55e] text-black shadow-[3px_3px_0_0_theme(colors.foreground)] -translate-y-0.5"
                  : "bg-card text-foreground hover:bg-muted shadow-[2px_2px_0_0_theme(colors.foreground)]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Success Banner */}
        {appliedId && (
          <div className="mt-6 flex items-center justify-between rounded-2xl border-2 border-foreground bg-[#22c55e] p-4 text-black font-extrabold shadow-[4px_4px_0_0_theme(colors.foreground)] animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 stroke-[3]" />
              <span>Theme Applied Successfully! Your profile has been updated.</span>
            </div>
            {user && (
              <Link
                to="/$username"
                params={{ username: user.username }}
                target="_blank"
                className="inline-flex items-center gap-1 rounded-full border-2 border-foreground bg-background px-3.5 py-1.5 text-xs font-black hover:bg-muted text-foreground"
              >
                View Live <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        )}

        {/* Theme Grid */}
        <div className="mt-8 grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredThemes.map(t => {
            const active = isCurrentTheme(t);
            const isApplying = applyingId === t.id;

            return (
              <div
                key={t.id}
                className="flex flex-col rounded-3xl border-2 border-foreground bg-card overflow-hidden shadow-[0_6px_0_0_theme(colors.foreground)] transition-transform hover:-translate-y-1"
              >
                {/* Live Preview Screen */}
                <div
                  className="relative h-64 w-full p-4 flex flex-col items-center justify-center text-center transition-all overflow-hidden"
                  style={{
                    background: t.theme.bg,
                    color: t.theme.text,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                  }}
                >
                  {/* Overlay for subtle contrast */}
                  <div className="absolute inset-0 bg-black/5 pointer-events-none" />

                  {/* Profile Mockup inside Card */}
                  <div className="relative z-10 w-full max-w-[240px] flex flex-col items-center space-y-2">
                    {/* Mock Avatar */}
                    <div className="h-12 w-12 rounded-full border-2 border-foreground bg-background grid place-items-center font-black text-sm text-foreground shadow-[2px_2px_0_0_theme(colors.foreground)]">
                      {user?.name?.[0]?.toUpperCase() || "R"}
                    </div>
                    {/* Mock Name */}
                    <p className="text-base font-bold truncate max-w-full" style={getFontFamily(t.theme.nameFont || t.theme.font)}>
                      {user?.name || "Alex Creator"}
                    </p>
                    {/* Mock Bio */}
                    <p className="text-[11px] opacity-80 line-clamp-1" style={getFontFamily(t.theme.bioFont || t.theme.font)}>
                      Digital creator & designer
                    </p>
                    {/* Mock Link Buttons */}
                    <div className="w-full space-y-1.5 pt-1">
                      <div
                        className={`w-full py-1.5 px-3 text-xs font-bold truncate border-2 border-foreground shadow-[2px_2px_0_0_theme(colors.foreground)] ${
                          t.theme.button === "pill" ? "rounded-full" : t.theme.button === "outline" ? "rounded-lg bg-transparent" : "rounded-lg"
                        }`}
                        style={{
                          backgroundColor: t.theme.button === "outline" ? "transparent" : t.theme.buttonBg,
                          color: t.theme.buttonText,
                          fontFamily: getFontFamily(t.theme.font).fontFamily,
                        }}
                      >
                        ⚡ My Portfolio
                      </div>
                      <div
                        className={`w-full py-1.5 px-3 text-xs font-bold truncate border-2 border-foreground shadow-[2px_2px_0_0_theme(colors.foreground)] ${
                          t.theme.button === "pill" ? "rounded-full" : t.theme.button === "outline" ? "rounded-lg bg-transparent" : "rounded-lg"
                        }`}
                        style={{
                          backgroundColor: t.theme.button === "outline" ? "transparent" : t.theme.buttonBg,
                          color: t.theme.buttonText,
                          fontFamily: getFontFamily(t.theme.font).fontFamily,
                        }}
                      >
                        🌐 Instagram Profile
                      </div>
                    </div>
                  </div>

                  {/* Active Badge */}
                  {active && (
                    <div className="absolute top-3 right-3 z-20 flex items-center gap-1 rounded-full border-2 border-foreground bg-[#22c55e] px-2.5 py-1 text-[11px] font-black text-black shadow-[2px_2px_0_0_theme(colors.foreground)]">
                      <Check className="h-3.5 w-3.5 stroke-[3]" /> Active
                    </div>
                  )}
                </div>

                {/* Details Footer */}
                <div className="p-5 flex flex-col flex-1 justify-between bg-card border-t-2 border-foreground">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="text-lg font-bold">{t.name}</h3>
                      <span className="rounded-full border border-foreground/20 bg-muted px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                        {t.category}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-4">
                      {t.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => handleApplyTheme(t)}
                      disabled={isApplying || active}
                      className={`w-full inline-flex items-center justify-center gap-1.5 rounded-full border-2 border-foreground px-4 py-2.5 text-xs font-black transition-all shadow-[2px_2px_0_0_theme(colors.foreground)] active:translate-y-0 active:shadow-none ${
                        active
                          ? "bg-muted text-muted-foreground cursor-default opacity-80"
                          : "bg-primary text-primary-foreground hover:-translate-y-0.5"
                      }`}
                    >
                      {isApplying ? (
                        "Applying..."
                      ) : active ? (
                        <>
                          <Check className="h-4 w-4 stroke-[3]" /> Theme Active
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" /> Apply Theme
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
