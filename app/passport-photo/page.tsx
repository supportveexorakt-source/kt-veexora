"use client";

import { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState } from "react";

type Preset = {
  id: string;
  name: string;
  width: number;
  height: number;
  label: string;
};

const PRESETS: Preset[] = [
  {
    id: "india-passport",
    name: "India Passport Photo",
    width: 35,
    height: 45,
    label: "35 × 45 mm",
  },
  {
    id: "us-passport",
    name: "US Passport Photo",
    width: 51,
    height: 51,
    label: "51 × 51 mm",
  },
  {
    id: "uk-passport",
    name: "UK Passport Photo",
    width: 35,
    height: 45,
    label: "35 × 45 mm",
  },
  {
    id: "canada-passport",
    name: "Canada Passport Photo",
    width: 50,
    height: 70,
    label: "50 × 70 mm",
  },
  {
    id: "custom",
    name: "Custom Size",
    width: 35,
    height: 45,
    label: "Custom",
  },
];

const PX_PER_MM = 11.811;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export default function PassportPhotoPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const originalUrlRef = useRef<string | null>(null);
  const outputUrlRef = useRef<string | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState("");
  const [outputUrl, setOutputUrl] = useState("");

  const [presetId, setPresetId] = useState("india-passport");
  const [customWidth, setCustomWidth] = useState(35);
  const [customHeight, setCustomHeight] = useState(45);

  const [background, setBackground] = useState("#ffffff");
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [copies, setCopies] = useState(1);
  const [outputFormat, setOutputFormat] = useState<"jpg" | "png">("jpg");
  const [quality, setQuality] = useState(92);

  const [zoom, setZoom] = useState(1);
  const [positionX, setPositionX] = useState(50);
  const [positionY, setPositionY] = useState(50);

  const [status, setStatus] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const selectedPreset = useMemo(
    () => PRESETS.find((preset) => preset.id === presetId) ?? PRESETS[0],
    [presetId]
  );

  const photoWidth = presetId === "custom" ? customWidth : selectedPreset.width;
  const photoHeight = presetId === "custom" ? customHeight : selectedPreset.height;

  const aspectRatio = photoWidth / photoHeight;

  useEffect(() => {
    return () => {
      if (originalUrlRef.current) URL.revokeObjectURL(originalUrlRef.current);
      if (outputUrlRef.current) URL.revokeObjectURL(outputUrlRef.current);
    };
  }, []);

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function handleFile(fileToUse: File) {
    if (!fileToUse.type.startsWith("image/")) {
      setStatus("Please select an image file.");
      return;
    }

    if (fileToUse.size > 20 * 1024 * 1024) {
      setStatus("Maximum file size is 20 MB.");
      return;
    }

    if (originalUrlRef.current) {
      URL.revokeObjectURL(originalUrlRef.current);
    }

    if (outputUrlRef.current) {
      URL.revokeObjectURL(outputUrlRef.current);
      outputUrlRef.current = null;
    }

    const url = URL.createObjectURL(fileToUse);
    originalUrlRef.current = url;

    setFile(fileToUse);
    setOriginalUrl(url);
    setOutputUrl("");
    setStatus("Photo loaded. Adjust the settings and generate your photo.");
  }

  function handleFileInput(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];

    if (selectedFile) {
      handleFile(selectedFile);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);

    const droppedFile = event.dataTransfer.files?.[0];

    if (droppedFile) {
      handleFile(droppedFile);
    }
  }

  function resetSettings() {
    setPresetId("india-passport");
    setCustomWidth(35);
    setCustomHeight(45);
    setBackground("#ffffff");
    setBrightness(100);
    setContrast(100);
    setCopies(1);
    setOutputFormat("jpg");
    setQuality(92);
    setZoom(1);
    setPositionX(50);
    setPositionY(50);
    setOutputUrl("");
    setStatus(file ? "Settings reset." : "");
  }

  function removePhoto() {
    if (originalUrlRef.current) {
      URL.revokeObjectURL(originalUrlRef.current);
      originalUrlRef.current = null;
    }

    if (outputUrlRef.current) {
      URL.revokeObjectURL(outputUrlRef.current);
      outputUrlRef.current = null;
    }

    setFile(null);
    setOriginalUrl("");
    setOutputUrl("");
    setStatus("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function generatePassportPhoto() {
    if (!file || !originalUrl) {
      setStatus("Please upload a photo first.");
      return;
    }

    setIsGenerating(true);
    setStatus("Generating passport photo...");

    const image = new Image();

    image.onload = () => {
      try {
        const outputWidth = Math.max(100, Math.round(photoWidth * PX_PER_MM));
        const outputHeight = Math.max(100, Math.round(photoHeight * PX_PER_MM));

        const canvas = document.createElement("canvas");
        canvas.width = outputWidth;
        canvas.height = outputHeight;

        const ctx = canvas.getContext("2d");

        if (!ctx) {
          throw new Error("Canvas is not supported.");
        }

        ctx.fillStyle = background;
        ctx.fillRect(0, 0, outputWidth, outputHeight);

        const targetRatio = outputWidth / outputHeight;
        const imageRatio = image.width / image.height;

        let cropWidth = image.width;
        let cropHeight = image.height;

        if (imageRatio > targetRatio) {
          cropWidth = image.height * targetRatio;
        } else {
          cropHeight = image.width / targetRatio;
        }

        const maxOffsetX = image.width - cropWidth;
        const maxOffsetY = image.height - cropHeight;

        const centeredX = maxOffsetX * (positionX / 100);
        const centeredY = maxOffsetY * (positionY / 100);

        const zoomFactor = clamp(zoom, 1, 2);

        cropWidth = cropWidth / zoomFactor;
        cropHeight = cropHeight / zoomFactor;

        const zoomedMaxOffsetX = image.width - cropWidth;
        const zoomedMaxOffsetY = image.height - cropHeight;

        const sourceX = clamp(
          centeredX + (maxOffsetX - zoomedMaxOffsetX) / 2,
          0,
          zoomedMaxOffsetX
        );

        const sourceY = clamp(
          centeredY + (maxOffsetY - zoomedMaxOffsetY) / 2,
          0,
          zoomedMaxOffsetY
        );

        ctx.save();

        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;

        ctx.drawImage(
          image,
          sourceX,
          sourceY,
          cropWidth,
          cropHeight,
          0,
          0,
          outputWidth,
          outputHeight
        );

        ctx.restore();

        if (copies > 1) {
          const sheetColumns = Math.ceil(Math.sqrt(copies));
          const sheetRows = Math.ceil(copies / sheetColumns);

          const gap = Math.round(8 * PX_PER_MM);

          const sheetWidth =
            sheetColumns * outputWidth + (sheetColumns + 1) * gap;

          const sheetHeight =
            sheetRows * outputHeight + (sheetRows + 1) * gap;

          const sheet = document.createElement("canvas");
          sheet.width = sheetWidth;
          sheet.height = sheetHeight;

          const sheetCtx = sheet.getContext("2d");

          if (!sheetCtx) {
            throw new Error("Unable to create print sheet.");
          }

          sheetCtx.fillStyle = "#ffffff";
          sheetCtx.fillRect(0, 0, sheetWidth, sheetHeight);

          for (let i = 0; i < copies; i++) {
            const column = i % sheetColumns;
            const row = Math.floor(i / sheetColumns);

            const x = gap + column * (outputWidth + gap);
            const y = gap + row * (outputHeight + gap);

            sheetCtx.drawImage(canvas, x, y);
          }

          if (outputUrlRef.current) {
            URL.revokeObjectURL(outputUrlRef.current);
          }

          const mimeType =
            outputFormat === "png" ? "image/png" : "image/jpeg";

          sheet.toBlob(
            (blob) => {
              if (!blob) {
                setStatus("Could not generate the photo.");
                setIsGenerating(false);
                return;
              }

              const url = URL.createObjectURL(blob);
              outputUrlRef.current = url;

              setOutputUrl(url);
              setStatus(
                `${copies} ${copies === 1 ? "copy" : "copies"} generated successfully.`
              );
              setIsGenerating(false);
            },
            mimeType,
            outputFormat === "jpg" ? quality / 100 : undefined
          );

          return;
        }

        if (outputUrlRef.current) {
          URL.revokeObjectURL(outputUrlRef.current);
        }

        const mimeType =
          outputFormat === "png" ? "image/png" : "image/jpeg";

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              setStatus("Could not generate the photo.");
              setIsGenerating(false);
              return;
            }

            const url = URL.createObjectURL(blob);
            outputUrlRef.current = url;

            setOutputUrl(url);
            setStatus("Passport photo generated successfully.");
            setIsGenerating(false);
          },
          mimeType,
          outputFormat === "jpg" ? quality / 100 : undefined
        );
      } catch (error) {
        console.error(error);
        setStatus("Something went wrong while generating the photo.");
        setIsGenerating(false);
      }
    };

    image.onerror = () => {
      setStatus("Could not read the uploaded image.");
      setIsGenerating(false);
    };

    image.src = originalUrl;
  }

  function downloadPhoto() {
    if (!outputUrl) {
      setStatus("Generate the photo first.");
      return;
    }

    const extension = outputFormat === "png" ? "png" : "jpg";

    const link = document.createElement("a");
    link.href = outputUrl;
    link.download =
      copies > 1
        ? `kt-veexora-passport-sheet.${extension}`
        : `kt-veexora-passport-photo.${extension}`;

    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  return (
    <main className="min-h-screen bg-[#f6f8fc] text-[#0B1020]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <div>
            <div className="text-2xl font-black tracking-tight">
              KT <span className="text-blue-600">VEEXORA</span>
            </div>
            <p className="text-xs font-medium text-slate-500">
              Everything You Need. One Place.
            </p>
          </div>

          <a
            href="/"
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold transition hover:bg-slate-50"
          >
            Back to Home
          </a>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-10">
        <div className="mb-8">
          <p className="mb-2 text-sm font-bold uppercase tracking-wider text-blue-600">
            Photo Tools
          </p>

          <h1 className="text-4xl font-black tracking-tight md:text-5xl">
            Passport & ID Photo Maker
          </h1>

          <p className="mt-3 max-w-2xl text-slate-600">
            Create correctly sized passport and ID-style photos with simple
            cropping, positioning, background, brightness and print-copy
            controls.
          </p>
        </div>

        {!file ? (
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`rounded-3xl border-2 border-dashed p-10 text-center transition ${
              dragActive
                ? "border-blue-500 bg-blue-50"
                : "border-slate-300 bg-white"
            }`}
          >
            <div className="mx-auto max-w-xl">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-3xl">
                🪪
              </div>

              <h2 className="text-2xl font-bold">
                Upload your photo
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                JPG, PNG or WebP • Maximum 20 MB
              </p>

              <button
                onClick={openFilePicker}
                className="mt-6 rounded-xl bg-[#2563EB] px-6 py-3 font-bold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-700"
              >
                Choose Photo
              </button>

              <p className="mt-4 text-xs text-slate-400">
                Or drag & drop an image here
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
            <aside className="space-y-5">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-bold">Photo Settings</h2>

                <div className="mt-5 space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      Country / Preset
                    </label>

                    <select
                      value={presetId}
                      onChange={(event) => setPresetId(event.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500"
                    >
                      {PRESETS.map((preset) => (
                        <option key={preset.id} value={preset.id}>
                          {preset.name} — {preset.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {presetId === "custom" && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-2 block text-xs font-semibold text-slate-600">
                          Width (mm)
                        </label>

                        <input
                          type="number"
                          min="10"
                          max="200"
                          value={customWidth}
                          onChange={(event) =>
                            setCustomWidth(
                              Math.max(10, Number(event.target.value))
                            )
                          }
                          className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-semibold text-slate-600">
                          Height (mm)
                        </label>

                        <input
                          type="number"
                          min="10"
                          max="200"
                          value={customHeight}
                          onChange={(event) =>
                            setCustomHeight(
                              Math.max(10, Number(event.target.value))
                            )
                          }
                          className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      Background
                    </label>

                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={background}
                        onChange={(event) => setBackground(event.target.value)}
                        className="h-11 w-14 cursor-pointer rounded-lg border border-slate-300"
                      />

                      <input
                        type="text"
                        value={background}
                        onChange={(event) => setBackground(event.target.value)}
                        className="flex-1 rounded-xl border border-slate-300 px-3 py-3 text-sm uppercase"
                      />
                    </div>

                    <div className="mt-3 flex gap-2">
                      {["#ffffff", "#f5f5f5", "#e8f0ff"].map((color) => (
                        <button
                          key={color}
                          onClick={() => setBackground(color)}
                          className="h-8 w-8 rounded-full border border-slate-300"
                          style={{ backgroundColor: color }}
                          aria-label={`Set background ${color}`}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex justify-between">
                      <label className="text-sm font-semibold">
                        Zoom
                      </label>
                      <span className="text-sm text-slate-500">
                        {zoom.toFixed(2)}×
                      </span>
                    </div>

                    <input
                      type="range"
                      min="1"
                      max="2"
                      step="0.01"
                      value={zoom}
                      onChange={(event) => setZoom(Number(event.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex justify-between">
                      <label className="text-sm font-semibold">
                        Horizontal Position
                      </label>
                      <span className="text-sm text-slate-500">
                        {positionX}%
                      </span>
                    </div>

                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={positionX}
                      onChange={(event) =>
                        setPositionX(Number(event.target.value))
                      }
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex justify-between">
                      <label className="text-sm font-semibold">
                        Vertical Position
                      </label>
                      <span className="text-sm text-slate-500">
                        {positionY}%
                      </span>
                    </div>

                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={positionY}
                      onChange={(event) =>
                        setPositionY(Number(event.target.value))
                      }
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex justify-between">
                      <label className="text-sm font-semibold">
                        Brightness
                      </label>
                      <span className="text-sm text-slate-500">
                        {brightness}%
                      </span>
                    </div>

                    <input
                      type="range"
                      min="70"
                      max="130"
                      value={brightness}
                      onChange={(event) =>
                        setBrightness(Number(event.target.value))
                      }
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex justify-between">
                      <label className="text-sm font-semibold">
                        Contrast
                      </label>
                      <span className="text-sm text-slate-500">
                        {contrast}%
                      </span>
                    </div>

                    <input
                      type="range"
                      min="70"
                      max="130"
                      value={contrast}
                      onChange={(event) =>
                        setContrast(Number(event.target.value))
                      }
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      Copies
                    </label>

                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={copies}
                      onChange={(event) =>
                        setCopies(
                          clamp(Number(event.target.value) || 1, 1, 20)
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm"
                    />

                    <p className="mt-1 text-xs text-slate-400">
                      More than one copy creates a printable sheet.
                    </p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      Output Format
                    </label>

                    <div className="grid grid-cols-2 gap-2">
                      {(["jpg", "png"] as const).map((format) => (
                        <button
                          key={format}
                          onClick={() => setOutputFormat(format)}
                          className={`rounded-xl border px-3 py-3 text-sm font-bold uppercase transition ${
                            outputFormat === format
                              ? "border-blue-600 bg-blue-50 text-blue-700"
                              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {format}
                        </button>
                      ))}
                    </div>
                  </div>

                  {outputFormat === "jpg" && (
                    <div>
                      <div className="mb-2 flex justify-between">
                        <label className="text-sm font-semibold">
                          JPG Quality
                        </label>
                        <span className="text-sm text-slate-500">
                          {quality}%
                        </span>
                      </div>

                      <input
                        type="range"
                        min="60"
                        max="100"
                        value={quality}
                        onChange={(event) =>
                          setQuality(Number(event.target.value))
                        }
                        className="w-full"
                      />
                    </div>
                  )}

                  <button
                    onClick={generatePassportPhoto}
                    disabled={isGenerating}
                    className="w-full rounded-xl bg-[#2563EB] px-4 py-3 font-bold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isGenerating ? "Generating..." : "Generate Photo"}
                  </button>

                  <button
                    onClick={resetSettings}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Reset Settings
                  </button>

                  <button
                    onClick={removePhoto}
                    className="w-full rounded-xl border border-red-200 px-4 py-3 font-semibold text-red-600 transition hover:bg-red-50"
                  >
                    Choose Another Photo
                  </button>
                </div>
              </div>
            </aside>

            <section className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="font-bold">Original Photo</h2>
                    <span className="text-xs text-slate-400">
                      {file?.name}
                    </span>
                  </div>

                  <div className="flex min-h-[430px] items-center justify-center rounded-2xl bg-slate-100 p-6">
                    <img
                      src={originalUrl}
                      alt="Original uploaded photo"
                      className="max-h-[390px] max-w-full rounded-xl object-contain shadow-md"
                    />
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="font-bold">Passport Preview</h2>
                    <span className="text-xs font-semibold text-blue-600">
                      {photoWidth} × {photoHeight} mm
                    </span>
                  </div>

                  <div className="flex min-h-[430px] items-center justify-center rounded-2xl bg-slate-100 p-6">
                    <div
                      className="relative max-h-[390px] max-w-full overflow-hidden shadow-xl"
                      style={{
                        aspectRatio,
                        width: "min(280px, 100%)",
                        backgroundColor: background,
                      }}
                    >
                      <img
                        src={originalUrl}
                        alt="Passport photo preview"
                        className="absolute h-full w-full object-cover"
                        style={{
                          filter: `brightness(${brightness}%) contrast(${contrast}%)`,
                          transform: `scale(${zoom})`,
                          objectPosition: `${positionX}% ${positionY}%`,
                        }}
                      />
                    </div>
                  </div>

                  <p className="mt-3 text-center text-xs text-slate-400">
                    Preview is an editing guide. Always verify the final photo
                    against the requirements of the authority you are applying
                    to.
                  </p>
                </div>
              </div>

              {status && (
                <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800">
                  {status}
                </div>
              )}

              {outputUrl && (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="text-xl font-bold">
                        Generated Photo
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        {copies > 1
                          ? `${copies} copies arranged on a printable sheet`
                          : `${photoWidth} × ${photoHeight} mm`}
                      </p>
                    </div>

                    <button
                      onClick={downloadPhoto}
                      className="rounded-xl bg-[#0B1020] px-6 py-3 font-bold text-white transition hover:bg-slate-800"
                    >
                      Download {outputFormat.toUpperCase()}
                    </button>
                  </div>

                  <div className="mt-6 flex justify-center rounded-2xl bg-slate-100 p-6">
                    <img
                      src={outputUrl}
                      alt="Generated passport photo"
                      className="max-h-[550px] max-w-full rounded-xl object-contain shadow-lg"
                    />
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        <div className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          <strong>Important:</strong> Passport and ID photo requirements can
          differ by country, authority and document type. The presets here are
          size presets and do not guarantee acceptance. Check the official
          requirements before submitting a photo.
        </div>
      </section>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className="hidden"
      />
    </main>
  );
}