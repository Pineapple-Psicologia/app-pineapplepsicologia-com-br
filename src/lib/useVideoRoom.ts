import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type CamLabel = "face" | "ambiente" | "tela";
export type Member = {
  peerId: string;
  kind: "psi" | "cam";
  label?: CamLabel;
};

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

type RemoteEntry = { stream: MediaStream; label: CamLabel };

export function useVideoRoom(opts: {
  code: string;
  kind: "psi" | "cam";
  label?: CamLabel;
  localStream: MediaStream | null;
  enabled: boolean;
}) {
  const { code, kind, label, localStream, enabled } = opts;
  const peerIdRef = useRef<string>(
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2),
  );
  const [members, setMembers] = useState<Member[]>([]);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, RemoteEntry>>({});
  const [connected, setConnected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const pcsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  useEffect(() => {
    if (!enabled) return;
    const myId = peerIdRef.current;

    const ch = supabase.channel(`v:${code}`, {
      config: { broadcast: { self: false }, presence: { key: myId } },
    });
    channelRef.current = ch;

    const sendSig = (to: string, kindMsg: string, data: any, lbl?: CamLabel) => {
      ch.send({
        type: "broadcast",
        event: "rtc",
        payload: { from: myId, to, kind: kindMsg, data, label: lbl },
      });
    };

    const ensurePC = (otherId: string, otherLabel?: CamLabel) => {
      let pc = pcsRef.current.get(otherId);
      if (pc) return pc;
      pc = new RTCPeerConnection(RTC_CONFIG);
      pcsRef.current.set(otherId, pc);

      pc.onicecandidate = (e) => {
        if (e.candidate) sendSig(otherId, "ice", e.candidate.toJSON());
      };
      pc.ontrack = (e) => {
        const stream = e.streams[0];
        const lbl = otherLabel ?? "face";
        setRemoteStreams((prev) => ({ ...prev, [otherId]: { stream, label: lbl } }));
      };
      pc.onconnectionstatechange = () => {
        if (pc!.connectionState === "failed" || pc!.connectionState === "closed") {
          setRemoteStreams((prev) => {
            const next = { ...prev };
            delete next[otherId];
            return next;
          });
        }
      };

      if (localStreamRef.current) {
        for (const t of localStreamRef.current.getTracks()) {
          pc.addTrack(t, localStreamRef.current);
        }
      }
      return pc;
    };

    const initiateOffer = async (psiPeerId: string) => {
      if (kind !== "cam" || !localStreamRef.current) return;
      if (pcsRef.current.has(psiPeerId)) return;
      const pc = ensurePC(psiPeerId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      sendSig(psiPeerId, "offer", offer, label);
    };

    ch.on("broadcast", { event: "rtc" }, async ({ payload }) => {
      const { from, to, kind: k, data, label: lbl } = payload as any;
      if (to !== myId) return;
      try {
        if (k === "offer") {
          const pc = ensurePC(from, lbl);
          await pc.setRemoteDescription(new RTCSessionDescription(data));
          const ans = await pc.createAnswer();
          await pc.setLocalDescription(ans);
          sendSig(from, "answer", ans);
        } else if (k === "answer") {
          const pc = pcsRef.current.get(from);
          if (pc) await pc.setRemoteDescription(new RTCSessionDescription(data));
        } else if (k === "ice") {
          const pc = pcsRef.current.get(from);
          if (pc) await pc.addIceCandidate(data);
        } else if (k === "bye") {
          const pc = pcsRef.current.get(from);
          if (pc) {
            pc.close();
            pcsRef.current.delete(from);
          }
          setRemoteStreams((prev) => {
            const next = { ...prev };
            delete next[from];
            return next;
          });
        }
      } catch (err) {
        console.error("[rtc]", err);
      }
    });

    ch.on("presence", { event: "sync" }, () => {
      const state = ch.presenceState() as Record<string, any[]>;
      const list: Member[] = [];
      for (const [pid, metas] of Object.entries(state)) {
        const m = metas[0];
        list.push({ peerId: pid, kind: m.kind, label: m.label });
      }
      setMembers(list);

      if (kind === "cam") {
        for (const m of list) {
          if (m.kind === "psi") void initiateOffer(m.peerId);
        }
      }
    });

    ch.on("presence", { event: "leave" }, ({ key }) => {
      const pc = pcsRef.current.get(key as string);
      if (pc) {
        pc.close();
        pcsRef.current.delete(key as string);
      }
      setRemoteStreams((prev) => {
        const next = { ...prev };
        delete next[key as string];
        return next;
      });
    });

    ch.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await ch.track({ kind, label, at: Date.now() });
        setConnected(true);
      }
    });

    return () => {
      pcsRef.current.forEach((pc) => pc.close());
      pcsRef.current.clear();
      ch.unsubscribe();
      supabase.removeChannel(ch);
      channelRef.current = null;
      setConnected(false);
      setRemoteStreams({});
    };
  }, [code, kind, label, enabled]);

  // When a cam's stream becomes available *after* subscribe, push offers.
  useEffect(() => {
    if (!enabled || kind !== "cam" || !localStream || !channelRef.current) return;
    const ch = channelRef.current;
    const state = ch.presenceState() as Record<string, any[]>;
    for (const [pid, metas] of Object.entries(state)) {
      const m = metas[0];
      if (m.kind === "psi" && !pcsRef.current.has(pid)) {
        // Recreate by simulating presence sync
        const pc = new RTCPeerConnection(RTC_CONFIG);
        pcsRef.current.set(pid, pc);
        pc.onicecandidate = (e) => {
          if (e.candidate)
            ch.send({
              type: "broadcast",
              event: "rtc",
              payload: { from: peerIdRef.current, to: pid, kind: "ice", data: e.candidate.toJSON() },
            });
        };
        for (const t of localStream.getTracks()) pc.addTrack(t, localStream);
        (async () => {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          ch.send({
            type: "broadcast",
            event: "rtc",
            payload: { from: peerIdRef.current, to: pid, kind: "offer", data: offer, label },
          });
        })();
      }
    }
  }, [localStream, enabled, kind, label]);

  return { members, remoteStreams, connected, peerId: peerIdRef.current };
}
