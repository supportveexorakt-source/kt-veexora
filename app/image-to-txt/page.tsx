"use client";

import {
  ChangeEvent,
  DragEvent,
  useEffect,
  useRef,
  useState,
} from "react";

type ImageItem = {
  id: string;
  file: File;
  url: string;
  name: string;
  text: string;
  status: "pending" | "processing" | "done" | "error";
};

type TesseractWorker = {
  recognize: (image: string | File) => Promise<{
    data: {
      text: string;
    };
  }>;
  terminate: () => Promise<void>;
};

type TesseractAPI = {
  createWorker: (
    lang: string,
    oem: number,
    options?: {
      workerPath?: string;
      corePath?: string;
      langPath?: string;
      workerBlobURL?: boolean;
      logger?: (message: {
        status?: string;
        progress?: number;
      }) => void;
    }
  ) => Promise<TesseractWorker>;
};

declare global {
  interface Window {
    Tesseract?: TesseractAPI;
  }
}

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function ImageToTxtPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const workerRef = useRef<TesseractWorker | null>(null);
  const tesseractLoadingRef = useRef<Promise<TesseractAPI> | null>(null);

  const [images, setImages] = useState<ImageItem[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    return () => {
      images.forEach((item) => URL.revokeObjectURL(item.url));

      if (workerRef.current) {
        workerRef.current.terminate().catch(() => {});
        workerRef.current = null;
      }
    };
  }, []);

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function addFiles(fileList: FileList | File[]) {
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

    if (totalSize > 50 * 1024 * 1024) {
      setStatus("The total selected image size must be below 50 MB.");
      return;
    }

    const newItems: ImageItem[] = selectedFiles.map((file) => ({
      id: createId(),
      file,
      url: URL.createObjectURL(file),
      name: file.name,
      text: "",
      status: "pending",
    }));

    setImages((current) => [...current, ...newItems]);

    setStatus(
      `${newItems.length} ${
        newItems.length === 1 ? "image" : "images"
      } added successfully.`
    );
  }

  function handleFileInput(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) {
      addFiles(event.target.files);
    }

    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);

    if (event.dataTransfer.files) {
      addFiles(event.dataTransfer.files);
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

    setStatus("");
  }

  function clearAll() {
    images.forEach((item) => URL.revokeObjectURL(item.url));
    setImages([]);
    setStatus("");
  }

  async function loadTesseract(): Promise<TesseractAPI> {
    if (window.Tesseract) {
      return window.Tesseract;
    }

    if (tesseractLoadingRef.current) {
      return tesseractLoadingRef.current;
    }

    tesseractLoadingRef.current = new Promise(
      (resolve, reject) => {
        const existingScript = document.querySelector(
          'script[data-veexora-tesseract="true"]'
        ) as HTMLScriptElement | null;

        if (existingScript) {
          existingScript.addEventListener("load", () => {
            if (window.Tesseract) {
              resolve(window.Tesseract);
            } else {
              reject(
                new Error("Tesseract loaded but was not found.")
              );
            }
          });

          existingScript.addEventListener("error", () => {
            reject(new Error("Could not load the OCR engine."));
          });

          return;
        }

        const script = document.createElement("script");

        script.src =
          "https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/dist/tesseract.min.js";

        script.async = true;

        script.setAttribute(
          "data-veexora-tesseract",
          "true"
        );

        script.onload = () => {
          if (window.Tesseract) {
            resolve(window.Tesseract);
          } else {
            reject(
              new Error("Tesseract loaded but was not found.")
            );
          }
        };

        script.onerror = () => {
          reject(
            new Error(
              "Could not load the OCR engine from the CDN."
            )
          );
        };

        document.head.appendChild(script);
      }
    );

    return tesseractLoadingRef.current;
  }

  async function getWorker() {
    if (workerRef.current) {
      return workerRef.current;
    }

    setStatus("Loading OCR engine...");

    const Tesseract = await loadTesseract();

    const worker = await Tesseract.createWorker(
      "eng",
      1,
      {
        workerPath:
          "https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/dist/worker.min.js",

        corePath:
          "https://cdn.jsdelivr.net/npm/tesseract.js-core@7.0.0",

        langPath:
          "https://tessdata.projectnaptha.com/4.0.0",

        workerBlobURL: true,

        logger: (message) => {
          if (
            message.status === "recognizing text" &&
            typeof message.progress === "number"
          ) {
            const progress = Math.round(
              message.progress * 100
            );

            setStatus(`Reading text... ${progress}%`);
          }
        },
      }
    );

    workerRef.current = worker;

    return worker;
  }

  async function extractAllText() {
    if (!images.length) {
      setStatus("Please add at least one image first.");
      return;
    }

    setIsProcessing(true);

    try {
      const worker = await getWorker();

      for (const item of images) {
        setImages((current) =>
          current.map((image) =>
            image.id === item.id
              ? {
                  ...image,
                  status: "processing",
                }
              : image
          )
        );

        try {
          const result = await worker.recognize(item.url);

          const text = result.data.text.trim();

          setImages((current) =>
            current.map((image) =>
              image.id === item.id
                ? {
                    ...image,
                    text,
                    status: "done",
                  }
                : image
            )
          );
        } catch (error) {
          console.error(error);

          setImages((current) =>
            current.map((image) =>
              image.id === item.id
                ? {
                    ...image,
                    status: "error",
                  }
                : image
            )
          );
        }
      }

      setStatus("OCR completed successfully.");
    } catch (error) {
      console.error(error);

      setStatus(
        "OCR engine could not start. Please refresh and try again."
      );
    } finally {
      setIsProcessing(false);
    }
  }

  function updateText(id: string, text: string) {
    setImages((current) =>
      current.map((image) =>
        image.id === id
          ? {
              ...image,
              text,
            }
          : image
      )
    );
  }

  async function downloadTxt() {
    const completedImages = images.filter(
      (image) => image.text.trim()
    );

    if (!completedImages.length) {
      setStatus("Extract text from at least one image first.");
      return;
    }

    const content = completedImages
      .map((item) => {
        return `===== ${item.name} =====\n\n${item.text}`;
      })
      .join("\n\n\n");

    const blob = new Blob([content], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);

    const link = window.document.createElement("a");
    link.href = url;
    link.download = "kt-veexora-extracted-text.txt";

    window.document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);

    setStatus("TXT file downloaded successfully.");
  }

  async function copyAllText() {
    const completedImages = images.filter(
      (image) => image.text.trim()
    );

    if (!completedImages.length) {
      setStatus("Extract text from at least one image first.");
      return;
    }

    const content = completedImages
      .map((item) => item.text)
      .join("\n\n");

    try {
      await navigator.clipboard.writeText(content);
      setStatus("All extracted text copied to clipboard.");
    } catch {
      setStatus("Could not copy text automatically.");
    }
  }

  const completedCount = images.filter(
    (image) => image.status === "done"
  ).length;

  return (
    <main className="min-h-screen bg-[#f6f8fc] text-[#0B1020]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <div>
            <div className="text-2xl font-black tracking-tight">
              KT{" "}
              <span className="text-blue-600">
                VEEXORA
              </span>
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
            OCR Tools
          </p>

          <h1 className="text-4xl font-black tracking-tight md:text-5xl">
            Image to TXT
          </h1>

          <p className="mt-3 max-w-2xl text-slate-600">
            Extract text from images with OCR, edit the
            extracted text, copy it, or download it as a
            TXT file.
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
                📝
              </div>

              <h2 className="text-2xl font-bold">
                Upload an image
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                JPG, PNG and WebP • Up to 50 MB total
              </p>

              <button
                onClick={openFilePicker}
                className="mt-6 rounded-xl bg-[#2563EB] px-6 py-3 font-bold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-700"
              >
                Choose Images
              </button>

              <p className="mt-4 text-xs text-slate-400">
                Or drag & drop images here
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-bold">
                    Your Images
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {images.length}{" "}
                    {images.length === 1
                      ? "image"
                      : "images"}{" "}
                    • {completedCount} processed
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={openFilePicker}
                    className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
                  >
                    + Add Images
                  </button>

                  <button
                    onClick={extractAllText}
                    disabled={isProcessing}
                    className="rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isProcessing
                      ? "Reading Text..."
                      : "Extract Text"}
                  </button>

                  <button
                    onClick={copyAllText}
                    disabled={completedCount === 0}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    Copy All
                  </button>

                  <button
                    onClick={downloadTxt}
                    disabled={completedCount === 0}
                    className="rounded-xl bg-[#0B1020] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-50"
                  >
                    Download TXT
                  </button>

                  <button
                    onClick={clearAll}
                    className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </div>

            {status && (
              <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800">
                {status}
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              {images.map((item, index) => (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="relative flex h-64 items-center justify-center bg-slate-100 p-5">
                    <img
                      src={item.url}
                      alt={item.name}
                      className="max-h-full max-w-full rounded-xl object-contain shadow-sm"
                    />

                    <div className="absolute left-4 top-4 rounded-lg bg-slate-900 px-3 py-1 text-xs font-bold text-white">
                      Image {index + 1}
                    </div>

                    <button
                      onClick={() => removeImage(item.id)}
                      className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white text-lg text-red-600 shadow-md transition hover:bg-red-50"
                      aria-label="Remove image"
                    >
                      ×
                    </button>
                  </div>

                  <div className="p-5">
                    <div className="flex items-center justify-between gap-3">
                      <h3
                        className="truncate font-bold"
                        title={item.name}
                      >
                        {item.name}
                      </h3>

                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                          item.status === "done"
                            ? "bg-green-100 text-green-700"
                            : item.status === "processing"
                            ? "bg-blue-100 text-blue-700"
                            : item.status === "error"
                            ? "bg-red-100 text-red-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {item.status === "done"
                          ? "Done"
                          : item.status === "processing"
                          ? "Processing..."
                          : item.status === "error"
                          ? "Error"
                          : "Pending"}
                      </span>
                    </div>

                    <div className="mt-4">
                      <label className="mb-2 block text-sm font-semibold">
                        Extracted / Editable Text
                      </label>

                      <textarea
                        value={item.text}
                        onChange={(event) =>
                          updateText(
                            item.id,
                            event.target.value
                          )
                        }
                        placeholder="Click Extract Text to detect text from this image..."
                        className="min-h-48 w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 outline-none transition focus:border-blue-500 focus:bg-white"
                      />
                    </div>

                    <button
                      onClick={() =>
                        extractAllText()
                      }
                      disabled={
                        item.status === "processing" ||
                        isProcessing
                      }
                      className="mt-4 w-full rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm font-bold text-blue-700 transition hover:bg-blue-100 disabled:opacity-50"
                    >
                      OCR This Image
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
              <strong className="text-slate-900">
                Privacy:
              </strong>{" "}
              OCR recognition runs in your browser. Your
              image is not intentionally uploaded to a
              VEEXORA server.
            </div>
          </div>
        )}
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