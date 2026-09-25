"use client";

import { useState } from "react";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import * as XLSX from "xlsx";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "/pdfjs/pdf.worker.min.mjs";

type PdfItem = {
  str?: string;
  transform?: number[];
};

type PdfRow = string[];

export default function PdfToExcelPage() {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [rows, setRows] = useState<PdfRow[]>([]);
  const [pageCount, setPageCount] = useState(0);
  const [downloadReady, setDownloadReady] = useState(false);

  function chooseFile(selectedFile: File | undefined) {
    if (!selectedFile) return;

    setError("");
    setRows([]);
    setProgress(0);
    setStatus("");
    setDownloadReady(false);

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

  async function convertPdf() {
    if (!file || converting) return;

    try {
      setConverting(true);
      setError("");
      setRows([]);
      setProgress(0);
      setDownloadReady(false);
      setStatus("Reading PDF...");

      const buffer = await file.arrayBuffer();

      const pdf = await pdfjsLib
        .getDocument({
          data: new Uint8Array(buffer),
        })
        .promise;

      setPageCount(pdf.numPages);

      const extractedRows: PdfRow[] = [];

      for (
        let pageNumber = 1;
        pageNumber <= pdf.numPages;
        pageNumber++
      ) {
        setStatus(
          `Extracting page ${pageNumber} of ${pdf.numPages}...`
        );

        const page = await pdf.getPage(pageNumber);

        const content = await page.getTextContent();

        const items = content.items as PdfItem[];

        const lines: {
          y: number;
          items: PdfItem[];
        }[] = [];

        for (const item of items) {
          const text = item.str || "";

          if (!text.trim()) continue;

          const y = item.transform?.[5] ?? 0;

          let line = lines.find(
            (existingLine) =>
              Math.abs(existingLine.y - y) < 5
          );

          if (!line) {
            line = {
              y,
              items: [],
            };

            lines.push(line);
          }

          line.items.push(item);
        }

        lines.sort((a, b) => b.y - a.y);

        for (const line of lines) {
          line.items.sort(
            (a, b) =>
              (a.transform?.[4] ?? 0) -
              (b.transform?.[4] ?? 0)
          );

          const row: string[] = [];

          for (const item of line.items) {
            const text = (item.str || "").trim();

            if (text) {
              row.push(text);
            }
          }

          if (row.length > 0) {
            extractedRows.push(row);
          }
        }

        setProgress(
          Math.round(
            (pageNumber / pdf.numPages) * 90
          )
        );

        await new Promise((resolve) =>
          setTimeout(resolve, 0)
        );
      }

      if (extractedRows.length === 0) {
        throw new Error(
          "No selectable text was found in this PDF. It may be a scanned or image-only PDF."
        );
      }

      setRows(extractedRows);
      setProgress(100);
      setStatus("PDF data extracted successfully.");
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to extract data from this PDF."
      );

      setStatus("");
    } finally {
      setConverting(false);
    }
  }

  function downloadExcel() {
    if (!rows.length || !file) return;

    const workbook = XLSX.utils.book_new();

    /*
     * Create a simple sheet from extracted PDF rows.
     * Each PDF text line becomes one Excel row.
     */
    const worksheetData = rows.map((row) => [...row]);

    const worksheet =
      XLSX.utils.aoa_to_sheet(worksheetData);

    worksheet["!cols"] = Array.from(
      {
        length: Math.max(
          ...rows.map((row) => row.length),
          1
        ),
      },
      () => ({
        wch: 25,
      })
    );

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "PDF Data"
    );

    const fileName = file.name.replace(
      /\.pdf$/i,
      ""
    );

    XLSX.writeFile(
      workbook,
      `${fileName}.xlsx`
    );

    setDownloadReady(true);
  }

  function reset() {
    setFile(null);
    setRows([]);
    setPageCount(0);
    setProgress(0);
    setStatus("");
    setError("");
    setDownloadReady(false);
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
            PDF to Excel Converter
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-slate-600">
            Extract text and table-like data from PDF files
            and export it to Excel.
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

              {/* Features */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 p-5">
                  <p className="font-bold text-slate-900">
                    Excel Output
                  </p>

                  <p className="mt-2 text-sm text-slate-500">
                    Download extracted PDF content as XLSX.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 p-5">
                  <p className="font-bold text-slate-900">
                    Multi-page
                  </p>

                  <p className="mt-2 text-sm text-slate-500">
                    Extract content from complete PDF documents.
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

              {/* Convert */}
              {!rows.length && (
                <button
                  type="button"
                  onClick={convertPdf}
                  disabled={converting}
                  className="w-full rounded-2xl bg-blue-600 px-6 py-4 font-bold text-white shadow-lg transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {converting
                    ? "Extracting..."
                    : "Convert PDF to Excel"}
                </button>
              )}

              {/* Result */}
              {rows.length > 0 && (
                <div className="space-y-5">

                  <div className="flex flex-col gap-4 rounded-2xl bg-green-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-bold text-green-800">
                        PDF data extracted!
                      </p>

                      <p className="mt-1 text-sm text-green-700">
                        {rows.length} rows of content are ready
                        for Excel.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={downloadExcel}
                      className="rounded-xl bg-green-600 px-5 py-3 font-bold text-white hover:bg-green-700"
                    >
                      {downloadReady
                        ? "Download Again"
                        : "Download Excel"}
                    </button>
                  </div>

                  {/* Preview */}
                  <div className="overflow-hidden rounded-2xl border border-slate-200">
                    <div className="border-b bg-slate-50 px-5 py-4">
                      <p className="font-bold text-slate-900">
                        Data Preview
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Showing extracted PDF content.
                      </p>
                    </div>

                    <div className="max-h-[450px] overflow-auto">
                      <table className="w-full border-collapse text-sm">
                        <tbody>
                          {rows
                            .slice(0, 100)
                            .map((row, rowIndex) => (
                              <tr
                                key={rowIndex}
                                className={
                                  rowIndex % 2 === 0
                                    ? "bg-white"
                                    : "bg-slate-50"
                                }
                              >
                                <td className="border-b border-r px-3 py-3 text-xs font-medium text-slate-400">
                                  {rowIndex + 1}
                                </td>

                                {row.map(
                                  (cell, cellIndex) => (
                                    <td
                                      key={cellIndex}
                                      className="border-b border-slate-200 px-4 py-3 text-slate-700"
                                    >
                                      {cell}
                                    </td>
                                  )
                                )}
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
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