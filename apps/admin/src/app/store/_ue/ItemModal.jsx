"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LuCamera as Camera, LuChevronDown as ChevronDown, LuPlus as Plus, LuUpload as Upload, LuX as X } from "react-icons/lu";
import { IoFastFoodOutline } from "react-icons/io5";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function ItemModal({ cats, initialCat, initial, mode = "add", onSubmit, onClose }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [desc, setDesc] = useState(initial?.desc ?? "");
  const [price, setPrice] = useState(
    initial?.price != null ? String(initial.price) : "",
  );
  const [prepTime, setPrepTime] = useState(
    initial?.prepTimeMinutes != null ? String(initial.prepTimeMinutes) : "",
  );
  const [category, setCategory] = useState(initialCat);
  const [customCat, setCustomCat] = useState(false);
  const [image, setImage] = useState(initial?.imageUrl ?? null);
  const [pendingImage, setPendingImage] = useState(null);
  const [imageBusy, setImageBusy] = useState(false);
  const [imageErr, setImageErr] = useState(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const cameraInputRef = useRef(null);
  const uploadInputRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, submitting]);

  const submit = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    const trimmedDesc = desc.trim();
    const parsedPrice = parseFloat(price);
    const parsedPrep = parseInt(prepTime, 10);
    if (!trimmed || !trimmedDesc || !category) return;
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) return;
    if (!Number.isFinite(parsedPrep) || parsedPrep < 0) return;
    setSubmitting(true);
    setErr(null);
    try {
      await onSubmit({
        name: trimmed,
        desc: trimmedDesc,
        price: parsedPrice,
        category,
        prepTimeMinutes: parsedPrep,
        imageUrl: image,
      });
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  const isEdit = mode === "edit";
  if (typeof document === "undefined") return null;

  const hasCats = cats && cats.length > 0;

  const pickFromCamera = () => {
    if (submitting || imageBusy) return;
    setImageErr(null);
    if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
      setCameraOpen(true);
    } else {
      cameraInputRef.current?.click();
    }
  };

  const pickFromFiles = () => {
    if (submitting || imageBusy) return;
    uploadInputRef.current?.click();
  };

  const onFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setImageErr("Please choose an image file.");
      return;
    }
    setImageBusy(true);
    setImageErr(null);
    try {
      const dataUrl = await compressImage(file);
      setPendingImage(dataUrl);
    } catch {
      setImageErr("Could not read that image.");
    } finally {
      setImageBusy(false);
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="item-modal-title"
      className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center"
    >
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-foreground/30"
        onClick={submitting ? undefined : onClose}
      />
      <form
        onSubmit={submit}
        className="relative flex max-h-[calc(100vh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-border bg-card text-foreground shadow-lg"
      >
        <div className="flex items-center justify-between gap-3 px-6 pt-5 pb-4">
          <h3 id="item-modal-title" className="text-base font-semibold tracking-tight">
            {isEdit ? "Edit Menu Item" : "Add Menu Item"}
          </h3>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            disabled={submitting}
            className="inline-grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto px-6 pb-2">
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">Photo</span>
            <div className="flex flex-col items-start gap-3">
              {image ? (
                <img
                  src={image}
                  alt=""
                  className="h-24 w-24 rounded-lg border border-border object-cover"
                />
              ) : (
                <div
                  aria-hidden="true"
                  className="flex h-24 w-24 items-center justify-center rounded-lg border border-dashed border-border"
                  style={{ background: "#f3f4f6", color: "#9ca3af" }}
                >
                  <IoFastFoodOutline size={32} />
                </div>
              )}
              {imageBusy ? (
                <span className="text-sm text-muted-foreground">Processing…</span>
              ) : (
                <div className="flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={pickFromCamera}
                    disabled={submitting}
                    className="inline-flex items-center gap-1.5 text-xs text-foreground transition-colors hover:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    Take photo
                  </button>
                  <button
                    type="button"
                    onClick={pickFromFiles}
                    disabled={submitting}
                    className="inline-flex items-center gap-1.5 text-xs text-foreground transition-colors hover:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Upload
                  </button>
                </div>
              )}
              {image ? (
                <button
                  type="button"
                  onClick={() => setImage(null)}
                  disabled={submitting || imageBusy}
                  className="text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                >
                  Remove
                </button>
              ) : null}
              {imageErr ? (
                <span className="text-xs text-destructive">{imageErr}</span>
              ) : null}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={onFileChange}
                className="hidden"
              />
              <input
                ref={uploadInputRef}
                type="file"
                accept="image/*"
                onChange={onFileChange}
                className="hidden"
              />
            </div>
          </div>

          <Field label="Name">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              disabled={submitting}
              className="border border-border bg-transparent text-sm font-normal focus-visible:ring-0"
            />
          </Field>

          <Field label="Description">
            <Textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Key ingredients, size, allergens"
              rows={2}
              className="min-h-[72px] border border-border bg-transparent text-sm font-normal focus-visible:ring-0"
              disabled={submitting}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Price (R)">
              <Input
                type="text"
                inputMode="decimal"
                value={price}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "" || /^\d*\.?\d{0,2}$/.test(v)) setPrice(v);
                }}
                placeholder="0.00"
                disabled={submitting}
                className="border border-border bg-transparent text-sm font-normal focus-visible:ring-0"
              />
            </Field>
            <Field label="Prep time (min)">
              <Input
                type="text"
                inputMode="numeric"
                value={prepTime}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "" || /^\d+$/.test(v)) setPrepTime(v);
                }}
                placeholder="0"
                disabled={submitting}
                className="border border-border bg-transparent text-sm font-normal focus-visible:ring-0"
              />
            </Field>
          </div>

          <Field label="Category">
            {hasCats && !customCat ? (
              <Select
                value={category}
                options={cats}
                onChange={setCategory}
                onCreateNew={() => {
                  setCategory("");
                  setCustomCat(true);
                }}
                disabled={submitting}
                placeholder="Select category"
              />
            ) : (
              <div className="flex flex-col gap-1.5">
                <Input
                  value={category ?? ""}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="New category name"
                  autoFocus={customCat}
                  disabled={submitting}
                  className="border border-border bg-transparent text-sm font-normal focus-visible:ring-0"
                />
                {hasCats && customCat ? (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomCat(false);
                      setCategory("");
                    }}
                    className="self-start text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Back to list
                  </button>
                ) : null}
              </div>
            )}
          </Field>

          {err && <p className="text-sm font-medium text-destructive">{err}</p>}
        </div>

        <div className="flex justify-end gap-2 px-6 pb-5 pt-4">
          <Button type="submit" variant="dark" disabled={submitting}>
            {submitting ? "Saving…" : isEdit ? "Save changes" : "Continue"}
          </Button>
        </div>
      </form>
      {cameraOpen ? (
        <CameraCapture
          onCapture={(dataUrl) => {
            setImage(dataUrl);
            setCameraOpen(false);
          }}
          onClose={() => setCameraOpen(false)}
          onFallback={() => {
            setCameraOpen(false);
            cameraInputRef.current?.click();
          }}
        />
      ) : null}
      {pendingImage ? (
        <PhotoCropper
          src={pendingImage}
          onCancel={() => setPendingImage(null)}
          onConfirm={(dataUrl) => {
            setImage(dataUrl);
            setPendingImage(null);
          }}
        />
      ) : null}
    </div>,
    document.body,
  );
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}

