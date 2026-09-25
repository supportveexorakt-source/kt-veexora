"use client";

import {
  ChangeEvent,
  DragEvent,
  useEffect,
  useRef,
  useState,
} from "react";

type AspectRatio =
  | "free"
  | "1:1"
  | "4:3"
  | "3:4"
  | "16:9"
  | "9:16";

export default function CropImagePage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [resultUrl, setResultUrl] = useState("");

  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  const [rotation, setRotation] = useState(0);
  const [flipX, setFlipX] = useState(false);
  const [flipY, setFlipY] = useState(false);

  const [zoom, setZoom] = useState(1);
  const [aspectRatio, setAspectRatio] =
    useState<AspectRatio>("free");

  const [originalDimensions, setOriginalDimensions] = useState({
    width: 0,
    height: 0,
  });

  const [crop, setCrop] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  const previewUrlRef = useRef<string | null>(null);
  const resultUrlRef = useRef<string | null>(null);

  /* -----------------------------
     HELPERS
  ----------------------------- */

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getAspectValue = (ratio: AspectRatio) => {
    if (ratio === "1:1") return 1;
    if (ratio === "4:3") return 4 / 3;
    if (ratio === "3:4") return 3 / 4;
    if (ratio === "16:9") return 16 / 9;
    if (ratio === "9:16") return 9 / 16;

    return null;
  };

  const getImageDimensions = (
    imageFile: File
  ): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(imageFile);
      const image = new Image();

      image.onload = () => {
        resolve({
          width: image.naturalWidth,
          height: image.naturalHeight,
        });

        URL.revokeObjectURL(url);
      };

      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Could not read image."));
      };

      image.src = url;
    });
  };

  /* -----------------------------
     FILE HANDLING
  ----------------------------- */

  const handleFile = async (selectedFile: File) => {
    setError("");

    if (!selectedFile.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    if (selectedFile.size > 50 * 1024 * 1024) {
      setError("Maximum supported image size is 50 MB.");
      return;
    }

    try {
      const dimensions = await getImageDimensions(
        selectedFile
      );

      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }

      if (resultUrlRef.current) {
        URL.revokeObjectURL(resultUrlRef.current);
      }

      const objectUrl = URL.createObjectURL(
        selectedFile
      );

      previewUrlRef.current = objectUrl;
      resultUrlRef.current = null;

      setFile(selectedFile);
      setPreview(objectUrl);
      setResultUrl("");

      setOriginalDimensions(dimensions);

      setRotation(0);
      setFlipX(false);
      setFlipY(false);
      setZoom(1);
      setAspectRatio("free");

      setCrop({
        x: 0,
        y: 0,
        width: dimensions.width,
        height: dimensions.height,
      });
    } catch {
      setError(
        "Could not read this image. Please try another file."
      );
    }
  };

  const handleFileChange = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) return;

    await handleFile(selectedFile);

    event.target.value = "";
  };

  const handleDrop = async (
    event: DragEvent<HTMLLabelElement>
  ) => {
    event.preventDefault();
    setIsDragging(false);

    const droppedFile = event.dataTransfer.files?.[0];

    if (!droppedFile) return;

    await handleFile(droppedFile);
  };

  /* -----------------------------
     ASPECT RATIO
  ----------------------------- */

  const applyAspectRatio = (
    ratio: AspectRatio
  ) => {
    setAspectRatio(ratio);

    if (ratio === "free") {
      setCrop({
        x: 0,
        y: 0,
        width: originalDimensions.width,
        height: originalDimensions.height,
      });

      return;
    }

    const targetRatio = getAspectValue(ratio);

    if (!targetRatio) return;

    let width = originalDimensions.width;
    let height = width / targetRatio;

    if (height > originalDimensions.height) {
      height = originalDimensions.height;
      width = height * targetRatio;
    }

    width = Math.max(1, Math.round(width));
    height = Math.max(1, Math.round(height));

    setCrop({
      x: Math.round(
        (originalDimensions.width - width) / 2
      ),
      y: Math.round(
        (originalDimensions.height - height) / 2
      ),
      width,
      height,
    });
  };

  /* -----------------------------
     ROTATION
  ----------------------------- */

  const rotateLeft = () => {
    setRotation((current) => (current - 90 + 360) % 360);
  };

  const rotateRight = () => {
    setRotation((current) => (current + 90) % 360);
  };

  /* -----------------------------
     RESET EDITS
  ----------------------------- */

  const resetEdits = () => {
    setRotation(0);
    setFlipX(false);
    setFlipY(false);
    setZoom(1);
    setAspectRatio("free");

    setCrop({
      x: 0,
      y: 0,
      width: originalDimensions.width,
      height: originalDimensions.height,
    });

    setError("");
    setResultUrl("");

    if (resultUrlRef.current) {
      URL.revokeObjectURL(resultUrlRef.current);
      resultUrlRef.current = null;
    }
  };

  /* -----------------------------
     CREATE RESULT
  ----------------------------- */

  const applyChanges = async () => {
    if (!file) {
      setError("Please upload an image first.");
      return;
    }

    if (
      crop.width <= 0 ||
      crop.height <= 0
    ) {
      setError("Please select a valid crop area.");
      return;
    }

    setError("");
    setIsProcessing(true);

    try {
      const image = await createImageBitmap(file);

      const radians =
        (rotation * Math.PI) / 180;

      const rotatedWidth =
        rotation === 90 || rotation === 270
          ? crop.height
          : crop.width;

      const rotatedHeight =
        rotation === 90 || rotation === 270
          ? crop.width
          : crop.height;

      const canvas = document.createElement("canvas");

      canvas.width = Math.max(
        1,
        Math.round(rotatedWidth * zoom)
      );

      canvas.height = Math.max(
        1,
        Math.round(rotatedHeight * zoom)
      );

      const context = canvas.getContext("2d");

      if (!context) {
        image.close();
        throw new Error("Could not create canvas.");
      }

      context.save();

      context.translate(
        canvas.width / 2,
        canvas.height / 2
      );

      context.rotate(radians);

      context.scale(
        flipX ? -1 : 1,
        flipY ? -1 : 1
      );

      context.drawImage(
        image,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        -rotatedWidth * zoom / 2,
        -rotatedHeight * zoom / 2,
        rotatedWidth * zoom,
        rotatedHeight * zoom
      );

      context.restore();

      image.close();

      const mimeType =
        file.type === "image/png"
          ? "image/png"
          : file.type === "image/webp"
          ? "image/webp"
          : "image/jpeg";

      const blob = await new Promise<Blob | null>(
        (resolve) => {
          canvas.toBlob(
            resolve,
            mimeType,
            mimeType === "image/png" ? undefined : 0.95
          );
        }
      );

      if (!blob) {
        throw new Error(
          "Could not create edited image."
        );
      }

      if (resultUrlRef.current) {
        URL.revokeObjectURL(
          resultUrlRef.current
        );
      }

      const url = URL.createObjectURL(blob);

      resultUrlRef.current = url;

      setResultUrl(url);
    } catch (processingError) {
      console.error(processingError);

      setError(
        "Something went wrong while processing the image."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  /* -----------------------------
     DOWNLOAD
  ----------------------------- */

  const downloadImage = () => {
    if (!resultUrl || !file) return;

    const extension =
      file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
        ? "webp"
        : "jpg";

    const baseName = file.name.replace(
      /\.[^/.]+$/,
      ""
    );

    const link = document.createElement("a");

    link.href = resultUrl;
    link.download = `veexora-edited-${baseName}.${extension}`;

    document.body.appendChild(link);

    link.click();

    link.remove();
  };

  /* -----------------------------
     RESET TOOL
  ----------------------------- */

  const resetTool = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(
        previewUrlRef.current
      );
      previewUrlRef.current = null;
    }

    if (resultUrlRef.current) {
      URL.revokeObjectURL(
        resultUrlRef.current
      );
      resultUrlRef.current = null;
    }

    setFile(null);
    setPreview("");
    setResultUrl("");

    setOriginalDimensions({
      width: 0,
      height: 0,
    });

    setCrop({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    });

    setRotation(0);
    setFlipX(false);
    setFlipY(false);
    setZoom(1);
    setAspectRatio("free");

    setError("");
  };

  /* -----------------------------
     CLEANUP
  ----------------------------- */

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(
          previewUrlRef.current
        );
      }

      if (resultUrlRef.current) {
        URL.revokeObjectURL(
          resultUrlRef.current
        );
      }
    };
  }, []);

  /* -----------------------------
     UI
  ----------------------------- */

  return (
    <main className="min-h-screen bg-slate-50 text-[#0B1020]">
      {/* HEADER */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <a
            href="/"
            className="flex items-center gap-3"
          >
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-violet-600 to-cyan-400 shadow-lg">
              <span className="text-xl font-black italic text-white">
                V
              </span>

              <span className="absolute -right-1 -top-1 text-xs text-yellow-300">
                ✦
              </span>
            </div>

            <div>
              <div className="text-lg font-black">
                KT{" "}
                <span className="bg-gradient-to-r from-blue-600 via-violet-600 to-fuchsia-500 bg-clip-text text-transparent">
                  VEEXORA
                </span>
              </div>

              <div className="text-[9px] font-semibold tracking-[0.2em] text-slate-400">
                DIGITAL TOOLS
              </div>
            </div>
          </a>

          <a
            href="/"
            className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
          >
            ← Back to Home
          </a>
        </div>
      </header>

      {/* MAIN */}
      <section className="mx-auto max-w-6xl px-5 py-12 lg:px-8 lg:py-16">
        {/* TITLE */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700">
            ✂️ Image Tool
          </div>

          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
            Crop & Rotate Image
          </h1>

          <p className="mt-4 text-base leading-7 text-slate-600">
            Crop, rotate, flip and zoom your image with
            simple controls.
          </p>
        </div>

        {/* UPLOAD */}
        {!file && (
          <label
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() =>
              setIsDragging(false)
            }
            onDrop={handleDrop}
            className={`mx-auto mt-10 flex max-w-3xl cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 py-16 text-center shadow-sm transition ${
              isDragging
                ? "border-blue-500 bg-blue-50"
                : "border-blue-200 bg-white hover:border-blue-400 hover:bg-blue-50/30"
            }`}
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-3xl text-white shadow-lg">
              ↑
            </div>

            <h2 className="mt-6 text-xl font-bold">
              Upload your image
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Drag & drop or choose an image
            </p>

            <p className="mt-1 text-xs text-slate-400">
              JPG, JPEG, PNG, WebP • Maximum 50 MB
            </p>

            <span className="mt-6 rounded-xl bg-[#0B1020] px-6 py-3 text-sm font-bold text-white">
              Choose Image
            </span>

            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        )}

        {/* WORKSPACE */}
        {file && (
          <div className="mx-auto mt-10 max-w-6xl">
            <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
              {/* PREVIEW */}
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-5 py-4">
                  <h2 className="font-bold">
                    Image Preview
                  </h2>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold">
                      {formatSize(file.size)}
                    </span>

                    <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold">
                      {originalDimensions.width} ×{" "}
                      {originalDimensions.height}px
                    </span>
                  </div>
                </div>

                <div className="flex min-h-[420px] items-center justify-center overflow-hidden bg-[linear-gradient(45deg,#f1f5f9_25%,transparent_25%),linear-gradient(-45deg,#f1f5f9_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f1f5f9_75%),linear-gradient(-45deg,transparent_75%,#f1f5f9_75%)] bg-[length:24px_24px] bg-[position:0_0,0_12px,12px_-12px,-12px_0px] p-6">
                  {preview && (
                    <div
                      className="transition-transform duration-300"
                      style={{
                        transform: `rotate(${rotation}deg) scale(${zoom}) scaleX(${
                          flipX ? -1 : 1
                        }) scaleY(${flipY ? -1 : 1})`,
                      }}
                    >
                      <img
                        src={preview}
                        alt="Preview"
                        className="max-h-[460px] max-w-full rounded-xl object-contain shadow-xl"
                      />
                    </div>
                  )}
                </div>

                {/* RESULT */}
                {resultUrl && (
                  <div className="border-t border-emerald-100 bg-emerald-50 p-5">
                    <div className="font-bold text-emerald-800">
                      ✓ Changes Applied
                    </div>

                    <img
                      src={resultUrl}
                      alt="Edited result"
                      className="mt-4 max-h-[350px] w-full rounded-xl bg-white object-contain p-3"
                    />

                    <button
                      onClick={downloadImage}
                      className="mt-4 w-full rounded-xl bg-[#0B1020] px-5 py-4 text-sm font-bold text-white transition hover:bg-blue-700"
                    >
                      Download Edited Image ↓
                    </button>
                  </div>
                )}
              </div>

              {/* CONTROLS */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-black">
                  Edit Image
                </h2>

                {/* ASPECT */}
                <div className="mt-7">
                  <label className="text-sm font-bold">
                    Crop Ratio
                  </label>

                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {(
                      [
                        ["free", "Free"],
                        ["1:1", "1:1"],
                        ["4:3", "4:3"],
                        ["3:4", "3:4"],
                        ["16:9", "16:9"],
                        ["9:16", "9:16"],
                      ] as [AspectRatio, string][]
                    ).map(([ratio, label]) => (
                      <button
                        key={ratio}
                        type="button"
                        onClick={() =>
                          applyAspectRatio(ratio)
                        }
                        className={`rounded-xl border px-3 py-3 text-xs font-bold transition ${
                          aspectRatio === ratio
                            ? "border-blue-600 bg-blue-600 text-white"
                            : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ROTATE */}
                <div className="mt-7">
                  <label className="text-sm font-bold">
                    Rotate
                  </label>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={rotateLeft}
                      className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold hover:bg-slate-50"
                    >
                      ↶ Rotate Left
                    </button>

                    <button
                      type="button"
                      onClick={rotateRight}
                      className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold hover:bg-slate-50"
                    >
                      ↷ Rotate Right
                    </button>
                  </div>

                  <div className="mt-2 text-center text-xs text-slate-400">
                    {rotation}°
                  </div>
                </div>

                {/* FLIP */}
                <div className="mt-7">
                  <label className="text-sm font-bold">
                    Flip
                  </label>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setFlipX((current) => !current)
                      }
                      className={`rounded-xl border px-4 py-3 text-sm font-bold ${
                        flipX
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      ↔ Horizontal
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setFlipY((current) => !current)
                      }
                      className={`rounded-xl border px-4 py-3 text-sm font-bold ${
                        flipY
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      ↕ Vertical
                    </button>
                  </div>
                </div>

                {/* ZOOM */}
                <div className="mt-7">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold">
                      Zoom
                    </label>

                    <span className="text-sm font-bold text-blue-600">
                      {zoom.toFixed(1)}×
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={zoom}
                    onChange={(event) =>
                      setZoom(
                        Number(event.target.value)
                      )
                    }
                    className="mt-4 w-full accent-blue-600"
                  />
                </div>

                {/* CROP INFO */}
                <div className="mt-7 rounded-2xl bg-slate-50 p-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Crop Area
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-slate-400">
                        Width
                      </div>

                      <div className="font-bold">
                        {crop.width}px
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-slate-400">
                        Height
                      </div>

                      <div className="font-bold">
                        {crop.height}px
                      </div>
                    </div>
                  </div>
                </div>

                {/* APPLY */}
                <button
                  onClick={applyChanges}
                  disabled={isProcessing}
                  className="mt-7 w-full rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-4 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isProcessing
                    ? "Processing..."
                    : "Apply Changes"}
                </button>

                <button
                  onClick={resetEdits}
                  className="mt-3 w-full rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Reset Edits
                </button>

                <button
                  onClick={resetTool}
                  className="mt-3 w-full rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-500 hover:bg-slate-50"
                >
                  Choose Another Image
                </button>

                {error && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                    {error}
                  </div>
                )}
              </div>
            </div>

            <p className="mt-8 text-center text-xs text-slate-400">
              Your image is processed directly in your browser.
              It is not uploaded to a VEEXORA server.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}