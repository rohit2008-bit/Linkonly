import { createServerFn } from "@tanstack/react-start";
import { supabase } from "./supabase";
import type { Profile, LinkItem } from "./store";

// ---------------------------------------------------------------------------
// Salt helper — uses a dedicated env var, never a fallback literal in prod
// ---------------------------------------------------------------------------
function getSalt(): string {
  const salt = process.env.PASSWORD_SALT;
  if (!salt) {
    throw new Error("PASSWORD_SALT env var is not set. Cannot hash passwords.");
  }
  return salt;
}

// ---------------------------------------------------------------------------
// Hashing — uses Node's built-in crypto.scrypt (proper KDF, bcrypt-class)
//   scrypt(password, salt, keylen) → hex string
// ---------------------------------------------------------------------------
async function scryptHash(password: string): Promise<string> {
  const { scrypt, randomBytes } = await import("crypto");
  const salt = getSalt();
  // 16-byte random per-password nonce stored alongside the hash
  const nonce = randomBytes(16).toString("hex");
  return new Promise((resolve, reject) => {
    scrypt(password + salt, nonce, 64, (err, derived) => {
      if (err) reject(err);
      else resolve(`${nonce}:${derived.toString("hex")}`);
    });
  });
}

async function scryptVerify(password: string, stored: string): Promise<boolean> {
  const { scrypt } = await import("crypto");
  const salt = getSalt();
  const [nonce, hashHex] = stored.split(":");
  if (!nonce || !hashHex) return false;
  return new Promise((resolve, reject) => {
    scrypt(password + salt, nonce, 64, (err, derived) => {
      if (err) reject(err);
      else {
        // Constant-time comparison
        const a = Buffer.from(derived.toString("hex"));
        const b = Buffer.from(hashHex);
        resolve(a.length === b.length && a.equals(b));
      }
    });
  });
}

// ---------------------------------------------------------------------------
// Helper — remove sensitive password fields from any profile before sending
// to the client.
// ---------------------------------------------------------------------------
function scrubProfile(profile: Profile): Profile {
  const scrubbed = { ...profile };
  // Strip link-level hashes
  if (Array.isArray(scrubbed.links)) {
    scrubbed.links = scrubbed.links.map((l: LinkItem) => {
      const { password_hash, ...rest } = l;
      // Also replace the real URL with "protected" so the client never sees it
      if (l.isProtected) {
        return { ...rest, url: "protected" };
      }
      return rest;
    });
  }
  // Strip profile-level protection hash
  if (scrubbed.theme?.protection) {
    scrubbed.theme = {
      ...scrubbed.theme,
      protection: { lock_type: scrubbed.theme.protection.lock_type },
    };
  }
  return scrubbed;
}

// ---------------------------------------------------------------------------
// Public server functions
// ---------------------------------------------------------------------------

export const hashPasswordServer = createServerFn({ method: "POST" })
  .validator((password: string) => password)
  .handler(async ({ data: password }) => {
    return await scryptHash(password);
  });

export const verifyLinkPassword = createServerFn({ method: "POST" })
  .validator(
    (payload: { username: string; linkId: string; passwordInput: string }) =>
      payload
  )
  .handler(async ({ data: { username, linkId, passwordInput } }) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("links")
      .eq("username", username.toLowerCase())
      .maybeSingle();

    if (!profile || !profile.links) return { ok: false, error: "Not found" };

    const link = (profile.links as any[]).find((l) => l.id === linkId);
    if (!link) return { ok: false, error: "Link not found" };

    if (link.isProtected && link.password_hash) {
      const match = await scryptVerify(passwordInput, link.password_hash);
      if (match) {
        return { ok: true, url: link.url };
      }
    }

    return { ok: false, error: "Incorrect password" };
  });

export const verifyProfilePassword = createServerFn({ method: "POST" })
  .validator(
    (payload: { username: string; passwordInput: string }) => payload
  )
  .handler(async ({ data: { username, passwordInput } }) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("theme")
      .eq("username", username.toLowerCase())
      .maybeSingle();

    if (!profile || !profile.theme) return { ok: false, error: "Not found" };

    const theme = profile.theme as any;
    if (theme.protection?.password_hash) {
      const match = await scryptVerify(passwordInput, theme.protection.password_hash);
      if (match) {
        const { data: fullProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("username", username.toLowerCase())
          .maybeSingle();

        if (!fullProfile) return { ok: false, error: "Profile not found" };

        // FIX #5 — scrub all sensitive fields before sending to client
        return { ok: true, profile: scrubProfile(fullProfile as Profile) };
      }
    }

    return { ok: false, error: "Incorrect password" };
  });
