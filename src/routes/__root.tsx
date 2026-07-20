import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, useRef, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { AuthProvider } from "../lib/auth";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The link you're looking for doesn't exist yet.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">Try again or head back home.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Try again
          </button>
          <a href="/" className="inline-flex items-center justify-center rounded-full border-2 border-foreground bg-background px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-accent/40">
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "LinkHub — One link for everything you are" },
      { name: "description", content: "Create a beautiful public profile that holds every link you share. Custom branding, QR codes, and analytics — no code required." },
      { property: "og:title", content: "LinkHub — One link for everything you are" },
      { property: "og:description", content: "Create a beautiful public profile that holds every link you share. Custom branding, QR codes, and analytics." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&family=Bebas+Neue&family=Galindo&family=Playfair+Display:ital,wght@1,400;1,700&family=Poppins:wght@400;600;700&family=Nunito:wght@400;600;700&family=Lato:wght@400;700&family=Oswald:wght@400;600;700&family=Raleway:wght@400;600;700&family=Montserrat:wght@400;600;700&family=Pacifico&family=Dancing+Script:wght@600;700&family=Lobster&family=Righteous&family=Ubuntu:wght@400;700&family=Merriweather:wght@400;700&family=Caveat:wght@600;700&family=Cinzel:wght@600;700&family=Aboreto&family=Comfortaa:wght@400;700&family=Bungee&family=Permanent+Marker&family=Gloria+Hallelujah&family=Rubik+Dirt&display=swap" },
      { rel: "icon", href: "/logo.png", type: "image/png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function MouseFollower() {
  const followerRef = useRef<HTMLDivElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const follower = followerRef.current;
    if (!follower) return;

    const handleMouseMove = (e: MouseEvent) => {
      follower.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%) scale(${isHovered ? 2.5 : 1})`;
      follower.style.opacity = "1";
    };

    const handleMouseLeave = () => {
      follower.style.opacity = "0";
    };

    const handleMouseEnter = () => {
      follower.style.opacity = "1";
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isInteractive = 
        target.tagName === "BUTTON" || 
        target.tagName === "A" || 
        target.closest("button") || 
        target.closest("a") || 
        target.getAttribute("role") === "button";
      setIsHovered(!!isInteractive);
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);
    window.addEventListener("mouseover", handleMouseOver);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
      window.removeEventListener("mouseover", handleMouseOver);
    };
  }, [isHovered]);

  return (
    <div
      ref={followerRef}
      className="pointer-events-none fixed left-0 top-0 z-[9999] rounded-full transition-transform duration-75 ease-out hidden md:block opacity-0"
      style={{
        width: "10px",
        height: "10px",
        backgroundColor: "var(--primary)",
        boxShadow: "0 0 10px var(--primary), 0 0 20px var(--primary)",
        willChange: "transform, opacity",
      }}
    />
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
        <MouseFollower />
      </AuthProvider>
    </QueryClientProvider>
  );
}
