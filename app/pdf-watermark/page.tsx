"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";

export default function PdfWatermarkPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [text, setText] = useState("CONFIDENTIAL");
  const [fontSize, setFontSize] = useState(32);
  const [opacity, setOpacity] = useState(0.25);
  const [rotation, setRotation] = useState(-45);
  const [position, setPosition] = useState("center");
  const [status, setStatus] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState("");

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

  const addWatermark = async () => {
    if (!file) {
      setStatus("Please upload a PDF first.");
      return;
    }

    if (!text.trim()) {
      setStatus("Please enter watermark text.");
      return;
    }

    setIsProcessing(true);
    setStatus("");
    setDownloadUrl("");

    try {
      const bytes = await file.arrayBuffer();
      const pdf = await PDFDocument.load(bytes);
      const font = await pdf.embedFont(StandardFonts.HelveticaBold);

      const pages = pdf.getPages();

      pages.forEach((page) => {
        const { width, height } = page.getSize();

        const watermarkWidth = font.widthOfTextAtSize(
          text,
          fontSize
        );

        let x = (width - watermarkWidth) / 2;
        let y = height / 2;

        if (position === "top-left") {
          x = 30;
          y = height - 60;
        }

        if (position === "top-center") {
          x = (width - watermarkWidth) / 2;
          y = height - 60;
        }

        if (position === "top-right") {
          x = width - watermarkWidth - 30;
          y = height - 60;
        }

        if (position === "bottom-left") {
          x = 30;
          y = 40;
        }

        if (position === "bottom-center") {
          x = (width - watermarkWidth) / 2;
          y = 40;
        }

        if (position === "bottom-right") {
          x = width - watermarkWidth - 30;
          y = 40;
        }

        page.drawText(text, {
          x,
          y,
          size: fontSize,
          font,
          color: rgb(0.35, 0.35, 0.35),
          opacity,
          rotate: degrees(rotation),
        });
      });

      const outputBytes = await pdf.save();

      const blob = new Blob(
        [outputBytes.buffer as ArrayBuffer],
        { type: "application/pdf" }
      );

      const url = URL.createObjectURL(blob);

      setDownloadUrl(url);
      setStatus(
        `Watermark added to all ${pages.length} page${
          pages.length !== 1 ? "s" : ""
        }.`
      );
    } catch {
      setStatus("Something went wrong while adding the watermark.");
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
    setText("CONFIDENTIAL");
    setFontSize(32);
    setOpacity(0.25);
    setRotation(-45);
    setPosition("center");
    setStatus("");
    setDownloadUrl("");
  };

  return (
    <main className="min-h-screen bg-[#f7f9fc] px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-10">

          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-[#0B1020] sm:text-4xl">
              Add Watermark to PDF
            </h1>

            <p className="mt-3 text-gray-600">
              Add custom text watermarks to every page of your PDF.
            </p>
          </div>

          {!file ? (
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-16 text-center transition hover:border-blue-500 hover:bg-blue-50">

              <div className="mb-4 text-5xl">💧</div>

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

              <div className="grid gap-5 sm:grid-cols-2">

                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 sm:col-span-2">
                  <h2 className="font-semibold text-[#0B1020]">
                    Watermark Text
                  </h2>

                  <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Enter watermark text"
                    className="mt-4 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>

                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                  <h2 className="font-semibold text-[#0B1020]">
                    Position
                  </h2>

                  <select
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="mt-4 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
                  >
                    <option value="center">Center</option>
                    <option value="top-left">Top Left</option>
                    <option value="top-center">Top Center</option>
                    <option value="top-right">Top Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="bottom-center">Bottom Center</option>
                    <option value="bottom-right">Bottom Right</option>
                  </select>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                  <h2 className="font-semibold text-[#0B1020]">
                    Rotation
                  </h2>

                  <select
                    value={rotation}
                    onChange={(e) =>
                      setRotation(Number(e.target.value))
                    }
                    className="mt-4 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
                  >
                    <option value={0}>0°</option>
                    <option value={-45}>-45°</option>
                    <option value={45}>45°</option>
                    <option value={90}>90°</option>
                  </select>
                </div>

              </div>

              <div className="grid gap-5 sm:grid-cols-2">

                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-[#0B1020]">
                      Font Size
                    </h2>

                    <span className="text-sm text-gray-500">
                      {fontSize}px
                    </span>
                  </div>

                  <input
                    type="range"
                    min="12"
                    max="80"
                    value={fontSize}
                    onChange={(e) =>
                      setFontSize(Number(e.target.value))
                    }
                    className="mt-4 w-full"
                  />
                </div>

                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-[#0B1020]">
                      Opacity
                    </h2>

                    <span className="text-sm text-gray-500">
                      {Math.round(opacity * 100)}%
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={opacity}
                    onChange={(e) =>
                      setOpacity(Number(e.target.value))
                    }
                    className="mt-4 w-full"
                  />
                </div>

              </div>

              <button
                onClick={addWatermark}
                disabled={isProcessing}
                className="w-full rounded-xl bg-[#2563EB] px-5 py-3.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isProcessing
                  ? "Adding Watermark..."
                  : "Add Watermark"}
              </button>

              {status && (
                <div className="rounded-xl bg-gray-50 p-4 text-center text-sm text-gray-700">
                  {status}
                </div>
              )}

              {downloadUrl && (
                <div className="rounded-2xl border border-green-200 bg-green-50 p-5 text-center">

                  <p className="mb-4 font-semibold text-green-800">
                    Your watermarked PDF is ready.
                  </p>

                  <a
                    href={downloadUrl}
                    download="watermarked.pdf"
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