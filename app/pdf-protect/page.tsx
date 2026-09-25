"use client";

import { useEffect, useState } from "react";
import { encryptPDF } from "@pdfsmaller/pdf-encrypt";

export default function PdfProtectPage() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    return () => {
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [downloadUrl]);

  function chooseFile(selectedFile: File | undefined) {
    if (!selectedFile) return;

    setError("");
    setSuccess(false);
    setDownloadUrl(null);

    if (selectedFile.type !== "application/pdf") {
      setFile(null);
      setError("Please select a PDF file.");
      return;
    }

    setFile(selectedFile);
  }

  function handleInput(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    chooseFile(event.target.files?.[0]);
  }

  function handleDrop(
    event: React.DragEvent<HTMLLabelElement>
  ) {
    event.preventDefault();
    setDragging(false);
    chooseFile(event.dataTransfer.files?.[0]);
  }

  async function protectPdf() {
    if (!file) return;

    setError("");
    setSuccess(false);

    if (!password) {
      setError("Please enter a password.");
      return;
    }

    if (password.length < 4) {
      setError("Password should contain at least 4 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setProcessing(true);

      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
        setDownloadUrl(null);
      }

      const fileBuffer = await file.arrayBuffer();

      const pdfBytes = new Uint8Array(fileBuffer);

      const encryptedBytes = await encryptPDF(
        pdfBytes,
        password,
        {
          ownerPassword: password,
          allowPrinting: true,
          allowCopying: true,
          allowModifying: false,
          allowAnnotating: true,
          allowFillingForms: true,
          allowExtraction: true,
          allowAssembly: false,
          allowHighQualityPrint: true,
        }
      );

       const blob = new Blob(
  [encryptedBytes.buffer as ArrayBuffer],
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
          : "Unable to protect this PDF."
      );
    } finally {
      setProcessing(false);
    }
  }

  function reset() {
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
    }

    setFile(null);
    setPassword("");
    setConfirmPassword("");
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
            Protect PDF
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-slate-600">
            Add password protection to your PDF securely in
            your browser.
          </p>
        </div>

        {/* Main Card */}
        <div className="rounded-3xl bg-white p-5 shadow-xl md:p-8">

          {!file ? (
            <label
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`flex min-h-[320px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition ${
                dragging
                  ? "border-blue-600 bg-blue-50"
                  : "border-slate-300 hover:border-blue-500 hover:bg-slate-50"
              }`}
            >
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleInput}
                className="hidden"
              />

              <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-600 text-3xl text-white">
                🔒
              </div>

              <h2 className="text-xl font-bold text-slate-900">
                Upload your PDF
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Drag & drop your PDF here or click to browse
              </p>

              <p className="mt-5 text-xs text-slate-400">
                PDF files only
              </p>
            </label>
          ) : (
            <div className="space-y-6">

              {/* Selected file */}
              <div className="flex flex-col gap-4 rounded-2xl bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-red-100 font-bold text-red-600">
                    PDF
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">
                      {file.name}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={reset}
                  disabled={processing}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                >
                  Change PDF
                </button>
              </div>

              {/* Password */}
              <div className="rounded-2xl border border-slate-200 p-5">
                <h2 className="font-bold text-slate-900">
                  Create Password
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  This password will be required to open the
                  protected PDF.
                </p>

                <div className="mt-5 space-y-4">

                  <div>
                    <label className="text-sm font-semibold text-slate-700">
                      Password
                    </label>

                    <input
                      type="password"
                      value={password}
                      onChange={(event) =>
                        setPassword(event.target.value)
                      }
                      placeholder="Enter password"
                      className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700">
                      Confirm Password
                    </label>

                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(event.target.value)
                      }
                      placeholder="Confirm password"
                      className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                </div>
              </div>

              {/* Privacy */}
              <div className="rounded-2xl bg-blue-50 p-5">
                <p className="font-semibold text-blue-900">
                  🔐 Browser processing
                </p>

                <p className="mt-1 text-sm leading-6 text-blue-800">
                  Your PDF and password are processed directly in
                  your browser. The tool does not need to upload
                  the PDF to a conversion server.
                </p>
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
                    PDF protected successfully!
                  </p>

                  <p className="mt-1 text-sm text-green-700">
                    Your PDF now requires the password to open.
                  </p>

                  <a
                    href={downloadUrl}
                    download={`protected-${file.name}`}
                    className="mt-4 inline-flex rounded-xl bg-green-600 px-5 py-3 font-bold text-white hover:bg-green-700"
                  >
                    Download Protected PDF
                  </a>
                </div>
              )}

              {/* Button */}
              {!success && (
                <button
                  type="button"
                  onClick={protectPdf}
                  disabled={processing}
                  className="w-full rounded-2xl bg-blue-600 px-6 py-4 font-bold text-white shadow-lg transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {processing
                    ? "Protecting PDF..."
                    : "Protect PDF"}
                </button>
              )}

              {/* Reset */}
              {success && (
                <button
                  type="button"
                  onClick={reset}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-6 py-4 font-bold text-slate-700 hover:bg-slate-50"
                >
                  Protect Another PDF
                </button>
              )}
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