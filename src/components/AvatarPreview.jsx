"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { RotateCcw, X } from "lucide-react";
import { AVATAR_PRESETS, Avatar, avatarAspect, avatarFullPhoto } from "@/components/RankBits";

const SPARKLES = [
  { top: "10%", left: "8%", delay: "0s", size: 22 },
  { top: "20%", left: "86%", delay: ".15s", size: 18 },
  { top: "52%", left: "4%", delay: ".3s", size: 16 },
  { top: "60%", left: "90%", delay: ".1s", size: 24 },
  { top: "84%", left: "18%", delay: ".25s", size: 18 },
  { top: "5%", left: "55%", delay: ".35s", size: 16 },
];

/**
 * Full-screen avatar preview.
 *  - Uploaded / selfie photo  -> the complete, uncropped picture.
 *  - 3D avatar (girl / boy)   -> turns by itself 3 full times to show the
 *                                outfit, stops facing front and smiles.
 *    No dragging / scrolling: the motion is fully automatic.
 */
export default function AvatarPreview({ open, onClose, name = "Player", avatar }) {
  const photo = avatarFullPhoto(avatar);
  const preset = !photo && avatar?.preset && AVATAR_PRESETS[avatar.preset] ? avatar.preset : null;
  const [phase, setPhase] = useState("spin"); // spin -> smile
  const [run, setRun] = useState(0);
  const timer = useRef(null);
  const areaRef = useRef(null);
  const [area, setArea] = useState({ w: 0, h: 0 });

  useEffect(() => {
    if (!open || !preset) return undefined;
    setPhase("spin");
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    timer.current = setTimeout(() => setPhase("smile"), reduce ? 200 : 5100);
    return () => clearTimeout(timer.current);
  }, [open, preset, run]);

  // Measure the free space so the figure is always fitted completely (never cropped or squashed).
  useEffect(() => {
    if (!open) return undefined;
    const el = areaRef.current;
    if (!el) return undefined;
    const measure = () => setArea({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    window.addEventListener("resize", measure);
    return () => { ro?.disconnect(); window.removeEventListener("resize", measure); };
  }, [open, preset, photo]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || (!photo && !preset)) return null;

  const ratio = avatarAspect(avatar);
  const src = preset ? AVATAR_PRESETS[preset] : photo;
  const smiling = phase === "smile";
  const availW = Math.max(0, area.w - 32);
  const availH = Math.max(0, area.h - 20);
  const boxH = Math.min(availH, availW / ratio);
  const boxW = boxH * ratio;

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center bg-black/90 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-[calc(0.75rem+env(safe-area-inset-top))] backdrop-blur-md"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${name} profile preview`}
    >
      <div
        className="relative flex h-full max-h-[900px] w-full max-w-[430px] flex-col overflow-hidden rounded-[28px] border border-cyan-300/20 bg-[radial-gradient(circle_at_50%_25%,rgba(34,211,238,.14),transparent_55%),#041522] shadow-[0_24px_90px_rgba(0,0,0,.7)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between px-4 py-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-black text-white">{name}</div>
            <div className="text-[10px] font-bold text-white/40">{preset ? (smiling ? "Looking good!" : "Showing the outfit…") : "Profile photo"}</div>
          </div>
          <div className="flex items-center gap-2">
            {preset && (
              <button type="button" onClick={() => setRun((n) => n + 1)} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/70" aria-label="Replay">
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
            <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/70" aria-label="Close preview">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div ref={areaRef} className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-5">
          {photo ? (
            // Whole image, never cropped.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt={`${name} profile`} className="max-h-full max-w-full rounded-2xl object-contain shadow-[0_12px_50px_rgba(0,0,0,.6)]" />
          ) : (
            <div className="relative flex h-full w-full items-center justify-center [perspective:1100px]">
              <div
                key={run}
                className={`relative ${smiling ? "sv-avatar-pop" : ""}`}
                style={{ width: boxW || undefined, height: boxH || undefined }}
              >
                <div
                  className={`absolute inset-0 [transform-style:preserve-3d] ${phase === "spin" ? "sv-avatar-spin" : ""}`}
                  style={{ willChange: "transform" }}
                >
                  {/* thin slices give the figure a little real thickness while it turns */}
                  {[6, 5, 4, 3, 2, 1].map((i) => (
                    <div
                      key={i}
                      aria-hidden="true"
                      className="absolute inset-0 rounded-2xl"
                      style={{ transform: `translateZ(${-i * 1.5}px)`, backgroundImage: `url(${src})`, backgroundSize: "100% 100%", filter: "brightness(.45)" }}
                    />
                  ))}
                  <div
                    className="absolute inset-0 overflow-hidden rounded-2xl shadow-[0_18px_60px_rgba(0,0,0,.65)]"
                    style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "translateZ(1px)" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`${name} avatar`} className="h-full w-full object-fill" draggable={false} />
                  </div>
                  <div
                    className="absolute inset-0 overflow-hidden rounded-2xl"
                    style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg) translateZ(10px)" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" aria-hidden="true" className="h-full w-full object-fill" style={{ transform: "scaleX(-1)", filter: "brightness(.8)" }} draggable={false} />
                  </div>
                </div>

                {smiling && (
                  <div className="pointer-events-none absolute inset-0">
                    {SPARKLES.map((s, i) => (
                      <svg key={i} viewBox="0 0 24 24" width={s.size} height={s.size} className="sv-sparkle absolute" style={{ top: s.top, left: s.left, animationDelay: s.delay }}>
                        <path d="M12 0c1 7 5 11 12 12-7 1-11 5-12 12-1-7-5-11-12-12 7-1 11-5 12-12z" fill="#ffd21a" />
                      </svg>
                    ))}
                  </div>
                )}
              </div>

              {smiling && (
                <div className="sv-badge-in absolute bottom-1 left-1/2 -translate-x-1/2 rounded-full border border-yellow-300/40 bg-black/55 px-4 py-1.5 text-xs font-black text-yellow-100 backdrop-blur">
                  😊 Smile!
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Round avatar that opens the full preview when tapped:
 * photo/selfie -> whole picture, 3D avatar -> turntable. Falls back to a plain avatar when none is set.
 */
export function PreviewableAvatar({ name, you, size = 36, avatar, className = "", fallbackHref }) {
  const [open, setOpen] = useState(false);
  const hasPreview = Boolean(avatarFullPhoto(avatar) || (avatar?.preset && AVATAR_PRESETS[avatar.preset]));
  if (!hasPreview) {
    const plain = <Avatar name={name} you={you} size={size} avatar={avatar} />;
    return fallbackHref ? <Link href={fallbackHref} className="shrink-0" aria-label="Open profile">{plain}</Link> : plain;
  }
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`shrink-0 rounded-full active:scale-95 ${className}`} aria-label="Open profile preview">
        <Avatar name={name} you={you} size={size} avatar={avatar} />
      </button>
      <AvatarPreview open={open} onClose={() => setOpen(false)} name={name} avatar={avatar} />
    </>
  );
}
