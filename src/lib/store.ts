// Frontend-only localStorage store for the Linktree-like MVP demo.
export type LinkItem = {
  id: string;
  title: string;
  url: string;
  clicks: number;
};

export type Theme = {
  bg: string; // background color
  card: string; // card color
  text: string; // text color
  button: "pill" | "solid" | "outline";
  buttonBg: string;
  buttonText: string;
  font: "sans" | "display";
};

export type Profile = {
  username: string;
  email: string;
  password: string; // demo only, plain text — NOT for production
  name: string;
  bio: string;
  avatar: string; // data URL or URL
  links: LinkItem[];
  theme: Theme;
  premium: boolean;
  views: number;
  createdAt: number;
};

const USERS_KEY = "linkhub.users";
const SESSION_KEY = "linkhub.session";

export const defaultTheme: Theme = {
  bg: "#f5f5f0",
  card: "#ffffff",
  text: "#111111",
  button: "pill",
  buttonBg: "#ffffff",
  buttonText: "#111111",
  font: "sans",
};

function read(): Record<string, Profile> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "{}");
  } catch {
    return {};
  }
}
function write(users: Record<string, Profile>) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export const store = {
  getAll: read,
  get(username: string): Profile | null {
    return read()[username.toLowerCase()] || null;
  },
  save(p: Profile) {
    const users = read();
    users[p.username.toLowerCase()] = p;
    write(users);
  },
  usernameExists(u: string) {
    return !!read()[u.toLowerCase()];
  },
  emailExists(email: string) {
    return Object.values(read()).some((u) => u.email.toLowerCase() === email.toLowerCase());
  },
  findByEmail(email: string) {
    return Object.values(read()).find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  },
  session: {
    get(): string | null {
      if (typeof window === "undefined") return null;
      return localStorage.getItem(SESSION_KEY);
    },
    set(username: string) {
      localStorage.setItem(SESSION_KEY, username.toLowerCase());
    },
    clear() {
      localStorage.removeItem(SESSION_KEY);
    },
  },
  trackView(username: string) {
    const p = this.get(username);
    if (!p) return;
    p.views = (p.views || 0) + 1;
    this.save(p);
  },
  trackClick(username: string, linkId: string) {
    const p = this.get(username);
    if (!p) return;
    const link = p.links.find((l) => l.id === linkId);
    if (link) {
      link.clicks = (link.clicks || 0) + 1;
      this.save(p);
    }
  },
};

export function newId() {
  return Math.random().toString(36).slice(2, 10);
}
