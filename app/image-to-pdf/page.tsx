"use client";

import { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState } from "react";
import { jsPDF } from "jspdf";

type PageSize = "a4" | "a5" | "letter" | "original";
type Orientation = "portrait" | "landscape";
type FitMode = "fit" | "fill";

type ImageItem = {
  id: string;
  file: File;
  url: string;
  width: number;
  height: number;
};

const PAGE_SIZES = {
  a4: {
    name: "A4",
    width: 210,
    height: 297,
  },
  a5: {
    name: "A5",
    width: 148,
    height: 210,
  },
  letter: {
    name: "Letter",
    width: 215.9,
    height: 279.4,
  },
};

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load image."));

    image.src = url;
  });
}

export default function ImageToPdfPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [images, setImages] = useState<ImageItem[]>([]);
  const [pageSize, setPageSize] = useState<PageSize>("a4");
  const [orientation, setOrientation] =
    useState<Orientation>("portrait");
  const [fitMode, setFitMode] = useState<FitMode>("fit");
  const [margin, setMargin] = useState(10);
  const [pdfQuality, setPdfQuality] = useState(92);

  const [dragActive, setDragActive] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");

  const pdfUrlRef = useRef<string | null>(null);

  const pageDimensions = useMemo(() => {
    if (pageSize === "original") {
      return null;
    }

    const selected = PAGE_SIZES[pageSize];

    if (orientation === "portrait") {
      return {
        width: selected.width,
        height: selected.height,
      };
    }

    return {
      width: selected.height,
      height: selected.width,
    };
  }, [pageSize, orientation]);

  useEffect(() => {
    return () => {
      images.forEach((item) => URL.revokeObjectURL(item.url));

      if (pdfUrlRef.current) {
        URL.revokeObjectURL(pdfUrlRef.current);
      }
    };
  }, [images]);

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  async function processFiles(fileList: FileList | File[]) {
    const selectedFiles = Array.from(fileList).filter((file) =>
      file.type.startsWith("image/")
    );

    if (!selectedFiles.length) {
      setStatus("Please select image files only.");
      return;
    }

    const totalSize = selectedFiles.reduce(
      (total, file) => total + file.size,
      0
    );

    if (totalSize > 100 * 1024 * 1024) {
      setStatus("The total selected image size must be below 100 MB.");
      return;
    }

    const newItems: ImageItem[] = [];

    for (const file of selectedFiles) {
      try {
        const url = URL.createObjectURL(file);
        const image = await loadImage(url);

        newItems.push({
          id: createId(),
          file,
          url,
          width: image.naturalWidth,
          height: image.naturalHeight,
        });
      } catch {
        setStatus(`Could not read ${file.name}.`);
      }
    }

    if (!newItems.length) {
      return;
    }

    setImages((current) => [...current, ...newItems]);
    setPdfUrl("");
    setStatus(
      `${newItems.length} ${
        newItems.length === 1 ? "image" : "images"
      } added successfully.`
    );
  }

  function handleFileInput(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) {
      processFiles(event.target.files);
    }

    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);

    if (event.dataTransfer.files) {
      processFiles(event.dataTransfer.files);
    }
  }

  function removeImage(id: string) {
    setImages((current) => {
      const item = current.find((image) => image.id === id);

      if (item) {
        URL.revokeObjectURL(item.url);
      }

      return current.filter((image) => image.id !== id);
    });

    setPdfUrl("");
  }

  function moveImage(index: number, direction: -1 | 1) {
    setImages((current) => {
      const targetIndex = index + direction;

      if (
        targetIndex < 0 ||
        targetIndex >= current.length
      ) {
        return current;
      }

      const updated = [...current];

      [updated[index], updated[targetIndex]] = [
        updated[targetIndex],
        updated[index],
      ];

      return updated;
    });

    setPdfUrl("");
  }

  function clearAll() {
    images.forEach((item) => URL.revokeObjectURL(item.url));

    setImages([]);
    setPdfUrl("");
    setStatus("");
  }

  function resetSettings() {
    setPageSize("a4");
    setOrientation("portrait");
    setFitMode("fit");
    setMargin(10);
    setPdfQuality(92);
    setPdfUrl("");
    setStatus(images.length ? "PDF settings reset." : "");
  }

  async function generatePdf() {
    if (!images.length) {
      setStatus("Please add at least one image first.");
      return;
    }

    setIsGenerating(true);
    setStatus("Creating PDF...");

    try {
      let pdf: jsPDF;

      if (pageSize === "original") {
        const firstImage = images[0];

        const firstRatio =
          firstImage.width / firstImage.height;

        const baseWidth = 210;
        const baseHeight = baseWidth / firstRatio;

        pdf = new jsPDF({
          orientation:
            baseWidth > baseHeight
              ? "landscape"
              : "portrait",
          unit: "mm",
          format: [baseWidth, baseHeight],
          compress: true,
        });
      } else {
        pdf = new jsPDF({
          orientation,
          unit: "mm",
          format: pageSize,
          compress: true,
        });
      }

      for (let index = 0; index < images.length; index++) {
        const item = images[index];

        if (index > 0) {
          if (pageSize === "original") {
            const ratio = item.width / item.height;

            const baseWidth = 210;
            const baseHeight = baseWidth / ratio;

            pdf.addPage(
              [baseWidth, baseHeight],
              baseWidth > baseHeight
                ? "landscape"
                : "portrait"
            );
          } else {
            pdf.addPage(pageSize, orientation);
          }
        }

        const image = await loadImage(item.url);

        const currentPageWidth = pdf.internal.pageSize.getWidth();
        const currentPageHeight =
          pdf.internal.pageSize.getHeight();

        const safeMargin = clamp(
          margin,
          0,
          Math.min(currentPageWidth, currentPageHeight) / 3
        );

        const availableWidth =
          currentPageWidth - safeMargin * 2;

        const availableHeight =
          currentPageHeight - safeMargin * 2;

        const imageRatio =
          image.naturalWidth / image.naturalHeight;

        const availableRatio =
          availableWidth / availableHeight;

        let drawWidth = availableWidth;
        let drawHeight = availableHeight;

        if (fitMode === "fit") {
          if (imageRatio > availableRatio) {
            drawWidth = availableWidth;
            drawHeight = drawWidth / imageRatio;
          } else {
            drawHeight = availableHeight;
            drawWidth = drawHeight * imageRatio;
          }
        } else {
          if (imageRatio > availableRatio) {
            drawHeight = availableHeight;
            drawWidth = drawHeight * imageRatio;
          } else {
            drawWidth = availableWidth;
            drawHeight = drawWidth / imageRatio;
          }
        }

        const x =
          (currentPageWidth - drawWidth) / 2;

        const y =
          (currentPageHeight - drawHeight) / 2;

        const canvas = document.createElement("canvas");

        canvas.width = Math.min(
          image.naturalWidth,
          2500
        );

        canvas.height = Math.round(
          canvas.width / imageRatio
        );

        const ctx = canvas.getContext("2d");

        if (!ctx) {
          throw new Error("Could not create canvas.");
        }

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(
          0,
          0,
          canvas.width,
          canvas.height
        );

        if (fitMode === "fill") {
          const sourceRatio =
            image.naturalWidth /
            image.naturalHeight;

          const targetRatio =
            canvas.width / canvas.height;

          let sourceWidth = image.naturalWidth;
          let sourceHeight = image.naturalHeight;

          let sourceX = 0;
          let sourceY = 0;

          if (sourceRatio > targetRatio) {
            sourceWidth =
              image.naturalHeight * targetRatio;

            sourceX =
              (image.naturalWidth - sourceWidth) / 2;
          } else {
            sourceHeight =
              image.naturalWidth / targetRatio;

            sourceY =
              (image.naturalHeight - sourceHeight) / 2;
          }

          ctx.drawImage(
            image,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            0,
            0,
            canvas.width,
            canvas.height
          );
        } else {
          ctx.drawImage(
            image,
            0,
            0,
            canvas.width,
            canvas.height
          );
        }

        const imageData = canvas.toDataURL(
          "image/jpeg",
          pdfQuality / 100
        );

        pdf.addImage(
          imageData,
          "JPEG",
          x,
          y,
          drawWidth,
          drawHeight,
          undefined,
          "FAST"
        );
      }

      const blob = pdf.output("blob");

      if (pdfUrlRef.current) {
        URL.revokeObjectURL(pdfUrlRef.current);
      }

      const url = URL.createObjectURL(blob);
      pdfUrlRef.current = url;

      setPdfUrl(url);
      setStatus(
        `PDF created successfully with ${images.length} ${
          images.length === 1 ? "page" : "pages"
        }.`
      );
    } catch (error) {
      console.error(error);
      setStatus("Something went wrong while creating the PDF.");
    } finally {
      setIsGenerating(false);
    }
  }

  function downloadPdf() {
    if (!pdfUrl) {
      setStatus("Create the PDF first.");
      return;
    }

    const link = document.createElement("a");

    link.href = pdfUrl;
    link.download = "kt-veexora-images.pdf";

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
            PDF Tools
          </p>

          <h1 className="text-4xl font-black tracking-tight md:text-5xl">
            Image to PDF
          </h1>

          <p className="mt-3 max-w-2xl text-slate-600">
            Convert one or multiple images into a clean PDF. Choose
            the page size, orientation, margins and image fitting.
          </p>
        </div>

        {images.length === 0 ? (
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`rounded-3xl border-2 border-dashed p-12 text-center transition ${
              dragActive
                ? "border-blue-500 bg-blue-50"
                : "border-slate-300 bg-white"
            }`}
          >
            <div className="mx-auto max-w-xl">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-3xl">
                📄
              </div>

              <h2 className="text-2xl font-bold">
                Add images to create a PDF
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                JPG, PNG and WebP • Up to 100 MB total
              </p>

              <button
                onClick={openFilePicker}
                className="mt-6 rounded-xl bg-[#2563EB] px-6 py-3 font-bold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-700"
              >
                Choose Images
              </button>

              <p className="mt-4 text-xs text-slate-400">
                Or drag & drop multiple images here
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
            <aside className="space-y-5">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-bold">
                  PDF Settings
                </h2>

                <div className="mt-5 space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      Page Size
                    </label>

                    <select
                      value={pageSize}
                      onChange={(event) =>
                        setPageSize(
                          event.target.value as PageSize
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500"
                    >
                      <option value="a4">
                        A4 — 210 × 297 mm
                      </option>
                      <option value="a5">
                        A5 — 148 × 210 mm
                      </option>
                      <option value="letter">
                        Letter — 8.5 × 11 in
                      </option>
                      <option value="original">
                        Original Ratio
                      </option>
                    </select>
                  </div>

                  {pageSize !== "original" && (
                    <div>
                      <label className="mb-2 block text-sm font-semibold">
                        Orientation
                      </label>

                      <div className="grid grid-cols-2 gap-2">
                        {(
                          [
                            "portrait",
                            "landscape",
                          ] as Orientation[]
                        ).map((item) => (
                          <button
                            key={item}
                            onClick={() =>
                              setOrientation(item)
                            }
                            className={`rounded-xl border px-3 py-3 text-sm font-bold capitalize transition ${
                              orientation === item
                                ? "border-blue-600 bg-blue-50 text-blue-700"
                                : "border-slate-200 text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      Image Fit
                    </label>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setFitMode("fit")}
                        className={`rounded-xl border px-3 py-3 text-sm font-bold transition ${
                          fitMode === "fit"
                            ? "border-blue-600 bg-blue-50 text-blue-700"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        Fit
                      </button>

                      <button
                        onClick={() => setFitMode("fill")}
                        className={`rounded-xl border px-3 py-3 text-sm font-bold transition ${
                          fitMode === "fill"
                            ? "border-blue-600 bg-blue-50 text-blue-700"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        Fill
                      </button>
                    </div>

                    <p className="mt-2 text-xs text-slate-400">
                      Fit keeps the whole image. Fill crops edges
                      when necessary.
                    </p>
                  </div>

                  <div>
                    <div className="mb-2 flex justify-between">
                      <label className="text-sm font-semibold">
                        Margin
                      </label>

                      <span className="text-sm text-slate-500">
                        {margin} mm
                      </span>
                    </div>

                    <input
                      type="range"
                      min="0"
                      max="30"
                      value={margin}
                      onChange={(event) =>
                        setMargin(Number(event.target.value))
                      }
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex justify-between">
                      <label className="text-sm font-semibold">
                        Image Quality
                      </label>

                      <span className="text-sm text-slate-500">
                        {pdfQuality}%
                      </span>
                    </div>

                    <input
                      type="range"
                      min="50"
                      max="100"
                      value={pdfQuality}
                      onChange={(event) =>
                        setPdfQuality(
                          Number(event.target.value)
                        )
                      }
                      className="w-full"
                    />
                  </div>

                  <button
                    onClick={generatePdf}
                    disabled={isGenerating}
                    className="w-full rounded-xl bg-[#2563EB] px-4 py-3 font-bold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isGenerating
                      ? "Creating PDF..."
                      : "Create PDF"}
                  </button>

                  <button
                    onClick={resetSettings}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Reset Settings
                  </button>

                  <button
                    onClick={openFilePicker}
                    className="w-full rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 font-semibold text-blue-700 transition hover:bg-blue-100"
                  >
                    + Add More Images
                  </button>

                  <button
                    onClick={clearAll}
                    className="w-full rounded-xl border border-red-200 px-4 py-3 font-semibold text-red-600 transition hover:bg-red-50"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </aside>

            <section className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-bold">
                      Your Images
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      {images.length}{" "}
                      {images.length === 1
                        ? "image"
                        : "images"}{" "}
                      • Drag order using the arrows
                    </p>
                  </div>

                  <button
                    onClick={openFilePicker}
                    className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
                  >
                    + Add Images
                  </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {images.map((item, index) => (
                    <div
                      key={item.id}
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
                    >
                      <div className="relative flex h-52 items-center justify-center bg-slate-100 p-3">
                        <img
                          src={item.url}
                          alt={item.file.name}
                          className="max-h-full max-w-full rounded-lg object-contain"
                        />

                        <div className="absolute left-3 top-3 rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-bold text-white">
                          Page {index + 1}
                        </div>

                        <button
                          onClick={() => removeImage(item.id)}
                          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-red-600 shadow-md transition hover:bg-red-50"
                          aria-label="Remove image"
                        >
                          ×
                        </button>
                      </div>

                      <div className="p-4">
                        <p
                          className="truncate text-sm font-semibold"
                          title={item.file.name}
                        >
                          {item.file.name}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {item.width} × {item.height}px
                        </p>

                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={() =>
                              moveImage(index, -1)
                            }
                            disabled={index === 0}
                            className="flex-1 rounded-lg border border-slate-200 bg-white py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            ↑ Move Up
                          </button>

                          <button
                            onClick={() =>
                              moveImage(index, 1)
                            }
                            disabled={
                              index === images.length - 1
                            }
                            className="flex-1 rounded-lg border border-slate-200 bg-white py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            ↓ Move Down
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {status && (
                <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800">
                  {status}
                </div>
              )}

              {pdfUrl && (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-xl font-bold">
                        PDF Ready
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        Your {images.length}-page PDF has been
                        created.
                      </p>
                    </div>

                    <button
                      onClick={downloadPdf}
                      className="rounded-xl bg-[#0B1020] px-6 py-3 font-bold text-white transition hover:bg-slate-800"
                    >
                      Download PDF
                    </button>
                  </div>

                  <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                    <iframe
                      src={pdfUrl}
                      title="Generated PDF preview"
                      className="h-[650px] w-full"
                    />
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
          <strong className="text-slate-900">
            Privacy:
          </strong>{" "}
          Images are processed directly in your browser for this
          tool. They are not intentionally uploaded to a VEEXORA
          server.
        </div>
      </section>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileInput}
        className="hidden"
      />
    </main>
  );
}