import { createPublicApiClient } from "@atlas/api-client";
import type { components } from "@atlas/api-types";
import { startTransition, useCallback, useEffect, useRef, useState } from "react";

export type RealtimeEvent = {
  type: string;
  [key: string]: unknown;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  timestamp: number;
};

type ManualSearchResult = components["schemas"]["ManualTaskSearchResponseDto"];

export interface UseTechnicianRealtimeOptions {
  assetName?: string;
  engineerId: string;
  engineerName: string;
  jobTitle?: string;
  taskHint?: string;
}

export interface UseTechnicianRealtimeReturn {
  isActive: boolean;
  isConnecting: boolean;
  isMuted: boolean;
  error: string | null;
  status: string;
  messages: ChatMessage[];
  events: RealtimeEvent[];
  toolCall: string | null;
  noiseSuppression: boolean;
  lastTaskResult: ManualSearchResult | null;
  startSession: () => Promise<void>;
  stopSession: () => void;
  toggleMute: () => void;
  sendText: (text: string) => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

const client = createPublicApiClient();

let messageCounter = 0;

function nextMessageId() {
  messageCounter += 1;
  return `msg-${Date.now()}-${messageCounter}`;
}

function isNoisyEvent(event: RealtimeEvent) {
  return event.type === "response.audio.delta" || event.type === "response.audio.done";
}

function isUserTranscriptEvent(event: RealtimeEvent) {
  return event.type === "conversation.item.input_audio_transcription.completed";
}

function isAssistantTranscriptEvent(event: RealtimeEvent) {
  return (
    event.type === "response.audio_transcript.done" ||
    event.type === "response.output_audio_transcript.done"
  );
}

function isFunctionCallEvent(event: RealtimeEvent) {
  return event.type === "response.function_call_arguments.done";
}

function isErrorEvent(event: RealtimeEvent) {
  return event.type === "error";
}

export function useTechnicianRealtime(
  options: UseTechnicianRealtimeOptions
): UseTechnicianRealtimeReturn {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("Idle");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  const [toolCall, setToolCall] = useState<string | null>(null);
  const [noiseSuppression, setNoiseSuppression] = useState(false);
  const [lastTaskResult, setLastTaskResult] = useState<ManualSearchResult | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const snapshotTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pushMessage = useCallback((role: ChatMessage["role"], text: string) => {
    startTransition(() => {
      setMessages((current) => [
        ...current,
        {
          id: nextMessageId(),
          role,
          text,
          timestamp: Date.now(),
        },
      ]);
    });
  }, []);

  const forwardTranscript = useCallback(
    async (role: "user" | "assistant" | "system", text: string) => {
      await client
        .POST("/api/technician-assist/transcripts", {
          body: {
            engineerId: options.engineerId,
            engineerName: options.engineerName,
            role,
            text,
            timestamp: new Date().toISOString(),
          },
        })
        .catch(() => undefined);
    },
    [options.engineerId, options.engineerName]
  );

  const captureFrame = useCallback(async () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return null;

    const sourceWidth = video.videoWidth;
    const sourceHeight = video.videoHeight;
    if (!sourceWidth || !sourceHeight) return null;

    const maxWidth = 640;
    const scale = Math.min(1, maxWidth / sourceWidth);
    const width = Math.round(sourceWidth * scale);
    const height = Math.round(sourceHeight * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) return null;

    context.drawImage(video, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((nextBlob) => resolve(nextBlob), "image/jpeg", 0.76);
    });

    if (!blob) return null;

    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = typeof reader.result === "string" ? reader.result : "";
        resolve(result.split(",")[1] ?? "");
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });

    return {
      mime: "image/jpeg",
      base64,
    };
  }, []);

  const sendFrame = useCallback(async () => {
    const channel = dcRef.current;
    if (!channel || channel.readyState !== "open") return;

    const frame = await captureFrame();
    if (!frame) return;

    channel.send(
      JSON.stringify({
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "user",
          content: [
            {
              type: "input_image",
              image_url: `data:${frame.mime};base64,${frame.base64}`,
            },
          ],
        },
      })
    );
  }, [captureFrame]);

  const stopSnapshotLoop = useCallback(() => {
    if (snapshotTimerRef.current) {
      clearInterval(snapshotTimerRef.current);
      snapshotTimerRef.current = null;
    }
  }, []);

  const startSnapshotLoop = useCallback(() => {
    if (snapshotTimerRef.current) return;
    snapshotTimerRef.current = setInterval(() => {
      void sendFrame();
    }, 1200);
  }, [sendFrame]);

  const cleanup = useCallback(() => {
    stopSnapshotLoop();

    if (dcRef.current) {
      try {
        dcRef.current.close();
      } catch {
        // noop
      }
      dcRef.current = null;
    }

    if (pcRef.current) {
      try {
        pcRef.current.getSenders().forEach((sender) => sender.track?.stop());
        pcRef.current.close();
      } catch {
        // noop
      }
      pcRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.srcObject = null;
    }

    setIsActive(false);
    setIsMuted(false);
    setNoiseSuppression(false);
    setStatus("Idle");
  }, [stopSnapshotLoop]);

  const toggleMute = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) return;

    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) return;

    audioTrack.enabled = !audioTrack.enabled;
    setIsMuted(!audioTrack.enabled);
  }, []);

  const sendText = useCallback(
    (text: string) => {
      const channel = dcRef.current;
      const trimmed = text.trim();
      if (!channel || channel.readyState !== "open" || !trimmed) return;

      pushMessage("user", trimmed);
      void forwardTranscript("user", trimmed);

      channel.send(
        JSON.stringify({
          type: "conversation.item.create",
          item: {
            type: "message",
            role: "user",
            content: [{ type: "input_text", text: trimmed }],
          },
        })
      );
      channel.send(JSON.stringify({ type: "response.create" }));
    },
    [forwardTranscript, pushMessage]
  );

  const startSession = useCallback(async () => {
    if (isActive || isConnecting) return;

    setIsConnecting(true);
    setError(null);
    setMessages([]);
    setEvents([]);
    setLastTaskResult(null);
    setToolCall(null);
    setStatus("Requesting camera and microphone...");

    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = media;
      setNoiseSuppression(true);

      if (videoRef.current) {
        videoRef.current.srcObject = media;
      }

      setStatus("Minting realtime session...");
      const { data: session, error: sessionError } = await client.POST(
        "/api/technician-assist/realtime/session",
        {
          body: {
            assetName: options.assetName,
            jobTitle: options.jobTitle,
            taskHint: options.taskHint,
          },
        }
      );

      if (sessionError || !session?.value) {
        throw new Error("Failed to create realtime session");
      }

      setStatus("Connecting realtime engine...");

      const peerConnection = new RTCPeerConnection();
      pcRef.current = peerConnection;

      peerConnection.ontrack = (event) => {
        if (audioRef.current) {
          audioRef.current.srcObject = event.streams[0] ?? null;
        }
      };

      media.getTracks().forEach((track) => {
        peerConnection.addTrack(track, media);
      });

      const dataChannel = peerConnection.createDataChannel("oai-events");
      dcRef.current = dataChannel;

      dataChannel.addEventListener("open", async () => {
        setIsActive(true);
        setStatus("Connected - Atlas bench guide live");

        const video = videoRef.current;
        if (video && video.readyState < 2) {
          await new Promise<void>((resolve) => {
            video.addEventListener("loadeddata", () => resolve(), { once: true });
          });
        }

        await sendFrame();
        startSnapshotLoop();
      });

      dataChannel.addEventListener("close", () => {
        cleanup();
      });

      dataChannel.addEventListener("message", (event) => {
        try {
          const payload = JSON.parse(event.data) as RealtimeEvent;

          if (!isNoisyEvent(payload)) {
            setEvents((current) => [payload, ...current].slice(0, 40));
          }

          if (isUserTranscriptEvent(payload)) {
            const transcript = typeof payload.transcript === "string" ? payload.transcript.trim() : "";
            if (transcript) {
              pushMessage("user", transcript);
              void forwardTranscript("user", transcript);
            }
          }

          if (isAssistantTranscriptEvent(payload)) {
            const transcript = typeof payload.transcript === "string" ? payload.transcript.trim() : "";
            if (transcript) {
              pushMessage("assistant", transcript);
              void forwardTranscript("assistant", transcript);
            }
          }

          if (isFunctionCallEvent(payload)) {
            const argsString = typeof payload.arguments === "string" ? payload.arguments : "{}";
            const callId = typeof payload.call_id === "string" ? payload.call_id : "";
            const name = typeof payload.name === "string" ? payload.name : "";

            if (name === "get_manual_task_steps" && callId) {
              setToolCall("Looking up HP manual steps...");

              void (async () => {
                let taskDescription = "";
                try {
                  const parsed = JSON.parse(argsString) as { task_description?: string };
                  taskDescription = parsed.task_description?.trim() ?? "";
                } catch {
                  taskDescription = "";
                }

                const result = await client.POST("/api/technician-assist/manual/search", {
                  body: { description: taskDescription },
                });

                const toolResult: ManualSearchResult = result.data ?? {
                  found: false,
                  steps: [],
                  availableTasks: [],
                };

                setLastTaskResult(toolResult);

                if (toolResult.found && toolResult.title) {
                  const systemMessage = `Loaded manual: ${toolResult.title}`;
                  pushMessage("system", systemMessage);
                  void forwardTranscript("system", systemMessage);
                }

                dataChannel.send(
                  JSON.stringify({
                    type: "conversation.item.create",
                    item: {
                      type: "function_call_output",
                      call_id: callId,
                      output: JSON.stringify(toolResult),
                    },
                  })
                );
                dataChannel.send(JSON.stringify({ type: "response.create" }));

                window.setTimeout(() => setToolCall(null), 1800);
              })();
            }
          }

          if (isErrorEvent(payload)) {
            const message =
              typeof payload.error === "object" && payload.error && "message" in payload.error
                ? String(payload.error.message)
                : JSON.stringify(payload);
            setError(message);
          }
        } catch {
          // ignore non-json payloads
        }
      });

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      const response = await fetch(
        `https://api.openai.com/v1/realtime/calls?model=${encodeURIComponent("gpt-realtime-2")}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.value}`,
            "Content-Type": "application/sdp",
          },
          body: offer.sdp,
        }
      );

      if (!response.ok) {
        throw new Error(`Realtime SDP negotiation failed: ${response.status}`);
      }

      const answerSdp = await response.text();
      await peerConnection.setRemoteDescription({ type: "answer", sdp: answerSdp });
      setStatus("Waiting for realtime channel...");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
      cleanup();
    } finally {
      setIsConnecting(false);
    }
  }, [
    cleanup,
    forwardTranscript,
    isActive,
    isConnecting,
    options.assetName,
    options.jobTitle,
    options.taskHint,
    pushMessage,
    sendFrame,
    startSnapshotLoop,
  ]);

  const stopSession = useCallback(() => {
    cleanup();
  }, [cleanup]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    isActive,
    isConnecting,
    isMuted,
    error,
    status,
    messages,
    events,
    toolCall,
    noiseSuppression,
    lastTaskResult,
    startSession,
    stopSession,
    toggleMute,
    sendText,
    videoRef,
    audioRef,
  };
}
