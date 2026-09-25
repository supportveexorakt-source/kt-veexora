"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { PDFDocument, rgb } from "pdf-lib";

export default function PdfSignPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [signature, setSignature] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [xPosition, setXPosition] = useState(50);
  const [yPosition, setYPosition] = useState(50);
  const [fontSize, setFontSize] = useState(28);
  const [status, setStatus] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState("");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);

  useEffect(() => {
    return () => {
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [downloadUrl]);

  const handleFile = async (selectedFile: File) => {
    if (selectedFile.type !== "application/pdf") {
      setStatus("Please select a PDF file.");
      return;
    }

    try {
      const bytes = await selectedFile.arrayBuffer();
      const pdf = await PDFDocument.load(bytes);

      setFile(selectedFile);
      setPageCount(pdf.getPageCount());
      setPageNumber(1);
      setStatus("");
      setDownloadUrl("");
    } catch {
      setStatus("Could not read this PDF.");
    }
  };

  const handleInput = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];

    if (selectedFile) {
      handleFile(selectedFile);
    }
  };

  const getCanvasPosition = (
    event: React.PointerEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return { x: 0, y: 0 };
    }

    const rect = canvas.getBoundingClientRect();

    return {
      x:
        ((event.clientX - rect.left) / rect.width) *
        canvas.width,
      y:
        ((event.clientY - rect.top) / rect.height) *
        canvas.height,
    };
  };

  const startDrawing = (
    event: React.PointerEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    drawing.current = true;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    const { x, y } = getCanvasPosition(event);

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (
    event: React.PointerEvent<HTMLCanvasElement>
  ) => {
    if (!drawing.current) return;

    const canvas = canvasRef.current;

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    const { x, y } = getCanvasPosition(event);

    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#111827";

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    drawing.current = false;
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const addSignature = async () => {
    if (!file) {
      setStatus("Please upload a PDF first.");
      return;
    }

    const canvas = canvasRef.current;

    if (!canvas) {
      setStatus("Please draw your signature first.");
      return;
    }

    const signatureData = canvas.toDataURL("image/png");

    if (signatureData.length < 1000) {
      setStatus("Please draw your signature first.");
      return;
    }

    setIsProcessing(true);
    setStatus("");
    setDownloadUrl("");

    try {
      const bytes = await file.arrayBuffer();
      const pdf = await PDFDocument.load(bytes);

      const pages = pdf.getPages();

      if (pageNumber < 1 || pageNumber > pages.length) {
        setStatus("Invalid page number.");
        setIsProcessing(false);
        return;
      }

      const page = pages[pageNumber - 1];
      const pngImage = await pdf.embedPng(signatureData);

      const { width, height } = page.getSize();

      const signatureWidth = 150;
      const signatureHeight =
        (pngImage.height / pngImage.width) *
        signatureWidth;

      const x = Math.max(
        0,
        Math.min(
          width - signatureWidth,
          (xPosition / 100) * width
        )
      );

      const y = Math.max(
        0,
        Math.min(
          height - signatureHeight,
          (yPosition / 100) * height
        )
      );

      page.drawImage(pngImage, {
        x,
        y,
        width: signatureWidth,
        height: signatureHeight,
      });

      const outputBytes = await pdf.save();

      const blob = new Blob(
        [outputBytes.buffer as ArrayBuffer],
        { type: "application/pdf" }
      );

      const url = URL.createObjectURL(blob);

      setDownloadUrl(url);

      setStatus(
        `Signature added successfully to page ${pageNumber}.`
      );
    } catch {
      setStatus("Something went wrong while signing the PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
    }

    setFile(null);
    setPageCount(0);
    setSignature("");
    setPageNumber(1);
    setXPosition(50);
    setYPosition(50);
    setFontSize(28);
    setStatus("");
    setDownloadUrl("");

    clearSignature();
  };

  return (
    <main className="min-h-screen bg-[#f7f9fc] px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-10">

          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-[#0B1020] sm:text-4xl">
              Sign PDF
            </h1>

            <p className="mt-3 text-gray-600">
              Draw your signature and place it on a PDF page.
            </p>
          </div>

          {!file ? (
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-16 text-center transition hover:border-blue-500 hover:bg-blue-50">

              <div className="mb-4 text-5xl">✍️</div>

              <h2 className="text-xl font-semibold text-[#0B1020]">
                Upload PDF
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Click here to select a PDF file
              </p>

              <input
                type="file"
                accept="application/pdf"
                onChange={handleInput}
                className="hidden"
              />
            </label>
          ) : (
            <div className="space-y-6">

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                  <div>
                    <p className="font-semibold text-[#0B1020]">
                      {file.name}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {pageCount} page
                      {pageCount !== 1 ? "s" : ""}
                    </p>
                  </div>

                  <button
                    onClick={reset}
                    className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                  >
                    Choose Another PDF
                  </button>

                </div>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">

                <h2 className="text-lg font-semibold text-[#0B1020]">
                  Draw Your Signature
                </h2>

                <p className="mt-2 text-sm text-gray-600">
                  Use your mouse, trackpad, or touchscreen.
                </p>

                <div className="mt-5 overflow-hidden rounded-xl border-2 border-gray-300 bg-white">
                  <canvas
                    ref={canvasRef}
                    width={700}
                    height={250}
                    className="h-48 w-full touch-none"
                    onPointerDown={startDrawing}
                    onPointerMove={draw}
                    onPointerUp={stopDrawing}
                    onPointerLeave={stopDrawing}
                  />
                </div>

                <button
                  onClick={clearSignature}
                  className="mt-3 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Clear Signature
                </button>

              </div>

              <div className="grid gap-5 sm:grid-cols-2">

                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">

                  <h2 className="font-semibold text-[#0B1020]">
                    Page Number
                  </h2>

                  <input
                    type="number"
                    min="1"
                    max={pageCount}
                    value={pageNumber}
                    onChange={(e) =>
                      setPageNumber(
                        Math.max(
                          1,
                          Math.min(
                            pageCount,
                            Number(e.target.value)
                          )
                        )
                      )
                    }
                    className="mt-4 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
                  />

                </div>

                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">

                  <h2 className="font-semibold text-[#0B1020]">
                    Signature Size
                  </h2>

                  <input
                    type="range"
                    min="12"
                    max="60"
                    value={fontSize}
                    onChange={(e) =>
                      setFontSize(Number(e.target.value))
                    }
                    className="mt-5 w-full"
                  />

                  <p className="mt-2 text-sm text-gray-500">
                    Size: {fontSize}
                  </p>

                </div>

              </div>

              <div className="grid gap-5 sm:grid-cols-2">

                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">

                  <h2 className="font-semibold text-[#0B1020]">
                    Horizontal Position
                  </h2>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={xPosition}
                    onChange={(e) =>
                      setXPosition(Number(e.target.value))
                    }
                    className="mt-5 w-full"
                  />

                </div>

                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">

                  <h2 className="font-semibold text-[#0B1020]">
                    Vertical Position
                  </h2>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={yPosition}
                    onChange={(e) =>
                      setYPosition(Number(e.target.value))
                    }
                    className="mt-5 w-full"
                  />

                </div>

              </div>

              <button
                onClick={addSignature}
                disabled={isProcessing}
                className="w-full rounded-xl bg-[#2563EB] px-5 py-3.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isProcessing
                  ? "Signing PDF..."
                  : "Add Signature to PDF"}
              </button>

              {status && (
                <div className="rounded-xl bg-gray-50 p-4 text-center text-sm text-gray-700">
                  {status}
                </div>
              )}

              {downloadUrl && (
                <div className="rounded-2xl border border-green-200 bg-green-50 p-5 text-center">

                  <p className="mb-4 font-semibold text-green-800">
                    Your signed PDF is ready.
                  </p>

                  <a
                    href={downloadUrl}
                    download="signed.pdf"
                    className="inline-block rounded-xl bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700"
                  >
                    Download PDF
                  </a>

                </div>
              )}

              <button
                onClick={reset}
                className="w-full rounded-xl border border-gray-300 bg-white px-5 py-3 font-medium text-gray-700 hover:bg-gray-50"
              >
                Reset
              </button>

            </div>
          )}

          <p className="mt-8 text-center text-xs text-gray-500">
            Your PDF is processed directly in your browser.
          </p>

        </div>
      </div>
    </main>
  );
}