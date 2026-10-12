"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isNative } from "@/lib/native";
import { setAppActive } from "@/lib/sound";
import { syncPageHistory } from "@/lib/pageHistory";
import { goToPreviousScreen } from "@/components/ScreenBackButton";

export default function NativeAppEvents() {
  const router = useRouter();
  useEffect(() => {
    const syncComfort = () => {
      for (const key of ["large", "contrast", "reduced", "low"]) {
        document.documentElement.classList.toggle(`sv-${key}`, window.localStorage.getItem(`sortverse-setting-${key}`) === "1");
      }
    };
    syncComfort();
    window.addEventListener("storage", syncComfort);
    window.addEventListener("sortverse-progress", syncComfort);
    return () => {
      window.removeEventListener("storage", syncComfort);
      window.removeEventListener("sortverse-progress", syncComfort);
    };
  }, []);
  useEffect(() => {
    syncPageHistory();
    const sync = () => syncPageHistory();
    window.addEventListener("popstate", sync);
    window.addEventListener("pageshow", sync);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("pageshow", sync);
    };
  }, []);
  useEffect(() => {
    if (!isNative()) return;
    document.documentElement.classList.add("native-device");
    let active = true;
    const listeners = [];
    async function setup() {
      try {
        const { App } = await import("@capacitor/app");
        const state = await App.addListener("appStateChange", ({ isActive }) => setAppActive(isActive));
        if (!active) { state.remove(); return; }
        listeners.push(state);
        const back = await App.addListener("backButton", () => {
          const path = window.location.pathname.replace(/\/$/, "") || "/";
          if (path === "/gameplay") {
            window.dispatchEvent(new Event("sortverse-native-back"));
          } else if (path === "/") {
            if (window.confirm("Exit SortVerse 3D?")) App.exitApp();
          } else {
            const fallback = {
              "/skins": "/profile",
              "/trophies": "/profile",
              "/settings": "/profile",
              "/journey": "/levels",
              "/special": "/journey",
            }[path] || "/";
            goToPreviousScreen(router, fallback);
          }
        });
        if (!active) { back.remove(); return; }
        listeners.push(back);
      } catch (err) { console.warn("Native lifecycle listeners unavailable", err); }
    }
    setup();
    return () => { active = false; listeners.forEach((h) => h.remove()); setAppActive(true); document.documentElement.classList.remove("native-device"); };
  }, [router]);
  return null;
}
