"use client";

import { useEffect, useState } from "react";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "/pdfjs/pdf.worker.min.mjs";

export default function PdfToTxtPage() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [pageCount, setPageCount] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  function chooseFile(selectedFile: File | undefined) {
    if (!selectedFile) return;

    setError("");
    setText("");
    setProgress(0);
    setStatus("");
    setCopied(false);

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

  async function extractText() {
    if (!file || converting) return;

    try {
      setConverting(true);
      setError("");
      setText("");
      setProgress(0);
      setStatus("Reading PDF...");

      const buffer = await file.arrayBuffer();

      const pdf = await pdfjsLib
        .getDocument({
          data: new Uint8Array(buffer),
        })
        .promise;

      setPageCount(pdf.numPages);

      const pages: string[] = [];

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        setStatus(
          `Extracting text from page ${pageNumber} of ${pdf.numPages}...`
        );

        const page = await pdf.getPage(pageNumber);

        const content = await page.getTextContent();

        const items = content.items as Array<{
          str?: string;
          transform?: number[];
        }>;

        const lines: {
          y: number;
          text: string;
        }[] = [];

        for (const item of items) {
          const value = item.str || "";

          if (!value.trim()) continue;

          const y = item.transform?.[5] ?? 0;

          let line = lines.find(
            (existingLine) =>
              Math.abs(existingLine.y - y) < 4
          );

          if (!line) {
            line = {
              y,
              text: "",
            };

            lines.push(line);
          }

          if (line.text.length > 0) {
            line.text += " ";
          }

          line.text += value;
        }

        lines.sort((a, b) => b.y - a.y);

        const pageText = lines
          .map((line) => line.text.trim())
          .filter(Boolean)
          .join("\n");

        pages.push(pageText);

        setProgress(
          Math.round((pageNumber / pdf.numPages) * 100)
        );

        await new Promise((resolve) =>
          setTimeout(resolve, 0)
        );
      }

      const finalText = pages
        .map(
          (pageText, index) =>
            `========== PAGE ${index + 1} ==========\n\n${pageText}`
        )
        .join("\n\n");

      if (!finalText.trim()) {
        throw new Error(
          "No selectable text was found in this PDF. It may be a scanned or image-only PDF."
        );
      }

      setText(finalText);
      setStatus("Text extraction complete!");
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to extract text from this PDF."
      );

      setStatus("");
    } finally {
      setConverting(false);
    }
  }

  async function copyText() {
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setError("Unable to copy text.");
    }
  }

  function downloadTxt() {
    if (!text) return;

    const blob = new Blob([text], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    const name = file?.name
      ? file.name.replace(/\.pdf$/i, "")
      : "extracted-text";

    link.href = url;
    link.download = `${name}.txt`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  function reset() {
    setFile(null);
    setText("");
    setPageCount(0);
    setProgress(0);
    setStatus("");
    setError("");
    setCopied(false);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
            KT VEEXORA
          </div>

          <h1 className="text-3xl font-bold text-slate-900 md:text-5xl">
            PDF to TXT Converter
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-slate-600">
            Extract text from your PDF and download it as a
            simple TXT file.
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
              className={`flex min-h-[330px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition ${
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

              <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-600 text-2xl font-bold text-white">
                PDF
              </div>

              <h2 className="text-xl font-bold text-slate-900">
                Upload your PDF
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Drag & drop your file here or click to browse
              </p>

              <p className="mt-5 text-xs text-slate-400">
                PDF files only
              </p>
            </label>
          ) : (
            <div className="space-y-6">

              {/* File */}
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
                      {pageCount > 0 &&
                        ` • ${pageCount} pages`}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={reset}
                  disabled={converting}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                >
                  Change PDF
                </button>
              </div>

              {/* Information */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 p-5">
                  <p className="font-bold text-slate-900">
                    Extract Text
                  </p>

                  <p className="mt-2 text-sm text-slate-500">
                    Extract selectable text from PDF pages.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 p-5">
                  <p className="font-bold text-slate-900">
                    Editable
                  </p>

                  <p className="mt-2 text-sm text-slate-500">
                    Review and edit the extracted text before
                    downloading.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 p-5">
                  <p className="font-bold text-slate-900">
                    Browser Processing
                  </p>

                  <p className="mt-2 text-sm text-slate-500">
                    Your PDF is processed directly in the browser.
                  </p>
                </div>
              </div>

              {/* Progress */}
              {converting && (
                <div className="rounded-2xl bg-blue-50 p-5">
                  <div className="mb-3 flex justify-between text-sm">
                    <span className="font-semibold text-blue-900">
                      {status}
                    </span>

                    <span className="font-bold text-blue-700">
                      {progress}%
                    </span>
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-blue-100">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all"
                      style={{
                        width: `${progress}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="rounded-2xl bg-red-50 p-5 text-sm text-red-700">
                  <strong>Error:</strong> {error}
                </div>
              )}

              {/* Extract Button */}
              {!text && (
                <button
                  type="button"
                  onClick={extractText}
                  disabled={converting}
                  className="w-full rounded-2xl bg-blue-600 px-6 py-4 font-bold text-white shadow-lg transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {converting
                    ? "Extracting..."
                    : "Extract Text"}
                </button>
              )}

              {/* Result */}
              {text && (
                <div className="space-y-4">

                  <div className="flex flex-col gap-3 rounded-2xl bg-green-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-bold text-green-800">
                        Text extraction complete!
                      </p>

                      <p className="mt-1 text-sm text-green-700">
                        You can edit the text below before
                        downloading.
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={copyText}
                        className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-green-700 shadow-sm hover:bg-green-100"
                      >
                        {copied ? "Copied!" : "Copy All"}
                      </button>

                      <button
                        type="button"
                        onClick={downloadTxt}
                        className="rounded-xl bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-700"
                      >
                        Download TXT
                      </button>
                    </div>
                  </div>

                  <textarea
                    value={text}
                    onChange={(event) =>
                      setText(event.target.value)
                    }
                    spellCheck={false}
                    className="min-h-[500px] w-full resize-y rounded-2xl border border-slate-300 bg-white p-5 font-mono text-sm leading-6 text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="Extracted text will appear here..."
                  />

                  <button
                    type="button"
                    onClick={reset}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-6 py-4 font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Extract Another PDF
                  </button>
                </div>
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