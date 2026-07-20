import { supabase } from "./supabase";

export type LinkItem = {
  id: string;
  title: string;
  url: string;
  clicks: number;
};

export type Theme = {
  bg: string;
  card: string;
  text: string;
  button: "pill" | "solid" | "outline";
  buttonBg: string;
  buttonText: string;
  font: "sans" | "display" | "italic" | "bebas" | "galindo";
  nameFont?: "sans" | "display" | "italic" | "bebas" | "galindo";
  bioFont?: "sans" | "display" | "italic" | "bebas" | "galindo";
};

export type Profile = {
  username: string;
  email: string;
  password?: string; // Stored in Auth, not profile table
  name: string;
  bio: string;
  avatar: string;
  links: LinkItem[];
  theme: Theme;
  premium: boolean;
  views: number;
  createdAt?: number;
};

export const defaultTheme: Theme = {
  bg: "#f5f5f0",
  card: "#ffffff",
  text: "#111111",
  button: "pill",
  buttonBg: "#ffffff",
  buttonText: "#111111",
  font: "sans",
  nameFont: "sans",
  bioFont: "sans",
};

export const store = {
  async get(username: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username.toLowerCase())
        .maybeSingle();

      if (error) {
        console.error("Error getting profile:", error);
        return null;
      }
      return data as Profile | null;
    } catch (e) {
      console.error(e);
      return null;
    }
  },

  async checkIpView(username: string, ip: string): Promise<boolean> {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username.toLowerCase())
        .maybeSingle();

      if (profile) {
        const { data, error } = await supabase
          .from("analytics")
          .select("id")
          .eq("profile_id", profile.id)
          .eq("type", "view")
          .eq("link_id", ip)
          .limit(1);

        if (error) {
          console.error("Error checking IP view:", error);
          return false;
        }
        return !!(data && data.length > 0);
      }
      return false;
    } catch (e) {
      console.error("Error checking IP view:", e);
      return false;
    }
  },

  async trackView(username: string, ip?: string) {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, views")
        .eq("username", username.toLowerCase())
        .maybeSingle();

      if (profile) {
        await supabase
          .from("profiles")
          .update({ views: (profile.views || 0) + 1 })
          .eq("id", profile.id);

        const visitor = await getVisitorDetails(ip);
        await supabase
          .from("analytics")
          .insert({
            profile_id: profile.id,
            type: "view",
            link_id: ip || null,
            country_code: visitor.countryCode,
            country_name: visitor.countryName,
            device: visitor.device,
          });
      }
    } catch (e) {
      console.error("Error tracking view:", e);
    }
  },

  async trackClick(username: string, linkId: string) {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, links")
        .eq("username", username.toLowerCase())
        .maybeSingle();

      if (profile && Array.isArray(profile.links)) {
        const links = [...profile.links];
        const link = links.find((l: any) => l.id === linkId);
        if (link) {
          link.clicks = (link.clicks || 0) + 1;
          await supabase
            .from("profiles")
            .update({ links })
            .eq("id", profile.id);

          const visitor = await getVisitorDetails();
          await supabase
            .from("analytics")
            .insert({
              profile_id: profile.id,
              type: "click",
              link_id: linkId,
              country_code: visitor.countryCode,
              country_name: visitor.countryName,
              device: visitor.device,
            });
        }
      }
    } catch (e) {
      console.error("Error tracking click:", e);
    }
  },
};

async function getVisitorDetails(prefetchedIp?: string) {
  let countryCode = "US";
  let countryName = "United States";
  try {
    const url = prefetchedIp ? `https://ipapi.co/${prefetchedIp}/json/` : "https://ipapi.co/json/";
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      countryCode = data.country_code || "US";
      countryName = data.country_name || "United States";
    }
  } catch (e) {
    console.error("Geo lookup failed:", e);
  }

  let device = "Desktop";
  if (typeof navigator !== "undefined") {
    const ua = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(ua)) device = "Tablet";
    else if (/mobile|iphone|ipod|android|blackberry|iemobile|opera mini/i.test(ua)) device = "Mobile";
  }
  return { countryCode, countryName, device };
}

export function newId() {
  return Math.random().toString(36).slice(2, 10);
}

export function getFontFamily(font: Theme["font"]): React.CSSProperties {
  switch (font) {
    case "display":
      return { fontFamily: "var(--font-display)" };
    case "italic":
      return { fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic" };
    case "bebas":
      return { fontFamily: "'Bebas Neue', sans-serif" };
    case "galindo":
      return { fontFamily: "'Galindo', cursive, sans-serif" };
    case "sans":
    default:
      return { fontFamily: "var(--font-sans)" };
  }
}
