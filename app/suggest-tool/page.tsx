"use client";

import Link from "next/link";
import { useState } from "react";

export default function SuggestToolPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <main className="min-h-screen bg-[#f7f9fc] text-[#0B1020]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563EB] via-[#7C3AED] to-[#06B6D4] text-xl font-black text-white">
              V
            </div>

            <div>
              <div className="text-lg font-extrabold tracking-tight">
                KT VEEXORA
              </div>
              <div className="hidden text-[10px] font-medium text-gray-500 sm:block">
                Everything You Need. One Place.
              </div>
            </div>
          </Link>

          <Link
            href="/tools"
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:border-[#2563EB] hover:text-[#2563EB]"
          >
            ← Back to Tools
          </Link>
        </div>
      </header>

      {/* Main */}
      <section className="px-5 py-16 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-violet-50 text-3xl">
              💡
            </div>

            <h1 className="mt-6 text-3xl font-black tracking-tight sm:text-4xl">
              Suggest a Tool
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-gray-600 sm:text-base">
              Have an idea for a useful tool? Tell us what you need and help
              shape the future of KT VEEXORA.
            </p>
          </div>

          {!submitted ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSubmitted(true);
              }}
              className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8"
            >
              <label className="block text-sm font-semibold text-gray-800">
                What tool would you like?
              </label>

              <input
                type="text"
                required
                placeholder="Example: Image to SVG converter"
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100"
              />

              <label className="mt-6 block text-sm font-semibold text-gray-800">
                Tell us more
              </label>

              <textarea
                rows={5}
                placeholder="What should this tool do?"
                className="mt-2 w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100"
              />

              <button
                type="submit"
                className="mt-6 w-full rounded-xl bg-[#2563EB] px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
              >
                Submit Suggestion
              </button>

              <p className="mt-4 text-center text-xs text-gray-400">
                This form currently works locally in the browser. We&apos;ll
                connect it to a real submission system later.
              </p>
            </form>
          ) : (
            <div className="rounded-3xl border border-green-100 bg-white p-8 text-center shadow-sm">
              <div className="text-5xl">✅</div>

              <h2 className="mt-5 text-2xl font-bold">
                Thanks for the suggestion!
              </h2>

              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-500">
                Your suggestion has been recorded for this session. A real
                submission system will be connected later.
              </p>

              <Link
                href="/tools"
                className="mt-7 inline-block rounded-xl bg-[#2563EB] px-6 py-3 text-sm font-bold text-white hover:bg-blue-700"
              >
                Back to Tools
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white px-5 py-8 text-center">
        <div className="text-sm font-bold">KT VEEXORA</div>
        <div className="mt-1 text-xs text-gray-400">
          Everything You Need. One Place.
        </div>
      </footer>
    </main>
  );
}