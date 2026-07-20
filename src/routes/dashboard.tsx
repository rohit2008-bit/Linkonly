import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { BarChart3, Copy, ExternalLink, GripVertical, LogOut, Palette, Plus, QrCode, Trash2, Crown, Check, Eye, Pencil, User, Globe, FileText, ChevronRight, Sparkles, Lock } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { newId, defaultTheme, getFontFamily, formatCompactNumber, type LinkItem, type Theme, type Profile } from "@/lib/store";
import { createServerFn } from "@tanstack/react-start";

const getCloudinarySignature = createServerFn({ method: "GET" })
  .validator((timestamp: string) => timestamp)
  .handler(async ({ data: timestamp }) => {
    const apiSecret = process.env.CLOUDINARY_API_SECRET || "a734KvYgyLfnDqcxRBiaESOusuM";
    const uploadPreset = process.env.VITE_CLOUDINARY_UPLOAD_PRESET || "profile_pics";
    const signatureStr = `timestamp=${timestamp}&upload_preset=${uploadPreset}${apiSecret}`;
    
    const crypto = await import("crypto");
    const signature = crypto.createHash("sha1").update(signatureStr).digest("hex");
    
    return { signature };
  });

const askOpenRouter = createServerFn({ method: "POST" })
  .validator((prompt: string) => prompt)
  .handler(async ({ data: prompt }) => {
    const apiKey = process.env.OPENROUTER_API_KEY || "";
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://linkonly.co',
          'X-Title': 'LinkOnly',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'openrouter/free',
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`OpenRouter error: ${errText}`);
      }

      const data = await response.json();
      return { success: true, text: data.choices?.[0]?.message?.content || "" };
    } catch (err: any) {
      console.error("OpenRouter request failed:", err);
      return { success: false, error: err.message || "Request failed" };
    }
  });

interface AiTip {
  id: string;
  title: string;
  description: string;
  impact: string;
  category: "priority" | "recommendation" | "optimization";
}

function getAiTips(links: any[], user: any): AiTip[] {
  const tips: AiTip[] = [];
  
  // 1. YouTube position check (if user has youtube and it is not at index 0)
  const ytIndex = links.findIndex(l => l.title.toLowerCase().includes("youtube") || l.url.toLowerCase().includes("youtube.com"));
  if (ytIndex > 0) {
    tips.push({
      id: "yt-top",
      title: `Move ${links[ytIndex].title} to the top`,
      description: "Video platforms like YouTube perform best when placed at the very top of your link list to grab immediate user attention.",
      impact: "+18% CTR",
      category: "priority"
    });
  } else if (ytIndex === 0) {
    tips.push({
      id: "yt-top-success",
      title: "YouTube is placed optimally!",
      description: "Great job! Keeping YouTube at the top drives higher video consumption and conversions.",
      impact: "Optimal Position",
      category: "optimization"
    });
  }

  // 2. Profile completion elements
  if (!user.avatar) {
    tips.push({
      id: "add-avatar",
      title: "Upload a profile photo",
      description: "Profiles with custom avatars receive significantly higher visitor trust and interaction rates.",
      impact: "+25% trust",
      category: "priority"
    });
  }

  if (!user.bio || user.bio.trim() === "") {
    tips.push({
      id: "add-bio",
      title: "Write a short bio description",
      description: "An engaging bio introducing who you are helps frame your links and increases link click-through rates.",
      impact: "+15% CTR",
      category: "priority"
    });
  }

  // 3. Short titles check
  const shortTitleLink = links.find(l => l.title.trim().length > 0 && l.title.trim().length < 6);
  if (shortTitleLink) {
    tips.push({
      id: "short-title",
      title: `Enhance "${shortTitleLink.title}" title`,
      description: `Make your title more action-oriented (e.g., change "${shortTitleLink.title}" to "Shop on ${shortTitleLink.title}").`,
      impact: "+14% clicks",
      category: "recommendation"
    });
  }

  // 4. Overloaded link list check
  if (links.length > 7) {
    tips.push({
      id: "overloaded-links",
      title: "Reduce total link count",
      description: "Having more than 7 links can lead to decision paralysis. Keep only your most important links active to maximize CTR.",
      impact: "+12% conversions",
      category: "optimization"
    });
  } else if (links.length > 0 && links.length < 3) {
    tips.push({
      id: "underloaded-links",
      title: "Add 1-2 more active links",
      description: "Profiles with 3 to 5 links see the best balance of variety and user attention.",
      impact: "+10% engagement",
      category: "recommendation"
    });
  }

  // 5. Social links check
  const socialKeywords = ["instagram", "tiktok", "twitter", "x.com", "facebook", "linkedin", "github"];
  const hasSocial = links.some(l => socialKeywords.some(kw => l.title.toLowerCase().includes(kw) || l.url.toLowerCase().includes(kw)));
  if (!hasSocial && links.length > 0) {
    tips.push({
      id: "add-social",
      title: "Add your main social media handles",
      description: "Connecting your other social channels helps cross-pollinate your audience and build online presence.",
      impact: "+22% audience growth",
      category: "recommendation"
    });
  }

  // 6. Generic/fallback tips to ensure we always have at least 5 top tips
  if (tips.length < 5) {
    tips.push({
      id: "share-handle",
      title: "Share your Linkonly URL in bios",
      description: `Add your linkonly.co/${user.username} link in your Instagram, TikTok, and Twitter bio descriptions to funnel traffic.`,
      impact: "+35% traffic",
      category: "optimization"
    });
  }
  if (tips.length < 5) {
    tips.push({
      id: "brand-logo",
      title: "Brand favicon autofetch active",
      description: "Our platform automatically displays verified brand logos for well-known destinations to keep your styling consistent.",
      impact: "+20% trust",
      category: "optimization"
    });
  }
  if (tips.length < 5) {
    tips.push({
      id: "font-styling",
      title: "Use modern name & bio fonts",
      description: "Different font layouts enhance profile aesthetics. Select clean, premium fonts in your settings tab.",
      impact: "+8% retention",
      category: "optimization"
    });
  }

  return tips.slice(0, 5);
}

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

type Tab = "links" | "profile" | "theme" | "qr" | "analytics";

