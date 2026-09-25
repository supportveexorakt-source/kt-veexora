"use client";

import { useEffect, useState } from "react";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  PageBreak,
} from "docx";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "/pdfjs/pdf.worker.min.mjs";

type PdfTextItem = {
  str: string;
  transform: number[];
  width: number;
};

export default function PdfToWordPage() {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [downloadUrl]);

  function selectFile(selectedFile: File | undefined) {
    if (!selectedFile) return;

    setError("");
    setDownloadUrl(null);
    setProgress(0);
    setStatus("");

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
    selectFile(event.target.files?.[0]);
  }

  function handleDrop(
    event: React.DragEvent<HTMLLabelElement>
  ) {
    event.preventDefault();
    setDragging(false);

    selectFile(event.dataTransfer.files?.[0]);
  }

  async function convertToWord() {
    if (!file) return;

    try {
      setConverting(true);
      setError("");
      setDownloadUrl(null);
      setProgress(0);
      setStatus("Reading PDF...");

      const buffer = await file.arrayBuffer();

      const pdf = await pdfjsLib
        .getDocument({
          data: new Uint8Array(buffer),
        })
        .promise;

      const allSections: {
        children: Paragraph[];
      }[] = [];

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        setStatus(
          `Converting page ${pageNumber} of ${pdf.numPages}...`
        );

        const page = await pdf.getPage(pageNumber);

        const textContent = await page.getTextContent();

         const items = textContent.items as unknown as PdfTextItem[];

        /*
         * PDF text items are grouped into lines using
         * their vertical position.
         */
        const lines: {
          y: number;
          items: PdfTextItem[];
        }[] = [];

        for (const item of items) {
          if (!item.str.trim()) continue;

          const y = item.transform?.[5] ?? 0;

          let existingLine = lines.find(
            (line) => Math.abs(line.y - y) < 4
          );

          if (!existingLine) {
            existingLine = {
              y,
              items: [],
            };

            lines.push(existingLine);
          }

          existingLine.items.push(item);
        }

        lines.sort((a, b) => b.y - a.y);

        const paragraphs: Paragraph[] = [];

        for (const line of lines) {
          line.items.sort(
            (a, b) =>
              (a.transform?.[4] ?? 0) -
              (b.transform?.[4] ?? 0)
          );

          let lineText = "";

          let previousEnd = 0;

          for (const item of line.items) {
            const x = item.transform?.[4] ?? 0;

            if (
              lineText.length > 0 &&
              x - previousEnd > 3
            ) {
              lineText += " ";
            }

            lineText += item.str;
            previousEnd = x + item.width;
          }

          if (lineText.trim()) {
            paragraphs.push(
              new Paragraph({
                spacing: {
                  after: 80,
                },
                children: [
                  new TextRun({
                    text: lineText.trim(),
                    font: "Arial",
                    size: 22,
                  }),
                ],
              })
            );
          }
        }

        if (paragraphs.length === 0) {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text:
                    "No selectable text was found on this page.",
                  italics: true,
                  color: "666666",
                  size: 22,
                }),
              ],
            })
          );
        }

        /*
         * Add a page break after every PDF page
         * except the last one.
         */
        if (pageNumber < pdf.numPages) {
          paragraphs.push(
            new Paragraph({
              children: [new PageBreak()],
            })
          );
        }

        allSections.push({
          children: paragraphs,
        });

        setProgress(
          Math.round((pageNumber / pdf.numPages) * 90)
        );

        await new Promise((resolve) =>
          setTimeout(resolve, 0)
        );
      }

      setStatus("Creating Word document...");
      setProgress(95);

      const document = new Document({
        sections: allSections,
      });

      const blob = await Packer.toBlob(document);

      const url = URL.createObjectURL(blob);

      setDownloadUrl(url);
      setProgress(100);
      setStatus("Conversion complete!");
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to convert this PDF."
      );

      setStatus("");
    } finally {
      setConverting(false);
    }
  }

  function reset() {
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
    }

    setFile(null);
    setDownloadUrl(null);
    setProgress(0);
    setStatus("");
    setError("");
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
            PDF to Word Converter
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-slate-600">
            Convert your PDF files into editable Word documents
            quickly and easily.
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

              {/* Selected File */}
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
                  disabled={converting}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                >
                  Change PDF
                </button>
              </div>

              {/* Info */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border p-5">
                  <p className="text-sm font-semibold text-slate-900">
                    Editable
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Extracted text can be edited in Word.
                  </p>
                </div>

                <div className="rounded-2xl border p-5">
                  <p className="text-sm font-semibold text-slate-900">
                    Multi-page
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Convert complete PDF documents.
                  </p>
                </div>

                <div className="rounded-2xl border p-5">
                  <p className="text-sm font-semibold text-slate-900">
                    Private
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Processing happens in your browser.
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

              {/* Success */}
              {downloadUrl && (
                <div className="rounded-2xl bg-green-50 p-5">
                  <p className="font-bold text-green-800">
                    Your Word file is ready!
                  </p>

                  <p className="mt-1 text-sm text-green-700">
                    The PDF text has been converted into an editable
                    Word document.
                  </p>

                  <a
                    href={downloadUrl}
                    download={`${file.name.replace(
                      /\.pdf$/i,
                      ""
                    )}.docx`}
                    className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-green-600 px-5 py-3 font-bold text-white hover:bg-green-700 sm:w-auto"
                  >
                    Download Word
                  </a>
                </div>
              )}

              {/* Convert Button */}
              {!downloadUrl && (
                <button
                  type="button"
                  onClick={convertToWord}
                  disabled={converting}
                  className="w-full rounded-2xl bg-blue-600 px-6 py-4 font-bold text-white shadow-lg transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {converting
                    ? "Converting..."
                    : "Convert PDF to Word"}
                </button>
              )}

              {/* Reset */}
              {downloadUrl && (
                <button
                  type="button"
                  onClick={reset}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-6 py-4 font-bold text-slate-700 hover:bg-slate-50"
                >
                  Convert Another PDF
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