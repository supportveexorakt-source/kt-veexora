"use client";

import {
  ChangeEvent,
  DragEvent,
  useEffect,
  useRef,
  useState,
} from "react";

type FilterName =
  | "none"
  | "grayscale"
  | "sepia"
  | "vintage"
  | "warm"
  | "cool";

export default function PhotoEditorPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [resultUrl, setResultUrl] = useState("");

  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [blur, setBlur] = useState(0);

  const [filter, setFilter] =
    useState<FilterName>("none");

  const [rotation, setRotation] = useState(0);
  const [flipX, setFlipX] = useState(false);
  const [flipY, setFlipY] = useState(false);
  const [zoom, setZoom] = useState(1);

  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  const [dimensions, setDimensions] = useState({
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

  const getFilterValues = () => {
    switch (filter) {
      case "grayscale":
        return {
          brightness: 100,
          contrast: 100,
          saturation: 0,
          sepia: 0,
        };

      case "sepia":
        return {
          brightness: 105,
          contrast: 105,
          saturation: 85,
          sepia: 70,
        };

      case "vintage":
        return {
          brightness: 105,
          contrast: 110,
          saturation: 80,
          sepia: 25,
        };

      case "warm":
        return {
          brightness: 105,
          contrast: 105,
          saturation: 115,
          sepia: 12,
        };

      case "cool":
        return {
          brightness: 100,
          contrast: 105,
          saturation: 110,
          sepia: 0,
        };

      default:
        return {
          brightness,
          contrast,
          saturation,
          sepia: 0,
        };
    }
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
      const imageDimensions =
        await getImageDimensions(selectedFile);

      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }

      if (resultUrlRef.current) {
        URL.revokeObjectURL(resultUrlRef.current);
      }

      const objectUrl =
        URL.createObjectURL(selectedFile);

      previewUrlRef.current = objectUrl;
      resultUrlRef.current = null;

      setFile(selectedFile);
      setPreview(objectUrl);
      setResultUrl("");

      setDimensions(imageDimensions);

      resetEditingValues();
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

    const droppedFile =
      event.dataTransfer.files?.[0];

    if (!droppedFile) return;

    await handleFile(droppedFile);
  };

  /* -----------------------------
     EDITING RESET
  ----------------------------- */

  const resetEditingValues = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setBlur(0);

    setFilter("none");

    setRotation(0);
    setFlipX(false);
    setFlipY(false);

    setZoom(1);
  };

  /* -----------------------------
     APPLY EDITS
  ----------------------------- */

  const applyEdits = async () => {
    if (!file) {
      setError("Please upload an image first.");
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
          ? image.height
          : image.width;

      const rotatedHeight =
        rotation === 90 || rotation === 270
          ? image.width
          : image.height;

      const canvas =
        document.createElement("canvas");

      canvas.width = Math.max(
        1,
        Math.round(rotatedWidth * zoom)
      );

      canvas.height = Math.max(
        1,
        Math.round(rotatedHeight * zoom)
      );

      const context =
        canvas.getContext("2d");

      if (!context) {
        image.close();
        throw new Error("Could not create canvas.");
      }

      const filterValues =
        getFilterValues();

      context.filter = `
        brightness(${filterValues.brightness}%)
        contrast(${filterValues.contrast}%)
        saturate(${filterValues.saturation}%)
        sepia(${filterValues.sepia}%)
        blur(${blur}px)
      `;

      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";

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
        -image.width * zoom / 2,
        -image.height * zoom / 2,
        image.width * zoom,
        image.height * zoom
      );

      image.close();

      const mimeType =
        file.type === "image/png"
          ? "image/png"
          : file.type === "image/webp"
          ? "image/webp"
          : "image/jpeg";

      const blob =
        await new Promise<Blob | null>(
          (resolve) => {
            canvas.toBlob(
              resolve,
              mimeType,
              mimeType === "image/png"
                ? undefined
                : 0.95
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

      const url =
        URL.createObjectURL(blob);

      resultUrlRef.current = url;

      setResultUrl(url);
    } catch (processingError) {
      console.error(processingError);

      setError(
        "Something went wrong while applying the edits."
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

    const baseName =
      file.name.replace(
        /\.[^/.]+$/,
        ""
      );

    const link =
      document.createElement("a");

    link.href = resultUrl;

    link.download =
      `veexora-edited-${baseName}.${extension}`;

    document.body.appendChild(link);

    link.click();

    link.remove();
  };

  /* -----------------------------
     RESET ALL
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

    setDimensions({
      width: 0,
      height: 0,
    });

    resetEditingValues();

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
     PREVIEW FILTER
  ----------------------------- */

  const previewFilterValues =
    getFilterValues();

  const previewStyle = {
    filter: `
      brightness(${previewFilterValues.brightness}%)
      contrast(${previewFilterValues.contrast}%)
      saturate(${previewFilterValues.saturation}%)
      sepia(${previewFilterValues.sepia}%)
      blur(${blur}px)
    `,
    transform: `
      rotate(${rotation}deg)
      scale(${zoom})
      scaleX(${flipX ? -1 : 1})
      scaleY(${flipY ? -1 : 1})
    `,
  };

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
            🎨 Image Tool
          </div>

          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
            Photo Editor
          </h1>

          <p className="mt-4 text-base leading-7 text-slate-600">
            Adjust brightness, contrast, saturation, filters,
            blur, rotation and more.
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
            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              {/* PREVIEW */}
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-5 py-4">
                  <h2 className="font-bold">
                    Live Preview
                  </h2>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold">
                      {formatSize(file.size)}
                    </span>

                    <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold">
                      {dimensions.width} ×{" "}
                      {dimensions.height}px
                    </span>
                  </div>
                </div>

                <div className="flex min-h-[440px] items-center justify-center overflow-hidden bg-[linear-gradient(45deg,#f1f5f9_25%,transparent_25%),linear-gradient(-45deg,#f1f5f9_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f1f5f9_75%),linear-gradient(-45deg,transparent_75%,#f1f5f9_75%)] bg-[length:24px_24px] bg-[position:0_0,0_12px,12px_-12px,-12px_0px] p-8">
                  {preview && (
                    <img
                      src={preview}
                      alt="Photo editor preview"
                      style={previewStyle}
                      className="max-h-[480px] max-w-full rounded-xl object-contain shadow-2xl transition-all duration-200"
                    />
                  )}
                </div>

                {/* RESULT */}
                {resultUrl && (
                  <div className="border-t border-emerald-100 bg-emerald-50 p-5">
                    <div className="font-bold text-emerald-800">
                      ✓ Edits Applied
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
                  Editing Controls
                </h2>

                {/* BRIGHTNESS */}
                <div className="mt-7">
                  <div className="flex justify-between">
                    <label className="text-sm font-bold">
                      Brightness
                    </label>

                    <span className="text-sm font-bold text-blue-600">
                      {brightness}%
                    </span>
                  </div>

                  <input
                    type="range"
                    min="50"
                    max="150"
                    value={brightness}
                    onChange={(event) =>
                      setBrightness(
                        Number(event.target.value)
                      )
                    }
                    className="mt-3 w-full accent-blue-600"
                  />
                </div>

                {/* CONTRAST */}
                <div className="mt-6">
                  <div className="flex justify-between">
                    <label className="text-sm font-bold">
                      Contrast
                    </label>

                    <span className="text-sm font-bold text-blue-600">
                      {contrast}%
                    </span>
                  </div>

                  <input
                    type="range"
                    min="50"
                    max="150"
                    value={contrast}
                    onChange={(event) =>
                      setContrast(
                        Number(event.target.value)
                      )
                    }
                    className="mt-3 w-full accent-blue-600"
                  />
                </div>

                {/* SATURATION */}
                <div className="mt-6">
                  <div className="flex justify-between">
                    <label className="text-sm font-bold">
                      Saturation
                    </label>

                    <span className="text-sm font-bold text-blue-600">
                      {saturation}%
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={saturation}
                    onChange={(event) =>
                      setSaturation(
                        Number(event.target.value)
                      )
                    }
                    className="mt-3 w-full accent-blue-600"
                  />
                </div>

                {/* BLUR */}
                <div className="mt-6">
                  <div className="flex justify-between">
                    <label className="text-sm font-bold">
                      Blur
                    </label>

                    <span className="text-sm font-bold text-blue-600">
                      {blur}px
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="8"
                    step="0.5"
                    value={blur}
                    onChange={(event) =>
                      setBlur(
                        Number(event.target.value)
                      )
                    }
                    className="mt-3 w-full accent-blue-600"
                  />
                </div>

                {/* FILTERS */}
                <div className="mt-7">
                  <label className="text-sm font-bold">
                    Filters
                  </label>

                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {(
                      [
                        ["none", "Original"],
                        ["grayscale", "B&W"],
                        ["sepia", "Sepia"],
                        ["vintage", "Vintage"],
                        ["warm", "Warm"],
                        ["cool", "Cool"],
                      ] as [FilterName, string][]
                    ).map(
                      ([filterName, label]) => (
                        <button
                          key={filterName}
                          type="button"
                          onClick={() =>
                            setFilter(filterName)
                          }
                          className={`rounded-xl border px-2 py-3 text-xs font-bold transition ${
                            filter === filterName
                              ? "border-blue-600 bg-blue-600 text-white"
                              : "border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50"
                          }`}
                        >
                          {label}
                        </button>
                      )
                    )}
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
                      onClick={() =>
                        setRotation(
                          (current) =>
                            (current - 90 + 360) %
                            360
                        )
                      }
                      className="rounded-xl border border-slate-200 px-3 py-3 text-sm font-bold hover:bg-slate-50"
                    >
                      ↶ Left
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setRotation(
                          (current) =>
                            (current + 90) % 360
                        )
                      }
                      className="rounded-xl border border-slate-200 px-3 py-3 text-sm font-bold hover:bg-slate-50"
                    >
                      ↷ Right
                    </button>
                  </div>
                </div>

                {/* FLIP */}
                <div className="mt-6">
                  <label className="text-sm font-bold">
                    Flip
                  </label>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setFlipX(
                          (current) => !current
                        )
                      }
                      className={`rounded-xl border px-3 py-3 text-sm font-bold ${
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
                        setFlipY(
                          (current) => !current
                        )
                      }
                      className={`rounded-xl border px-3 py-3 text-sm font-bold ${
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
                <div className="mt-6">
                  <div className="flex justify-between">
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
                    className="mt-3 w-full accent-blue-600"
                  />
                </div>

                {/* ACTIONS */}
                <button
                  onClick={applyEdits}
                  disabled={isProcessing}
                  className="mt-8 w-full rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-4 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isProcessing
                    ? "Applying..."
                    : "Apply Edits"}
                </button>

                <button
                  onClick={() => {
                    resetEditingValues();
                    setResultUrl("");

                    if (resultUrlRef.current) {
                      URL.revokeObjectURL(
                        resultUrlRef.current
                      );

                      resultUrlRef.current =
                        null;
                    }
                  }}
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