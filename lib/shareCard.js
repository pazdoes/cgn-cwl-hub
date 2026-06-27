/**
 * shareCard.js
 * Snapshots a DOM element with html2canvas, writes image to clipboard,
 * then opens OS share sheet (mobile) or triggers download (desktop).
 *
 * Usage:
 *   import { shareCard } from "@/lib/shareCard";
 *   await shareCard(ref.current, "cgn-card.png");
 *
 * Returns { shared, copied, downloaded }
 */
export async function shareCard(element, filename = "cgn-card.png") {
  const html2canvas = (await import("html2canvas")).default;

  const canvas = await html2canvas(element, {
    backgroundColor: "#070b17",
    scale: 3,
    useCORS: true,
    allowTaint: true,
    logging: false,
    removeContainer: true,
    foreignObjectRendering: false,
  });

  const dataUrl = canvas.toDataURL("image/png");
  const blob = await (await fetch(dataUrl)).blob();

  // ── 1. Write image to clipboard ──
  // Pass a Promise<Blob> to ClipboardItem — required on iOS 16+ and
  // some Android Chrome versions; passing a resolved blob fails silently.
  let copied = false;
  try {
    if (navigator.clipboard?.write) {
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": Promise.resolve(blob) }),
      ]);
      copied = true;
    }
  } catch (_) {
    // Clipboard write denied or unsupported — non-fatal
  }

  // ── 2. Share sheet (mobile) — image file only, no title/url ──
  // Passing title or url causes iOS share sheet "Copy" to copy the
  // string instead of the image. Files-only share forces image copy.
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
