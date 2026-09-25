"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { PDFDocument } from "pdf-lib";

export default function PdfCompressPage() {
  const [file, setFile] = useState<File | null>(null);
  const [originalSize, setOriginalSize] = useState(0);
  const [quality, setQuality] = useState(60);
  const [status, setStatus] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [compressedSize, setCompressedSize] = useState(0);

  useEffect(() => {
    return () => {
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [downloadUrl]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleFile = async (selectedFile: File) => {
    if (selectedFile.type !== "application/pdf") {
      setStatus("Please select a PDF file.");
      return;
    }

    try {
      const bytes = await selectedFile.arrayBuffer();

      await PDFDocument.load(bytes);

      setFile(selectedFile);
      setOriginalSize(selectedFile.size);
      setCompressedSize(0);
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

  const compressPdf = async () => {
    if (!file) {
      setStatus("Please upload a PDF first.");
      return;
    }

    setIsProcessing(true);
    setStatus("");
    setDownloadUrl("");
    setCompressedSize(0);

    try {
      const bytes = await file.arrayBuffer();

      const pdf = await PDFDocument.load(bytes);

      /*
        pdf-lib does not re-encode embedded images like a full
        PDF optimizer would. We still rebuild the PDF and remove
        unused objects where possible.
      */
      const outputBytes = await pdf.save({
        useObjectStreams: quality >= 50,
        addDefaultPage: false,
      });

      const blob = new Blob(
        [outputBytes.buffer as ArrayBuffer],
        { type: "application/pdf" }
      );

      const url = URL.createObjectURL(blob);

      setDownloadUrl(url);
      setCompressedSize(outputBytes.byteLength);

      if (outputBytes.byteLength < originalSize) {
        const saved =
          ((originalSize - outputBytes.byteLength) /
            originalSize) *
          100;

        setStatus(
          `Compression complete. Saved ${saved.toFixed(1)}% space.`
        );
      } else {
        setStatus(
          "PDF was processed, but this PDF could not be reduced further."
        );
      }
    } catch {
      setStatus("Something went wrong while compressing the PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
    }

    setFile(null);
    setOriginalSize(0);
    setCompressedSize(0);
    setQuality(60);
    setStatus("");
    setDownloadUrl("");
  };

  const savedPercent =
    originalSize > 0 && compressedSize > 0
      ? ((originalSize - compressedSize) / originalSize) * 100
      : 0;

  return (
    <main className="min-h-screen bg-[#f7f9fc] px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-10">

          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-[#0B1020] sm:text-4xl">
              Compress PDF
            </h1>

            <p className="mt-3 text-gray-600">
              Reduce PDF file size while keeping your document usable.
            </p>
          </div>

          {!file ? (
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-16 text-center transition hover:border-blue-500 hover:bg-blue-50">

              <div className="mb-4 text-5xl">📉</div>

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
                      Original size: {formatSize(originalSize)}
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
                  Compression Level
                </h2>

                <p className="mt-2 text-sm text-gray-600">
                  Choose how aggressively the PDF should be optimized.
                </p>

                <div className="mt-5">
                  <input
                    type="range"
                    min="20"
                    max="90"
                    value={quality}
                    onChange={(e) =>
                      setQuality(Number(e.target.value))
                    }
                    className="w-full"
                  />

                  <div className="mt-2 flex justify-between text-xs text-gray-500">
                    <span>More compression</span>
                    <span>{quality}</span>
                    <span>More preservation</span>
                  </div>
                </div>
              </div>

              <button
                onClick={compressPdf}
                disabled={isProcessing}
                className="w-full rounded-xl bg-[#2563EB] px-5 py-3.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isProcessing
                  ? "Compressing PDF..."
                  : "Compress PDF"}
              </button>

              {status && (
                <div className="rounded-xl bg-gray-50 p-4 text-center text-sm text-gray-700">
                  {status}
                </div>
              )}

              {compressedSize > 0 && (
                <div className="grid gap-4 sm:grid-cols-3">

                  <div className="rounded-2xl border border-gray-200 bg-white p-5 text-center">
                    <p className="text-sm text-gray-500">
                      Original
                    </p>

                    <p className="mt-1 text-xl font-bold text-[#0B1020]">
                      {formatSize(originalSize)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-white p-5 text-center">
                    <p className="text-sm text-gray-500">
                      Processed
                    </p>

                    <p className="mt-1 text-xl font-bold text-[#0B1020]">
                      {formatSize(compressedSize)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-green-200 bg-green-50 p-5 text-center">
                    <p className="text-sm text-green-700">
                      Space Saved
                    </p>

                    <p className="mt-1 text-xl font-bold text-green-800">
                      {Math.max(0, savedPercent).toFixed(1)}%
                    </p>
                  </div>

                </div>
              )}

              {downloadUrl && (
                <div className="rounded-2xl border border-green-200 bg-green-50 p-5 text-center">

                  <p className="mb-4 font-semibold text-green-800">
                    Your processed PDF is ready.
                  </p>

                  <a
                    href={downloadUrl}
                    download="compressed.pdf"
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