import type {
  BackgroundState,
  CanvasElement,
  AspectRatio,
} from "../components/CanvasEditor";
export const getCanvasDimensions = (aspectRatio: AspectRatio) => {
  const [w, h] = aspectRatio.split(":").map(Number);
  return { width: Math.round((800 * w) / h), height: 800 };
};
export const deleteLayers = (elements: CanvasElement[], ids: string[]) =>
  elements.filter((e) => !ids.includes(e.id));
export const isEditableTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (!!target.closest("input,textarea,select") || target.isContentEditable);
const loadImage = (url: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error("Could not load an image for export."));
    image.src = url;
  });
export const wrapText = (
  text: string,
  width: number,
  measure: (s: string) => number,
): string[] => {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/)) {
      const candidate = line ? `${line} ${word}` : word;
      if (line && measure(candidate) > width) {
        lines.push(line);
        line = word;
      } else line = candidate;
      if (measure(line) > width) {
        let piece = "";
        for (const letter of line) {
          if (piece && measure(piece + letter) > width) {
            lines.push(piece);
            piece = "";
          }
          piece += letter;
        }
        line = piece;
      }
    }
    lines.push(line);
  }
  return lines;
};
const gradient = (
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  width: number,
  height: number,
) => {
  const horizontal = /to right/.test(value);
  const vertical = /to bottom/.test(value);
  const g = ctx.createLinearGradient(
    x,
    y,
    x + (vertical ? 0 : width),
    y + (horizontal ? 0 : height),
  );
  const colors = value.match(/#[a-fA-F0-9]{6}/g) ?? ["#ffffff", "#000000"];
  colors.forEach((c, i) =>
    g.addColorStop(i / Math.max(1, colors.length - 1), c),
  );
  return g;
};
export const renderCanvasDocument = async (
  aspect: AspectRatio,
  elements: CanvasElement[],
  bg: BackgroundState,
) => {
  const dims = getCanvasDimensions(aspect);
  const canvas = document.createElement("canvas");
  canvas.width = dims.width;
  canvas.height = dims.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas export is unavailable.");
  await Promise.all(
    elements
      .filter((e) => e.type === "text" || e.type === "cta")
      .map((e) =>
        document.fonts.load(
          `${e.style.fontStyle ?? "normal"} ${e.style.fontWeight ?? "normal"} ${e.style.fontSize ?? 16}px "${e.style.fontFamily ?? "Inter"}"`,
        ),
      ),
  );
  await document.fonts.ready;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, dims.width, dims.height);
  if (bg.type === "image") {
    const img = await loadImage(bg.value);
    ctx.save();
    ctx.globalAlpha = bg.opacity;
    ctx.translate(dims.width / 2 + (bg.x ?? 0), dims.height / 2 + (bg.y ?? 0));
    ctx.scale(bg.scale ?? 1, bg.scale ?? 1);
    const scale = Math.max(dims.width / img.width, dims.height / img.height);
    ctx.drawImage(
      img,
      (-img.width * scale) / 2,
      (-img.height * scale) / 2,
      img.width * scale,
      img.height * scale,
    );
    ctx.restore();
  } else {
    ctx.save();
    ctx.globalAlpha = bg.opacity ?? 1;
    ctx.fillStyle =
      bg.type === "gradient"
        ? gradient(ctx, bg.value, 0, 0, dims.width, dims.height)
        : bg.value;
    ctx.fillRect(0, 0, dims.width, dims.height);
    ctx.restore();
  }
  for (const el of [...elements].sort(
    (a, b) => a.style.zIndex - b.style.zIndex,
  )) {
    ctx.save();
    const cx = el.x + el.width / 2,
      cy = el.y + el.height / 2;
    ctx.translate(cx, cy);
    ctx.rotate((el.rotation * Math.PI) / 180);
    ctx.scale(el.scaleX ?? 1, el.scaleY ?? 1);
    ctx.translate(-cx, -cy);
    ctx.globalAlpha = el.style.opacity ?? 1;
    if (el.type === "image" || el.type === "logo") {
      ctx.drawImage(
        await loadImage(el.content),
        el.x,
        el.y,
        el.width,
        el.height,
      );
    } else {
      if (el.style.backgroundColor || el.type === "shape") {
        ctx.fillStyle = el.style.backgroundColor ?? el.content;
        ctx.beginPath();
        ctx.roundRect(
          el.x,
          el.y,
          el.width,
          el.height,
          Math.min(el.style.borderRadius ?? 0, el.width / 2, el.height / 2),
        );
        ctx.fill();
      }
      if (el.type === "text" || el.type === "cta") {
        const fs = el.style.fontSize ?? 16;
        ctx.font = `${el.style.fontStyle ?? "normal"} ${el.style.fontWeight ?? "normal"} ${fs}px "${el.style.fontFamily ?? "Inter"}"`;
        const spacing = el.style.letterSpacing ?? 0;
        const measure = (text: string) =>
          ctx.measureText(text).width + Math.max(0, text.length - 1) * spacing;
        const padding = el.style.padding ?? 4;
        const lines = wrapText(
          el.content,
          Math.max(1, el.width - 2 * padding),
          measure,
        );
        const lineHeight = fs * (el.style.lineHeight ?? 1.2);
        ctx.fillStyle = el.style.gradient
          ? gradient(ctx, el.style.gradient, el.x, el.y, el.width, el.height)
          : (el.style.color ?? "#ffffff");
        ctx.textBaseline = "middle";
        for (const [index, line] of lines.entries()) {
          const width = measure(line);
          let x = el.x + padding;
          if (el.style.textAlign === "center")
            x = el.x + (el.width - width) / 2;
          else if (el.style.textAlign === "right")
            x = el.x + el.width - padding - width;
          const y =
            el.y +
            el.height / 2 +
            (index - (lines.length - 1) / 2) * lineHeight;
          const startX = x;
          if (!spacing) ctx.fillText(line, x, y);
          else
            for (let i = 0; i < line.length; i++)
              ctx.fillText(
                line[i],
                startX + ctx.measureText(line.slice(0, i)).width + i * spacing,
                y,
              );
          if (el.style.textDecoration === "underline") {
            ctx.fillRect(startX, y + fs * 0.4, width, Math.max(1, fs / 16));
          }
        }
      }
    }
    ctx.restore();
  }
  return canvas.toDataURL("image/png");
};
