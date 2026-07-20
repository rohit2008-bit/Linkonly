import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { store, getFontFamily, type Profile, type Theme } from "@/lib/store";
import { Avatar, LinkIcon, isValidUrl } from "./dashboard";
import { Crown, Check } from "lucide-react";

export const Route = createFileRoute("/$username")({
  ssr: false,
  component: PublicProfile,
  notFoundComponent: NotFoundProfile,
});

function PublicProfile() {
  const { username } = Route.useParams();
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);

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
        try {
          const ipRes = await fetch("https://ipapi.co/json/");
          if (ipRes.ok) {
            const ipData = await ipRes.json();
            ipAddress = ipData.ip || "";
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
          // Increment views and store IP analytics in Supabase
          await store.trackView(username, ipAddress);
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
          {profile.links.filter((l) => isValidUrl(l.url)).length === 0 && <p className="opacity-60">No links yet.</p>}
          {profile.links
            .filter((l) => isValidUrl(l.url))
            .map((l) => (
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
            ))}
        </div>

        <footer className="mt-12 text-xs opacity-60">
          <Link to="/" className="underline">Made with LinkOnly</Link>
        </footer>
      </div>
    </div>
  );
}

function ButtonView({ label, url, theme }: { label: string; url: string; theme: Theme }) {
  const base = "flex items-center justify-center relative w-full truncate text-base font-semibold px-5 py-3.5 min-h-[52px]";
  
  const content = (
    <>
      <LinkIcon url={url} className="absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 rounded object-contain bg-white/10 shrink-0 p-0.5" />
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
