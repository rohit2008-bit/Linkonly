import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, BarChart3, Crown, Smartphone, Monitor, Tablet, Globe, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { getFontFamily, formatCompactNumber } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { useEffect, useState, useMemo } from "react";

export const Route = createFileRoute("/proanalytics")({
  ssr: false,
  component: ProAnalyticsPage,
});

function ProAnalyticsPage() {
  const { user, ready } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [dbError, setDbError] = useState(false);

  useEffect(() => {
    if (!user) return;
    const loadLogs = async () => {
      try {
        const { data, error } = await supabase
          .from("analytics")
          .select("*")
          .eq("profile_id", user.id)
          .order("created_at", { ascending: true });

        if (error) {
          console.error("Error fetching analytics:", error);
          setDbError(true);
        } else {
          setLogs(data || []);
        }
      } catch (e) {
        console.error("Fetch logs failed:", e);
        setDbError(true);
      } finally {
        setLoadingLogs(false);
      }
    };
    loadLogs();
  }, [user]);

  const links = user?.links || [];
  const totalViews = user?.views || 0;
  const totalClicks = useMemo(() => links.reduce((sum, l) => sum + (l.clicks || 0), 0) || 0, [links]);

  const [demoMode, setDemoMode] = useState(false);

  // 1st chart data: Views vs Clicks (Mon - Sun)
  const chartData = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const dayMap = days.map((day) => ({ day, views: 0, clicks: 0 }));
    
    logs.forEach((log) => {
      if (!log.created_at) return;
      const date = new Date(log.created_at);
      const dayIndex = date.getDay(); // 0 = Sun, 1 = Mon ... 6 = Sat
      
      const idx = dayIndex === 0 ? 6 : dayIndex - 1;
      
      if (log.type === "view") {
        dayMap[idx].views++;
      } else if (log.type === "click") {
        dayMap[idx].clicks++;
      }
    });
    return dayMap;
  }, [logs]);

  const demoChartData = [
    { day: "Mon", views: 1200, clicks: 350 },
    { day: "Tue", views: 3500, clicks: 920 },
    { day: "Wed", views: 8200, clicks: 2100 },
    { day: "Thu", views: 15400, clicks: 4200 },
    { day: "Fri", views: 28000, clicks: 7500 },
    { day: "Sat", views: 45000, clicks: 12800 },
    { day: "Sun", views: 120000, clicks: 34000 },
  ];

  const activeChartData = demoMode ? demoChartData : chartData;
  const maxVal = Math.max(...activeChartData.map((d) => d.views), 20);

  // 2nd chart data: CTR per link
  const slices = useMemo(() => {
    if (links.length === 0) return [];
    
    const clickCounts: { [key: string]: number } = {};
    links.forEach(l => { clickCounts[l.id] = 0; });
    
    logs.forEach((log) => {
      if (log.type === "click" && log.link_id && clickCounts[log.link_id] !== undefined) {
        clickCounts[log.link_id]++;
      }
    });

    const totalLinkClicks = Object.values(clickCounts).reduce((s, c) => s + c, 0);

    return links.map((l) => {
      const clicks = clickCounts[l.id];
      return {
        label: l.title,
        clicks: clicks,
        pct: totalLinkClicks ? (clicks / totalLinkClicks) : 0,
      };
    });
  }, [logs, links]);

  const sliceColors = ["#10b981", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6", "#ef4444"];

  // 3rd: Visitor locations (country-wise)
  const visitorLocations = useMemo(() => {
    const counts: { [key: string]: { name: string; flag: string; count: number } } = {};
    logs.forEach((log) => {
      const cc = log.country_code || "US";
      if (!counts[cc]) {
        counts[cc] = {
          name: log.country_name || cc,
          flag: getFlagEmoji(cc),
          count: 0
        };
      }
      counts[cc].count++;
    });

    const totalLocLogs = Object.values(counts).reduce((s, c) => s + c.count, 0);
    if (totalLocLogs === 0) return [];

    return Object.values(counts)
      .map((c) => ({
        name: c.name,
        flag: c.flag,
        pct: Math.round((c.count / totalLocLogs) * 100),
        count: c.count
      }))
      .sort((a, b) => b.count - a.count);
  }, [logs]);

  // 4th: Device breakdown
  const deviceStats = useMemo(() => {
    let mobile = 0, desktop = 0, tablet = 0;
    logs.forEach((log) => {
      if (log.device === "Mobile") mobile++;
      else if (log.device === "Desktop") desktop++;
      else if (log.device === "Tablet") tablet++;
    });
    const total = (mobile + desktop + tablet);
    return [
      { name: "Mobile", pct: total ? Math.round((mobile / total) * 100) : 0, icon: Smartphone, color: "#10b981" },
      { name: "Desktop", pct: total ? Math.round((desktop / total) * 100) : 0, icon: Monitor, color: "#3b82f6" },
      { name: "Tablet", pct: total ? Math.round((tablet / total) * 100) : 0, icon: Tablet, color: "#f59e0b" }
    ];
  }, [logs]);

  if (!ready) {
    return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground bg-background">Loading…</div>;
  }

  if (!user) {
    return (
      <div className="grid min-h-screen place-items-center bg-background p-6">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Please log in to view pro analytics.</p>
          <Link to="/auth/login" className="mt-4 inline-flex items-center rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background">
            Log in
          </Link>
        </div>
      </div>
    );
  }

  // Pie chart calculation offset tracker
  let cumulativePct = 0;
  const pieRadius = 50;
  const pieCirc = 2 * Math.PI * pieRadius;

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 dashboard-container">
      <div className="mx-auto max-w-5xl">
        
        {/* Supabase missing table error banner */}
        {dbError && (
          <div className="mb-6 rounded-2xl border-2 border-destructive bg-destructive/10 p-4 text-sm font-semibold text-destructive flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-200">
            <div>
              <p className="font-bold flex items-center gap-1.5"><Crown className="h-4 w-4 fill-destructive" /> Supabase "analytics" table is missing!</p>
              <p className="text-xs opacity-90 mt-0.5">Please copy and run the SQL schema inside your Supabase SQL Editor to enable live tracking.</p>
            </div>
            <a href="#sql-schema" className="rounded-full bg-destructive text-white px-4 py-1.5 text-xs font-bold hover:opacity-90">
              View SQL Schema
            </a>
          </div>
        )}

        {/* Header bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-foreground bg-card p-4 rounded-2xl mb-6 shadow-[0_4px_0_0_theme(colors.foreground)]">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold">Pro Analytics</h1>
            <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-600 border border-amber-500/20">
              <Crown className="h-3 w-3 fill-amber-500 text-amber-500" /> PRO
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDemoMode(!demoMode)}
              className={`inline-flex items-center gap-1.5 rounded-full border-2 border-foreground px-3.5 py-2 text-xs font-bold transition-all shadow-[2px_2px_0_0_theme(colors.foreground)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none ${
                demoMode ? "bg-amber-400 text-foreground" : "bg-card hover:bg-muted"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" /> ⚡ Demo: {demoMode ? "120k ON" : "OFF"}
            </button>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1 rounded-full border-2 border-foreground bg-card px-4 py-2 text-xs font-bold hover:bg-muted transition-transform hover:-translate-y-0.5"
            >
              <ChevronLeft className="h-4 w-4" /> Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Card 1: Views vs Clicks */}
          <div className="rounded-2xl border-2 border-foreground bg-card p-5 shadow-[0_4px_0_0_theme(colors.foreground)]">
            <h2 className="text-base font-bold mb-1">Views vs Clicks</h2>
            <p className="text-xs text-muted-foreground mb-4">Traffic analysis for the current week</p>
            
            {/* SVG Line Chart */}
            <div className="w-full">
              <svg viewBox="0 0 500 250" className="w-full overflow-visible">
                {/* Horizontal grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                  const y = 200 - ratio * 150;
                  const val = Math.round(ratio * maxVal);
                  return (
                    <g key={idx} className="opacity-25">
                      <line x1="40" y1={y} x2="480" y2={y} stroke="var(--color-foreground)" strokeWidth="1" strokeDasharray="4 4" />
                      <text x="15" y={y + 4} className="text-[10px] font-bold fill-foreground" textAnchor="middle">{formatCompactNumber(val)}</text>
                    </g>
                  );
                })}

                {/* X axis line */}
                <line x1="40" y1="200" x2="480" y2="200" stroke="var(--color-foreground)" strokeWidth="2" />
                
                {/* X axis labels */}
                {activeChartData.map((d, idx) => {
                  const x = 40 + idx * 70;
                  return (
                    <text key={idx} x={x} y="220" className="text-[11px] font-bold fill-muted-foreground" textAnchor="middle">
                      {d.day}
                    </text>
                  );
                })}

                {/* Polyline for Views */}
                <polyline
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3.5"
                  points={activeChartData.map((d, i) => `${40 + i * 70},${200 - (d.views / maxVal) * 150}`).join(" ")}
                />

                {/* Polyline for Clicks */}
                <polyline
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="3.5"
                  points={activeChartData.map((d, i) => `${40 + i * 70},${200 - (d.clicks / maxVal) * 150}`).join(" ")}
                />

                {/* Dots for Views */}
                {activeChartData.map((d, i) => {
                  const x = 40 + i * 70;
                  const y = 200 - (d.views / maxVal) * 150;
                  return (
                    <g key={`v-${i}`}>
                      <circle cx={x} cy={y} r="5" className="fill-card stroke-[#10b981] stroke-[3]" />
                      <text x={x} y={y - 10} className="text-[10px] font-bold fill-foreground" textAnchor="middle">{formatCompactNumber(d.views)}</text>
                    </g>
                  );
                })}

                {/* Dots for Clicks */}
                {activeChartData.map((d, i) => {
                  const x = 40 + i * 70;
                  const y = 200 - (d.clicks / maxVal) * 150;
                  return (
                    <g key={`c-${i}`}>
                      <circle cx={x} cy={y} r="5" className="fill-card stroke-[#3b82f6] stroke-[3]" />
                      <text x={x} y={y - 10} className="text-[10px] font-bold fill-foreground" textAnchor="middle">{formatCompactNumber(d.clicks)}</text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-6 mt-4 text-xs font-semibold border-t border-dashed border-foreground/10 pt-3">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#10b981]" /> Views</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#3b82f6]" /> Clicks</span>
            </div>
          </div>

          {/* Card 2: CTR per Link */}
          <div className="rounded-2xl border-2 border-foreground bg-card p-5 shadow-[0_4px_0_0_theme(colors.foreground)]">
            <h2 className="text-base font-bold mb-1">Click-Through-Rate</h2>
            <p className="text-xs text-muted-foreground mb-6">Distribution of clicks across links</p>

            {links.length === 0 ? (
              <div className="flex min-h-[160px] items-center justify-center text-sm text-muted-foreground">
                No links added yet.
              </div>
            ) : links.length <= 6 ? (
              /* Render Pie Chart */
              <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
                <div className="relative h-[140px] w-[140px] shrink-0">
                  <svg viewBox="0 0 140 140" className="w-full h-full overflow-visible">
                    {slices.map((slice, idx) => {
                      const strokeDasharray = `${slice.pct * pieCirc} ${pieCirc}`;
                      const strokeDashoffset = -cumulativePct * pieCirc;
                      cumulativePct += slice.pct;
                      const color = sliceColors[idx % sliceColors.length];
                      return (
                        <circle
                          key={idx}
                          cx="70"
                          cy="70"
                          r={pieRadius}
                          fill="transparent"
                          stroke={color}
                          strokeWidth="20"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          transform="rotate(-90 70 70)"
                          className="transition-all duration-200 hover:stroke-[24px] cursor-pointer"
                        />
                      );
                    })}
                  </svg>
                </div>
                {/* Pie Chart Legend */}
                <div className="flex-1 w-full space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {slices.map((slice, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs font-semibold">
                      <span className="h-3 w-3 shrink-0 rounded-full border border-foreground" style={{ background: sliceColors[idx % sliceColors.length] }} />
                      <span className="truncate max-w-[120px]">{slice.label}</span>
                      <span className="text-muted-foreground ml-auto">{Math.round(slice.pct * 100)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Render Horizontal Bar Chart */
              <div className="space-y-3 max-h-[180px] overflow-y-auto pr-1">
                {slices.map((slice, idx) => {
                  const pct = Math.round(slice.pct * 100);
                  const color = sliceColors[idx % sliceColors.length];
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="truncate max-w-[150px]">{slice.label}</span>
                        <span className="text-muted-foreground">{pct}% ({formatCompactNumber(slice.clicks)} clicks)</span>
                      </div>
                      <div className="h-3 w-full rounded-full border-2 border-foreground bg-card overflow-hidden">
                        <div
                          className="h-full border-r-2 border-foreground"
                          style={{ width: `${pct}%`, backgroundColor: color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Card 3: Visitor Locations */}
          <div className="rounded-2xl border-2 border-foreground bg-card p-5 shadow-[0_4px_0_0_theme(colors.foreground)]">
            <div className="flex items-center gap-2 mb-1">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-base font-bold">Visitor Locations</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">Traffic distribution country wise</p>

            <div className="space-y-3.5">
              {visitorLocations.length === 0 && <p className="text-xs text-muted-foreground">No location logs recorded yet.</p>}
              {visitorLocations.map((loc) => (
                <div key={loc.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="flex items-center gap-1.5">
                      <span className="text-base leading-none">{loc.flag}</span>
                      <span>{loc.name}</span>
                    </span>
                    <span>{loc.pct}%</span>
                  </div>
                  <div className="h-3 w-full rounded-full border-2 border-foreground bg-card overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 border-r-2 border-foreground"
                      style={{ width: `${loc.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 4: Device wise Analytics */}
          <div className="rounded-2xl border-2 border-foreground bg-card p-5 shadow-[0_4px_0_0_theme(colors.foreground)]">
            <h2 className="text-base font-bold mb-1">Device wise Analytics</h2>
            <p className="text-xs text-muted-foreground mb-5">Visits breakdown by client platform</p>

            <div className="space-y-4">
              {deviceStats.map((device) => (
                <div key={device.name} className="flex items-center gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-foreground bg-muted">
                    <device.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span>{device.name}</span>
                      <span>{device.pct}%</span>
                    </div>
                    <div className="h-3 w-full rounded-full border-2 border-foreground bg-card overflow-hidden">
                      <div
                        className="h-full border-r-2 border-foreground"
                        style={{ width: `${device.pct}%`, backgroundColor: device.color }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Collapsible SQL Schema Instructions */}
        {dbError && (
          <div id="sql-schema" className="mt-8 rounded-2xl border-2 border-foreground bg-card p-5 shadow-[0_4px_0_0_theme(colors.foreground)]">
            <h3 className="font-bold text-sm mb-2 flex items-center gap-1.5">Supabase SQL Schema</h3>
            <p className="text-xs text-muted-foreground mb-3">Copy and run this query inside your Supabase Dashboard SQL Editor to instantiate real-time databases:</p>
            <pre className="bg-muted p-3 rounded-xl text-xs overflow-x-auto border-2 border-foreground text-left select-all font-mono">
{`CREATE TABLE analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'view' or 'click'
  link_id TEXT,
  country_code TEXT,
  country_name TEXT,
  device TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous inserts" ON analytics
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow owners to read analytics" ON analytics
  FOR SELECT USING (profile_id = auth.uid());`}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

function getFlagEmoji(countryCode: string) {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  try {
    return String.fromCodePoint(...codePoints);
  } catch (e) {
    return "🌍";
  }
}
