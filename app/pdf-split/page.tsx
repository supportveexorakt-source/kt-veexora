"use client";

import { ChangeEvent, useState } from "react";
import { PDFDocument } from "pdf-lib";

export default function PdfSplitPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [pageRange, setPageRange] = useState("");
  const [status, setStatus] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState("");

  const handleFile = async (selectedFile: File) => {
    if (selectedFile.type !== "application/pdf") {
      setStatus("Please select a PDF file.");
      return;
    }

    try {
      setFile(selectedFile);
      setStatus("");
      setDownloadUrl("");

      const bytes = await selectedFile.arrayBuffer();
      const pdf = await PDFDocument.load(bytes);

      setPageCount(pdf.getPageCount());
      setPageRange(`1-${pdf.getPageCount()}`);
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

  const parsePages = (input: string, totalPages: number) => {
    const pages = new Set<number>();

    const parts = input
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);

    for (const part of parts) {
      if (part.includes("-")) {
        const [startText, endText] = part.split("-").map((x) => x.trim());

        const start = Number(startText);
        const end = Number(endText);

        if (
          !Number.isInteger(start) ||
          !Number.isInteger(end) ||
          start < 1 ||
          end < 1 ||
          start > totalPages ||
          end > totalPages ||
          start > end
        ) {
          throw new Error("Invalid page range.");
        }

        for (let i = start; i <= end; i++) {
          pages.add(i);
        }
      } else {
        const page = Number(part);

        if (
          !Number.isInteger(page) ||
          page < 1 ||
          page > totalPages
        ) {
          throw new Error("Invalid page number.");
        }

        pages.add(page);
      }
    }

    return Array.from(pages).sort((a, b) => a - b);
  };

  const splitPdf = async () => {
    if (!file) {
      setStatus("Please upload a PDF first.");
      return;
    }

    if (!pageRange.trim()) {
      setStatus("Please enter the pages you want to extract.");
      return;
    }

    setIsProcessing(true);
    setStatus("");
    setDownloadUrl("");

    try {
      const pages = parsePages(pageRange, pageCount);

      if (pages.length === 0) {
        throw new Error("No pages selected.");
      }

      const sourceBytes = await file.arrayBuffer();
      const sourcePdf = await PDFDocument.load(sourceBytes);

      const newPdf = await PDFDocument.create();

      const copiedPages = await newPdf.copyPages(
        sourcePdf,
        pages.map((page) => page - 1)
      );

      copiedPages.forEach((page) => {
        newPdf.addPage(page);
      });

      const outputBytes = await newPdf.save();

      const blob = new Blob(
        [outputBytes.buffer as ArrayBuffer],
        { type: "application/pdf" }
      );

      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);

      setStatus(
        `${pages.length} page${
          pages.length > 1 ? "s" : ""
        } extracted successfully.`
      );
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Something went wrong while splitting the PDF."
      );
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
    setPageRange("");
    setStatus("");
    setDownloadUrl("");
  };

  return (
    <main className="min-h-screen bg-[#f7f9fc] px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-10">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-[#0B1020] sm:text-4xl">
              PDF Split
            </h1>

            <p className="mt-3 text-gray-600">
              Extract selected pages from a PDF into a new PDF file.
            </p>
          </div>

          {!file ? (
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-16 text-center transition hover:border-blue-500 hover:bg-blue-50">
              <div className="mb-4 text-5xl">📄</div>

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
                      {pageCount} page{pageCount !== 1 ? "s" : ""}
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
                  Select Pages
                </h2>

                <p className="mt-2 text-sm text-gray-600">
                  Enter pages like:
                </p>

                <div className="mt-3 space-y-1 text-sm text-gray-600">
                  <p>
                    <strong>1-3</strong> → pages 1 to 3
                  </p>
                  <p>
                    <strong>1,4,7</strong> → pages 1, 4 and 7
                  </p>
                  <p>
                    <strong>1-3,6,8-10</strong> → multiple ranges
                  </p>
                </div>

                <input
                  type="text"
                  value={pageRange}
                  onChange={(e) => setPageRange(e.target.value)}
                  placeholder="Example: 1-3,5,8-10"
                  className="mt-5 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <button
                onClick={splitPdf}
                disabled={isProcessing}
                className="w-full rounded-xl bg-[#2563EB] px-5 py-3.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isProcessing ? "Processing PDF..." : "Split PDF"}
              </button>

              {status && (
                <div className="rounded-xl bg-gray-50 p-4 text-center text-sm text-gray-700">
                  {status}
                </div>
              )}

              {downloadUrl && (
                <div className="rounded-2xl border border-green-200 bg-green-50 p-5 text-center">
                  <p className="mb-4 font-semibold text-green-800">
                    Your new PDF is ready.
                  </p>

                  <a
                    href={downloadUrl}
                    download="split-pages.pdf"
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