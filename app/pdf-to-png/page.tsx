"use client";

import { useEffect, useState } from "react";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "/pdfjs/pdf.worker.min.mjs";

type OutputPage = {
  pageNumber: number;
  dataUrl: string;
};

export default function PdfToPngPage() {
  const [file, setFile] = useState<File | null>(null);
  const [outputs, setOutputs] = useState<OutputPage[]>([]);
  const [scale, setScale] = useState(1.5);
  const [pageMode, setPageMode] = useState<"all" | "selected">("all");
  const [selectedPage, setSelectedPage] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      outputs.forEach((output) => {
        if (output.dataUrl.startsWith("blob:")) {
          URL.revokeObjectURL(output.dataUrl);
        }
      });
    };
  }, [outputs]);

  function chooseFile(selectedFile: File | undefined) {
    if (!selectedFile) return;

    setError("");
    setOutputs([]);
    setProgress(0);
    setStatus("");

    if (selectedFile.type !== "application/pdf") {
      setFile(null);
      setError("Please select a PDF file.");
      return;
    }

    setFile(selectedFile);
    setPageCount(0);
    setSelectedPage(1);
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

  async function convertPdf() {
    if (!file || converting) return;

    try {
      setConverting(true);
      setError("");
      setOutputs([]);
      setProgress(0);
      setStatus("Reading PDF...");

      const buffer = await file.arrayBuffer();

      const pdf = await pdfjsLib
        .getDocument({
          data: new Uint8Array(buffer),
        })
        .promise;

      setPageCount(pdf.numPages);

      const pages =
        pageMode === "all"
          ? Array.from(
              { length: pdf.numPages },
              (_, index) => index + 1
            )
          : [Math.min(selectedPage, pdf.numPages)];

      const generated: OutputPage[] = [];

      for (let i = 0; i < pages.length; i++) {
        const pageNumber = pages[i];

        setStatus(
          `Converting page ${pageNumber} of ${pdf.numPages}...`
        );

        const page = await pdf.getPage(pageNumber);

        const viewport = page.getViewport({
          scale,
        });

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        if (!context) {
          throw new Error(
            "Your browser could not create a canvas."
          );
        }

        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);

        await page.render({
          canvasContext: context,
          viewport,
        }).promise;

        const dataUrl = canvas.toDataURL("image/png");

        generated.push({
          pageNumber,
          dataUrl,
        });

        setProgress(
          Math.round(((i + 1) / pages.length) * 100)
        );

        await new Promise((resolve) =>
          setTimeout(resolve, 0)
        );
      }

      setOutputs(generated);
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
    setFile(null);
    setOutputs([]);
    setPageCount(0);
    setSelectedPage(1);
    setProgress(0);
    setStatus("");
    setError("");
  }

  function downloadImage(
    dataUrl: string,
    pageNumber: number
  ) {
    const link = document.createElement("a");

    const baseName = file?.name
      ? file.name.replace(/\.pdf$/i, "")
      : "converted";

    link.href = dataUrl;
    link.download = `${baseName}-page-${pageNumber}.png`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async function downloadAll() {
    for (const output of outputs) {
      downloadImage(output.dataUrl, output.pageNumber);

      await new Promise((resolve) =>
        setTimeout(resolve, 150)
      );
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-5xl">

        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
            KT VEEXORA
          </div>

          <h1 className="text-3xl font-bold text-slate-900 md:text-5xl">
            PDF to PNG Converter
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-slate-600">
            Convert PDF pages into high-quality PNG images
            directly in your browser.
          </p>
        </div>

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

              <div className="grid gap-5 md:grid-cols-2">

                <div className="rounded-2xl border border-slate-200 p-5">
                  <label className="text-sm font-bold text-slate-900">
                    Pages
                  </label>

                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPageMode("all")}
                      className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold ${
                        pageMode === "all"
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      All Pages
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setPageMode("selected")
                      }
                      className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold ${
                        pageMode === "selected"
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      One Page
                    </button>
                  </div>

                  {pageMode === "selected" && (
                    <div className="mt-4">
                      <label className="text-xs font-semibold text-slate-500">
                        Page number
                      </label>

                      <input
                        type="number"
                        min={1}
                        max={pageCount || undefined}
                        value={selectedPage}
                        onChange={(event) =>
                          setSelectedPage(
                            Math.max(
                              1,
                              Number(event.target.value)
                            )
                          )
                        }
                        className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                      />
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200 p-5">
                  <label className="text-sm font-bold text-slate-900">
                    Image Resolution
                  </label>

                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {[
                      { value: 1, label: "Standard" },
                      { value: 1.5, label: "High" },
                      { value: 2, label: "Very High" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          setScale(option.value)
                        }
                        className={`rounded-xl px-3 py-3 text-sm font-semibold ${
                          scale === option.value
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  <p className="mt-3 text-xs text-slate-500">
                    Higher resolution creates larger PNG files.
                  </p>
                </div>
              </div>

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

              {error && (
                <div className="rounded-2xl bg-red-50 p-5 text-sm text-red-700">
                  <strong>Error:</strong> {error}
                </div>
              )}

              {!outputs.length && (
                <button
                  type="button"
                  onClick={convertPdf}
                  disabled={converting}
                  className="w-full rounded-2xl bg-blue-600 px-6 py-4 font-bold text-white shadow-lg transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {converting
                    ? "Converting..."
                    : "Convert PDF to PNG"}
                </button>
              )}

              {outputs.length > 0 && (
                <div className="space-y-5">

                  <div className="rounded-2xl bg-green-50 p-5">
                    <p className="font-bold text-green-800">
                      Conversion complete!
                    </p>

                    <p className="mt-1 text-sm text-green-700">
                      {outputs.length} PNG image
                      {outputs.length > 1 ? "s" : ""} created.
                    </p>

                    {outputs.length > 1 && (
                      <button
                        type="button"
                        onClick={downloadAll}
                        className="mt-4 rounded-xl bg-green-600 px-5 py-3 font-bold text-white hover:bg-green-700"
                      >
                        Download All PNGs
                      </button>
                    )}
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    {outputs.map((output) => (
                      <div
                        key={output.pageNumber}
                        className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
                      >
                        <div className="flex items-center justify-between border-b bg-white px-4 py-3">
                          <span className="text-sm font-bold">
                            Page {output.pageNumber}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              downloadImage(
                                output.dataUrl,
                                output.pageNumber
                              )
                            }
                            className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700"
                          >
                            Download
                          </button>
                        </div>

                        <div className="p-4">
                          <img
                            src={output.dataUrl}
                            alt={`PDF page ${output.pageNumber}`}
                            className="mx-auto max-h-[500px] w-auto rounded-lg border bg-white object-contain shadow-sm"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={reset}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-6 py-4 font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Convert Another PDF
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