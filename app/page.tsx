"use client";

import Link from "next/link";

const popularTools = [
  {
    title: "Resize Image",
    description: "Resize images to exact dimensions or scale.",
    href: "/resize-image",
    icon: "↔️",
  },
  {
    title: "Compress Image",
    description: "Reduce image size while keeping quality.",
    href: "/compress-image",
    icon: "📉",
  },
  {
    title: "Convert Image",
    description: "Convert JPG, PNG and WebP files easily.",
    href: "/convert-image",
    icon: "🔄",
  },
  {
    title: "Image to PDF",
    description: "Turn one or multiple images into a PDF.",
    href: "/image-to-pdf",
    icon: "🖼️",
  },
  {
    title: "PDF Merge",
    description: "Combine multiple PDF files into one.",
    href: "/pdf-merge",
    icon: "📚",
  },
  {
    title: "PDF Split",
    description: "Extract selected pages from a PDF.",
    href: "/pdf-split",
    icon: "✂️",
  },
  {
    title: "PDF to Word",
    description: "Convert PDF text into an editable Word file.",
    href: "/pdf-to-word",
    icon: "📝",
  },
  {
    title: "PDF Unlock",
    description: "Remove password protection from a PDF you can access.",
    href: "/pdf-unlock",
    icon: "🔓",
  },
];

