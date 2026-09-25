"use client";

import { useState } from "react";
import { PDFDocument } from "pdf-lib";

type PdfFile = {
  id: string;
  file: File;
};

export default function PdfMergePage() {
  const [files, setFiles] = useState<PdfFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function addFiles(selectedFiles: FileList | File[]) {
    const pdfFiles = Array.from(selectedFiles).filter(
      (file) =>
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf")
    );

    if (pdfFiles.length === 0) {
      setError("Please select PDF files only.");
      return;
    }

    setError("");
    setSuccess(false);

    const newFiles: PdfFile[] = pdfFiles.map((file) => ({
      id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
      file,
    }));

    setFiles((current) => [...current, ...newFiles]);
  }

  function handleInput(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    if (event.target.files) {
      addFiles(event.target.files);
    }

    event.target.value = "";
  }

  function handleDrop(
    event: React.DragEvent<HTMLLabelElement>
  ) {
    event.preventDefault();
    setDragging(false);

    if (event.dataTransfer.files) {
      addFiles(event.dataTransfer.files);
    }
  }

  function removeFile(id: string) {
    setFiles((current) =>
      current.filter((item) => item.id !== id)
    );

    setSuccess(false);
    setDownloadUrl(null);
  }

  function moveFile(index: number, direction: "up" | "down") {
    setFiles((current) => {
      const updated = [...current];

      const newIndex =
        direction === "up" ? index - 1 : index + 1;

      if (
        newIndex < 0 ||
        newIndex >= updated.length
      ) {
        return current;
      }

      [updated[index], updated[newIndex]] = [
        updated[newIndex],
        updated[index],
      ];

      return updated;
    });

    setSuccess(false);
    setDownloadUrl(null);
  }

  async function mergePdfs() {
    if (files.length < 2) {
      setError("Please select at least 2 PDF files to merge.");
      return;
    }

    try {
      setProcessing(true);
      setError("");
      setSuccess(false);

      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
        setDownloadUrl(null);
      }

      const mergedPdf = await PDFDocument.create();

      for (const item of files) {
        const bytes = await item.file.arrayBuffer();

        const sourcePdf = await PDFDocument.load(bytes);

        const copiedPages = await mergedPdf.copyPages(
          sourcePdf,
          sourcePdf.getPageIndices()
        );

        copiedPages.forEach((page) => {
          mergedPdf.addPage(page);
        });
      }

      const mergedBytes = await mergedPdf.save();

      const blob = new Blob(
        [mergedBytes.buffer as ArrayBuffer],
        {
          type: "application/pdf",
        }
      );

      const url = URL.createObjectURL(blob);

      setDownloadUrl(url);
      setSuccess(true);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to merge the PDF files."
      );
    } finally {
      setProcessing(false);
    }
  }

  function reset() {
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
    }

    setFiles([]);
    setDownloadUrl(null);
    setError("");
    setSuccess(false);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
            KT VEEXORA
          </div>

          <h1 className="text-3xl font-bold text-slate-900 md:text-5xl">
            Merge PDF Files
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-slate-600">
            Combine multiple PDF files into one PDF document.
          </p>
        </div>

        {/* Main Card */}
        <div className="rounded-3xl bg-white p-5 shadow-xl md:p-8">

          {/* Upload */}
          <label
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`flex min-h-[260px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition ${
              dragging
                ? "border-blue-600 bg-blue-50"
                : "border-slate-300 hover:border-blue-500 hover:bg-slate-50"
            }`}
          >
            <input
              type="file"
              accept=".pdf,application/pdf"
              multiple
              onChange={handleInput}
              className="hidden"
            />

            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-600 text-3xl font-bold text-white">
              PDF
            </div>

            <h2 className="text-xl font-bold text-slate-900">
              Add PDF files
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Select multiple PDFs or drag & drop them here
            </p>

            <p className="mt-5 text-xs text-slate-400">
              You can reorder the files before merging
            </p>
          </label>

          {/* Selected Files */}
          {files.length > 0 && (
            <div className="mt-6 space-y-4">

              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-slate-900">
                    Selected PDFs
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {files.length} file
                    {files.length !== 1 ? "s" : ""} selected
                  </p>
                </div>

                <button
                  type="button"
                  onClick={reset}
                  disabled={processing}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                >
                  Clear All
                </button>
              </div>

              <div className="space-y-3">
                {files.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-100 text-xs font-bold text-red-600">
                        PDF
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-800">
                          {index + 1}. {item.file.name}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {(
                            item.file.size /
                            1024 /
                            1024
                          ).toFixed(2)}{" "}
                          MB
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          moveFile(index, "up")
                        }
                        disabled={
                          index === 0 || processing
                        }
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                        title="Move up"
                      >
                        ↑
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          moveFile(index, "down")
                        }
                        disabled={
                          index === files.length - 1 ||
                          processing
                        }
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                        title="Move down"
                      >
                        ↓
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          removeFile(item.id)
                        }
                        disabled={processing}
                        className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-40"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-2xl bg-red-50 p-5 text-sm leading-6 text-red-700">
                  <strong>Error:</strong> {error}
                </div>
              )}

              {/* Success */}
              {success && downloadUrl && (
                <div className="rounded-2xl bg-green-50 p-5">
                  <p className="font-bold text-green-800">
                    PDFs merged successfully!
                  </p>

                  <p className="mt-1 text-sm text-green-700">
                    Your {files.length} PDF files are now one
                    document.
                  </p>

                  <a
                    href={downloadUrl}
                    download="merged-pdf.pdf"
                    className="mt-4 inline-flex rounded-xl bg-green-600 px-5 py-3 font-bold text-white hover:bg-green-700"
                  >
                    Download Merged PDF
                  </a>
                </div>
              )}

              {/* Merge Button */}
              {!success && (
                <button
                  type="button"
                  onClick={mergePdfs}
                  disabled={
                    processing || files.length < 2
                  }
                  className="w-full rounded-2xl bg-blue-600 px-6 py-4 font-bold text-white shadow-lg transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {processing
                    ? "Merging PDFs..."
                    : "Merge PDFs"}
                </button>
              )}

              {success && (
                <button
                  type="button"
                  onClick={reset}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-6 py-4 font-bold text-slate-700 hover:bg-slate-50"
                >
                  Merge More PDFs
                </button>
              )}
            </div>
          )}

          {/* Empty state info */}
          {files.length === 0 && (
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 p-5">
                <p className="font-bold text-slate-900">
                  Multiple Files
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  Combine multiple PDFs into one document.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 p-5">
                <p className="font-bold text-slate-900">
                  Reorder
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  Choose exactly what order the PDFs appear in.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 p-5">
                <p className="font-bold text-slate-900">
                  Browser Processing
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  Files are processed directly in your browser.
                </p>
              </div>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          KT VEEXORA • Everything You Need. One Place.
        </p>
      </div>
    </main>
  );
}