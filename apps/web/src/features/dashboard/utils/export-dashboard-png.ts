import { toPng } from "html-to-image";
import {
  downloadDataUrl,
  stampFilename,
} from "@/features/dashboard/utils/export-download";

export type ExportPngOptions = {
  filenamePrefix: string;
  /** Extra bottom/right padding captured in the PNG. */
  pixelRatio?: number;
};

/** Capture a DOM node (dashboard content) as a PNG download. */
export async function exportElementAsPng(
  element: HTMLElement,
  options: ExportPngOptions,
) {
  const dataUrl = await toPng(element, {
    cacheBust: true,
    pixelRatio: options.pixelRatio ?? 2,
    backgroundColor: getComputedStyle(document.body).backgroundColor || "#ffffff",
    filter: (node) => {
      if (!(node instanceof HTMLElement)) return true;
      // Skip interactive chrome that shouldn't appear in the snapshot.
      return !node.dataset.exportIgnore;
    },
  });

  downloadDataUrl(dataUrl, stampFilename(options.filenamePrefix, "png"));
}