const categories = [
  {
    title: "Image Tools",
    description: "Resize, compress, convert, crop and edit images.",
    icon: "🖼️",
  },
  {
    title: "PDF Tools",
    description: "Merge, split, convert, protect and organize PDFs.",
    icon: "📄",
  },
  {
    title: "Document Tools",
    description: "Work with documents, text and OCR tools.",
    icon: "📑",
  },
  {
    title: "AI Tools",
    description: "Smart productivity tools coming to VEEXORA.",
    icon: "✨",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-[#0B1020]">

      {/* HEADER */}
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

          <nav className="hidden items-center gap-7 text-sm font-medium text-gray-600 lg:flex">
            <Link href="/tools" className="hover:text-[#2563EB]">
  Tools
</Link>

            <a href="#categories" className="hover:text-[#2563EB]">
              Categories
            </a>

            <a href="#how-it-works" className="hover:text-[#2563EB]">
              How It Works
            </a>

            <Link
  href="/privacy"
  className="hover:text-[#2563EB]"
>
  Privacy
</Link>
          </nav>

          <div className="hidden items-center gap-3 sm:flex">
            <Link
  href="/sign-in"
  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
>
  Sign In
</Link>

            <Link
  href="/create-account"
  className="rounded-xl bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
>
  Get Started
</Link>
          </div>

          <button className="rounded-xl border border-gray-200 px-3 py-2 text-xl lg:hidden">
            ☰
          </button>

        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden bg-[#f7f9fc]">
        <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="absolute -right-24 top-10 h-80 w-80 rounded-full bg-violet-200/30 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-5 py-20 text-center sm:py-24 lg:px-8 lg:py-28">

          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-sm font-semibold text-[#2563EB] shadow-sm">
            <span>✨</span>
            Simple tools. Powerful results.
          </div>

          <h1 className="mx-auto max-w-5xl text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-7xl">
            Everything You Need.
            <span className="block bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#06B6D4] bg-clip-text text-transparent">
              One Place.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-gray-600 sm:text-lg">
            Resize, compress, convert, edit and manage your files with
            simple online tools built for everyday work.
          </p>

          {/* SEARCH */}
          <div className="mx-auto mt-9 max-w-2xl">
            <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-2 shadow-lg shadow-blue-100/30">
              <span className="pl-3 text-xl text-gray-400">
                🔍
              </span>

              <input
  type="text"
  placeholder="Search for a tool..."
  className="min-w-0 flex-1 bg-transparent px-1 py-3 text-sm outline-none sm:text-base"
  onKeyDown={(e) => {
    if (e.key === "Enter") {
      const value = e.currentTarget.value.trim();

      if (value) {
        window.location.href = `/tools?search=${encodeURIComponent(value)}`;
      }
    }
  }}
/>

              <button
  type="button"
  onClick={(e) => {
    const input = e.currentTarget.parentElement?.querySelector(
      "input"
    ) as HTMLInputElement | null;

    const value = input?.value.trim();

    if (value) {
      window.location.href = `/tools?search=${encodeURIComponent(value)}`;
    }
  }}
  className="rounded-xl bg-[#2563EB] px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
>
  Search
</button>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs text-gray-500">
            <span>Popular:</span>
            <Link
  href="/tools?search=Compress%20Image"
  className="cursor-pointer rounded-full bg-white px-3 py-1.5 shadow-sm transition hover:text-[#2563EB]"
>
  Compress Image
</Link>
           <Link
  href="/tools?search=PDF%20Merge"
  className="cursor-pointer rounded-full bg-white px-3 py-1.5 shadow-sm transition hover:text-[#2563EB]"
>
  PDF Merge
</Link>
            <Link
  href="/tools?search=Image%20to%20PDF"
  className="cursor-pointer rounded-full bg-white px-3 py-1.5 shadow-sm transition hover:text-[#2563EB]"
>
  Image to PDF
</Link>
          </div>

        </div>
      </section>

      {/* POPULAR TOOLS */}
      <section id="tools" className="mx-auto max-w-7xl px-5 py-20 lg:px-8">

        <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-sm font-bold uppercase tracking-wider text-[#2563EB]">
              Popular Tools
            </p>

            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Get things done faster
            </h2>

            <p className="mt-3 max-w-2xl text-gray-600">
              Quick, practical tools for your everyday image, PDF and
              document needs.
            </p>
          </div>

        <Link
  href="/tools"
  className="w-fit rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
>
  View All Tools →
</Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

          {popularTools.map((tool) => (
            <Link
              key={tool.title}
              href={tool.href}
              className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-blue-100 hover:shadow-lg"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#f0f5ff] text-2xl">
                {tool.icon}
              </div>

              <h3 className="font-bold group-hover:text-[#2563EB]">
                {tool.title}
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                {tool.description}
              </p>

              <div className="mt-5 text-sm font-semibold text-[#2563EB]">
                Use Tool →
              </div>
            </Link>
          ))}

        </div>
      </section>

      {/* CATEGORIES */}
      <section
        id="categories"
        className="bg-[#f7f9fc] px-5 py-20 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">

          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-wider text-[#7C3AED]">
              Categories
            </p>

            <h2 className="mt-2 text-3xl font-bold sm:text-4xl">
              Find the right tool
            </h2>

            <p className="mx-auto mt-3 max-w-2xl text-gray-600">
              Everything organized into simple categories so you can
              find what you need quickly.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

            {categories.map((category) => (
              <div
                key={category.title}
                className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
              >
                <div className="mb-5 text-4xl">
                  {category.icon}
                </div>

                <h3 className="text-lg font-bold">
                  {category.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  {category.description}
                </p>

                <Link
  href={`/tools#${category.title.toLowerCase().replace(/\s+/g, "-")}`}
  className="mt-5 inline-block text-sm font-semibold text-[#2563EB]"
>
  Explore →
</Link>
              </div>
            ))}

          </div>
        </div>
      </section>

      {/* WHAT DO YOU NEED */}
      <section className="mx-auto max-w-5xl px-5 py-20 text-center lg:px-8">

        <div className="rounded-3xl bg-gradient-to-br from-[#0B1020] via-[#111a38] to-[#172554] px-6 py-14 text-white shadow-xl sm:px-12">

          <div className="mx-auto max-w-2xl">

            <div className="text-4xl">💡</div>

            <h2 className="mt-5 text-3xl font-bold sm:text-4xl">
              Tell us what you need
            </h2>

            <p className="mt-4 leading-7 text-gray-300">
              Can’t find the tool you’re looking for? Tell us what
              you want to accomplish and we’ll help shape VEEXORA
              around real needs.
            </p>

            <Link
  href="/suggest-tool"
  className="mt-7 inline-block rounded-xl bg-white px-6 py-3 font-semibold text-[#0B1020] hover:bg-gray-100"
>
  Suggest a Tool
</Link>

          </div>
        </div>

      </section>

      {/* WHY VEEXORA */}
      <section className="border-y border-gray-100 bg-white px-5 py-20 lg:px-8">

        <div className="mx-auto max-w-7xl">

          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-wider text-[#06B6D4]">
              Why VEEXORA
            </p>

            <h2 className="mt-2 text-3xl font-bold sm:text-4xl">
              Built for simplicity
            </h2>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">

            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl">
                ⚡
              </div>

              <h3 className="mt-5 font-bold">
                Fast & Simple
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                No complicated workflows. Upload, customize and
                get your result.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-2xl">
                🔒
              </div>

              <h3 className="mt-5 font-bold">
                Privacy Focused
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Tools are designed to process files locally in the
                browser wherever practical.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-50 text-2xl">
                📱
              </div>

              <h3 className="mt-5 font-bold">
                Works Everywhere
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                A clean experience designed for phones, tablets
                and desktops.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        id="how-it-works"
        className="bg-[#f7f9fc] px-5 py-20 lg:px-8"
      >
        <div className="mx-auto max-w-6xl">

          <div className="text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              How it works
            </h2>

            <p className="mt-3 text-gray-600">
              Three simple steps. That’s it.
            </p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">

            {[
              ["01", "Choose a tool", "Pick the tool that matches what you want to do."],
              ["02", "Upload your file", "Add your image, PDF or document and customize the options."],
              ["03", "Download your result", "Process your file and download the finished result."],
            ].map(([number, title, description]) => (
              <div
                key={number}
                className="rounded-2xl bg-white p-7 shadow-sm"
              >
                <div className="text-4xl font-black text-blue-100">
                  {number}
                </div>

                <h3 className="mt-5 text-lg font-bold">
                  {title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  {description}
                </p>
              </div>
            ))}

          </div>
        </div>
      </section>

      {/* PRIVACY */}
      <section
        id="privacy"
        className="mx-auto max-w-7xl px-5 py-16 lg:px-8"
      >
        <div className="rounded-2xl border border-gray-100 bg-white p-7 text-center shadow-sm">

          <div className="text-3xl">🔐</div>

          <h2 className="mt-4 text-xl font-bold">
            Your files matter
          </h2>

          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-gray-500">
            Many VEEXORA tools process files directly in your browser,
            helping minimize unnecessary file transfers. Processing
            behavior can vary by tool.
          </p>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0B1020] px-5 py-12 text-gray-300 lg:px-8">

        <div className="mx-auto max-w-7xl">

          <div className="grid gap-10 md:grid-cols-4">

            <div className="md:col-span-2">

              <div className="flex items-center gap-2 text-white">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563EB] via-[#7C3AED] to-[#06B6D4] font-black">
                  V
                </div>

                <span className="text-lg font-extrabold">
                  KT VEEXORA
                </span>
              </div>

              <p className="mt-4 max-w-md text-sm leading-6 text-gray-400">
                Everything You Need. One Place.
                Simple digital tools for everyday tasks.
              </p>

            </div>

            <div>
              <h3 className="font-semibold text-white">
                Tools
              </h3>

              <div className="mt-4 space-y-3 text-sm text-gray-400">
                <a href="#tools" className="block hover:text-white">
                  Image Tools
                </a>

                <a href="#tools" className="block hover:text-white">
                  PDF Tools
                </a>

                <a href="#categories" className="block hover:text-white">
                  All Categories
                </a>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-white">
                Company
              </h3>

              <div className="mt-4 space-y-3 text-sm text-gray-400">
                <a href="#how-it-works" className="block hover:text-white">
                  How It Works
                </a>

                <a href="#privacy" className="block hover:text-white">
                  Privacy
                </a>

                <a href="/contact" className="block hover:text-white">
                  Contact
                </a>
              </div>
            </div>

          </div>

          <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-gray-500">
            © 2026 KT VEEXORA. All rights reserved.
          </div>

        </div>
      </footer>

    </main>
  );
}