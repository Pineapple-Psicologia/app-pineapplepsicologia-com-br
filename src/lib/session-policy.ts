// Política de duração da sessão do app (camada acima do Supabase).
// - "session": expira ao fechar a aba/janela (signOut no beforeunload).
// - "1d" | "7d" | "30d": expira após N dias; verificado em cada carga.

import { supabase } from "@/integrations/supabase/client";

export type SessionDuration = "session" | "1d" | "7d" | "30d";

const EXPIRY_KEY = "auth:expiresAt";
const MODE_KEY = "auth:mode";

const DAY = 24 * 60 * 60 * 1000;
const DURATION_MS: Record<Exclude<SessionDuration, "session">, number> = {
  "1d": 1 * DAY,
  "7d": 7 * DAY,
  "30d": 30 * DAY,
};

export function setSessionPolicy(duration: SessionDuration) {
  try {
    localStorage.setItem(MODE_KEY, duration);
    if (duration === "session") {
      localStorage.removeItem(EXPIRY_KEY);
    } else {
      const expiresAt = Date.now() + DURATION_MS[duration];
      localStorage.setItem(EXPIRY_KEY, String(expiresAt));
    }
  } catch {
    /* storage indisponível */
  }
}

export function clearSessionPolicy() {
  try {
    localStorage.removeItem(EXPIRY_KEY);
    localStorage.removeItem(MODE_KEY);
  } catch {
    /* noop */
  }
}

export function getSessionMode(): SessionDuration | null {
  try {
    return (localStorage.getItem(MODE_KEY) as SessionDuration | null) ?? null;
  } catch {
    return null;
  }
}

export function isPolicyExpired(): boolean {
  try {
    const raw = localStorage.getItem(EXPIRY_KEY);
    if (!raw) return false;
    const expiresAt = Number(raw);
    if (!Number.isFinite(expiresAt)) return false;
    return Date.now() >= expiresAt;
  } catch {
    return false;
  }
}

/** Registra signOut no beforeunload quando o modo for "apenas esta sessão". */
export function installSessionOnlyGuard(): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => {
    if (getSessionMode() === "session") {
      // scope: 'local' apenas limpa o storage local; rápido o suficiente para unload.
      void supabase.auth.signOut({ scope: "local" });
      clearSessionPolicy();
    }
  };
  window.addEventListener("beforeunload", handler);
  return () => window.removeEventListener("beforeunload", handler);
}
