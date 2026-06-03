"use client";

import * as React from "react";

const BOX = 288;
const OUTPUT = 512;

export function LogoCropper({
  src,
  onCancel,
  onConfirm,
}: {
  src: string;
  onCancel: () => void;
  onConfirm: (dataUrl: string) => void;
}) {
  const [natural, setNatural] = React.useState<{ w: number; h: number } | null>(null);
  const [scale, setScale] = React.useState(1);
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });
  const dragRef = React.useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  React.useEffect(() => {
    const img = new Image();
    img.onload = () => setNatural({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = src;
  }, [src]);

  const baseScale = natural ? Math.min(BOX / natural.w, BOX / natural.h) : 1;
  const aspect = natural ? Math.max(natural.w, natural.h) / Math.min(natural.w, natural.h) : 1;
  const maxScale = Math.max(3, aspect + 0.5);
  const dispW = natural ? natural.w * baseScale * scale : BOX;
  const dispH = natural ? natural.h * baseScale * scale : BOX;

  const clamp = React.useCallback(
    (o: { x: number; y: number }) => ({
      x: dispW <= BOX ? (BOX - dispW) / 2 : Math.min(0, Math.max(BOX - dispW, o.x)),
      y: dispH <= BOX ? (BOX - dispH) / 2 : Math.min(0, Math.max(BOX - dispH, o.y)),
    }),
    [dispW, dispH],
  );

  React.useEffect(() => {
    if (!natural) return;
    setOffset({
      x: (BOX - natural.w * baseScale) / 2,
      y: (BOX - natural.h * baseScale) / 2,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [natural]);

  React.useEffect(() => {
    setOffset((prev) => clamp(prev));
  }, [scale, clamp]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    setOffset(clamp({ x: dragRef.current.ox + dx, y: dragRef.current.oy + dy }));
  };

  const handlePointerUp = () => {
    dragRef.current = null;
  };

  const handleApply = () => {
    if (!natural) return;
    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT;
    canvas.height = OUTPUT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    img.onload = () => {
      const totalScale = baseScale * scale;
      const srcX = -offset.x / totalScale;
      const srcY = -offset.y / totalScale;
      const srcSize = BOX / totalScale;
      ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, OUTPUT, OUTPUT);
      onConfirm(canvas.toDataURL("image/png"));
    };
    img.src = src;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Position your logo"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-background p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-base font-semibold">Position your logo</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Your whole logo fits at the lowest zoom. Zoom in and drag to crop closer.
        </p>
        <div className="mt-4 flex justify-center">
          <div
            className="relative cursor-grab touch-none select-none overflow-hidden rounded-full bg-secondary active:cursor-grabbing"
            style={{ width: BOX, height: BOX }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            {natural ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt=""
                draggable={false}
                style={{
                  position: "absolute",
                  left: offset.x,
                  top: offset.y,
                  width: dispW,
                  height: dispH,
                  maxWidth: "none",
                }}
              />
            ) : null}
            <div className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-black/10" />
          </div>
        </div>
        <input
          type="range"
          min={1}
          max={maxScale}
          step={0.01}
          value={scale}
          onChange={(e) => setScale(Number(e.target.value))}
          aria-label="Zoom"
          className="mt-5 w-full cursor-pointer appearance-none bg-transparent [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:bg-primary [&::-moz-range-track]:h-1.5 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:border-none [&::-moz-range-track]:bg-muted-foreground/10 [&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:border-none [&::-webkit-slider-runnable-track]:bg-muted-foreground/10 [&::-webkit-slider-thumb]:-mt-[5px] [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
        />
        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={!natural}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
