"use client";

import {
  ChangeEvent,
  DragEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import imageCompression from "browser-image-compression";

type OutputFormat = "image/jpeg" | "image/png" | "image/webp";

const MAX_FILE_SIZE = 50 * 1024 * 1024;

export default function CompressImagePage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [compressedFile, setCompressedFile] = useState<File | null>(null);
  const [compressedPreview, setCompressedPreview] = useState("");

  const [targetSize, setTargetSize] = useState("200");
  const [unit, setUnit] = useState<"KB" | "MB">("KB");
  const [quality, setQuality] = useState(0.8);

  const [outputFormat, setOutputFormat] =
    useState<OutputFormat>("image/jpeg");

  const [keepAspectRatio, setKeepAspectRatio] = useState(true);
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");

  const [originalDimensions, setOriginalDimensions] = useState({
    width: 0,
    height: 0,
  });

  const [compressedDimensions, setCompressedDimensions] = useState({
    width: 0,
    height: 0,
  });

  const [isCompressing, setIsCompressing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");

  const previewUrlRef = useRef<string | null>(null);
  const compressedUrlRef = useRef<string | null>(null);
  const originalRatioRef = useRef(1);

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

  const getTargetBytes = () => {
    const value = Number(targetSize);

    if (!value || value <= 0) return 0;

    return unit === "MB"
      ? value * 1024 * 1024
      : value * 1024;
  };

  const getFormatName = () => {
    if (outputFormat === "image/png") return "PNG";
    if (outputFormat === "image/webp") return "WebP";
    return "JPG";
  };

  const getExtension = () => {
    if (outputFormat === "image/png") return "png";
    if (outputFormat === "image/webp") return "webp";
    return "jpg";
  };

  const getCompressionPercent = () => {
    if (!file || !compressedFile || file.size === 0) return 0;

    return Math.max(
      0,
      Math.round((1 - compressedFile.size / file.size) * 100)
    );
  };

  /* -----------------------------
     LOAD IMAGE DIMENSIONS
  ----------------------------- */

  const getImageDimensions = (
    imageFile: File
  ): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(imageFile);
      const img = new Image();

      img.onload = () => {
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
        });

        URL.revokeObjectURL(url);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Could not read image dimensions."));
      };

      img.src = url;
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

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError("Maximum supported image size is 50 MB.");
      return;
    }

    try {
      const dimensions = await getImageDimensions(selectedFile);

      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }

      if (compressedUrlRef.current) {
        URL.revokeObjectURL(compressedUrlRef.current);
      }

      const objectUrl = URL.createObjectURL(selectedFile);

      previewUrlRef.current = objectUrl;
      compressedUrlRef.current = null;

      setFile(selectedFile);
      setPreview(objectUrl);

      setCompressedFile(null);
      setCompressedPreview("");

      setOriginalDimensions(dimensions);
      setCompressedDimensions({
        width: 0,
        height: 0,
      });

      originalRatioRef.current =
        dimensions.width / dimensions.height;

      setWidth(String(dimensions.width));
      setHeight(String(dimensions.height));
    } catch {
      setError("Could not read this image. Please try another file.");
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

  const handleDrop = async (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);

    const droppedFile = event.dataTransfer.files?.[0];

    if (!droppedFile) return;

    await handleFile(droppedFile);
  };

  /* -----------------------------
     WIDTH / HEIGHT
  ----------------------------- */

  const handleWidthChange = (value: string) => {
    setWidth(value);

    if (!keepAspectRatio) return;

    const numericWidth = Number(value);

    if (!numericWidth || !originalRatioRef.current) {
      setHeight("");
      return;
    }

    setHeight(
      String(Math.max(1, Math.round(numericWidth / originalRatioRef.current)))
    );
  };

  const handleHeightChange = (value: string) => {
    setHeight(value);

    if (!keepAspectRatio) return;

    const numericHeight = Number(value);

    if (!numericHeight || !originalRatioRef.current) {
      setWidth("");
      return;
    }

    setWidth(
      String(
        Math.max(
          1,
          Math.round(numericHeight * originalRatioRef.current)
        )
      )
    );
  };

  /* -----------------------------
     COMPRESSION
  ----------------------------- */

  const compressImage = async () => {
    if (!file) {
      setError("Please upload an image first.");
      return;
    }

    const targetBytes = getTargetBytes();

    if (!targetBytes) {
      setError("Please enter a valid target size.");
      return;
    }

    const requestedWidth = Number(width);
    const requestedHeight = Number(height);

    if (!requestedWidth || requestedWidth < 1) {
      setError("Please enter a valid width.");
      return;
    }

    if (!requestedHeight || requestedHeight < 1) {
      setError("Please enter a valid height.");
      return;
    }

    setIsCompressing(true);
    setError("");

    if (compressedUrlRef.current) {
      URL.revokeObjectURL(compressedUrlRef.current);
      compressedUrlRef.current = null;
    }

    setCompressedFile(null);
    setCompressedPreview("");

    try {
      let currentQuality = quality;
      let result: File = file;

      /*
        PNG does not have normal JPEG-style quality compression.
        We still allow PNG output, while dimensions can reduce size.
      */

      const maxSizeMB = targetBytes / (1024 * 1024);

      for (let attempt = 0; attempt < 8; attempt++) {
        result = await imageCompression(file, {
          maxSizeMB,
          maxWidthOrHeight: Math.max(
            requestedWidth,
            requestedHeight
          ),
          useWebWorker: true,
          initialQuality:
            outputFormat === "image/png"
              ? undefined
              : currentQuality,
          fileType: outputFormat,
        });

        /*
          If custom dimensions were requested, use the image
          compression library's resize result first.
        */

        const resultDimensions = await getImageDimensions(result);

        /*
          If target size is reached, stop.
        */

        if (result.size <= targetBytes) {
          break;
        }

        currentQuality = Math.max(
          0.2,
          currentQuality - 0.1
        );
      }

      /*
        If exact requested dimensions differ from the result,
        resize again using canvas.
      */

      const finalResult = await resizeToExactDimensions(
        result,
        requestedWidth,
        requestedHeight,
        outputFormat,
        currentQuality
      );

      result = finalResult;

      /*
        Try a few additional quality passes for JPG/WebP
        if the result is still larger than requested.
      */

      if (
        result.size > targetBytes &&
        outputFormat !== "image/png"
      ) {
        for (let attempt = 0; attempt < 6; attempt++) {
          currentQuality = Math.max(
            0.15,
            currentQuality - 0.08
          );

          const retry = await resizeToExactDimensions(
            file,
            requestedWidth,
            requestedHeight,
            outputFormat,
            currentQuality
          );

          result = retry;

          if (result.size <= targetBytes) {
            break;
          }
        }
      }

      const finalDimensions = await getImageDimensions(result);

      setCompressedFile(result);
      setCompressedDimensions(finalDimensions);

      const resultUrl = URL.createObjectURL(result);

      compressedUrlRef.current = resultUrl;
      setCompressedPreview(resultUrl);

      /*
        Helpful warning if the requested target could not
        realistically be reached.
      */

      if (result.size > targetBytes) {
        setError(
          `The image was compressed as much as possible, but it is still ${formatSize(
            result.size
          )}. Try a larger target size or smaller dimensions.`
        );
      }
    } catch (compressionError) {
      console.error(compressionError);

      setError(
        "Something went wrong while compressing the image. Please try different settings."
      );
    } finally {
      setIsCompressing(false);
    }
  };

  /* -----------------------------
     DOWNLOAD
  ----------------------------- */

  const downloadImage = () => {
    if (!compressedFile) return;

    const url = URL.createObjectURL(compressedFile);

    const baseName = compressedFile.name.replace(
      /\.[^/.]+$/,
      ""
    );

    const link = document.createElement("a");

    link.href = url;
    link.download = `veexora-compressed-${baseName}.${getExtension()}`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  };

  /* -----------------------------
     RESET
  ----------------------------- */

  const resetTool = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    if (compressedUrlRef.current) {
      URL.revokeObjectURL(compressedUrlRef.current);
      compressedUrlRef.current = null;
    }

    setFile(null);
    setPreview("");

    setCompressedFile(null);
    setCompressedPreview("");

    setOriginalDimensions({
      width: 0,
      height: 0,
    });

    setCompressedDimensions({
      width: 0,
      height: 0,
    });

    setTargetSize("200");
    setUnit("KB");
    setQuality(0.8);

    setOutputFormat("image/jpeg");

    setKeepAspectRatio(true);
    setWidth("");
    setHeight("");

    setError("");
  };

  /* -----------------------------
     CLEANUP
  ----------------------------- */

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }

      if (compressedUrlRef.current) {
        URL.revokeObjectURL(compressedUrlRef.current);
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
          <a href="/" className="flex items-center gap-3">
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
            🖼️ Image Tool
          </div>

          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
            Compress Image
          </h1>

          <p className="mt-4 text-base leading-7 text-slate-600">
            Reduce image file size while keeping the quality,
            dimensions and format under your control.
          </p>
        </div>

        {/* UPLOAD */}
        {!file && (
          <label
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
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
            <div className="grid gap-6 lg:grid-cols-2">
              {/* ORIGINAL */}
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-5 py-4">
                  <h2 className="font-bold">
                    Original Image
                  </h2>

                  <p className="mt-1 break-all text-xs text-slate-500">
                    {file.name}
                  </p>

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

                <div className="flex min-h-[300px] items-center justify-center bg-slate-50 p-5">
                  {preview && (
                    <img
                      src={preview}
                      alt="Original"
                      className="max-h-[420px] max-w-full rounded-xl object-contain"
                    />
                  )}
                </div>
              </div>

              {/* SETTINGS */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-black">
                  Compression Settings
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Choose exactly how you want your image compressed.
                </p>

                {/* TARGET SIZE */}
                <div className="mt-7">
                  <label className="text-sm font-bold">
                    Target File Size
                  </label>

                  <div className="mt-2 flex gap-2">
                    <input
                      type="number"
                      min="1"
                      value={targetSize}
                      onChange={(e) =>
                        setTargetSize(e.target.value)
                      }
                      className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />

                    <select
                      value={unit}
                      onChange={(e) =>
                        setUnit(
                          e.target.value as "KB" | "MB"
                        )
                      }
                      className="rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold outline-none focus:border-blue-500"
                    >
                      <option value="KB">KB</option>
                      <option value="MB">MB</option>
                    </select>
                  </div>
                </div>

                {/* FORMAT */}
                <div className="mt-6">
                  <label className="text-sm font-bold">
                    Output Format
                  </label>

                  <select
                    value={outputFormat}
                    onChange={(e) =>
                      setOutputFormat(
                        e.target.value as OutputFormat
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold outline-none focus:border-blue-500"
                  >
                    <option value="image/jpeg">
                      JPG — Small & Compatible
                    </option>

                    <option value="image/png">
                      PNG — Lossless
                    </option>

                    <option value="image/webp">
                      WebP — Modern & Efficient
                    </option>
                  </select>
                </div>

                {/* QUALITY */}
                <div className="mt-6">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold">
                      Quality
                    </label>

                    <span className="text-sm font-bold text-blue-600">
                      {Math.round(quality * 100)}%
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0.2"
                    max="1"
                    step="0.05"
                    value={quality}
                    onChange={(e) =>
                      setQuality(Number(e.target.value))
                    }
                    disabled={outputFormat === "image/png"}
                    className="mt-4 w-full accent-blue-600 disabled:opacity-40"
                  />

                  <div className="mt-2 flex justify-between text-xs text-slate-400">
                    <span>Smaller file</span>
                    <span>
                      {outputFormat === "image/png"
                        ? "PNG uses lossless compression"
                        : "Higher quality"}
                    </span>
                  </div>
                </div>

                {/* DIMENSIONS */}
                <div className="mt-6">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold">
                      Dimensions
                    </label>

                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                      <input
                        type="checkbox"
                        checked={keepAspectRatio}
                        onChange={(e) =>
                          setKeepAspectRatio(
                            e.target.checked
                          )
                        }
                        className="h-4 w-4 accent-blue-600"
                      />
                      Keep aspect ratio
                    </label>
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-xs text-slate-400">
                        Width
                      </span>

                      <input
                        type="number"
                        min="1"
                        value={width}
                        onChange={(e) =>
                          handleWidthChange(e.target.value)
                        }
                        className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <span className="text-xs text-slate-400">
                        Height
                      </span>

                      <input
                        type="number"
                        min="1"
                        value={height}
                        onChange={(e) =>
                          handleHeightChange(e.target.value)
                        }
                        className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* ACTION */}
                <button
                  onClick={compressImage}
                  disabled={isCompressing}
                  className="mt-8 w-full rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-4 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCompressing
                    ? "Compressing..."
                    : "Compress Image"}
                </button>

                <button
                  onClick={resetTool}
                  className="mt-3 w-full rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Choose Another Image
                </button>

                {error && (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                    {error}
                  </div>
                )}
              </div>
            </div>

            {/* RESULT */}
            {compressedFile && (
              <div className="mt-6 overflow-hidden rounded-3xl border border-emerald-200 bg-white shadow-sm">
                <div className="border-b border-emerald-100 bg-emerald-50 px-5 py-5">
                  <div className="font-bold text-emerald-800">
                    ✓ Compression Complete
                  </div>

                  <div className="mt-1 text-sm text-emerald-700">
                    {formatSize(file.size)} →{" "}
                    <strong>
                      {formatSize(compressedFile.size)}
                    </strong>
                  </div>
                </div>

                <div className="grid gap-6 p-5 lg:grid-cols-2">
                  {/* PREVIEW */}
                  <div className="flex min-h-[300px] items-center justify-center rounded-2xl bg-slate-50 p-5">
                    {compressedPreview && (
                      <img
                        src={compressedPreview}
                        alt="Compressed"
                        className="max-h-[420px] max-w-full rounded-xl object-contain"
                      />
                    )}
                  </div>

                  {/* DETAILS */}
                  <div className="flex flex-col justify-center">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <div className="text-xs text-slate-400">
                          Original
                        </div>

                        <div className="mt-1 text-lg font-black">
                          {formatSize(file.size)}
                        </div>

                        <div className="mt-1 text-xs text-slate-500">
                          {originalDimensions.width} ×{" "}
                          {originalDimensions.height}px
                        </div>
                      </div>

                      <div className="rounded-2xl bg-emerald-50 p-4">
                        <div className="text-xs text-emerald-600">
                          Compressed
                        </div>

                        <div className="mt-1 text-lg font-black text-emerald-600">
                          {formatSize(compressedFile.size)}
                        </div>

                        <div className="mt-1 text-xs text-emerald-700">
                          {compressedDimensions.width} ×{" "}
                          {compressedDimensions.height}px
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-slate-200 p-4">
                        <div className="text-xs text-slate-400">
                          Space Saved
                        </div>

                        <div className="mt-1 text-2xl font-black text-blue-600">
                          {getCompressionPercent()}%
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 p-4">
                        <div className="text-xs text-slate-400">
                          Format
                        </div>

                        <div className="mt-1 text-2xl font-black">
                          {getFormatName()}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={downloadImage}
                      className="mt-5 w-full rounded-xl bg-[#0B1020] px-5 py-4 text-sm font-bold text-white transition hover:bg-blue-700"
                    >
                      Download Compressed Image ↓
                    </button>
                  </div>
                </div>
              </div>
            )}

            <p className="mt-8 text-center text-xs text-slate-400">
              Your image is processed in your browser in this
              version. It is not uploaded to a VEEXORA server.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

/* =========================================
   EXACT RESIZE + FORMAT CONVERSION
========================================= */

async function resizeToExactDimensions(
  inputFile: File,
  width: number,
  height: number,
  outputFormat: OutputFormat,
  quality: number
): Promise<File> {
  const bitmap = await createImageBitmap(inputFile);

  const canvas = document.createElement("canvas");

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    bitmap.close();
    throw new Error("Could not create canvas.");
  }

  /*
    White background for JPG because JPG
    does not support transparency.
  */

  if (outputFormat === "image/jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.drawImage(
    bitmap,
    0,
    0,
    width,
    height
  );

  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(
      resolve,
      outputFormat,
      outputFormat === "image/png"
        ? undefined
        : quality
    );
  });

  if (!blob) {
    throw new Error("Could not create compressed image.");
  }

  const extension =
    outputFormat === "image/png"
      ? "png"
      : outputFormat === "image/webp"
      ? "webp"
      : "jpg";

  const originalName = inputFile.name.replace(
    /\.[^/.]+$/,
    ""
  );

  return new File(
    [blob],
    `${originalName}-compressed.${extension}`,
    {
      type: outputFormat,
      lastModified: Date.now(),
    }
  );
}