function Dashboard() {
  const { user, ready, logout, update } = useAuth();
  const navigate = useNavigate();

  const isLocked = useMemo(() => {
    if (!user) return false;
    return !user.name?.trim() || !user.bio?.trim();
  }, [user]);

  const [tab, setTab] = useState<Tab>("profile");
  const [localTheme, setLocalTheme] = useState<Theme>(user?.theme || defaultTheme);
  const [localName, setLocalName] = useState(user?.name || "");
  const [localBio, setLocalBio] = useState(user?.bio || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [shakeTabId, setShakeTabId] = useState<string | null>(null);
  const [warningText, setWarningText] = useState("");

  useEffect(() => {
    if (ready && !user) navigate({ to: "/auth/$mode", params: { mode: "login" } });
  }, [ready, user, navigate]);

  useEffect(() => {
    if (user) {
      setLocalTheme(user.theme);
      setLocalName(user.name || "");
      setLocalBio(user.bio || "");
      
      // Auto-lock to profile if display name or bio are empty
      if (!user.name?.trim() || !user.bio?.trim()) {
        setTab("profile");
      }
    }
  }, [user]);

  const handleLockedClick = (id: Tab) => {
    setShakeTabId(id);
    setWarningText("🔒 Please fill out your Display Name and Bio in the Profile section to unlock other tabs!");
    
    setTimeout(() => {
      setShakeTabId(null);
    }, 400);

    setTimeout(() => {
      setWarningText("");
    }, 4000);
  };

  if (!ready || !user) {
    return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Loading…</div>;
  }

  const publicUrl = typeof window !== "undefined" ? `${window.location.origin}/${user.username}` : `/${user.username}`;

  return (
    <div className="min-h-screen bg-background dashboard-container">
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
      <header className="border-b-2 border-foreground bg-card">
        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 sm:flex sm:justify-between">
          <Link to="/dashboard" className="flex min-w-0 items-center gap-2 font-bold" style={{ fontFamily: "var(--font-display)" }}>
            <img src="/logo.png" alt="Logo" className="h-8 w-8 shrink-0 object-contain" />
            <span className="truncate">LinkOnly</span>
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
          <div className="space-y-6">
            <ProfileCompletionCard 
              user={user} 
              setTab={setTab} 
              isLocked={isLocked}
              onLockedClick={handleLockedClick}
            />
            <div>
              <div className="relative">
                <Tabs 
                  tab={tab} 
                  setTab={setTab} 
                  isLocked={isLocked}
                  onLockedClick={handleLockedClick}
                  shakeTabId={shakeTabId}
                />
                {warningText && (
                  <div className="absolute left-1/2 -translate-x-1/2 -top-10 w-max max-w-[90vw] rounded-full border-2 border-rose-500 bg-rose-50 px-4 py-1.5 text-xs font-black text-rose-600 shadow-[2px_2px_0_0_theme(colors.foreground)] animate-bounce z-50">
                    {warningText}
                  </div>
                )}
              </div>
              <div className="mt-4">
                {tab === "links" && <LinksTab />}
                {tab === "profile" && (
                  <ProfileTab 
                    user={user} 
                    update={update} 
                    localName={localName} 
                    setLocalName={setLocalName} 
                    localBio={localBio} 
                    setLocalBio={setLocalBio} 
                    localTheme={localTheme} 
                    setLocalTheme={setLocalTheme} 
                  />
                )}
                {tab === "theme" && <ThemeTab />}
                {tab === "qr" && <QRTab url={publicUrl} />}
                {tab === "analytics" && <AnalyticsTab />}
              </div>
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
    const t = localTheme;
    return (
      <div className="relative">
        <a
          href={`/${user!.username}`}
          target="_blank"
          rel="noreferrer"
          className="absolute -top-3 right-2 z-10 inline-flex items-center gap-1.5 rounded-full border-2 border-foreground bg-card px-3 py-1.5 text-[11px] font-black shadow-[2px_2px_0_0_theme(colors.foreground)] hover:bg-accent/30 transition-all hover:-translate-y-0.5 active:translate-y-0 active:shadow-none lg:hidden"
        >
          <Eye className="h-3 w-3" />
          Live Page
        </a>
        <div className="rounded-3xl border-2 border-foreground p-3 shadow-[0_10px_0_0_theme(colors.foreground)]" style={{ background: t.bg }}>
          <div className="max-h-[560px] overflow-y-auto rounded-2xl px-5 py-6" style={{ background: t.bg, color: t.text }}>
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <Avatar url={user!.avatar} name={localName} />
                {user!.premium && (
                  <div className="absolute -top-1.5 -right-1.5 rounded-full border-2 border-foreground bg-amber-400 p-1 text-foreground shadow-[1px_1px_0_0_theme(colors.foreground)]" title="Premium Creator">
                    <Crown className="h-3 w-3 fill-amber-300" />
                  </div>
                )}
              </div>
              <div className="mt-3 flex items-center justify-center gap-1.5 text-lg font-bold" style={getFontFamily(t.nameFont || t.font)}>
                {user!.premium && (
                  <Crown className="h-4.5 w-4.5 fill-amber-400 text-amber-500 shrink-0 animate-pulse" />
                )}
                <span className="truncate max-w-[160px]">{localName || `@${user!.username}`}</span>
                {user!.premium && (
                  <span className="inline-flex items-center justify-center rounded-full bg-blue-500 p-0.5 text-white shrink-0 shadow-[1px_1px_0_0_theme(colors.foreground)]" title="Verified Creator">
                    <Check className="h-2.5 w-2.5 stroke-[3.5]" />
                  </span>
                )}
              </div>
              <p className="text-sm opacity-70">@{user!.username}</p>
              {localBio && <p className="mt-2 max-w-xs text-sm opacity-80" style={{ ...getFontFamily(t.bioFont || t.font), wordBreak: "break-word", overflowWrap: "break-word" }}>{localBio}</p>}
              <div className="mt-5 w-full space-y-2.5">
                {user!.links.length === 0 && <p className="py-6 text-xs opacity-60">No links yet — add your first one →</p>}
                {user!.links.map((l) => (
                  <PreviewBtn key={l.id} label={l.title} url={l.url} theme={t} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function LinksTab() {
    const [title, setTitle] = useState("");
    const [url, setUrl] = useState("");
    const [error, setError] = useState("");
    const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
    const [tempTitle, setTempTitle] = useState("");
    const [tempUrl, setTempUrl] = useState("");
    const [editError, setEditError] = useState("");
    const [showAiTips, setShowAiTips] = useState(false);
    const aiTipsRef = useRef<HTMLDivElement | null>(null);

    const add = () => {
      setError("");
      const cleanTitle = title.trim();
      const cleanUrl = url.trim();

      if (!cleanTitle || !cleanUrl) {
        setError("Both Title and URL are required.");
        return;
      }

      if (cleanTitle.length > 20) {
        setError("Title cannot exceed 20 characters.");
        return;
      }

      if (!isValidUrl(cleanUrl)) {
        setError("Please enter a valid, single URL (no spaces or duplicate URLs).");
        return;
      }

      const link: LinkItem = { id: newId(), title: cleanTitle, url: normalizeUrl(cleanUrl), clicks: 0 };
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
      <div className="space-y-6">
        <Card>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-dashed border-foreground/10 pb-3 mb-2">
            <SectionTitle title="Your links" subtitle="Add unlimited links — they'll appear on your public profile." />
            <button
              type="button"
              onClick={() => {
                if (!user!.premium) {
                  navigate({ to: "/pricing" });
                  return;
                }
                setShowAiTips(true);
                setTimeout(() => {
                  aiTipsRef.current?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-foreground bg-blue-100 px-3.5 py-1.5 text-xs font-black text-blue-700 shadow-[2px_2px_0_0_theme(colors.foreground)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all cursor-pointer w-fit sm:self-center"
            >
              <Sparkles className="h-3.5 w-3.5 fill-blue-700 text-blue-700 animate-pulse animate-duration-1000" />
              <span>Ai tips</span>
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 rounded-2xl border-2 border-dashed border-foreground/30 p-3 sm:grid-cols-[1fr_1.4fr_auto]">
            <input 
              value={title} 
              onChange={(e) => setTitle(e.target.value.slice(0, 20))} 
              maxLength={20}
              placeholder="Title (e.g. My YouTube)" 
              className="rounded-full border-2 border-foreground bg-card px-4 py-2.5 text-sm outline-none" 
            />
            <input 
              value={url} 
              onChange={(e) => setUrl(e.target.value)} 
              placeholder="https://…" 
              className="rounded-full border-2 border-foreground bg-card px-4 py-2.5 text-sm outline-none" 
            />
            <button onClick={add} className="inline-flex items-center justify-center gap-1.5 rounded-full bg-foreground px-4 py-2.5 text-sm font-semibold text-background"><Plus className="h-4 w-4" /> Add link</button>
          </div>

          {error && (
            <p className="mt-2 text-xs font-bold text-rose-500 animate-fade-in px-1">
              ⚠️ {error}
            </p>
          )}

          <div className="mt-4 space-y-2">
            {user!.links.map((l) => {
              const isEditing = l.id === editingLinkId;
              if (isEditing) {
                return (
                  <div key={l.id} className="flex flex-col gap-3 rounded-2xl border-2 border-foreground bg-card p-4 shadow-[0_3px_0_0_theme(colors.foreground)] animate-fade-in">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-foreground bg-muted p-1">
                        <LinkIcon url={tempUrl} className="h-8 w-8 object-contain" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-2.5">
                        <div>
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Link Title</label>
                          <input 
                            value={tempTitle} 
                            onChange={(e) => setTempTitle(e.target.value.slice(0, 20))} 
                            maxLength={20}
                            placeholder="Link Title"
                            className="w-full rounded-full border-2 border-foreground bg-background px-4 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-ring" 
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">URL Destination</label>
                          <input 
                            value={tempUrl} 
                            onChange={(e) => setTempUrl(e.target.value)} 
                            placeholder="https://..."
                            className={`w-full rounded-full border-2 border-foreground bg-background px-4 py-2 text-xs outline-none focus:ring-2 focus:ring-ring ${isValidUrl(tempUrl) ? "" : "border-rose-500 text-rose-500 font-bold"}`} 
                          />
                        </div>
                        {editError && (
                          <span className="block text-xs font-bold text-rose-500 mt-1">⚠️ {editError}</span>
                        )}
                        {!isValidUrl(tempUrl) && (
                          <span className="block text-xs font-bold text-rose-500 mt-1">⚠️ Multiple links or invalid URL format detected</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-end gap-2 border-t border-dashed border-foreground/10 pt-3">
                      <button 
                        onClick={() => {
                          const cleanT = tempTitle.trim();
                          const cleanU = tempUrl.trim();
                          if (!cleanT || !cleanU) {
                            setEditError("Title and URL are required.");
                            return;
                          }
                          if (cleanT.length > 20) {
                            setEditError("Title cannot exceed 20 characters.");
                            return;
                          }
                          if (!isValidUrl(cleanU)) {
                            setEditError("Invalid URL format.");
                            return;
                          }
                          edit(l.id, { title: cleanT, url: normalizeUrl(cleanU) });
                          setEditingLinkId(null);
                          setEditError("");
                        }} 
                        className="rounded-full bg-foreground px-5 py-2 text-xs font-bold text-background hover:opacity-90 flex items-center gap-1.5 cursor-pointer shadow-[0_2px_0_0_theme(colors.foreground)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all"
                      >
                        <Check className="h-3.5 w-3.5 stroke-[3]" /> Save Changes
                      </button>
                      <button 
                        onClick={() => {
                          setEditingLinkId(null);
                          setEditError("");
                        }} 
                        className="rounded-full border-2 border-foreground bg-card px-5 py-1.5 text-xs font-bold hover:bg-muted cursor-pointer shadow-[0_2px_0_0_theme(colors.foreground)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div key={l.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border-2 border-foreground bg-card p-3">
                  <div className="flex flex-col">
                    <button onClick={() => move(l.id, -1)} className="text-xs text-muted-foreground hover:text-foreground">▲</button>
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <button onClick={() => move(l.id, 1)} className="text-xs text-muted-foreground hover:text-foreground">▼</button>
                  </div>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-foreground bg-muted p-1">
                      <LinkIcon url={l.url} className="h-6 w-6 object-contain" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-bold text-foreground">{l.title}</p>
                        <button 
                          onClick={() => {
                            setEditingLinkId(l.id);
                            setTempTitle(l.title);
                            setTempUrl(l.url);
                            setEditError("");
                          }}
                          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                          title="Edit link"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">{l.url}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-full bg-muted px-2 py-1 text-xs font-semibold">{formatCompactNumber(l.clicks)} clicks</span>
                    <a href={l.url} target="_blank" rel="noreferrer" className="grid h-8 w-8 place-items-center rounded-full hover:bg-muted"><ExternalLink className="h-4 w-4" /></a>
                    <button onClick={() => remove(l.id)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-destructive/10 hover:text-destructive cursor-pointer"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* AI Tips Section below */}
        {showAiTips && (
          <div ref={aiTipsRef} className="mt-8 rounded-3xl border-2 border-foreground bg-card p-5 sm:p-6 shadow-[0_8px_0_0_theme(colors.foreground)] scroll-mt-6 animate-fade-in">
            <div className="flex items-center gap-2 mb-4 border-b-2 border-dashed border-foreground/10 pb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-foreground bg-blue-100">
                <Sparkles className="h-4 w-4 stroke-[2.5] text-blue-700" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-foreground">💡 Profile Optimization Tips</h3>
                <p className="text-[10px] text-muted-foreground font-semibold">AI-Generated suggestions to maximize your Linkonly CTR</p>
              </div>
            </div>

            <div className="space-y-3.5">
              {getAiTips(user!.links, user!).map((tip, idx) => (
                <div key={tip.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border-2 border-foreground bg-background p-4 shadow-[3px_3px_0_0_theme(colors.foreground)] hover:-translate-y-0.5 transition-all">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-[10px] font-bold text-background">
                        {idx + 1}
                      </span>
                      <span className="text-sm font-bold text-foreground">{tip.title}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase border border-foreground ${
                        tip.category === 'priority' ? 'bg-rose-100 text-rose-700' :
                        tip.category === 'optimization' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {tip.category}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground pl-7 leading-relaxed">{tip.description}</p>
                  </div>
                  
                  <div className="shrink-0 flex items-center justify-end pl-7 sm:pl-0">
                    <span className="inline-block rounded-full border-2 border-foreground bg-blue-100 px-3 py-1 text-xs font-black text-blue-700 shadow-[2px_2px_0_0_theme(colors.foreground)]">
                      {tip.impact}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }



  function ThemeTab() {
    const [savingTheme, setSavingTheme] = useState(false);
    const [savedTheme, setSavedTheme] = useState(false);

    const t = localTheme;
    const set = (patch: Partial<Theme>) => setLocalTheme({ ...t, ...patch });

    const presets: Array<{ name: string; theme: Partial<Theme> }> = [
      { name: "Cream", theme: { bg: "#f5f5f0", card: "#ffffff", text: "#111111", buttonBg: "#ffffff", buttonText: "#111111" } },
      { name: "Midnight", theme: { bg: "#0f172a", card: "#1e293b", text: "#f8fafc", buttonBg: "#1e293b", buttonText: "#f8fafc" } },
      { name: "Sunset", theme: { bg: "#fb923c", card: "#fff7ed", text: "#3f1d0d", buttonBg: "#fff7ed", buttonText: "#3f1d0d" } },
      { name: "Mint", theme: { bg: "#a7f3d0", card: "#ffffff", text: "#064e3b", buttonBg: "#ffffff", buttonText: "#064e3b" } },
    ];

    const hasThemeChanges = JSON.stringify(localTheme) !== JSON.stringify(user!.theme);

    const handleSaveTheme = async () => {
      setSavingTheme(true);
      setSavedTheme(false);
      await update({ theme: localTheme });
      setSavingTheme(false);
      setSavedTheme(true);
      setTimeout(() => setSavedTheme(false), 3000);
    };

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
          <ColorField label="Background" value={t.bg} onChange={(v) => set({ bg: v })} disabled={!user!.premium} />
          <ColorField label="Text" value={t.text} onChange={(v) => set({ text: v })} disabled={!user!.premium} />
          <ColorField label="Button background" value={t.buttonBg} onChange={(v) => set({ buttonBg: v })} disabled={!user!.premium} />
          <ColorField label="Button text" value={t.buttonText} onChange={(v) => set({ buttonText: v })} disabled={!user!.premium} />
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

        {/* Save button actions */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-dashed border-foreground/10 pt-4">
          {savedTheme && <span className="text-xs font-bold text-emerald-500 animate-fade-in">Changes saved to your public page!</span>}
          <button
            onClick={handleSaveTheme}
            disabled={savingTheme || !hasThemeChanges}
            className="rounded-full bg-foreground px-6 py-2.5 text-sm font-semibold text-background transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {savingTheme ? "Saving..." : "Save Changes"}
          </button>
        </div>
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
                    <span className="text-xs font-bold text-muted-foreground">{formatCompactNumber(l.clicks)} clicks · {pct}%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-foreground" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 border-t-2 border-dashed border-foreground/10 pt-6">
          <Link
            to="/proanalytics"
            className="flex items-center justify-between rounded-2xl border-2 border-foreground bg-card p-4 hover:bg-muted transition-all hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-2.5">
              <Crown className="h-5 w-5 text-amber-500 fill-amber-500 shrink-0 animate-pulse" />
              <div className="text-left">
                <p className="font-bold text-sm">Advance Analytics for premium users</p>
                {!user!.premium && (
                  <p className="text-xs text-muted-foreground mt-0.5">Unlock geo-tracking, custom referrers, and visitor device metrics.</p>
                )}
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-foreground shrink-0" />
          </Link>
        </div>
      </Card>
    );
  }
}

function Tabs({ 
  tab, 
  setTab, 
  isLocked,
  onLockedClick,
  shakeTabId
}: { 
  tab: Tab; 
  setTab: (t: Tab) => void; 
  isLocked: boolean;
  onLockedClick: (id: Tab) => void;
  shakeTabId: string | null;
}) {
  const items: Array<{ id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: "links", label: "Links", icon: ExternalLink },
    { id: "profile", label: "Profile", icon: Eye },
    { id: "theme", label: "Theme", icon: Palette },
    { id: "qr", label: "QR", icon: QrCode },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
  ];
  return (
    <div className="flex flex-wrap justify-center items-center gap-1.5 rounded-full border-2 border-foreground bg-card p-1.5 tab-container">
      {items.map((it) => {
        const itemLocked = isLocked && it.id !== "profile";
        const isShaking = shakeTabId === it.id;
        return (
          <button
            key={it.id}
            onClick={() => {
              if (itemLocked) {
                onLockedClick(it.id);
              } else {
                setTab(it.id);
              }
            }}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-all relative ${
              tab === it.id ? "bg-foreground text-background" : "hover:bg-muted"
            } ${isShaking ? "animate-shake border-rose-500 bg-rose-50 text-rose-600" : ""} ${itemLocked ? "opacity-75 cursor-not-allowed" : ""}`}
          >
            <it.icon className="h-4 w-4" /> 
            <span>{it.label}</span>
            {itemLocked && (
              <Lock className="h-3 w-3 text-rose-500 ml-0.5 shrink-0 animate-pulse" />
            )}
          </button>
        );
      })}
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
function ColorField({ label, value, onChange, disabled }: { label: string; value: string; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <Labeled label={label}>
      <div className={`flex items-center gap-2 rounded-full border-2 border-foreground bg-card px-3 py-2 ${disabled ? "opacity-60 cursor-not-allowed select-none" : ""}`}>
        <input 
          type="color" 
          value={value} 
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)} 
          className="h-8 w-8 shrink-0 cursor-pointer rounded-full border-none bg-transparent p-0 disabled:cursor-not-allowed" 
        />
        <input 
          value={value} 
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)} 
          className="w-full bg-transparent text-sm outline-none disabled:cursor-not-allowed" 
        />
        {disabled && <Crown className="h-3.5 w-3.5 text-amber-500 fill-amber-500 mr-1 shrink-0" />}
      </div>
    </Labeled>
  );
}
function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border-2 border-foreground bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{typeof value === "number" ? formatCompactNumber(value) : value}</p>
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
export function LinkIcon({ url, className }: { url: string; className?: string }) {
  const [src, setSrc] = useState("/logo.png");

  useEffect(() => {
    if (!url) {
      setSrc("/logo.png");
      return;
    }
    try {
      const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
      setSrc(`https://www.google.com/s2/favicons?sz=64&domain=${parsed.hostname}`);
    } catch (e) {
      setSrc("/logo.png");
    }
  }, [url]);

  return (
    <img
      src={src}
      alt=""
      onError={() => setSrc("/logo.png")}
      className={className || "h-5 w-5 rounded object-contain shrink-0"}
    />
  );
}

function PreviewBtn({ label, url, theme }: { label: string; url: string; theme: Theme }) {
  const base = "flex items-center justify-center relative w-full truncate text-sm font-semibold px-4 py-2.5 min-h-[42px]";
  
  const content = (
    <>
      <LinkIcon url={url} className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 rounded object-contain bg-white/10 shrink-0 p-0.5" />
      <span className="truncate text-center px-6 w-full">{label}</span>
    </>
  );

  if (theme.button === "outline") {
    return (
      <div 
        className={`${base} rounded-full border-2`} 
        style={{ borderColor: theme.buttonText, color: theme.buttonText, background: "transparent" }}
      >
        {content}
      </div>
    );
  }
  if (theme.button === "solid") {
    return (
      <div 
        className={`${base} rounded-xl`} 
        style={{ background: theme.buttonBg, color: theme.buttonText }}
      >
        {content}
      </div>
    );
  }
  return (
    <div 
      className={`${base} rounded-full border-2`} 
      style={{ background: theme.buttonBg, color: theme.buttonText, borderColor: theme.buttonText }}
    >
      {content}
    </div>
  );
}
export function isValidUrl(u: string): boolean {
  try {
    const trimmed = u.trim();
    if (!trimmed) return false;
    
    // Check for spaces/tabs which would mean multiple URLs or keywords
    if (/\s/.test(trimmed)) return false;

    // Check count of protocol strings to prevent multiple URLs in one input
    const protocolMatches = trimmed.match(/https?:\/\//gi) || [];
    if (protocolMatches.length > 1) return false;

    // Normalize URL for verification
    let urlToCheck = trimmed;
    if (!/^https?:\/\//i.test(urlToCheck)) {
      urlToCheck = `https://${urlToCheck}`;
    }

    const url = new URL(urlToCheck);

    // Hostname validation
    const parts = url.hostname.split(".");
    if (parts.length < 2) return false;
    
    const tld = parts[parts.length - 1];
    if (tld.length < 2 || !/^[a-z]+$/i.test(tld)) return false;

    // Ensure pathname doesn't contain multiple protocol indicators or www.
    if (url.pathname.includes("http://") || url.pathname.includes("https://") || url.pathname.includes("www.")) {
      return false;
    }

    // Ensure there are no duplicate protocols or domain delimiters inside the hostname
    if (url.hostname.includes("http") || url.hostname.includes("://")) return false;

    return true;
  } catch (e) {
    return false;
  }
}

function normalizeUrl(u: string) {
  if (/^https?:\/\//i.test(u)) return u;
  return `https://${u}`;
}

interface ProfileTabProps {
  user: any;
  update: (p: any) => Promise<void>;
  localName: string;
  setLocalName: (n: string) => void;
  localBio: string;
  setLocalBio: (b: string) => void;
  localTheme: Theme;
  setLocalTheme: (t: Theme) => void;
}

function ProfileTab({ user, update, localName, setLocalName, localBio, setLocalBio, localTheme, setLocalTheme }: ProfileTabProps) {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const fontDropdownRef = useRef<HTMLDivElement | null>(null);
  const bioFontDropdownRef = useRef<HTMLDivElement | null>(null);
  const [isFontDropdownOpen, setIsFontDropdownOpen] = useState(false);
  const [isBioFontDropdownOpen, setIsBioFontDropdownOpen] = useState(false);
  const [showAiGenerator, setShowAiGenerator] = useState(false);
  const [aiKeywords, setAiKeywords] = useState("");
  const [generatingAiBio, setGeneratingAiBio] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiSuccess, setAiSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    setValidationError("");
  }, [localName, localBio]);

  const validate = () => {
    const cleanName = localName.trim();
    const cleanBio = localBio.trim();

    if (!cleanName) {
      return "Display Name cannot be empty or blank.";
    }
    if (cleanName.length > 30) {
      return "Display Name cannot exceed 30 characters.";
    }
    if (!/^[a-zA-Z\s]+$/.test(cleanName)) {
      return "Display Name can only contain letters and spaces (numbers and special characters are not allowed).";
    }

    if (!cleanBio) {
      return "Bio cannot be empty or blank.";
    }
    // Allow letters, numbers, spaces, standard punctuation, and emojis (everything except dangerous shell/code chars)
    if (/[<>{};`\\]/.test(cleanBio)) {
      return "Bio cannot contain HTML or code characters (< > { } ; ` \\).";
    }

    const selNameOpt = fontOptions.find((o) => o.value === (localTheme.nameFont || localTheme.font));
    const selBioOpt = fontOptions.find((o) => o.value === (localTheme.bioFont || localTheme.font));
    if (!user!.premium && ((selNameOpt && selNameOpt.isPremium) || (selBioOpt && selBioOpt.isPremium))) {
      return "unlock the premium to use this fonts";
    }

    return "";
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (fontDropdownRef.current && !fontDropdownRef.current.contains(e.target as Node)) {
        setIsFontDropdownOpen(false);
      }
      if (bioFontDropdownRef.current && !bioFontDropdownRef.current.contains(e.target as Node)) {
        setIsBioFontDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fontOptions = [
    { value: "sans",       label: "Inter — Clean & Modern",       preview: "Inter",           isPremium: false },
    { value: "display",    label: "Space Grotesk — Techy Bold",    preview: "Space Grotesk",   isPremium: false },
    { value: "poppins",    label: "Poppins — Friendly Round",      preview: "Poppins",         isPremium: true },
    { value: "montserrat", label: "Montserrat — Elegant Strong",   preview: "Montserrat",      isPremium: false },
    { value: "raleway",    label: "Raleway — Stylish Thin",        preview: "Raleway",         isPremium: false },
    { value: "nunito",     label: "Nunito — Soft & Playful",       preview: "Nunito",          isPremium: false },
    { value: "lato",       label: "Lato — Professional Light",     preview: "Lato",            isPremium: false },
    { value: "oswald",     label: "Oswald — Condensed Impact",     preview: "Oswald",          isPremium: false },
    { value: "italic",     label: "Playfair Display — Italic Serif",preview: "Playfair Display",isPremium: false },
    { value: "bebas",      label: "Bebas Neue — All Caps Bold",    preview: "Bebas Neue",      isPremium: true },
    { value: "galindo",    label: "Galindo — Retro Pop",           preview: "Galindo",         isPremium: false },
    { value: "righteous",  label: "Righteous — Groovy Display",    preview: "Righteous",       isPremium: true },
    { value: "pacifico",   label: "Pacifico — Surf Script",        preview: "Pacifico",        isPremium: true },
    { value: "dancing",    label: "Dancing Script — Handwritten",  preview: "Dancing Script",  isPremium: false },
    { value: "lobster",    label: "Lobster — Curvy Script",        preview: "Lobster",         isPremium: true },
    { value: "ubuntu",     label: "Ubuntu — Rounded Sans",         preview: "Ubuntu",          isPremium: true },
    { value: "merriweather", label: "Merriweather — Warm Serif",   preview: "Merriweather",    isPremium: true },
    { value: "caveat",     label: "Caveat — Playful Handwriting",  preview: "Caveat",          isPremium: true },
    { value: "cinzel",     label: "Cinzel — Roman Classic",        preview: "Cinzel",          isPremium: true },
    { value: "aboreto",    label: "Aboreto — Futuristic Modern",   preview: "Aboreto",         isPremium: true },
    { value: "comfortaa",  label: "Comfortaa — Soft Geometric",    preview: "Comfortaa",       isPremium: true },
    { value: "bungee",     label: "Bungee — Heavy Inline",         preview: "Bungee",          isPremium: true },
    { value: "marker",     label: "Permanent Marker — Street Art", preview: "Marker",          isPremium: true },
    { value: "gloria",     label: "Gloria Hallelujah — School Script", preview: "Gloria",     isPremium: true },
    { value: "dirt",       label: "Rubik Dirt — Muddy 3D",         preview: "Rubik Dirt",      isPremium: true },
  ] as const;

  const onUpload = async (f: File) => {
    setUploadingAvatar(true);
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "sovllrgj";
    const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY || "332665428766442";
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "profile_pics";
    
    const timestamp = Math.round(new Date().getTime() / 1000).toString();
    
    let signature = "";
    try {
      const res = await getCloudinarySignature({ data: timestamp });
      signature = res.signature;
    } catch (err) {
      console.error("Failed to retrieve server signature:", err);
    }

    const formData = new FormData();
    formData.append("file", f);
    formData.append("api_key", apiKey);
    formData.append("timestamp", timestamp);
    formData.append("upload_preset", uploadPreset);
    formData.append("signature", signature);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        await update({ avatar: data.secure_url });
      } else {
        const errorText = await res.text();
        console.error("Cloudinary upload failed:", errorText);
        try {
          const errorObj = JSON.parse(errorText);
          alert(`Cloudinary upload failed: ${errorObj.error?.message || errorText}`);
        } catch (e) {
          alert(`Cloudinary upload failed: ${errorText}`);
        }
      }
    } catch (err) {
      console.error("Error uploading avatar:", err);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const hasChanges = localName !== (user!.name || "") || 
                     localBio !== (user!.bio || "") || 
                     localTheme.nameFont !== (user!.theme?.nameFont || "sans") ||
                     localTheme.bioFont !== (user!.theme?.bioFont || "sans") ||
                     localTheme.font !== (user!.theme?.font || "sans");

  const handleSave = async () => {
    setValidationError("");
    const err = validate();
    if (err) {
      setValidationError(err);
      return;
    }
    setSaving(true);
    setSaved(false);
    await update({ name: localName.trim(), bio: localBio.trim(), theme: localTheme });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <Card>
      <SectionTitle title="Edit profile" subtitle="What visitors see at the top of your page." />
      
      <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:items-center">
        <div 
          className="relative group cursor-pointer shrink-0" 
          onClick={() => !uploadingAvatar && fileRef.current?.click()}
        >
          <div className="relative">
            <Avatar url={user!.avatar} name={user!.name} size={90} />
            {user!.premium && (
              <div className="absolute -top-1.5 -right-1.5 rounded-full border-2 border-foreground bg-amber-400 p-1 text-foreground shadow-[1px_1px_0_0_theme(colors.foreground)] z-10" title="Premium Creator">
                <Crown className="h-3 w-3 fill-amber-300" />
              </div>
            )}
          </div>
          {uploadingAvatar && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 text-white text-xs font-bold">
              Uploading...
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 rounded-full border-2 border-foreground bg-primary p-2 text-primary-foreground shadow-[0_2px_0_0_theme(colors.foreground)] hover:-translate-y-0.5 transition-transform">
            <Plus className="h-4 w-4 text-foreground" />
          </div>
        </div>
        <div className="flex flex-col gap-1 text-center sm:text-left">
          <h3 className="text-base font-bold">Profile Image</h3>
          <p className="text-xs text-muted-foreground">Click the image to choose a photo. PNG, JPG or WebP.</p>
          {user!.avatar && (
            <button 
              onClick={(e) => { e.stopPropagation(); update({ avatar: "" }); }} 
              className="mt-1 self-center sm:self-start text-xs font-semibold text-destructive hover:underline"
            >
              Remove photo
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Labeled label="Display Name">
          <div className="flex items-center overflow-hidden rounded-full border-2 border-foreground bg-card px-4 focus-within:ring-2 focus-within:ring-ring">
            <User className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />
            <input 
              value={localName} 
              onChange={(e) => setLocalName(e.target.value)} 
              className="w-full bg-transparent py-2.5 text-sm outline-none" 
              placeholder="e.g. Harsh Pawar"
            />
          </div>
        </Labeled>
        
        <Labeled label="Username (Public Link)">
          <div className="flex items-center overflow-hidden rounded-full border-2 border-foreground bg-card focus-within:ring-2 focus-within:ring-ring">
            <span className="flex items-center gap-1.5 bg-muted px-4 py-2.5 border-r-2 border-foreground text-xs font-bold text-muted-foreground shrink-0">
              <Globe className="h-3.5 w-3.5" /> linkonly/
            </span>
            <input 
              value={user!.username} 
              disabled 
              className="w-full bg-transparent px-4 py-2.5 text-sm text-muted-foreground outline-none" 
            />
          </div>
        </Labeled>
      </div>

      <div className="mt-4">
        <Labeled label="Bio">
          <div className="relative flex flex-col overflow-hidden rounded-2xl border-2 border-foreground bg-card p-3 focus-within:ring-2 focus-within:ring-ring">
            <div className="flex gap-2">
              <FileText className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
              <textarea 
                value={localBio} 
                onChange={(e) => setLocalBio(e.target.value.slice(0, 200))} 
                rows={3} 
                maxLength={200}
                className="w-full resize-none bg-transparent text-sm outline-none" 
                placeholder="Tell visitors who you are…" 
              />
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-dashed border-foreground/10 pt-1.5 text-xs text-muted-foreground">
              <button
                type="button"
                onClick={() => {
                  if (!user!.premium) {
                    navigate({ to: "/pricing" });
                    return;
                  }
                  setShowAiGenerator(!showAiGenerator);
                }}
                className="inline-flex items-center gap-1 rounded-full border border-foreground bg-muted px-2.5 py-1.5 font-bold text-foreground hover:bg-accent/40 cursor-pointer text-[10px] sm:text-xs shadow-[0_2px_0_0_theme(colors.foreground)] active:translate-y-0.5 active:shadow-none transition-all"
              >
                ✨ AI Bio Generator
              </button>
              <span>{localBio.length}/200 characters</span>
            </div>
          </div>
        </Labeled>

        {showAiGenerator && (
          <div className="mt-3 rounded-2xl border-2 border-foreground bg-accent/20 p-4 shadow-[0_2px_0_0_theme(colors.foreground)] animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-foreground">✨ AI Bio Generator</h4>
              <button 
                type="button" 
                onClick={() => { setShowAiGenerator(false); setAiError(""); }} 
                className="text-xs font-bold text-muted-foreground hover:text-foreground hover:underline cursor-pointer"
              >
                Close
              </button>
            </div>
            
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">Describe your interests or profession (e.g. "Tech Youtuber", "Writer & Artist"). We will write an engaging bio for you.</p>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <input 
                  value={aiKeywords}
                  onChange={(e) => setAiKeywords(e.target.value)}
                  placeholder="e.g. Product Designer, dog lover, coffee enthusiast"
                  className="flex-1 rounded-full border-2 border-foreground bg-background px-4 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-ring"
                  disabled={generatingAiBio}
                />
                <button
                  type="button"
                  disabled={generatingAiBio || !aiKeywords.trim()}
                  onClick={async () => {
                    setGeneratingAiBio(true);
                    setAiError("");
                    setAiSuccess(false);
                    try {
                      const res = await askOpenRouter({
                        data: `Write a short, engaging, and professional link-in-bio description (maximum 150 characters, no hashtags, no emojis except maybe 1 context-appropriate one) for someone who is: ${aiKeywords.trim()}`
                      });
                      if (res.success && res.text) {
                        setLocalBio(res.text.trim().slice(0, 200));
                        setAiSuccess(true);
                        setTimeout(() => setAiSuccess(false), 5000);
                      } else {
                        setAiError(res.error || "Generation failed.");
                      }
                    } catch (err: any) {
                      setAiError(err.message || "An error occurred.");
                    } finally {
                      setGeneratingAiBio(false);
                    }
                  }}
                  className="rounded-full bg-foreground px-4 py-2 text-xs font-bold text-background hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_2px_0_0_theme(colors.foreground)] active:translate-y-0.5 active:shadow-none transition-all shrink-0"
                >
                  {generatingAiBio ? (
                    <span>Generating...</span>
                  ) : (
                    <span>Generate</span>
                  )}
                </button>
              </div>
              
              {generatingAiBio && (
                <p className="text-[10px] font-semibold text-muted-foreground animate-pulse">
                  ⏳ Generating... it will take few minutes
                </p>
              )}

              {aiSuccess && (
                <div className="flex items-center gap-1.5 rounded-full border-2 border-emerald-600 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 shadow-[2px_2px_0_0_theme(colors.foreground)] animate-bounce w-fit">
                  <Check className="h-4 w-4 stroke-[3] text-emerald-600" />
                  <span>Generation successful!</span>
                </div>
              )}

              {aiError && (
                <p className="text-[10px] font-bold text-rose-500">⚠️ {aiError}</p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Labeled label="Display Name Font">
          <div ref={fontDropdownRef} className={`relative ${isFontDropdownOpen ? "z-40" : "z-20"}`}>
            <button
              type="button"
              onClick={() => {
                if (!isFontDropdownOpen) setIsBioFontDropdownOpen(false);
                setIsFontDropdownOpen(!isFontDropdownOpen);
              }}
              className="flex w-full items-center justify-between rounded-full border-2 border-foreground bg-card px-5 py-2.5 text-sm font-semibold outline-none cursor-pointer focus:ring-2 focus:ring-ring"
              style={getFontFamily(localTheme.nameFont || localTheme.font)}
            >
              <span>{fontOptions.find((o) => o.value === (localTheme.nameFont || localTheme.font))?.preview || "Inter"}</span>
              <span className={`text-xs transition-transform duration-200 ${isFontDropdownOpen ? "rotate-180" : ""}`}>
                ▼
              </span>
            </button>
            
            {isFontDropdownOpen && (
              <div className="absolute left-0 right-0 mt-2 max-h-[168px] overflow-y-auto rounded-2xl border-2 border-foreground bg-card p-1.5 shadow-[0_6px_0_0_theme(colors.foreground)] z-[100] animate-in fade-in slide-in-from-top-2 duration-150">
                {fontOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      if (opt.isPremium && !user!.premium) {
                        setValidationError("unlock the premium to use this fonts");
                        setIsFontDropdownOpen(false);
                        return;
                      }
                      setValidationError("");
                      setLocalTheme({ ...localTheme, nameFont: opt.value });
                      setIsFontDropdownOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-4 py-2 hover:bg-muted transition-colors ${
                      (localTheme.nameFont || localTheme.font) === opt.value ? "bg-muted" : ""
                    }`}
                  >
                    <div className="flex flex-col text-left">
                      <span className="text-sm font-semibold flex items-center gap-1.5" style={getFontFamily(opt.value)}>
                        <span>{opt.preview}</span>
                        {opt.isPremium && (
                          <Crown className="h-3 w-3 fill-amber-400 text-amber-500 shrink-0 inline-block" title="Premium Font" />
                        )}
                      </span>
                      <span className="text-[10px] text-muted-foreground mt-0.5" style={{ fontFamily: "inherit" }}>{opt.label.split(" — ")[1] || ""}</span>
                    </div>
                    {opt.isPremium && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-black text-amber-800 border border-amber-300 shrink-0">
                        <Crown className="h-2.5 w-2.5 fill-amber-500 text-amber-600" />
                        PRO
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => navigate({ to: "/plandetail" })}
            className="mt-3 inline-flex w-full items-center justify-between gap-2 rounded-full border-2 border-foreground bg-lime-400 px-4 py-2.5 text-xs font-black text-foreground shadow-[3px_3px_0_0_theme(colors.foreground)] transition-all hover:-translate-y-0.5 hover:bg-lime-300 active:translate-y-0 active:shadow-none"
          >
            <span>check my plan details</span>
            <FileText className="h-4 w-4 shrink-0" />
          </button>
        </Labeled>

        <Labeled label="Bio Font">
          <div ref={bioFontDropdownRef} className={`relative ${isBioFontDropdownOpen ? "z-40" : "z-10"}`}>
            <button
              type="button"
              onClick={() => {
                if (!isBioFontDropdownOpen) setIsFontDropdownOpen(false);
                setIsBioFontDropdownOpen(!isBioFontDropdownOpen);
              }}
              className="flex w-full items-center justify-between rounded-full border-2 border-foreground bg-card px-5 py-2.5 text-sm font-semibold outline-none cursor-pointer focus:ring-2 focus:ring-ring"
              style={getFontFamily(localTheme.bioFont || localTheme.font)}
            >
              <span>{fontOptions.find((o) => o.value === (localTheme.bioFont || localTheme.font))?.preview || "Inter"}</span>
              <span className={`text-xs transition-transform duration-200 ${isBioFontDropdownOpen ? "rotate-180" : ""}`}>
                ▼
              </span>
            </button>
            
            {isBioFontDropdownOpen && (
              <div className="absolute left-0 right-0 mt-2 max-h-[168px] overflow-y-auto rounded-2xl border-2 border-foreground bg-card p-1.5 shadow-[0_6px_0_0_theme(colors.foreground)] z-[100] animate-in fade-in slide-in-from-top-2 duration-150">
                {fontOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      if (opt.isPremium && !user!.premium) {
                        setValidationError("unlock the premium to use this fonts");
                        setIsBioFontDropdownOpen(false);
                        return;
                      }
                      setValidationError("");
                      setLocalTheme({ ...localTheme, bioFont: opt.value });
                      setIsBioFontDropdownOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-4 py-2 hover:bg-muted transition-colors ${
                      (localTheme.bioFont || localTheme.font) === opt.value ? "bg-muted" : ""
                    }`}
                  >
                    <div className="flex flex-col text-left">
                      <span className="text-sm font-semibold flex items-center gap-1.5" style={getFontFamily(opt.value)}>
                        <span>{opt.preview}</span>
                        {opt.isPremium && (
                          <Crown className="h-3 w-3 fill-amber-400 text-amber-500 shrink-0 inline-block" title="Premium Font" />
                        )}
                      </span>
                      <span className="text-[10px] text-muted-foreground mt-0.5" style={{ fontFamily: "inherit" }}>{opt.label.split(" — ")[1] || ""}</span>
                    </div>
                    {opt.isPremium && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-black text-amber-800 border border-amber-300 shrink-0">
                        <Crown className="h-2.5 w-2.5 fill-amber-500 text-amber-600" />
                        PRO
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </Labeled>
      </div>

      {!user!.premium && (
        <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <Crown className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0" />
          <span>Unlock more fonts with Premium</span>
        </div>
      )}

      {validationError && (
        <div className="mt-4 rounded-2xl border-2 border-rose-500 bg-rose-50 p-3 text-xs font-bold text-rose-500 animate-fade-in shadow-[2px_2px_0_0_theme(colors.foreground)]">
          ⚠️ {validationError}
        </div>
      )}

      <div className="mt-6 flex items-center justify-end gap-3 border-t border-dashed border-foreground/10 pt-4">
        {saved && <span className="text-xs font-bold text-emerald-500 animate-fade-in">Changes saved successfully!</span>}
        <button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="rounded-full bg-foreground px-6 py-2.5 text-sm font-semibold text-background transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </Card>
  );
}

interface ProfileCompletionCardProps {
  user: Profile;
  setTab: (t: Tab) => void;
  isLocked: boolean;
  onLockedClick: (id: Tab) => void;
}

function ProfileCompletionCard({ user, setTab, isLocked, onLockedClick }: ProfileCompletionCardProps) {
  const items = useMemo(() => {
    return [
      {
        id: "username",
        label: "Username",
        completed: !!user.username?.trim(),
        tab: "profile" as Tab,
      },
      {
        id: "bio",
        label: "Bio",
        completed: !!user.bio?.trim(),
        tab: "profile" as Tab,
      },
      {
        id: "avatar",
        label: "Avatar",
        completed: !!user.avatar?.trim(),
        tab: "profile" as Tab,
      },
      {
        id: "links",
        label: "1 Link",
        completed: Array.isArray(user.links) && user.links.length >= 1,
        tab: "links" as Tab,
      },
    ];
  }, [user]);

  const completedCount = items.filter((it) => it.completed).length;
  const pct = Math.round((completedCount / items.length) * 100);

  if (pct === 100) return null;

  // Generate ASCII/unicode progress bar: ████████░░ 80% (or actual)
  const totalBlocks = 10;
  const filledBlocksCount = Math.round((pct / 100) * totalBlocks);
  const emptyBlocksCount = totalBlocks - filledBlocksCount;
  const blockString = "█".repeat(filledBlocksCount) + "░".repeat(emptyBlocksCount);

  // We can choose color based on completion percentage for premium feel
  const getBarColorClass = (p: number) => {
    if (p <= 25) return "bg-rose-500";
    if (p <= 50) return "bg-amber-500";
    if (p <= 75) return "bg-yellow-400";
    return "bg-emerald-500";
  };

  return (
    <Card>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>Profile Setup</h3>
          <p className="text-xs text-muted-foreground">Complete these steps to optimize your public profile.</p>
        </div>
        <div className="flex items-center gap-2.5 font-mono text-sm font-black bg-muted border-2 border-foreground px-3 py-1.5 rounded-full w-fit shadow-[0_2px_0_0_theme(colors.foreground)]">
          <span className="tracking-wider text-foreground">{blockString}</span>
          <span className="text-foreground">{pct}%</span>
        </div>
      </div>

      {/* Graphical Progress Bar */}
      <div className="mt-4 h-5 w-full overflow-hidden rounded-full border-2 border-foreground bg-muted p-0.5 shadow-[0_2px_0_0_theme(colors.foreground)]">
        <div 
          className={`h-full rounded-full border-r-2 border-foreground transition-all duration-700 ease-out ${getBarColorClass(pct)}`} 
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Checklist items */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map((it) => {
          const itemLocked = isLocked && it.tab !== "profile";
          return (
            <button
              key={it.id}
              onClick={() => {
                if (itemLocked) {
                  onLockedClick(it.tab);
                } else {
                  setTab(it.tab);
                }
              }}
              className={`flex items-center gap-2 rounded-2xl border-2 border-foreground bg-card p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_0_0_theme(colors.foreground)] active:translate-y-0 active:shadow-[0_2px_0_0_theme(colors.foreground)] cursor-pointer shadow-[0_2px_0_0_theme(colors.foreground)] ${itemLocked ? "opacity-75 cursor-not-allowed" : ""}`}
            >
              {it.completed ? (
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 border border-foreground text-white">
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                </div>
              ) : (
                <div className="h-5 w-5 shrink-0 rounded-full border-2 border-dashed border-foreground/30 bg-muted flex items-center justify-center">
                  {itemLocked && <Lock className="h-2.5 w-2.5 text-rose-500 shrink-0" />}
                </div>
              )}
              <span className={`text-xs font-bold ${it.completed ? "line-through opacity-60" : ""}`}>
                {it.label}
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
