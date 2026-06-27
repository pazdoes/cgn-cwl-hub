/**
 * shareCard.js
 * Snapshots a DOM element to canvas using html2canvas,
 * then triggers download or Web Share API on mobile.
 *
 * Usage:
 *   import { shareCard } from "@/lib/shareCard";
 *   await shareCard(ref.current, "cgn-player-card.png");
 */

/**
 * shareCard(element, filename)
 * 1. Snapshots the element with html2canvas
 * 2. Writes the image to the clipboard (so "Paste" works anywhere immediately)
 * 3. Opens the OS share sheet with the image file (mobile)
 *    OR triggers a download (desktop fallback)
 *
 * Returns { shared, copied, downloaded } so the caller can show feedback.
 */
export async function shareCard(element, filename = "cgn-card.png") {
  const html2canvas = (await import("html2canvas")).default;

  const canvas = await html2canvas(element, {
    backgroundColor: "#070b17",
    scale: 3,
    useCORS: true,
    logging: false,
    removeContainer: true,
  });

  const dataUrl = canvas.toDataURL("image/png");
  const blob = await (await fetch(dataUrl)).blob();

  // ── 1. Write to clipboard so paste works immediately everywhere ──
  let copied = false;
  try {
    if (navigator.clipboard?.write) {
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      copied = true;
    }
  } catch (_) {
    // Clipboard write denied or unsupported — non-fatal
  }

  // ── 2. Share sheet (mobile) ──
  const file = new File([blob], filename, { type: "image/png" });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return { shared: true, copied, downloaded: false };
    } catch (e) {
      if (e.name === "AbortError") return { shared: false, copied, downloaded: false };
    }
  }

  // ── 3. Desktop fallback — download ──
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
  return { shared: false, copied, downloaded: true };
}
