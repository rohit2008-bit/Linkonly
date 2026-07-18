import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { store, type Profile, type Theme } from "@/lib/store";
import { Avatar } from "./dashboard";

export const Route = createFileRoute("/$username")({
  ssr: false,
  component: PublicProfile,
  notFoundComponent: NotFoundProfile,
});

function PublicProfile() {
  const { username } = Route.useParams();
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);

  useEffect(() => {
    const p = store.get(username);
    if (p) {
      store.trackView(username);
      setProfile({ ...p, views: (p.views || 0) + 1 });
    } else {
      setProfile(null);
    }
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
    <div className="min-h-screen px-5 py-10" style={{ background: t.bg, color: t.text }}>
      <div className="mx-auto flex max-w-md flex-col items-center text-center">
        <Avatar url={profile.avatar} name={profile.name} size={96} />
        <h1 className="mt-4 text-2xl font-bold">{profile.name || `@${profile.username}`}</h1>
        <p className="opacity-70">@{profile.username}</p>
        {profile.bio && <p className="mt-3 max-w-sm text-sm opacity-80">{profile.bio}</p>}

        <div className="mt-8 w-full space-y-3">
          {profile.links.length === 0 && <p className="opacity-60">No links yet.</p>}
          {profile.links.map((l) => (
            <a
              key={l.id}
              href={l.url}
              target="_blank"
              rel="noreferrer"
              onClick={() => onClick(l.id)}
              className="block w-full transition-transform hover:-translate-y-0.5"
            >
              <ButtonView label={l.title} theme={t} />
            </a>
          ))}
        </div>

        <footer className="mt-12 text-xs opacity-60">
          <Link to="/" className="underline">Made with LinkHub</Link>
        </footer>
      </div>
    </div>
  );
}

function ButtonView({ label, theme }: { label: string; theme: Theme }) {
  const base = "block w-full truncate text-center text-base font-semibold px-5 py-3.5";
  if (theme.button === "outline") {
    return <span className={`${base} rounded-full border-2`} style={{ borderColor: theme.buttonText, color: theme.buttonText, background: "transparent" }}>{label}</span>;
  }
  if (theme.button === "solid") {
    return <span className={`${base} rounded-xl`} style={{ background: theme.buttonBg, color: theme.buttonText }}>{label}</span>;
  }
  return <span className={`${base} rounded-full border-2 shadow-[0_4px_0_0_currentColor]`} style={{ background: theme.buttonBg, color: theme.buttonText, borderColor: theme.buttonText }}>{label}</span>;
}

function NotFoundProfile() {
  const { username } = Route.useParams();
  return (
    <div className="grid min-h-screen place-items-center bg-background px-6">
      <div className="max-w-md text-center">
        <h1 className="text-5xl font-bold">@{username}</h1>
        <p className="mt-3 text-muted-foreground">This link isn't taken yet. Grab it before someone else does!</p>
        <div className="mt-6">
          <Link to="/auth" search={{ mode: "signup" }} className="inline-flex items-center rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background">
            Claim @{username}
          </Link>
        </div>
      </div>
    </div>
  );
}
