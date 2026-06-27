/**
 * shareCard.js
 * Snapshots a DOM element to canvas using html2canvas,
 * then triggers download or Web Share API on mobile.
 *
 * Usage:
 *   import { shareCard } from "@/lib/shareCard";
 *   await shareCard(ref.current, "cgn-player-card.png");
 */

export async function shareCard(element, filename = "cgn-card.png") {
  // Dynamically import html2canvas so it never bloats the initial bundle
  const html2canvas = (await import("html2canvas")).default;

  const canvas = await html2canvas(element, {
    backgroundColor: "#070b17",
    scale: 2,                   // 2× for retina sharpness
    useCORS: true,              // allow TH icon images
    logging: false,
    removeContainer: true,
  });

  const dataUrl = canvas.toDataURL("image/png");

  // Web Share API — works on mobile (Discord, WhatsApp, etc.)
  if (navigator.canShare) {
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], filename, { type: "image/png" });
    if (navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: "CGN CWL Hub" });
        return;
      } catch (e) {
        // User cancelled — fall through to download
        if (e.name === "AbortError") return;
      }
    }
  }

  // Desktop fallback — trigger download
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}
