"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { PDFDocument } from "pdf-lib";

type PageItem = {
  originalIndex: number;
};

export default function PdfOrganizePage() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageItem[]>([]);
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
      const pageCount = pdf.getPageCount();

      setFile(selectedFile);

      setPages(
        Array.from({ length: pageCount }, (_, index) => ({
          originalIndex: index,
        }))
      );

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

  const movePage = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;

    if (newIndex < 0 || newIndex >= pages.length) {
      return;
    }

    const updatedPages = [...pages];

    [updatedPages[index], updatedPages[newIndex]] = [
      updatedPages[newIndex],
      updatedPages[index],
    ];

    setPages(updatedPages);
  };

  const removePage = (index: number) => {
    setPages((current) =>
      current.filter((_, pageIndex) => pageIndex !== index)
    );
  };

  const restorePages = async () => {
    if (!file) return;

    try {
      const bytes = await file.arrayBuffer();
      const pdf = await PDFDocument.load(bytes);

      setPages(
        Array.from(
          { length: pdf.getPageCount() },
          (_, index) => ({
            originalIndex: index,
          })
        )
      );

      setStatus("");
    } catch {
      setStatus("Could not restore the page order.");
    }
  };

  const saveOrganizedPdf = async () => {
    if (!file) {
      setStatus("Please upload a PDF first.");
      return;
    }

    if (pages.length === 0) {
      setStatus("Please keep at least one page.");
      return;
    }

    setIsProcessing(true);
    setStatus("");
    setDownloadUrl("");

    try {
      const bytes = await file.arrayBuffer();

      const sourcePdf = await PDFDocument.load(bytes);
      const newPdf = await PDFDocument.create();

      const copiedPages = await newPdf.copyPages(
        sourcePdf,
        pages.map((page) => page.originalIndex)
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
        `PDF organized successfully with ${pages.length} page${
          pages.length !== 1 ? "s" : ""
        }.`
      );
    } catch {
      setStatus("Something went wrong while organizing the PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
    }

    setFile(null);
    setPages([]);
    setStatus("");
    setDownloadUrl("");
  };

  return (
    <main className="min-h-screen bg-[#f7f9fc] px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-10">

          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-[#0B1020] sm:text-4xl">
              Organize PDF
            </h1>

            <p className="mt-3 text-gray-600">
              Reorder or remove PDF pages and create a new document.
            </p>
          </div>

          {!file ? (
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-16 text-center transition hover:border-blue-500 hover:bg-blue-50">

              <div className="mb-4 text-5xl">📑</div>

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
                      {pages.length} page
                      {pages.length !== 1 ? "s" : ""} selected
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

                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                  <div>
                    <h2 className="text-lg font-semibold text-[#0B1020]">
                      Arrange Pages
                    </h2>

                    <p className="mt-1 text-sm text-gray-600">
                      Use the arrows to change the page order.
                    </p>
                  </div>

                  <button
                    onClick={restorePages}
                    className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                  >
                    Restore Original
                  </button>

                </div>

                <div className="space-y-3">

                  {pages.map((page, index) => (
                    <div
                      key={`${page.originalIndex}-${index}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4"
                    >

                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 font-bold text-blue-700">
                          {index + 1}
                        </div>

                        <div>
                          <p className="font-medium text-[#0B1020]">
                            Page {page.originalIndex + 1}
                          </p>

                          <p className="text-xs text-gray-500">
                            Original page {page.originalIndex + 1}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">

                        <button
                          onClick={() =>
                            movePage(index, -1)
                          }
                          disabled={index === 0}
                          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                          title="Move up"
                        >
                          ↑
                        </button>

                        <button
                          onClick={() =>
                            movePage(index, 1)
                          }
                          disabled={index === pages.length - 1}
                          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                          title="Move down"
                        >
                          ↓
                        </button>

                        <button
                          onClick={() => removePage(index)}
                          className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                          title="Remove page"
                        >
                          ✕
                        </button>

                      </div>
                    </div>
                  ))}

                  {pages.length === 0 && (
                    <div className="rounded-xl bg-white p-8 text-center text-sm text-gray-500">
                      No pages remaining.
                    </div>
                  )}

                </div>
              </div>

              <button
                onClick={saveOrganizedPdf}
                disabled={isProcessing || pages.length === 0}
                className="w-full rounded-xl bg-[#2563EB] px-5 py-3.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isProcessing
                  ? "Creating PDF..."
                  : "Create Organized PDF"}
              </button>

              {status && (
                <div className="rounded-xl bg-gray-50 p-4 text-center text-sm text-gray-700">
                  {status}
                </div>
              )}

              {downloadUrl && (
                <div className="rounded-2xl border border-green-200 bg-green-50 p-5 text-center">

                  <p className="mb-4 font-semibold text-green-800">
                    Your organized PDF is ready.
                  </p>

                  <a
                    href={downloadUrl}
                    download="organized.pdf"
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