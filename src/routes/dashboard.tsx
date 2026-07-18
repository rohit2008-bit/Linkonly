import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { BarChart3, Copy, ExternalLink, GripVertical, LogOut, Palette, Plus, QrCode, Trash2, Crown, Check, Eye } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { newId, type LinkItem, type Theme } from "@/lib/store";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

type Tab = "links" | "profile" | "theme" | "qr" | "analytics";

function Dashboard() {
  const { user, ready, logout, update } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("links");

  useEffect(() => {
    if (ready && !user) navigate({ to: "/auth" });
  }, [ready, user, navigate]);

  if (!ready || !user) {
    return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Loading…</div>;
  }

  const publicUrl = typeof window !== "undefined" ? `${window.location.origin}/${user.username}` : `/${user.username}`;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b-2 border-foreground bg-card">
        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 sm:flex sm:justify-between">
          <Link to="/" className="flex min-w-0 items-center gap-2 font-bold" style={{ fontFamily: "var(--font-display)" }}>
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-foreground text-background">L</span>
            <span className="truncate">LinkHub</span>
          </Link>
          <div className="flex items-center gap-2">
            <a href={`/${user.username}`} target="_blank" rel="noreferrer" className="hidden items-center gap-1.5 rounded-full border-2 border-foreground bg-card px-3 py-1.5 text-xs font-semibold hover:bg-accent/30 sm:inline-flex">
              <Eye className="h-3.5 w-3.5" /> View my page
            </a>
            <button onClick={logout} className="inline-flex items-center gap-1.5 rounded-full border-2 border-foreground bg-card px-3 py-1.5 text-xs font-semibold hover:bg-accent/30">
              <LogOut className="h-3.5 w-3.5" /> Log out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6">
        <UrlBar url={publicUrl} />

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div>
            <Tabs tab={tab} setTab={setTab} />
            <div className="mt-4">
              {tab === "links" && <LinksTab />}
              {tab === "profile" && <ProfileTab />}
              {tab === "theme" && <ThemeTab />}
              {tab === "qr" && <QRTab url={publicUrl} />}
              {tab === "analytics" && <AnalyticsTab />}
            </div>
          </div>

          <div className="lg:sticky lg:top-6 lg:self-start">
            <PhonePreview />
          </div>
        </div>
      </div>
    </div>
  );

  function PhonePreview() {
    const t = user!.theme;
    return (
      <div className="rounded-3xl border-2 border-foreground p-3 shadow-[0_10px_0_0_theme(colors.foreground)]" style={{ background: t.bg }}>
        <div className="max-h-[560px] overflow-y-auto rounded-2xl px-5 py-6" style={{ background: t.bg, color: t.text }}>
          <div className="flex flex-col items-center text-center">
            <Avatar url={user!.avatar} name={user!.name} />
            <p className="mt-3 text-lg font-bold">{user!.name || `@${user!.username}`}</p>
            <p className="text-sm opacity-70">@{user!.username}</p>
            {user!.bio && <p className="mt-2 max-w-xs text-sm opacity-80">{user!.bio}</p>}
            <div className="mt-5 w-full space-y-2.5">
              {user!.links.length === 0 && <p className="py-6 text-xs opacity-60">No links yet — add your first one →</p>}
              {user!.links.map((l) => (
                <PreviewBtn key={l.id} label={l.title} theme={t} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  function LinksTab() {
    const [title, setTitle] = useState("");
    const [url, setUrl] = useState("");
    const add = () => {
      if (!title.trim() || !url.trim()) return;
      const link: LinkItem = { id: newId(), title: title.trim(), url: normalizeUrl(url.trim()), clicks: 0 };
      update({ links: [...user!.links, link] });
      setTitle(""); setUrl("");
    };
    const remove = (id: string) => update({ links: user!.links.filter((l) => l.id !== id) });
    const move = (id: string, dir: -1 | 1) => {
      const list = [...user!.links];
      const i = list.findIndex((l) => l.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= list.length) return;
      [list[i], list[j]] = [list[j], list[i]];
      update({ links: list });
    };
    const edit = (id: string, patch: Partial<LinkItem>) => {
      update({ links: user!.links.map((l) => (l.id === id ? { ...l, ...patch } : l)) });
    };

    return (
      <Card>
        <SectionTitle title="Your links" subtitle="Add unlimited links — they'll appear on your public profile." />
        <div className="mt-4 grid grid-cols-1 gap-2 rounded-2xl border-2 border-dashed border-foreground/30 p-3 sm:grid-cols-[1fr_1.4fr_auto]">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (e.g. My YouTube)" className="rounded-full border-2 border-foreground bg-card px-4 py-2.5 text-sm outline-none" />
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" className="rounded-full border-2 border-foreground bg-card px-4 py-2.5 text-sm outline-none" />
          <button onClick={add} className="inline-flex items-center justify-center gap-1.5 rounded-full bg-foreground px-4 py-2.5 text-sm font-semibold text-background"><Plus className="h-4 w-4" /> Add link</button>
        </div>

        <div className="mt-4 space-y-2">
          {user!.links.map((l) => (
            <div key={l.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border-2 border-foreground bg-card p-3">
              <div className="flex flex-col">
                <button onClick={() => move(l.id, -1)} className="text-xs text-muted-foreground hover:text-foreground">▲</button>
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <button onClick={() => move(l.id, 1)} className="text-xs text-muted-foreground hover:text-foreground">▼</button>
              </div>
              <div className="min-w-0">
                <input value={l.title} onChange={(e) => edit(l.id, { title: e.target.value })} className="w-full truncate bg-transparent text-sm font-semibold outline-none" />
                <input value={l.url} onChange={(e) => edit(l.id, { url: e.target.value })} className="w-full truncate bg-transparent text-xs text-muted-foreground outline-none" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="rounded-full bg-muted px-2 py-1 text-xs font-semibold">{l.clicks} clicks</span>
                <a href={l.url} target="_blank" rel="noreferrer" className="grid h-8 w-8 place-items-center rounded-full hover:bg-muted"><ExternalLink className="h-4 w-4" /></a>
                <button onClick={() => remove(l.id)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  function ProfileTab() {
    const fileRef = useRef<HTMLInputElement | null>(null);
    const onUpload = (f: File) => {
      const reader = new FileReader();
      reader.onload = () => update({ avatar: String(reader.result) });
      reader.readAsDataURL(f);
    };
    return (
      <Card>
        <SectionTitle title="Edit profile" subtitle="What visitors see at the top of your page." />
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
          <Avatar url={user!.avatar} name={user!.name} size={72} />
          <div className="flex gap-2">
            <button onClick={() => fileRef.current?.click()} className="rounded-full border-2 border-foreground bg-card px-4 py-2 text-sm font-semibold hover:bg-accent/30">Upload picture</button>
            {user!.avatar && <button onClick={() => update({ avatar: "" })} className="rounded-full px-3 py-2 text-sm text-muted-foreground hover:text-destructive">Remove</button>}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Labeled label="Display name">
            <input value={user!.name} onChange={(e) => update({ name: e.target.value })} className="w-full rounded-full border-2 border-foreground bg-card px-4 py-2.5 text-sm outline-none" />
          </Labeled>
          <Labeled label="Username (URL)">
            <div className="flex items-stretch overflow-hidden rounded-full border-2 border-foreground bg-card">
              <span className="grid place-items-center bg-muted px-3 text-xs text-muted-foreground">linkhub/</span>
              <input value={user!.username} disabled className="w-full bg-transparent px-3 py-2.5 text-sm text-muted-foreground outline-none" />
            </div>
          </Labeled>
        </div>
        <div className="mt-3">
          <Labeled label="Bio">
            <textarea value={user!.bio} onChange={(e) => update({ bio: e.target.value })} rows={3} className="w-full resize-none rounded-2xl border-2 border-foreground bg-card px-4 py-3 text-sm outline-none" placeholder="Tell visitors who you are…" />
          </Labeled>
        </div>
      </Card>
    );
  }

  function ThemeTab() {
    const t = user!.theme;
    const set = (patch: Partial<Theme>) => update({ theme: { ...t, ...patch } });
    const presets: Array<{ name: string; theme: Partial<Theme> }> = [
      { name: "Cream", theme: { bg: "#f5f5f0", card: "#ffffff", text: "#111111", buttonBg: "#ffffff", buttonText: "#111111" } },
      { name: "Midnight", theme: { bg: "#0f172a", card: "#1e293b", text: "#f8fafc", buttonBg: "#1e293b", buttonText: "#f8fafc" } },
      { name: "Sunset", theme: { bg: "#fb923c", card: "#fff7ed", text: "#3f1d0d", buttonBg: "#fff7ed", buttonText: "#3f1d0d" } },
      { name: "Mint", theme: { bg: "#a7f3d0", card: "#ffffff", text: "#064e3b", buttonBg: "#ffffff", buttonText: "#064e3b" } },
    ];
    return (
      <Card>
        <SectionTitle title="Customize theme" subtitle="Colors, buttons, and vibe. Premium unlocks all presets." />
        <div className="mt-4 flex flex-wrap gap-2">
          {presets.map((p, i) => {
            const locked = !user!.premium && i > 1;
            return (
              <button
                key={p.name}
                disabled={locked}
                onClick={() => set(p.theme)}
                className="relative flex items-center gap-2 rounded-full border-2 border-foreground bg-card px-3 py-2 text-sm font-semibold disabled:opacity-50"
              >
                <span className="h-4 w-4 rounded-full border border-foreground" style={{ background: p.theme.bg }} />
                {p.name}
                {locked && <Crown className="h-3.5 w-3.5" />}
              </button>
            );
          })}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <ColorField label="Background" value={t.bg} onChange={(v) => set({ bg: v })} />
          <ColorField label="Text" value={t.text} onChange={(v) => set({ text: v })} />
          <ColorField label="Button background" value={t.buttonBg} onChange={(v) => set({ buttonBg: v })} />
          <ColorField label="Button text" value={t.buttonText} onChange={(v) => set({ buttonText: v })} />
        </div>
        <div className="mt-4">
          <p className="mb-2 text-sm font-medium">Button style</p>
          <div className="flex flex-wrap gap-2">
            {(["pill", "solid", "outline"] as const).map((b) => (
              <button
                key={b}
                onClick={() => set({ button: b })}
                className={`rounded-full border-2 border-foreground px-4 py-2 text-sm font-semibold ${t.button === b ? "bg-foreground text-background" : "bg-card"}`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>
        {!user!.premium && (
          <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl border-2 border-foreground bg-accent/30 p-4">
            <div>
              <p className="flex items-center gap-1.5 font-bold"><Crown className="h-4 w-4" /> Go Premium</p>
              <p className="text-xs text-muted-foreground">Unlock all presets, custom fonts, and remove branding.</p>
            </div>
            <button onClick={() => update({ premium: true })} className="rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background">Upgrade (demo)</button>
          </div>
        )}
        {user!.premium && (
          <div className="mt-6 flex items-center gap-2 rounded-2xl border-2 border-foreground bg-accent/40 p-4 text-sm font-semibold">
            <Check className="h-4 w-4" /> Premium unlocked — enjoy!
          </div>
        )}
      </Card>
    );
  }

  function QRTab({ url }: { url: string }) {
    const ref = useRef<HTMLDivElement | null>(null);
    const download = () => {
      const canvas = ref.current?.querySelector("canvas");
      if (!canvas) return;
      const link = document.createElement("a");
      link.download = `${user!.username}-qr.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    return (
      <Card>
        <SectionTitle title="Your QR code" subtitle="Print it, share it, put it on a sticker." />
        <div className="mt-4 flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-foreground/30 p-6">
          <div ref={ref} className="rounded-2xl border-2 border-foreground bg-white p-4">
            <QRCodeCanvas value={url} size={200} level="H" includeMargin={false} />
          </div>
          <button onClick={download} className="rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background">Download PNG</button>
        </div>
      </Card>
    );
  }

  function AnalyticsTab() {
    const totalClicks = useMemo(() => user!.links.reduce((s, l) => s + (l.clicks || 0), 0), [user]);
    const top = useMemo(() => [...user!.links].sort((a, b) => b.clicks - a.clicks).slice(0, 5), [user]);
    return (
      <Card>
        <SectionTitle title="Analytics" subtitle="Real numbers from your public profile." />
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat label="Profile views" value={user!.views} />
          <Stat label="Total clicks" value={totalClicks} />
          <Stat label="Links" value={user!.links.length} />
        </div>
        <div className="mt-6">
          <p className="mb-2 text-sm font-semibold">Top links</p>
          {top.length === 0 && <p className="text-sm text-muted-foreground">No clicks yet. Share your link to get started.</p>}
          <div className="space-y-2">
            {top.map((l) => {
              const pct = totalClicks ? Math.round((l.clicks / totalClicks) * 100) : 0;
              return (
                <div key={l.id} className="rounded-2xl border-2 border-foreground bg-card p-3">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate font-semibold">{l.title}</span>
                    <span className="text-xs text-muted-foreground">{l.clicks} · {pct}%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-foreground" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    );
  }
}

function Tabs({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  const items: Array<{ id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: "links", label: "Links", icon: ExternalLink },
    { id: "profile", label: "Profile", icon: Eye },
    { id: "theme", label: "Theme", icon: Palette },
    { id: "qr", label: "QR", icon: QrCode },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
  ];
  return (
    <div className="flex flex-wrap gap-1.5 rounded-full border-2 border-foreground bg-card p-1.5">
      {items.map((it) => (
        <button
          key={it.id}
          onClick={() => setTab(it.id)}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
            tab === it.id ? "bg-foreground text-background" : "hover:bg-muted"
          }`}
        >
          <it.icon className="h-4 w-4" /> {it.label}
        </button>
      ))}
    </div>
  );
}

function UrlBar({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-full border-2 border-foreground bg-card px-4 py-2 shadow-[0_4px_0_0_theme(colors.foreground)] sm:flex sm:justify-between">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">Your LinkHub</p>
        <p className="truncate text-sm font-semibold">{url}</p>
      </div>
      <div className="flex items-center gap-1.5">
        <button onClick={copy} className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1.5 text-xs font-semibold text-background">
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-3xl border-2 border-foreground bg-card p-5 shadow-[0_6px_0_0_theme(colors.foreground)] sm:p-6">{children}</div>;
}
function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h2 className="text-xl font-bold">{title}</h2>
      {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}
function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <Labeled label={label}>
      <div className="flex items-center gap-2 rounded-full border-2 border-foreground bg-card px-3 py-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-8 w-8 shrink-0 cursor-pointer rounded-full border-none bg-transparent p-0" />
        <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-transparent text-sm outline-none" />
      </div>
    </Labeled>
  );
}
function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border-2 border-foreground bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
export function Avatar({ url, name, size = 80 }: { url?: string; name?: string; size?: number }) {
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  if (url) return <img src={url} alt={name} className="rounded-full border-2 border-foreground object-cover" style={{ width: size, height: size }} />;
  return (
    <div className="grid place-items-center rounded-full border-2 border-foreground bg-gradient-to-br from-emerald-400 to-cyan-500 font-bold text-white" style={{ width: size, height: size, fontSize: size / 2.5 }}>
      {initial}
    </div>
  );
}
function PreviewBtn({ label, theme }: { label: string; theme: Theme }) {
  const base = "block w-full truncate text-center text-sm font-semibold px-4 py-2.5";
  if (theme.button === "outline") {
    return <div className={`${base} rounded-full border-2`} style={{ borderColor: theme.buttonText, color: theme.buttonText, background: "transparent" }}>{label}</div>;
  }
  if (theme.button === "solid") {
    return <div className={`${base} rounded-xl`} style={{ background: theme.buttonBg, color: theme.buttonText }}>{label}</div>;
  }
  return <div className={`${base} rounded-full border-2`} style={{ background: theme.buttonBg, color: theme.buttonText, borderColor: theme.buttonText }}>{label}</div>;
}
function normalizeUrl(u: string) {
  if (/^https?:\/\//i.test(u)) return u;
  return `https://${u}`;
}
