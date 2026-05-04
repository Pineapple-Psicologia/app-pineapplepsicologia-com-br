import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type Role = "psi" | "paciente";

export type RoomMessage = { type: string; payload: any; from: Role };

export function useRoom(code: string | null, role: Role) {
  const [ready, setReady] = useState(false);
  const [peers, setPeers] = useState(0);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const handlersRef = useRef<Set<(m: RoomMessage) => void>>(new Set());

  useEffect(() => {
    if (!code) return;
    const ch = supabase.channel(`room:${code}`, {
      config: { broadcast: { self: false }, presence: { key: role } },
    });

    ch.on("broadcast", { event: "msg" }, ({ payload }) => {
      handlersRef.current.forEach((h) => h(payload as RoomMessage));
    });

    ch.on("presence", { event: "sync" }, () => {
      const state = ch.presenceState();
      setPeers(Object.keys(state).length);
    });

    ch.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await ch.track({ role, at: Date.now() });
        setReady(true);
      }
    });

    channelRef.current = ch;
    return () => {
      ch.unsubscribe();
      supabase.removeChannel(ch);
      channelRef.current = null;
      setReady(false);
    };
  }, [code, role]);

  const send = useCallback(
    (type: string, payload: any) => {
      const ch = channelRef.current;
      if (!ch) return;
      ch.send({
        type: "broadcast",
        event: "msg",
        payload: { type, payload, from: role } as RoomMessage,
      });
    },
    [role],
  );

  const on = useCallback((handler: (m: RoomMessage) => void) => {
    handlersRef.current.add(handler);
    return () => {
      handlersRef.current.delete(handler);
    };
  }, []);

  return { ready, peers, send, on };
}
