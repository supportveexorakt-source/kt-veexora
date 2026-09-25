"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { createPdfToolkit, PdfPasswordError } from "pdfstudio";

export default function PdfUnlockPage() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
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

  const handleFile = (selectedFile: File) => {
    if (selectedFile.type !== "application/pdf") {
      setStatus("Please select a PDF file.");
      return;
    }

    setFile(selectedFile);
    setPassword("");
    setStatus("");
    setDownloadUrl("");
  };

  const handleInput = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];

    if (selectedFile) {
      handleFile(selectedFile);
    }
  };

  const unlockPdf = async () => {
    if (!file) {
      setStatus("Please upload a PDF first.");
      return;
    }

    if (!password) {
      setStatus("Please enter the PDF password.");
      return;
    }

    setIsProcessing(true);
    setStatus("");
    setDownloadUrl("");

    try {
      const pdf = await createPdfToolkit();

      const unlockedBytes = await pdf.unlock(file, {
        password,
      });

      const blob = new Blob(
        [unlockedBytes.buffer as ArrayBuffer],
        { type: "application/pdf" }
      );

      const url = URL.createObjectURL(blob);

      setDownloadUrl(url);

      setStatus(
        "PDF unlocked successfully. The password has been removed."
      );
    } catch (error) {
      if (error instanceof PdfPasswordError) {
        setStatus(
          "Incorrect password. Please enter the correct PDF password."
        );
      } else {
        setStatus(
          "Could not unlock this PDF. The file may use an unsupported encryption method or may be damaged."
        );
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
    }

    setFile(null);
    setPassword("");
    setStatus("");
    setDownloadUrl("");
  };

  return (
    <main className="min-h-screen bg-[#f7f9fc] px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-10">

          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-[#0B1020] sm:text-4xl">
              Unlock PDF
            </h1>

            <p className="mt-3 text-gray-600">
              Remove password protection from a PDF when you know
              the current password.
            </p>
          </div>

          {!file ? (
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-16 text-center transition hover:border-blue-500 hover:bg-blue-50">

              <div className="mb-4 text-5xl">🔓</div>

              <h2 className="text-xl font-semibold text-[#0B1020]">
                Upload Password-Protected PDF
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Click here to select your PDF
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
                      Password-protected PDF selected
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

                <label className="font-semibold text-[#0B1020]">
                  PDF Password
                </label>

                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter the current PDF password"
                  className="mt-3 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <p className="mt-3 text-xs text-gray-500">
                  You must know the existing password to unlock the PDF.
                </p>

              </div>

              <button
                onClick={unlockPdf}
                disabled={isProcessing}
                className="w-full rounded-xl bg-[#2563EB] px-5 py-3.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isProcessing
                  ? "Unlocking PDF..."
                  : "Unlock PDF"}
              </button>

              {status && (
                <div className="rounded-xl bg-gray-50 p-4 text-center text-sm text-gray-700">
                  {status}
                </div>
              )}

              {downloadUrl && (
                <div className="rounded-2xl border border-green-200 bg-green-50 p-5 text-center">

                  <p className="mb-4 font-semibold text-green-800">
                    Your unlocked PDF is ready.
                  </p>

                  <a
                    href={downloadUrl}
                    download="unlocked.pdf"
                    className="inline-block rounded-xl bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700"
                  >
                    Download Unlocked PDF
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
            Processing happens directly in your browser.
          </p>

        </div>
      </div>
    </main>
  );
}