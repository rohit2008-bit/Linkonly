import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { store, getFontFamily, type Profile, type Theme } from "@/lib/store";
import { Avatar, LinkIcon, isValidUrl } from "./dashboard";
import { Crown, Check, Lock, ShieldCheck, ArrowRight } from "lucide-react";
import { verifyProfilePassword, verifyLinkPassword } from "@/lib/password";
import { PasswordInput } from "@/components/PasswordInput";

export const Route = createFileRoute("/$username")({
  ssr: false,
  component: PublicProfile,
  notFoundComponent: NotFoundProfile,
});

function PublicProfile() {
  const { username } = Route.useParams();
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  
  // Password State
  const [profileUnlocked, setProfileUnlocked] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState("");
  
  const [activeLinkLock, setActiveLinkLock] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const p = await store.get(username);
      if (p) {
        const key = username.toLowerCase();
        let viewsVal = p.views || 0;

        // 1. Device check via localStorage
        const viewedKey = `viewed_${key}`;
        const deviceViewed = typeof window !== "undefined" && localStorage.getItem(viewedKey);

        if (deviceViewed) {
          // Already viewed on this device, skip view increment
          setProfile(p);
          return;
        }

        // 2. IP check via public IP resolver
        let ipAddress = "";
        let countryCode = "US";
        let countryName = "United States";
        try {
          const ipRes = await fetch("https://ipapi.co/json/");
          if (ipRes.ok) {
            const ipData = await ipRes.json();
            ipAddress = ipData.ip || "";
            countryCode = ipData.country_code || "US";
            countryName = ipData.country_name || "United States";
          }
        } catch (e) {
          console.error("Failed to fetch IP:", e);
        }

        let ipViewed = false;
        if (ipAddress) {
          const hasView = await store.checkIpView(username, ipAddress);
          if (hasView) {
            ipViewed = true;
          }
        }

        if (!deviceViewed && !ipViewed) {
          // Record view on this device
          if (typeof window !== "undefined") {
            localStorage.setItem(viewedKey, "true");
          }
          
          let device = "Desktop";
          if (typeof navigator !== "undefined") {
            const ua = navigator.userAgent;
            if (/tablet|ipad|playbook|silk/i.test(ua)) device = "Tablet";
            else if (/mobile|iphone|ipod|android|blackberry|iemobile|opera mini/i.test(ua)) device = "Mobile";
          }

          // Increment views and store IP analytics in Supabase with pre-fetched details
          await store.trackView(username, ipAddress, { countryCode, countryName, device });
          viewsVal += 1;
        }

        setProfile({ ...p, views: viewsVal });
      } else {
        setProfile(null);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  if (profile === undefined) {
    return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Loading…</div>;
  }
  if (profile === null) {
    throw notFound();
  }

  const t = profile.theme;
  const onClick = (id: string) => store.trackClick(username, id);
  
  const isProtectedProfile = !!t.protection?.password_hash;
  const isFullLock = isProtectedProfile && t.protection?.lock_type === "full";
  const isPartialLock = isProtectedProfile && t.protection?.lock_type === "partial";
  const needsProfileUnlock = isProtectedProfile && !profileUnlocked;

  const handleProfileUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unlockPassword) return;
    setUnlocking(true);
    setUnlockError("");
    try {
      const res = await verifyProfilePassword({ data: { username, passwordInput: unlockPassword } });
      if (res.ok && res.profile) {
        setProfile(res.profile);
        setProfileUnlocked(true);
      } else {
        setUnlockError(res.error || "Incorrect password");
      }
    } catch (e: any) {
      setUnlockError(e.message || "An error occurred");
    } finally {
      setUnlocking(false);
    }
  };

  const handleLinkUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unlockPassword || !activeLinkLock) return;
    setUnlocking(true);
    setUnlockError("");
    try {
      const res = await verifyLinkPassword({ data: { username, linkId: activeLinkLock, passwordInput: unlockPassword } });
      if (res.ok && res.url) {
        window.open(res.url, "_blank");
        setActiveLinkLock(null);
        setUnlockPassword("");
        onClick(activeLinkLock);
      } else {
        setUnlockError(res.error || "Incorrect password");
      }
    } catch (e: any) {
      setUnlockError(e.message || "An error occurred");
    } finally {
      setUnlocking(false);
    }
  };

  // ----------------------------------------------------
  // FULL LOCK RENDER
  // ----------------------------------------------------
  if (isFullLock && needsProfileUnlock) {
    return (
      <div className="grid min-h-screen place-items-center px-4" style={{ background: t.bg, color: t.text }}>
        <div className="w-full max-w-sm rounded-3xl p-6 sm:p-8" style={{ background: t.card, border: `2px solid ${t.text}`, boxShadow: `6px 6px 0 0 ${t.text}` }}>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl mb-6" style={{ background: t.buttonBg, color: t.buttonText, border: `2px solid ${t.text}` }}>
            <Lock className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-black text-center mb-2" style={getFontFamily(t.nameFont || t.font)}>Profile Locked</h1>
          <p className="text-sm text-center opacity-70 mb-8" style={getFontFamily(t.font)}>This profile requires a password to view.</p>
          
          <form onSubmit={handleProfileUnlock} className="space-y-4">
            <PasswordInput
              placeholder="Enter password"
              value={unlockPassword}
              onChange={setUnlockPassword}
              className="w-full"
            />
            {unlockError && <p className="text-xs font-bold text-rose-500 text-center">{unlockError}</p>}
            <button
              type="submit"
              disabled={unlocking || !unlockPassword}
              className="w-full rounded-full py-3 font-bold transition-transform hover:-translate-y-0.5 disabled:opacity-50"
              style={{ background: t.buttonBg, color: t.buttonText, border: `2px solid ${t.text}`, boxShadow: `0 4px 0 0 ${t.text}` }}
            >
              {unlocking ? "Unlocking..." : "Unlock Profile"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // NORMAL & PARTIAL LOCK RENDER
  // ----------------------------------------------------
  return (
    <div className="min-h-screen px-5 py-10 public-profile" style={{ background: t.bg, color: t.text }}>
      <div className="mx-auto flex max-w-md flex-col items-center text-center">
        <div className="relative">
          <Avatar url={profile.avatar} name={profile.name} size={96} />
          {profile.premium && (
            <div className="absolute -top-1.5 -right-1.5 rounded-full border-2 border-foreground bg-amber-400 p-1 text-foreground shadow-[1px_1px_0_0_theme(colors.foreground)]" title="Premium Creator">
              <Crown className="h-3.5 w-3.5 fill-amber-300" />
            </div>
          )}
        </div>
        <h1 className="mt-4 text-2xl font-bold flex items-center justify-center gap-1.5" style={getFontFamily(t.nameFont || t.font)}>
          {profile.premium && (
            <Crown className="h-5 w-5 fill-amber-400 text-amber-500 shrink-0" title="Premium" />
          )}
          <span>{profile.name || `@${profile.username}`}</span>
          {profile.premium && (
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 p-0.5 text-white shrink-0 shadow-[1px_1px_0_0_theme(colors.foreground)]" title="Verified Account">
              <Check className="h-3 w-3 stroke-[3.5]" />
            </span>
          )}
        </h1>
        <p className="opacity-70">@{profile.username}</p>
        {profile.bio && <p className="mt-3 max-w-sm text-sm opacity-80" style={{ ...getFontFamily(t.bioFont || t.font), wordBreak: "break-word", overflowWrap: "break-word" }}>{profile.bio}</p>}

        <div className="mt-8 w-full space-y-3">
          {isPartialLock && needsProfileUnlock ? (
            <div className="rounded-3xl p-6 sm:p-8 text-center" style={{ background: t.card, border: `2px solid ${t.text}`, boxShadow: `6px 6px 0 0 ${t.text}` }}>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl mb-4" style={{ background: t.buttonBg, color: t.buttonText, border: `2px solid ${t.text}` }}>
                <Lock className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold mb-2" style={getFontFamily(t.nameFont || t.font)}>Links Locked</h2>
              <p className="text-sm opacity-70 mb-6" style={getFontFamily(t.font)}>Enter password to reveal links.</p>
              
              <form onSubmit={handleProfileUnlock} className="space-y-4 max-w-[240px] mx-auto">
                <PasswordInput
                  placeholder="Password"
                  value={unlockPassword}
                  onChange={setUnlockPassword}
                  className="w-full"
                />
                {unlockError && <p className="text-xs font-bold text-rose-500">{unlockError}</p>}
                <button
                  type="submit"
                  disabled={unlocking || !unlockPassword}
                  className="w-full rounded-full py-2.5 text-sm font-bold transition-transform hover:-translate-y-0.5 disabled:opacity-50"
                  style={{ background: t.buttonBg, color: t.buttonText, border: `2px solid ${t.text}` }}
                >
                  {unlocking ? "..." : "Unlock"}
                </button>
              </form>
            </div>
          ) : (
            <>
              {profile.links.filter((l) => isValidUrl(l.url) || l.url === "protected").length === 0 && <p className="opacity-60">No links yet.</p>}
              {profile.links
                .filter((l) => isValidUrl(l.url) || l.url === "protected")
                .map((l) => (
                  l.url === "protected" ? (
                    <button
                      key={l.id}
                      onClick={() => {
                        setActiveLinkLock(l.id);
                        setUnlockError("");
                        setUnlockPassword("");
                      }}
                      className="block w-full transition-transform hover:-translate-y-0.5 cursor-pointer text-left"
                    >
                      <ButtonView label={l.title} url="protected" theme={t} isProtected={true} />
                    </button>
                  ) : (
                    <a
                      key={l.id}
                      href={l.url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => onClick(l.id)}
                      className="block w-full transition-transform hover:-translate-y-0.5"
                    >
                      <ButtonView label={l.title} url={l.url} theme={t} />
                    </a>
                  )
                ))}
            </>
          )}
        </div>

        {/* Individual Link Lock Modal */}
        {activeLinkLock && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
            <div className="w-full max-w-sm rounded-3xl p-6 sm:p-8 relative" style={{ background: t.card, border: `2px solid ${t.text}`, boxShadow: `8px 8px 0 0 ${t.text}`, color: t.text }}>
              <button 
                onClick={() => setActiveLinkLock(null)}
                className="absolute top-4 right-4 p-2 opacity-50 hover:opacity-100"
              >
                ✕
              </button>
              <div className="mb-6 flex items-center gap-3">
                <ShieldCheck className="h-6 w-6 opacity-70" />
                <h2 className="text-xl font-bold" style={getFontFamily(t.nameFont || t.font)}>Secure Link</h2>
              </div>
              <p className="text-sm opacity-80 mb-6" style={getFontFamily(t.font)}>This link is password protected.</p>
              
              <form onSubmit={handleLinkUnlock} className="space-y-4">
                <PasswordInput
                  placeholder="Enter link password"
                  value={unlockPassword}
                  onChange={setUnlockPassword}
                  className="w-full"
                  autoFocus
                />
                {unlockError && <p className="text-xs font-bold text-rose-500">{unlockError}</p>}
                <button
                  type="submit"
                  disabled={unlocking || !unlockPassword}
                  className="w-full flex items-center justify-center gap-2 rounded-full py-3 font-bold transition-transform hover:-translate-y-0.5 disabled:opacity-50"
                  style={{ background: t.buttonBg, color: t.buttonText, border: `2px solid ${t.text}`, boxShadow: `0 4px 0 0 ${t.text}` }}
                >
                  {unlocking ? "Unlocking..." : (
                    <>
                      <span>Unlock & Visit</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        <footer className="mt-12 text-xs opacity-60">
          <Link to="/" className="underline">Made with LinkOnly</Link>
        </footer>
      </div>
    </div>
  );
}

function ButtonView({ label, url, theme, isProtected }: { label: string; url: string; theme: Theme; isProtected?: boolean }) {
  const base = "flex items-center justify-center relative w-full truncate text-base font-semibold px-5 py-3.5 min-h-[52px]";
  
  const content = (
    <>
      {isProtected ? (
        <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 opacity-70 shrink-0" />
      ) : (
        <LinkIcon url={url} className="absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 rounded object-contain bg-white/10 shrink-0 p-0.5" />
      )}
      <span className="truncate text-center px-8 w-full">{label}</span>
    </>
  );

  if (theme.button === "outline") {
    return (
      <span 
        className={`${base} rounded-full border-2`} 
        style={{ borderColor: theme.buttonText, color: theme.buttonText, background: "transparent" }}
      >
        {content}
      </span>
    );
  }
  if (theme.button === "solid") {
    return (
      <span 
        className={`${base} rounded-xl`} 
        style={{ background: theme.buttonBg, color: theme.buttonText }}
      >
        {content}
      </span>
    );
  }
  return (
    <span 
      className={`${base} rounded-full border-2 shadow-[0_4px_0_0_currentColor]`} 
      style={{ background: theme.buttonBg, color: theme.buttonText, borderColor: theme.buttonText }}
    >
      {content}
    </span>
  );
}

function NotFoundProfile() {
  const { username } = Route.useParams();
  return (
    <div className="grid min-h-screen place-items-center bg-background px-6">
      <div className="max-w-md text-center">
        <h1 className="text-5xl font-bold">@{username}</h1>
        <p className="mt-3 text-muted-foreground">This link isn't taken yet. Grab it before someone else does!</p>
        <div className="mt-6">
          <Link to="/auth/$mode" params={{ mode: "signup" }} className="inline-flex items-center rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background">
            Claim @{username}
          </Link>
        </div>
      </div>
    </div>
  );
}