async function compressImage(file) {
  const maxDim = 1024;
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
  const img = await new Promise((resolve, reject) => {
    const i = new window.Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("image load failed"));
    i.src = dataUrl;
  });
  let { width, height } = img;
  if (width > maxDim || height > maxDim) {
    const ratio = Math.min(maxDim / width, maxDim / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", 0.85);
}

function CameraCapture({ onCapture, onClose, onFallback }) {
  const BOX = 320;
  const OUTPUT = 1024;
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);
  const [captured, setCaptured] = useState(null);
  const [natural, setNatural] = useState(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play().catch(() => {});
          setReady(true);
        }
      } catch (e) {
        if (cancelled) return;
        const name = e?.name ?? "";
        if (name === "NotAllowedError" || name === "SecurityError") {
          setError("Camera permission denied. You can upload a file instead.");
        } else if (name === "NotFoundError" || name === "OverconstrainedError") {
          setError("No camera available on this device.");
        } else {
          setError("Could not start the camera.");
        }
      }
    };
    start();
    return () => {
      cancelled = true;
      const stream = streamRef.current;
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      const video = videoRef.current;
      if (video) video.srcObject = null;
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  useEffect(() => {
    if (!captured) {
      setNatural(null);
      setScale(1);
      setOffset({ x: 0, y: 0 });
      return;
    }
    const img = new window.Image();
    img.onload = () => setNatural({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = captured;
  }, [captured]);

  const baseScale = natural ? Math.min(BOX / natural.w, BOX / natural.h) : 1;
  const aspect = natural ? Math.max(natural.w, natural.h) / Math.min(natural.w, natural.h) : 1;
  const maxScale = Math.max(3, aspect + 0.5);
  const dispW = natural ? natural.w * baseScale * scale : BOX;
  const dispH = natural ? natural.h * baseScale * scale : BOX;

  const clamp = (o) => ({
    x: dispW <= BOX ? (BOX - dispW) / 2 : Math.min(0, Math.max(BOX - dispW, o.x)),
    y: dispH <= BOX ? (BOX - dispH) / 2 : Math.min(0, Math.max(BOX - dispH, o.y)),
  });

  useEffect(() => {
    if (!natural) return;
    setOffset({
      x: (BOX - natural.w * baseScale) / 2,
      y: (BOX - natural.h * baseScale) / 2,
    });
  }, [natural, baseScale]);

  useEffect(() => {
    setOffset((prev) => clamp(prev));
  }, [scale]);

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  };
  const onPointerMove = (e) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    setOffset(clamp({ x: dragRef.current.ox + dx, y: dragRef.current.oy + dy }));
  };
  const onPointerUp = () => {
    dragRef.current = null;
  };

  const capture = () => {
    const video = videoRef.current;
    if (!video) return;
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (!vw || !vh) return;
    const maxDim = 1600;
    let w = vw;
    let h = vh;
    if (w > maxDim || h > maxDim) {
      const r = Math.min(maxDim / w, maxDim / h);
      w = Math.round(w * r);
      h = Math.round(h * r);
    }
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d").drawImage(video, 0, 0, w, h);
    setCaptured(canvas.toDataURL("image/jpeg", 0.92));
  };

  const usePhoto = () => {
    if (!natural || !captured) return;
    const totalScale = baseScale * scale;
    const srcX = -offset.x / totalScale;
    const srcY = -offset.y / totalScale;
    const srcSize = BOX / totalScale;
    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT;
    canvas.height = OUTPUT;
    const ctx = canvas.getContext("2d");
    const img = new window.Image();
    img.onload = () => {
      ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, OUTPUT, OUTPUT);
      onCapture(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.src = captured;
  };

  const retake = () => setCaptured(null);

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-black text-white">
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm font-medium">
          {captured ? "Adjust photo" : "Take a photo"}
        </span>
        <button
          type="button"
          aria-label="Close camera"
          onClick={onClose}
          className="inline-grid h-9 w-9 place-items-center rounded-full text-white/80 transition-colors hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        {error ? (
          <div className="flex max-w-xs flex-col items-center gap-3 px-6 text-center">
            <p className="text-sm text-white/80">{error}</p>
            <button
              type="button"
              onClick={onFallback}
              className="text-sm text-white underline-offset-2"
            >
              Choose a file
            </button>
          </div>
        ) : null}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={cn(
            "h-full w-full object-cover",
            (captured || error) && "hidden",
          )}
        />
        {!ready && !captured && !error ? (
          <span className="absolute text-sm text-white/70">Starting camera…</span>
        ) : null}
        {captured ? (
          <div
            className="relative cursor-grab touch-none select-none overflow-hidden rounded-lg bg-black/40 active:cursor-grabbing"
            style={{ width: BOX, height: BOX }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
          >
            {natural ? (
              <img
                src={captured}
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
            <div className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-white/30" />
          </div>
        ) : null}
      </div>
      {captured ? (
        <div className="flex flex-col gap-4 px-6 pb-8 pt-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setScale((s) => Math.max(1, s - 0.2))}
              disabled={!natural || scale <= 1}
              aria-label="Zoom out"
              className="inline-grid h-8 w-8 place-items-center rounded-full border border-solid border-white/40 bg-transparent text-white/80 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              −
            </button>
            <input
              type="range"
              min={1}
              max={maxScale}
              step={0.01}
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              aria-label="Zoom"
              className="flex-1 cursor-pointer appearance-none bg-transparent [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:bg-white [&::-moz-range-track]:h-1.5 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:border-none [&::-moz-range-track]:bg-white/20 [&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:border-none [&::-webkit-slider-runnable-track]:bg-white/20 [&::-webkit-slider-thumb]:-mt-[5px] [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
            />
            <button
              type="button"
              onClick={() => setScale((s) => Math.min(maxScale, s + 0.2))}
              disabled={!natural || scale >= maxScale}
              aria-label="Zoom in"
              className="inline-grid h-8 w-8 place-items-center rounded-full border border-solid border-white/40 bg-transparent text-white/80 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              +
            </button>
          </div>
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={retake}
              className="text-sm text-white/80 transition-colors hover:text-white"
            >
              Retake
            </button>
            <button
              type="button"
              onClick={usePhoto}
              disabled={!natural}
              className="rounded-full bg-white px-5 py-2 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Use photo
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center px-4 pb-8 pt-4">
          <button
            type="button"
            onClick={capture}
            disabled={!ready || !!error}
            aria-label="Capture photo"
            className="inline-grid h-16 w-16 place-items-center rounded-full border-4 border-solid border-white bg-white/10 transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="h-10 w-10 rounded-full bg-white" />
          </button>
        </div>
      )}
    </div>
  );
}

function PhotoCropper({ src, onCancel, onConfirm }) {
  const BOX = 320;
  const OUTPUT = 1024;
  const [natural, setNatural] = useState(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef(null);

  useEffect(() => {
    const img = new window.Image();
    img.onload = () => setNatural({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = src;
  }, [src]);

  const baseScale = natural ? Math.min(BOX / natural.w, BOX / natural.h) : 1;
  const aspect = natural ? Math.max(natural.w, natural.h) / Math.min(natural.w, natural.h) : 1;
  const maxScale = Math.max(3, aspect + 0.5);
  const dispW = natural ? natural.w * baseScale * scale : BOX;
  const dispH = natural ? natural.h * baseScale * scale : BOX;

  const clamp = (o) => ({
    x: dispW <= BOX ? (BOX - dispW) / 2 : Math.min(0, Math.max(BOX - dispW, o.x)),
    y: dispH <= BOX ? (BOX - dispH) / 2 : Math.min(0, Math.max(BOX - dispH, o.y)),
  });

  useEffect(() => {
    if (!natural) return;
    setOffset({
      x: (BOX - natural.w * baseScale) / 2,
      y: (BOX - natural.h * baseScale) / 2,
    });
  }, [natural, baseScale]);

  useEffect(() => {
    setOffset((prev) => clamp(prev));
  }, [scale]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCancel();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onCancel]);

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  };
  const onPointerMove = (e) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    setOffset(clamp({ x: dragRef.current.ox + dx, y: dragRef.current.oy + dy }));
  };
  const onPointerUp = () => {
    dragRef.current = null;
  };

  const apply = () => {
    if (!natural) return;
    const totalScale = baseScale * scale;
    const srcX = -offset.x / totalScale;
    const srcY = -offset.y / totalScale;
    const srcSize = BOX / totalScale;
    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT;
    canvas.height = OUTPUT;
    const ctx = canvas.getContext("2d");
    const img = new window.Image();
    img.onload = () => {
      ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, OUTPUT, OUTPUT);
      onConfirm(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.src = src;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Adjust photo"
      className="fixed inset-0 z-[80] flex items-end justify-center bg-foreground/40 p-4 sm:items-center"
    >
      <div className="relative flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-border bg-card text-foreground shadow-lg">
        <div className="flex items-center justify-between gap-3 px-6 pt-5 pb-4">
          <h3 className="text-base font-semibold tracking-tight">Adjust Photo</h3>
          <button
            type="button"
            aria-label="Close"
            onClick={onCancel}
            className="inline-grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-col items-center gap-4 px-6 pb-2">
          <div
            className="relative cursor-grab touch-none select-none overflow-hidden rounded-lg bg-secondary active:cursor-grabbing"
            style={{ width: BOX, height: BOX }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
          >
            {natural ? (
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
            <div className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-foreground/10" />
          </div>
          <div className="flex w-full items-center gap-3">
            <button
              type="button"
              onClick={() => setScale((s) => Math.max(1, s - 0.2))}
              disabled={!natural || scale <= 1}
              aria-label="Zoom out"
              className="inline-grid h-8 w-8 place-items-center rounded-full border border-solid border-border bg-transparent text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              −
            </button>
            <input
              type="range"
              min={1}
              max={maxScale}
              step={0.01}
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              aria-label="Zoom"
              className="flex-1 cursor-pointer appearance-none bg-transparent [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:bg-foreground [&::-moz-range-track]:h-1.5 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:border-none [&::-moz-range-track]:bg-muted-foreground/20 [&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:border-none [&::-webkit-slider-runnable-track]:bg-muted-foreground/20 [&::-webkit-slider-thumb]:-mt-[5px] [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground"
            />
            <button
              type="button"
              onClick={() => setScale((s) => Math.min(maxScale, s + 0.2))}
              disabled={!natural || scale >= maxScale}
              aria-label="Zoom in"
              className="inline-grid h-8 w-8 place-items-center rounded-full border border-solid border-border bg-transparent text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              +
            </button>
          </div>
          <p className="text-xs text-muted-foreground">Drag to reposition. Pinch or use the slider to zoom.</p>
        </div>
        <div className="flex justify-end gap-2 px-6 pb-5 pt-4">
          <Button type="button" variant="dark" onClick={apply} disabled={!natural}>
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
}

function Select({ value, options, onChange, onCreateNew, disabled, placeholder = "Select" }) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const measure = () => {
      const el = triggerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const gap = 6;
      const margin = 8;
      const desired = 256;
      const spaceBelow = window.innerHeight - r.bottom - gap - margin;
      const spaceAbove = r.top - gap - margin;
      if (spaceBelow >= Math.min(desired, 160) || spaceBelow >= spaceAbove) {
        setRect({
          top: r.bottom + gap,
          left: r.left,
          width: r.width,
          maxHeight: Math.max(120, Math.min(desired, spaceBelow)),
        });
      } else {
        const maxHeight = Math.max(120, Math.min(desired, spaceAbove));
        setRect({ top: r.top - gap - maxHeight, left: r.left, width: r.width, maxHeight });
      }
    };
    measure();
    const onDocClick = (e) => {
      if (triggerRef.current?.contains(e.target)) return;
      if (menuRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
      }
    };
    const close = () => setOpen(false);
    const onScroll = (e) => {
      if (menuRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey, true);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey, true);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "flex h-12 w-full items-center justify-between rounded-lg border border-solid border-border bg-transparent px-4 text-left text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        <span className={cn("truncate", !value && "text-muted-foreground")}>
          {value || placeholder}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180 text-foreground",
          )}
        />
      </button>
      {open && rect && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={menuRef}
              style={{
                position: "fixed",
                top: rect.top,
                left: rect.left,
                width: rect.width,
                maxHeight: rect.maxHeight,
                zIndex: 70,
              }}
              className="flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-lg"
            >
              <ul role="listbox" className="min-h-0 flex-1 overflow-y-auto p-1">
                {options.map((opt) => {
                  const selected = opt === value;
                  return (
                    <li
                      key={opt}
                      role="option"
                      aria-selected={selected}
                      onClick={() => {
                        onChange(opt);
                        setOpen(false);
                      }}
                      className={cn(
                        "flex h-10 cursor-pointer items-center rounded-md px-3 text-sm hover:bg-secondary",
                        selected && "bg-secondary font-medium",
                      )}
                    >
                      <span className="truncate">{opt}</span>
                    </li>
                  );
                })}
              </ul>
              {onCreateNew ? (
                <div className="shrink-0 border-t border-border px-3 py-2">
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      onCreateNew();
                    }}
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    New category
                  </button>
                </div>
              ) : null}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
