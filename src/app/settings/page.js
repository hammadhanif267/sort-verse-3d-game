"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ChevronLeft, Copy, ShieldCheck } from "lucide-react";
import { exportCode, parseCode, overwriteProgress, queueMirror } from "@/lib/backup";
import { isMuted, setMuted, setMusicEnabled, setSoundEffectsEnabled } from "@/lib/sound";
import useBackgroundMusic from "@/lib/useBackgroundMusic";
import { DEFAULT_THEME, THEMES, getTheme, setTheme, subscribeToTheme } from "@/lib/theme";

const KEY = { sound: "sortverse-setting-sound", music: "sortverse-setting-music", vibration: "sortverse-setting-vibration" };

export default function SettingsPage() {
  useBackgroundMusic("menu");
  const selectedTheme = useSyncExternalStore(subscribeToTheme, getTheme, () => DEFAULT_THEME);
  const [settings, setSettings] = useState({ sound: true, music: true, vibration: true });
  const [code, setCode] = useState("");
  const [incoming, setIncoming] = useState("");
  const [pending, setPending] = useState(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  useEffect(() => {
    // Device preferences are loaded after the initial static HTML hydrates.
    const frame = window.requestAnimationFrame(() => {
      setSettings({ sound: window.localStorage.getItem(KEY.sound) !== "0" && !isMuted(), music: window.localStorage.getItem(KEY.music) !== "0", vibration: window.localStorage.getItem(KEY.vibration) !== "0" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);
  function updateTheme(id) {
    setTheme(id);
    queueMirror();
  }
  function update(name) {
    const value = !settings[name];
    setSettings((previous) => ({ ...previous, [name]: value }));
    window.localStorage.setItem(KEY[name], value ? "1" : "0");
    if (name === "sound") { if (value && isMuted()) setMuted(false); setSoundEffectsEnabled(value); }
    if (name === "music") setMusicEnabled(value);
    queueMirror();
  }
  async function makeCode() {
    try { setCode(await exportCode()); setError(""); setStatus("Keep this code somewhere private. It may contain a profile photograph."); }
    catch (err) { setError(err?.message || "Could not export progress"); }
  }
  async function prepareImport() {
    try { setPending(await parseCode(incoming)); setError(""); setStatus(""); }
    catch (err) { setPending(null); setError(err?.message || "Invalid progress code"); }
  }
  function confirmImport() {
    if (!pending) return;
    overwriteProgress(pending);
    queueMirror();
    setPending(null);
    setIncoming("");
    setStatus("Progress imported. Reloading game…");
    window.location.replace("/");
  }
  return (
    <main className="sv-screen h-dvh overflow-y-auto bg-[#020b15] text-white">
      <div className="mx-auto min-h-dvh max-w-[430px] px-5 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-[calc(1.5rem+env(safe-area-inset-top))]">
        <Link href="/profile" className="mb-6 inline-flex items-center gap-2 text-cyan-200"><ChevronLeft size={18} /> Profile</Link>
        <h1 className="text-2xl font-black">Settings</h1>
        <p className="mt-1 text-sm text-white/55">All settings and progress are stored on this device.</p>
        <section aria-labelledby="theme-heading" className="sv-theme-panel mt-6 rounded-2xl border border-white/10 bg-[#082238] p-4">
          <h2 id="theme-heading" className="text-base font-black">Game theme</h2>
          <p className="mt-1 text-xs text-white/60">Change the look of menus and gameplay. Puzzle colours stay the same.</p>
          <div className="mt-4 grid grid-cols-2 gap-3" role="group" aria-label="Choose game theme">
            {THEMES.map(({ id, name, description, colors }) => (
              <button
                key={id}
                type="button"
                onClick={() => updateTheme(id)}
                aria-pressed={selectedTheme === id}
                className={`sv-theme-choice rounded-xl border p-2.5 text-left transition active:scale-[0.98] ${selectedTheme === id ? "border-white ring-2 ring-cyan-300" : "border-white/15 hover:border-white/50"}`}
              >
                <span className="flex h-12 overflow-hidden rounded-lg border border-white/15" aria-hidden="true">
                  {colors.map((color, index) => <span key={color} style={{ backgroundColor: color, flex: index === 0 ? 2 : 1 }} />)}
                </span>
                <span className="mt-2 flex items-center justify-between gap-1 text-xs font-bold">
                  {name}
                  {selectedTheme === id && <span className="text-emerald-300" aria-label="Selected">✓</span>}
                </span>
                <span className="mt-0.5 block text-[10px] text-white/60">{description}</span>
              </button>
            ))}
          </div>
        </section>
        <section className="sv-theme-panel mt-5 space-y-3 rounded-2xl border border-white/10 bg-[#082238] p-4">
          {[["sound", "Sound effects"], ["music", "Music"], ["vibration", "Vibration"]].map(([name, label]) => (
            <label key={name} className="flex items-center justify-between gap-4 py-2 text-sm font-bold">
              <span>{label}</span><input type="checkbox" checked={settings[name]} onChange={() => update(name)} className="h-6 w-6 accent-cyan-400" />
            </label>
          ))}
        </section>
        <section className="sv-theme-panel mt-5 space-y-3 rounded-2xl border border-white/10 bg-[#082238] p-4">
          <h2 className="flex items-center gap-2 font-black"><ShieldCheck size={18} /> Progress backup</h2>
          <p className="text-xs leading-relaxed text-white/55">Uninstalling the app may erase local progress. Export a code before changing devices. Codes can include saved photos: do not post them publicly.</p>
          <button type="button" onClick={makeCode} className="w-full rounded-xl bg-cyan-500 px-4 py-3 text-sm font-bold text-[#00131f]">Export progress code</button>
          {code && <><textarea aria-label="Exported progress code" readOnly rows={4} value={code} className="w-full resize-y rounded-lg bg-black/40 p-3 text-xs text-white" /><button type="button" onClick={() => navigator.clipboard?.writeText(code).then(() => setStatus("Copied to clipboard")).catch(() => setError("Copy unavailable. Select the code manually."))} className="flex items-center gap-2 text-xs text-cyan-200"><Copy size={14} /> Copy code</button></>}
          <label htmlFor="progress-import" className="block pt-3 text-sm font-bold">Import progress code</label>
          <textarea id="progress-import" value={incoming} onChange={(e) => { setIncoming(e.target.value); setPending(null); }} rows={4} placeholder="Paste a code starting with SV1." className="w-full resize-y rounded-lg bg-black/40 p-3 text-xs text-white" />
          <button type="button" onClick={prepareImport} disabled={!incoming.trim()} className="w-full rounded-xl border border-cyan-400/50 px-4 py-3 text-sm font-bold disabled:opacity-40">Validate code</button>
          {pending && <div className="space-y-3 rounded-xl border border-orange-300/40 bg-orange-900/20 p-3 text-xs"><p>This validated backup contains {Object.keys(pending).length} saved keys. Importing will overwrite ALL existing SortVerse progress, achievements, avatar and records. This cannot be undone unless you exported your current progress.</p><div className="flex gap-2"><button type="button" onClick={() => setPending(null)} className="flex-1 rounded-lg border border-white/20 p-3">Cancel</button><button type="button" onClick={confirmImport} className="flex-1 rounded-lg bg-orange-400 p-3 font-black text-black">Confirm overwrite</button></div></div>}
          {error && <p role="alert" className="text-xs text-red-300">{error}</p>}
          {status && <p role="status" className="text-xs text-cyan-200">{status}</p>}
        </section>
      </div>
    </main>
  );
}
