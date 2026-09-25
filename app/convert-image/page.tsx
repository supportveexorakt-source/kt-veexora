"use client";

import {
  ChangeEvent,
  DragEvent,
  useEffect,
  useRef,
  useState,
} from "react";

type OutputFormat = "image/jpeg" | "image/png" | "image/webp";

export default function ConvertImagePage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [convertedFile, setConvertedFile] = useState<File | null>(null);
  const [convertedPreview, setConvertedPreview] = useState("");

  const [outputFormat, setOutputFormat] =
    useState<OutputFormat>("image/png");

  const [quality, setQuality] = useState(0.9);
  const [isConverting, setIsConverting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");

  const [originalDimensions, setOriginalDimensions] = useState({
    width: 0,
    height: 0,
  });

  const [convertedDimensions, setConvertedDimensions] = useState({
    width: 0,
    height: 0,
  });

  const previewUrlRef = useRef<string | null>(null);
  const convertedUrlRef = useRef<string | null>(null);

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

  const getFormatName = (format: OutputFormat) => {
    if (format === "image/png") return "PNG";
    if (format === "image/webp") return "WebP";
    return "JPG";
  };

  const getExtension = (format: OutputFormat) => {
    if (format === "image/png") return "png";
    if (format === "image/webp") return "webp";
    return "jpg";
  };

  const getCompressionDifference = () => {
    if (!file || !convertedFile || file.size === 0) return 0;

    return Math.round(
      ((file.size - convertedFile.size) / file.size) * 100
    );
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
      const dimensions = await getImageDimensions(selectedFile);

      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }

      if (convertedUrlRef.current) {
        URL.revokeObjectURL(convertedUrlRef.current);
      }

      const objectUrl = URL.createObjectURL(selectedFile);

      previewUrlRef.current = objectUrl;
      convertedUrlRef.current = null;

      setFile(selectedFile);
      setPreview(objectUrl);

      setConvertedFile(null);
      setConvertedPreview("");

      setOriginalDimensions(dimensions);

      setConvertedDimensions({
        width: 0,
        height: 0,
      });
    } catch {
      setError("Could not read this image.");
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
     CONVERT IMAGE
  ----------------------------- */

  const convertImage = async () => {
    if (!file) {
      setError("Please upload an image first.");
      return;
    }

    setError("");
    setIsConverting(true);

    if (convertedUrlRef.current) {
      URL.revokeObjectURL(convertedUrlRef.current);
      convertedUrlRef.current = null;
    }

    setConvertedFile(null);
    setConvertedPreview("");

    try {
      const image = await createImageBitmap(file);

      const canvas = document.createElement("canvas");

      canvas.width = image.width;
      canvas.height = image.height;

      const context = canvas.getContext("2d");

      if (!context) {
        image.close();
        throw new Error("Could not create canvas.");
      }

      /*
        JPG does not support transparency.
        Use a white background when converting
        transparent images to JPG.
      */

      if (outputFormat === "image/jpeg") {
        context.fillStyle = "#ffffff";
        context.fillRect(
          0,
          0,
          canvas.width,
          canvas.height
        );
      }

      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";

      context.drawImage(image, 0, 0);

      image.close();

      const blob = await new Promise<Blob | null>(
        (resolve) => {
          canvas.toBlob(
            resolve,
            outputFormat,
            outputFormat === "image/png"
              ? undefined
              : quality
          );
        }
      );

      if (!blob) {
        throw new Error("Could not create converted image.");
      }

      const originalName = file.name.replace(
        /\.[^/.]+$/,
        ""
      );

      const extension = getExtension(outputFormat);

      const newFile = new File(
        [blob],
        `${originalName}-converted.${extension}`,
        {
          type: outputFormat,
          lastModified: Date.now(),
        }
      );

      const resultUrl = URL.createObjectURL(newFile);

      convertedUrlRef.current = resultUrl;

      setConvertedFile(newFile);
      setConvertedPreview(resultUrl);

      setConvertedDimensions({
        width: canvas.width,
        height: canvas.height,
      });
    } catch (conversionError) {
      console.error(conversionError);

      setError(
        "Something went wrong while converting the image."
      );
    } finally {
      setIsConverting(false);
    }
  };

  /* -----------------------------
     DOWNLOAD
  ----------------------------- */

  const downloadImage = () => {
    if (!convertedFile) return;

    const url = URL.createObjectURL(convertedFile);

    const baseName = file
      ? file.name.replace(/\.[^/.]+$/, "")
      : "veexora-image";

    const link = document.createElement("a");

    link.href = url;

    link.download = `veexora-${baseName}.${getExtension(
      outputFormat
    )}`;

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

    if (convertedUrlRef.current) {
      URL.revokeObjectURL(convertedUrlRef.current);
      convertedUrlRef.current = null;
    }

    setFile(null);
    setPreview("");

    setConvertedFile(null);
    setConvertedPreview("");

    setOriginalDimensions({
      width: 0,
      height: 0,
    });

    setConvertedDimensions({
      width: 0,
      height: 0,
    });

    setOutputFormat("image/png");
    setQuality(0.9);

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

      if (convertedUrlRef.current) {
        URL.revokeObjectURL(convertedUrlRef.current);
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
            🖼️ Image Tool
          </div>

          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
            Convert Image
          </h1>

          <p className="mt-4 text-base leading-7 text-slate-600">
            Convert your image between JPG, PNG and WebP
            while keeping the original dimensions.
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

                <div className="flex min-h-[320px] items-center justify-center bg-slate-50 p-5">
                  {preview && (
                    <img
                      src={preview}
                      alt="Original"
                      className="max-h-[430px] max-w-full rounded-xl object-contain"
                    />
                  )}
                </div>
              </div>

              {/* SETTINGS */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-black">
                  Conversion Settings
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Select the format you want to create.
                </p>

                {/* FORMAT */}
                <div className="mt-7">
                  <label className="text-sm font-bold">
                    Convert To
                  </label>

                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {(
                      [
                        ["image/jpeg", "JPG"],
                        ["image/png", "PNG"],
                        ["image/webp", "WebP"],
                      ] as [OutputFormat, string][]
                    ).map(([format, label]) => (
                      <button
                        key={format}
                        type="button"
                        onClick={() =>
                          setOutputFormat(format)
                        }
                        className={`rounded-xl border px-3 py-3 text-sm font-bold transition ${
                          outputFormat === format
                            ? "border-blue-600 bg-blue-600 text-white shadow-md"
                            : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* QUALITY */}
                <div className="mt-7">
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
                    min="0.3"
                    max="1"
                    step="0.05"
                    value={quality}
                    onChange={(event) =>
                      setQuality(
                        Number(event.target.value)
                      )
                    }
                    disabled={
                      outputFormat === "image/png"
                    }
                    className="mt-4 w-full accent-blue-600 disabled:opacity-40"
                  />

                  <div className="mt-2 flex justify-between text-xs text-slate-400">
                    <span>Smaller file</span>

                    <span>
                      {outputFormat === "image/png"
                        ? "PNG is lossless"
                        : "Higher quality"}
                    </span>
                  </div>
                </div>

                {/* INFO */}
                <div className="mt-7 rounded-2xl bg-slate-50 p-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Output
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm text-slate-500">
                      Format
                    </span>

                    <span className="font-bold">
                      {getFormatName(outputFormat)}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm text-slate-500">
                      Dimensions
                    </span>

                    <span className="font-bold">
                      {originalDimensions.width} ×{" "}
                      {originalDimensions.height}px
                    </span>
                  </div>
                </div>

                {/* ACTION */}
                <button
                  onClick={convertImage}
                  disabled={isConverting}
                  className="mt-8 w-full rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-4 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isConverting
                    ? "Converting..."
                    : `Convert to ${getFormatName(
                        outputFormat
                      )}`}
                </button>

                <button
                  onClick={resetTool}
                  className="mt-3 w-full rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
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

            {/* RESULT */}
            {convertedFile && (
              <div className="mt-6 overflow-hidden rounded-3xl border border-emerald-200 bg-white shadow-sm">
                <div className="border-b border-emerald-100 bg-emerald-50 px-5 py-5">
                  <div className="font-bold text-emerald-800">
                    ✓ Conversion Complete
                  </div>

                  <div className="mt-1 text-sm text-emerald-700">
                    {getFormatName(file.type as OutputFormat)}{" "}
                    →{" "}
                    <strong>
                      {getFormatName(outputFormat)}
                    </strong>
                  </div>
                </div>

                <div className="grid gap-6 p-5 lg:grid-cols-2">
                  {/* PREVIEW */}
                  <div className="flex min-h-[320px] items-center justify-center rounded-2xl bg-slate-50 p-5">
                    {convertedPreview && (
                      <img
                        src={convertedPreview}
                        alt="Converted"
                        className="max-h-[430px] max-w-full rounded-xl object-contain"
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
                          Converted
                        </div>

                        <div className="mt-1 text-lg font-black text-emerald-600">
                          {formatSize(
                            convertedFile.size
                          )}
                        </div>

                        <div className="mt-1 text-xs text-emerald-700">
                          {convertedDimensions.width} ×{" "}
                          {convertedDimensions.height}px
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl border border-slate-200 p-4">
                      <div className="text-xs text-slate-400">
                        Size Difference
                      </div>

                      <div
                        className={`mt-1 text-2xl font-black ${
                          getCompressionDifference() >= 0
                            ? "text-blue-600"
                            : "text-orange-500"
                        }`}
                      >
                        {getCompressionDifference() >= 0
                          ? `${getCompressionDifference()}% smaller`
                          : `${Math.abs(
                              getCompressionDifference()
                            )}% larger`}
                      </div>
                    </div>

                    <button
                      onClick={downloadImage}
                      className="mt-5 w-full rounded-xl bg-[#0B1020] px-5 py-4 text-sm font-bold text-white transition hover:bg-blue-700"
                    >
                      Download Converted Image ↓
                    </button>
                  </div>
                </div>
              </div>
            )}

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