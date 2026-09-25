"use client";

import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";

type OutputFormat = "image/jpeg" | "image/png" | "image/webp";

type ImageInfo = {
  width: number;
  height: number;
  size: number;
  type: string;
};

const MAX_FILE_SIZE = 50 * 1024 * 1024;

const formatLabels: Record<OutputFormat, string> = {
  "image/jpeg": "JPG",
  "image/png": "PNG",
  "image/webp": "WebP",
};

function formatBytes(bytes: number) {
  if (!bytes) return "0 KB";

  const units = ["Bytes", "KB", "MB", "GB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));

  return `${(bytes / Math.pow(1024, index)).toFixed(
    index === 0 ? 0 : 2
  )} ${units[index]}`;
}

function getExtension(format: OutputFormat) {
  if (format === "image/png") return "png";
  if (format === "image/webp") return "webp";
  return "jpg";
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image."));

    img.src = src;
  });
}

export default function ResizeImagePage() {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [outputPreview, setOutputPreview] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");

  const [originalInfo, setOriginalInfo] = useState<ImageInfo | null>(null);
  const [outputInfo, setOutputInfo] = useState<ImageInfo | null>(null);

  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);

  const [keepRatio, setKeepRatio] = useState(true);
  const [percentage, setPercentage] = useState(100);

  const [format, setFormat] = useState<OutputFormat>("image/jpeg");
  const [quality, setQuality] = useState(92);

  const [targetSize, setTargetSize] = useState("");
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");

  const clearOutput = () => {
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
    }

    if (outputPreview && outputPreview !== downloadUrl) {
      URL.revokeObjectURL(outputPreview);
    }

    setDownloadUrl("");
    setOutputPreview("");
    setOutputInfo(null);
  };

  useEffect(() => {
  return () => {
    if (preview) URL.revokeObjectURL(preview);
  };
}, [preview]);

  const handleFile = async (selected: File) => {
    setError("");
    clearOutput();

    if (!selected.type.startsWith("image/")) {
      setError("Please choose a valid image file.");
      return;
    }

    if (selected.size > MAX_FILE_SIZE) {
      setError("This image is larger than 50 MB. Please choose a smaller file.");
      return;
    }

    try {
      const objectUrl = URL.createObjectURL(selected);
      const img = await loadImage(objectUrl);

      setFile(selected);
      setPreview(objectUrl);

      const info: ImageInfo = {
        width: img.naturalWidth,
        height: img.naturalHeight,
        size: selected.size,
        type: selected.type,
      };

      setOriginalInfo(info);
      setWidth(img.naturalWidth);
      setHeight(img.naturalHeight);
      setPercentage(100);
    } catch {
      setError("We could not read this image. Please try another file.");
    }
  };

  const handleFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];

    if (selected) {
      handleFile(selected);
    }
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);

    const droppedFile = event.dataTransfer.files?.[0];

    if (droppedFile) {
      handleFile(droppedFile);
    }
  };

  const changeWidth = (value: number) => {
    if (!Number.isFinite(value) || value < 1) return;

    setWidth(value);

    if (keepRatio && originalInfo) {
      const newHeight = Math.round(
        (value / originalInfo.width) * originalInfo.height
      );

      setHeight(Math.max(1, newHeight));
    }

    if (originalInfo) {
      setPercentage(
        Math.round((value / originalInfo.width) * 100 * 10) / 10
      );
    }

    clearOutput();
  };

  const changeHeight = (value: number) => {
    if (!Number.isFinite(value) || value < 1) return;

    setHeight(value);

    if (keepRatio && originalInfo) {
      const newWidth = Math.round(
        (value / originalInfo.height) * originalInfo.width
      );

      setWidth(Math.max(1, newWidth));
    }

    if (originalInfo) {
      setPercentage(
        Math.round((value / originalInfo.height) * 100 * 10) / 10
      );
    }

    clearOutput();
  };

  const changePercentage = (value: number) => {
    if (!originalInfo) return;
    if (!Number.isFinite(value) || value <= 0) return;

    const newWidth = Math.max(
      1,
      Math.round(originalInfo.width * (value / 100))
    );

    const newHeight = Math.max(
      1,
      Math.round(originalInfo.height * (value / 100))
    );

    setPercentage(value);
    setWidth(newWidth);
    setHeight(newHeight);

    clearOutput();
  };

  const resizeImage = async () => {
    if (!file || !preview) {
      setError("Please choose an image first.");
      return;
    }

    if (width < 1 || height < 1) {
      setError("Width and height must be greater than 0.");
      return;
    }

    if (width > 12000 || height > 12000) {
      setError("For browser safety, maximum output dimension is 12,000 px.");
      return;
    }

    setIsResizing(true);
    setError("");
    clearOutput();

    try {
      const img = await loadImage(preview);

      const canvas = document.createElement("canvas");
      canvas.width = Math.round(width);
      canvas.height = Math.round(height);

      const ctx = canvas.getContext("2d", {
        alpha: format !== "image/jpeg",
      });

      if (!ctx) {
        throw new Error("Canvas is not supported by this browser.");
      }

      if (format === "image/jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const requestedTargetKB = Number(targetSize);
      const requestedTargetBytes =
        requestedTargetKB > 0 ? requestedTargetKB * 1024 : 0;

      let currentQuality = Math.max(10, Math.min(100, quality));
      let blob: Blob | null = null;

      const createBlob = (q: number) =>
        new Promise<Blob | null>((resolve) => {
          const qualityValue =
            format === "image/png" ? undefined : q / 100;

          canvas.toBlob(
            (result) => resolve(result),
            format,
            qualityValue
          );
        });

      blob = await createBlob(currentQuality);

      if (requestedTargetBytes && format !== "image/png") {
        for (let i = 0; i < 7; i++) {
          if (!blob) break;
          if (blob.size <= requestedTargetBytes) break;

          currentQuality = Math.max(10, currentQuality - 10);
          blob = await createBlob(currentQuality);
        }
      }

      if (!blob) {
        throw new Error("The browser could not create the resized image.");
      }

      const url = URL.createObjectURL(blob);

      setDownloadUrl(url);
      setOutputPreview(url);

      setOutputInfo({
        width: canvas.width,
        height: canvas.height,
        size: blob.size,
        type: format,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while resizing the image."
      );
    } finally {
      setIsResizing(false);
    }
  };

  const chooseAnotherImage = () => {
    clearOutput();

    setFile(null);
    setPreview("");
    setOriginalInfo(null);
    setOutputInfo(null);
    setError("");
    setWidth(800);
    setHeight(600);
    setPercentage(100);
    setTargetSize("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center">
          <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600">
            🖼️ Image Tool
          </span>

          <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
            Resize Image
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
            Resize your image to the exact dimensions you need — quickly,
            simply and privately.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-auto mt-8 max-w-4xl rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* Upload */}
        {!file ? (
          <label
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`mx-auto mt-10 flex max-w-4xl cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 py-16 text-center transition sm:py-20 ${
              isDragging
                ? "border-violet-500 bg-violet-50"
                : "border-blue-300 bg-white hover:border-violet-400 hover:bg-blue-50/30"
            }`}
          >
            <div className="text-5xl">⬆️</div>

            <h2 className="mt-5 text-2xl font-bold text-slate-900">
              Upload your image
            </h2>

            <p className="mt-2 max-w-lg text-slate-500">
              Drag & drop your image here or choose a file from your device.
            </p>

            <span className="mt-6 rounded-xl bg-slate-950 px-7 py-3 font-semibold text-white shadow-sm">
              Choose Image
            </span>

            <p className="mt-4 text-xs text-slate-400">
              JPG, JPEG, PNG, WebP and other browser-supported formats
              <br />
              Maximum file size: 50 MB
            </p>

            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileInput}
            />
          </label>
        ) : (
          <>
            {/* Main workspace */}
            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              {/* Original */}
              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-xl font-bold text-slate-900">
                    Original Image
                  </h2>

                  {originalInfo && (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {formatBytes(originalInfo.size)}
                    </span>
                  )}
                </div>

                <div className="mt-5 flex min-h-[280px] items-center justify-center overflow-hidden rounded-2xl bg-slate-100 p-3">
                  <img
                    src={preview}
                    alt="Original image"
                    className="max-h-[480px] max-w-full rounded-xl object-contain"
                  />
                </div>

                {originalInfo && (
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">Width</p>
                      <p className="mt-1 font-bold text-slate-900">
                        {originalInfo.width}px
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">Height</p>
                      <p className="mt-1 font-bold text-slate-900">
                        {originalInfo.height}px
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Settings */}
              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
                <h2 className="text-2xl font-bold text-slate-900">
                  Resize Settings
                </h2>

                {/* Percentage */}
                <label className="mt-6 block text-sm font-semibold text-slate-800">
                  Scale (%)
                </label>

                <div className="mt-2 flex gap-3">
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={percentage}
                    onChange={(e) =>
                      changePercentage(Number(e.target.value))
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                  />

                  <span className="flex items-center rounded-xl bg-slate-100 px-4 font-bold text-slate-600">
                    %
                  </span>
                </div>

                {/* Width */}
                <label className="mt-5 block text-sm font-semibold text-slate-800">
                  Width (px)
                </label>

                <input
                  type="number"
                  min="1"
                  max="12000"
                  value={width}
                  onChange={(e) => changeWidth(Number(e.target.value))}
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                />

                {/* Height */}
                <label className="mt-5 block text-sm font-semibold text-slate-800">
                  Height (px)
                </label>

                <input
                  type="number"
                  min="1"
                  max="12000"
                  value={height}
                  onChange={(e) => changeHeight(Number(e.target.value))}
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                />

                {/* Ratio */}
                <label className="mt-5 flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={keepRatio}
                    onChange={(e) => {
                      setKeepRatio(e.target.checked);
                      clearOutput();
                    }}
                    className="h-4 w-4"
                  />

                  <span className="text-sm font-medium text-slate-700">
                    Maintain aspect ratio
                  </span>
                </label>

                {/* Format */}
                <label className="mt-6 block text-sm font-semibold text-slate-800">
                  Output Format
                </label>

                <select
                  value={format}
                  onChange={(e) => {
                    setFormat(e.target.value as OutputFormat);
                    clearOutput();
                  }}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                >
                  <option value="image/jpeg">JPG</option>
                  <option value="image/png">PNG</option>
                  <option value="image/webp">WebP</option>
                </select>

                {/* Quality */}
                <label className="mt-5 flex items-center justify-between text-sm font-semibold text-slate-800">
                  <span>Quality</span>
                  <span className="rounded-full bg-violet-50 px-3 py-1 text-violet-700">
                    {quality}%
                  </span>
                </label>

                <input
                  type="range"
                  min="10"
                  max="100"
                  value={quality}
                  disabled={format === "image/png"}
                  onChange={(e) => {
                    setQuality(Number(e.target.value));
                    clearOutput();
                  }}
                  className="mt-3 w-full"
                />

                {format === "image/png" && (
                  <p className="mt-2 text-xs text-slate-500">
                    PNG is lossless, so the quality slider does not affect PNG
                    output.
                  </p>
                )}

                {/* Target size */}
                <label className="mt-5 block text-sm font-semibold text-slate-800">
                  Target File Size (optional)
                </label>

                <div className="mt-2 flex gap-3">
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 200"
                    value={targetSize}
                    onChange={(e) => {
                      setTargetSize(e.target.value);
                      clearOutput();
                    }}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                  />

                  <span className="flex items-center rounded-xl bg-slate-100 px-4 text-sm font-bold text-slate-600">
                    KB
                  </span>
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  Best-effort target for JPG/WebP output.
                </p>

                {/* Resize button */}
                <button
                  onClick={resizeImage}
                  disabled={isResizing}
                  className="mt-7 w-full rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-6 py-4 font-bold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isResizing ? "Resizing..." : "Resize Image"}
                </button>

                {/* Download */}
                {downloadUrl && (
                  <a
                    href={downloadUrl}
                    download={`veexora-resized-image.${getExtension(format)}`}
                    className="mt-4 block rounded-xl bg-slate-950 px-6 py-4 text-center font-bold text-white transition hover:bg-slate-800"
                  >
                    Download Resized Image ↓
                  </a>
                )}

                <button
                  onClick={chooseAnotherImage}
                  className="mt-3 w-full rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Choose Another Image
                </button>
              </div>
            </div>

            {/* Output */}
            {outputInfo && outputPreview && (
              <div className="mt-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      Resized Result
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      {outputInfo.width} × {outputInfo.height}px ·{" "}
                      {formatLabels[format]} · {formatBytes(outputInfo.size)}
                    </p>
                  </div>

                  <span className="w-fit rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
                    Ready to download
                  </span>
                </div>

                <div className="mt-5 flex min-h-[260px] items-center justify-center overflow-hidden rounded-2xl bg-slate-100 p-4">
                  <img
                    src={outputPreview}
                    alt="Resized result"
                    className="max-h-[500px] max-w-full rounded-xl object-contain"
                  />
                </div>
              </div>
            )}
          </>
        )}

        {/* Privacy note */}
        <div className="mx-auto mt-8 max-w-4xl rounded-2xl border border-slate-200 bg-white p-5 text-center text-sm text-slate-500">
          🔒 Your image is processed locally in your browser in this version.
          It is not uploaded to our server.
        </div>
      </div>
    </main>
  );
}