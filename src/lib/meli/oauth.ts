import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { MeliError } from "./errors";

const API = "https://api.mercadolibre.com";
const AUTH_URL = "https://auth.mercadolibre.com.ar/authorization";
/** Refrescamos el token si vence en menos de 5 minutos. */
const REFRESH_MARGIN_MS = 5 * 60 * 1000;

interface MeliConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export function getMeliConfig(): MeliConfig | null {
  const clientId = process.env.MELI_CLIENT_ID;
  const clientSecret = process.env.MELI_CLIENT_SECRET;
  const redirectUri = process.env.MELI_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) return null;
  return { clientId, clientSecret, redirectUri };
}

function requireConfig(): MeliConfig {
  const cfg = getMeliConfig();
  if (!cfg) throw new MeliError("NOT_CONFIGURED");
  return cfg;
}

const base64url = (buf: Buffer) => buf.toString("base64url");

/** Arma la URL de autorización con state (anti-CSRF) y PKCE. */
export async function createAuthorizationUrl(): Promise<string> {
  const cfg = requireConfig();
  const state = base64url(randomBytes(24));
  const verifier = base64url(randomBytes(48));
  const challenge = base64url(createHash("sha256").update(verifier).digest());

  // Limpiamos estados viejos (> 15 min) y guardamos el nuevo.
  await db.meliOAuthState.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 15 * 60_000) } } });
  await db.meliOAuthState.create({ data: { state, verifier } });

  const url = new URL(AUTH_URL);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", cfg.clientId);
  url.searchParams.set("redirect_uri", cfg.redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user_id: number;
}

async function tokenRequest(params: Record<string, string>): Promise<TokenResponse> {
  let res: Response;
  try {
    res = await fetch(`${API}/oauth/token`, {
      method: "POST",
      headers: { accept: "application/json", "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(params),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new MeliError("NETWORK");
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new MeliError(
      res.status === 400 || res.status === 401 ? "UNAUTHORIZED" : "UNKNOWN",
      `Mercado Libre rechazó la autorización (${res.status}). ${body.slice(0, 200)}`,
      res.status,
    );
  }
  return (await res.json()) as TokenResponse;
}

async function fetchNickname(accessToken: string): Promise<string | null> {
  try {
    const res = await fetch(`${API}/users/me`, {
      headers: { authorization: `Bearer ${accessToken}` },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { nickname?: string };
    return data.nickname ?? null;
  } catch {
    return null;
  }
}

async function saveToken(t: TokenResponse) {
  const nickname = await fetchNickname(t.access_token);
  const data = {
    meliUserId: String(t.user_id),
    nickname,
    accessToken: t.access_token,
    refreshToken: t.refresh_token,
    expiresAt: new Date(Date.now() + t.expires_in * 1000),
  };
  await db.meliToken.upsert({ where: { id: "singleton" }, create: { id: "singleton", ...data }, update: data });
}

/** Paso 2 del OAuth: canjea el code por tokens y los guarda en la base. */
export async function handleCallback(code: string, state: string): Promise<void> {
  const cfg = requireConfig();
  const saved = await db.meliOAuthState.findUnique({ where: { state } });
  if (!saved) throw new MeliError("UNAUTHORIZED", "El inicio de sesión expiró o no es válido. Probá de nuevo.");
  await db.meliOAuthState.delete({ where: { state } });

  const token = await tokenRequest({
    grant_type: "authorization_code",
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    code,
    redirect_uri: cfg.redirectUri,
    code_verifier: saved.verifier,
  });
  await saveToken(token);
}

// Evita refrescos concurrentes (ML invalida el refresh_token al usarlo).
let refreshing: Promise<string | null> | null = null;

/**
 * Devuelve un access token válido, refrescándolo si hace falta.
 * null = no hay cuenta conectada (las consultas se intentan sin token).
 */
export async function getValidAccessToken(): Promise<string | null> {
  const cfg = getMeliConfig();
  if (!cfg) return null;
  const token = await db.meliToken.findUnique({ where: { id: "singleton" } });
  if (!token) return null;
  if (token.expiresAt.getTime() - Date.now() > REFRESH_MARGIN_MS) return token.accessToken;

  refreshing ??= (async () => {
    try {
      const fresh = await tokenRequest({
        grant_type: "refresh_token",
        client_id: cfg.clientId,
        client_secret: cfg.clientSecret,
        refresh_token: token.refreshToken,
      });
      await saveToken(fresh);
      return fresh.access_token;
    } catch (e) {
      // Refresh inválido → la cuenta quedó desconectada.
      if (e instanceof MeliError && e.code === "UNAUTHORIZED") {
        await db.meliToken.deleteMany();
        return null;
      }
      throw e;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

/** Fuerza el refresh (cuando ML responde 401 con un token "vigente"). */
export async function invalidateAccessToken() {
  await db.meliToken.updateMany({ data: { expiresAt: new Date(0) } });
}

export async function disconnect() {
  await db.meliToken.deleteMany();
}

export async function getMeliStatus() {
  const configured = getMeliConfig() !== null;
  const token = configured ? await db.meliToken.findUnique({ where: { id: "singleton" } }) : null;
  return {
    configured,
    connected: !!token,
    nickname: token?.nickname ?? null,
    expiresAt: token?.expiresAt.toISOString() ?? null,
  };
}
