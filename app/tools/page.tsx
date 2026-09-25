"use client";
import { useEffect, useMemo, useState } from "react";import Link from "next/link";

type Tool = {
  name: string;
  description: string;
  href: string;
  icon: string;
  comingSoon?: boolean;
};

type Category = {
  title: string;
  description: string;
  icon: string;
  tools: Tool[];
};


const categories: Category[] = [
  {
    title: "Image Tools",
    description: "Resize, compress, convert, edit and prepare your images.",
    icon: "🖼️",
    tools: [
      {
        name: "Resize Image",
        description: "Resize images to any width, height or scale.",
        href: "/resize-image",
        icon: "↔️",
      },
      {
        name: "Compress Image",
        description: "Reduce image size while keeping good quality.",
        href: "/compress-image",
        icon: "📉",
      },
      {
        name: "Convert Image",
        description: "Convert JPG, PNG and WebP images.",
        href: "/convert-image",
        icon: "🔄",
      },
      {
        name: "Crop & Rotate",
        description: "Crop, rotate, flip and adjust image framing.",
        href: "/crop-image",
        icon: "✂️",
      },
      {
        name: "Photo Editor",
        description: "Adjust brightness, contrast, saturation and filters.",
        href: "/photo-editor",
        icon: "🎨",
      },
      {
        name: "Passport Photo",
        description: "Create passport and ID-size photos.",
        href: "/passport-photo",
        icon: "🪪",
      },
      {
        name: "Image to PDF",
        description: "Combine images into a PDF document.",
        href: "/image-to-pdf",
        icon: "📄",
      },
      {
        name: "Image to Word",
        description: "Extract text from images and create Word files.",
        href: "/image-to-word",
        icon: "📝",
      },
      {
        name: "Image to TXT",
        description: "Extract text from images into editable text.",
        href: "/image-to-txt",
        icon: "📃",
      },
      {
        name: "Image to Excel",
        description: "Extract text from images into Excel.",
        href: "/image-to-excel",
        icon: "📊",
      },
    ],
  },
  {
    title: "PDF Tools",
    description: "Manage, convert, edit and organize PDF documents.",
    icon: "📕",
    tools: [
      {
        name: "PDF to Word",
        description: "Convert PDF text into an editable Word document.",
        href: "/pdf-to-word",
        icon: "📝",
      },
      {
        name: "PDF to JPG",
        description: "Convert PDF pages into JPG images.",
        href: "/pdf-to-jpg",
        icon: "🖼️",
      },
      {
        name: "PDF to PNG",
        description: "Convert PDF pages into PNG images.",
        href: "/pdf-to-png",
        icon: "🌄",
      },
      {
        name: "PDF to TXT",
        description: "Extract text from PDF documents.",
        href: "/pdf-to-txt",
        icon: "📃",
      },
      {
        name: "PDF to Excel",
        description: "Extract PDF text into an Excel workbook.",
        href: "/pdf-to-excel",
        icon: "📊",
      },
      {
        name: "Merge PDF",
        description: "Combine multiple PDF files into one.",
        href: "/pdf-merge",
        icon: "🔗",
      },
      {
        name: "Split PDF",
        description: "Extract selected pages from a PDF.",
        href: "/pdf-split",
        icon: "✂️",
      },
      {
        name: "Rotate PDF",
        description: "Rotate PDF pages by 90, 180 or 270 degrees.",
        href: "/pdf-rotate",
        icon: "🔃",
      },
      {
        name: "Compress PDF",
        description: "Optimize and reduce PDF file size.",
        href: "/pdf-compress",
        icon: "📦",
      },
      {
        name: "Page Numbers",
        description: "Add page numbers to your PDF.",
        href: "/pdf-page-numbers",
        icon: "🔢",
      },
      {
        name: "Watermark PDF",
        description: "Add a custom text watermark to PDF pages.",
        href: "/pdf-watermark",
        icon: "💧",
      },
      {
        name: "Organize PDF",
        description: "Reorder or remove PDF pages.",
        href: "/pdf-organize",
        icon: "📑",
      },
      {
        name: "Sign PDF",
        description: "Add a drawn signature to a PDF.",
        href: "/pdf-sign",
        icon: "✍️",
      },
      {
        name: "PDF Metadata",
        description: "Edit PDF title, author and document details.",
        href: "/pdf-metadata",
        icon: "🏷️",
      },
      {
        name: "Password Protect PDF",
        description: "Protect your PDF with a password.",
        href: "/pdf-protect",
        icon: "🔐",
      },
      {
        name: "Unlock PDF",
        description: "Remove password protection from a PDF.",
        href: "/pdf-unlock",
        icon: "🔓",
      },
    ],
  },
  {
    title: "Document Tools",
    description: "Useful tools for working with everyday documents.",
    icon: "📚",
    tools: [
      {
        name: "Image to Word",
        description: "Turn image text into an editable Word document.",
        href: "/image-to-word",
        icon: "📝",
      },
      {
        name: "Image to TXT",
        description: "Extract readable text from images.",
        href: "/image-to-txt",
        icon: "📃",
      },
      {
        name: "Image to Excel",
        description: "Extract image text into Excel.",
        href: "/image-to-excel",
        icon: "📊",
      },
      {
        name: "PDF to Word",
        description: "Convert PDF content into editable Word text.",
        href: "/pdf-to-word",
        icon: "📄",
      },
      {
        name: "PDF to TXT",
        description: "Extract editable text from PDFs.",
        href: "/pdf-to-txt",
        icon: "📃",
      },
      {
        name: "PDF to Excel",
        description: "Export PDF text into Excel.",
        href: "/pdf-to-excel",
        icon: "📊",
      },
    ],
  },
  {
    title: "AI Tools",
    description: "Smart productivity tools coming to VEEXORA.",
    icon: "✨",
    tools: [
      {
        name: "AI Image Tools",
        description: "Smart image enhancement and editing tools.",
        href: "#",
        icon: "✨",
        comingSoon: true,
      },
      {
        name: "AI Document Tools",
        description: "AI-powered document understanding and processing.",
        href: "#",
        icon: "🤖",
        comingSoon: true,
      },
      {
        name: "AI Text Tools",
        description: "Smart tools for writing, rewriting and summarizing.",
        href: "#",
        icon: "💡",
        comingSoon: true,
      },
    ],
  },
];

export default function ToolsPage() {  const [search, setSearch] = useState("");
    useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const searchQuery = params.get("search");

  if (searchQuery) {
    setSearch(searchQuery);
  }
}, []);

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return categories;

    return categories
      .map((category) => ({
        ...category,
        tools: category.tools.filter(
          (tool) =>
            tool.name.toLowerCase().includes(query) ||
            tool.description.toLowerCase().includes(query)
        ),
      }))
      .filter((category) => category.tools.length > 0);
  }, [search]);
  return (
    <main className="min-h-screen bg-[#f8fafc] text-[#0B1020]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] text-lg font-black text-white shadow-md">
              V
            </div>

            <div>
              <div className="text-lg font-extrabold tracking-tight">
                KT VEEXORA
              </div>
              <div className="text-[10px] font-medium text-slate-500">
                Everything You Need. One Place.
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            <Link
              href="/tools"
              className="text-sm font-semibold text-[#2563EB]"
            >
              Tools
            </Link>
            <Link
              href="/#categories"
              className="text-sm font-medium text-slate-600 hover:text-[#2563EB]"
            >
              Categories
            </Link>
            <Link
              href="/#how-it-works"
              className="text-sm font-medium text-slate-600 hover:text-[#2563EB]"
            >
              How It Works
            </Link>
            <Link
              href="/#privacy"
              className="text-sm font-medium text-slate-600 hover:text-[#2563EB]"
            >
              Privacy
            </Link>
          </nav>

          <Link
            href="/"
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-[#2563EB] hover:text-[#2563EB]"
          >
            Home
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-white">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-blue-100/60 blur-3xl" />
        <div className="absolute -right-24 top-10 h-72 w-72 rounded-full bg-violet-100/60 blur-3xl" />

        <div className="relative mx-auto max-w-5xl px-5 py-16 text-center lg:px-8 lg:py-20">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-semibold text-[#2563EB]">
            ✨ All VEEXORA Tools
          </div>

          <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
            Powerful Tools.
            <span className="block bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#06B6D4] bg-clip-text text-transparent">
              One Simple Place.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Explore our growing collection of image, PDF, document and AI
            tools. Fast, simple and designed for everyday use.
          </p>

          <div className="mx-auto mt-8 flex max-w-2xl items-center rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
            <span className="px-3 text-lg">🔎</span>
           <input
  type="text"
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  placeholder="Search for a tool..."
  className="w-full bg-transparent px-2 py-3 text-sm outline-none placeholder:text-slate-400"
/>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
        <div className="space-y-16">
         {filteredCategories.map((category) => (
<section
  key={category.title}
  id={category.title.toLowerCase().replace(/\s+/g, "-")}
  className="scroll-mt-28"
>
             <div className="mb-7 flex items-end justify-between gap-4">
                <div>
                  <div className="mb-2 text-3xl">{category.icon}</div>
                  <h2 className="text-2xl font-extrabold sm:text-3xl">
                    {category.title}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm text-slate-500 sm:text-base">
                    {category.description}
                  </p>
                </div>

                <div className="hidden rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 sm:block">
                  {category.tools.length} tools
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {category.tools.map((tool) => {
                  const CardContent = (
                    <>
                      <div className="mb-5 flex items-start justify-between">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-violet-50 text-2xl">
                          {tool.icon}
                        </div>

                        {tool.comingSoon && (
                          <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-violet-600">
                            Soon
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-extrabold">
                        {tool.name}
                      </h3>

                      <p className="mt-2 min-h-[48px] text-sm leading-6 text-slate-500">
                        {tool.description}
                      </p>

                      <div className="mt-5 flex items-center gap-1 text-sm font-bold text-[#2563EB]">
                        {tool.comingSoon ? "Coming Soon" : "Open Tool"}
                        {!tool.comingSoon && <span>→</span>}
                      </div>
                    </>
                  );

                  if (tool.comingSoon) {
                    return (
                      <div
                        key={tool.name}
                        className="rounded-2xl border border-slate-200 bg-white p-5 opacity-80 shadow-sm"
                      >
                        {CardContent}
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={tool.name}
                      href={tool.href}
                      className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl"
                    >
                      {CardContent}
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-5 pb-16 lg:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl bg-gradient-to-r from-[#0B1020] via-[#111a3a] to-[#24104d] px-6 py-12 text-center text-white sm:px-10">
          <div className="text-3xl">💡</div>

          <h2 className="mt-4 text-2xl font-extrabold sm:text-3xl">
            Can&apos;t find what you need?
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
            Tell us what tool you&apos;d like to see on VEEXORA. We&apos;re
            continuously expanding the platform.
          </p>

          <button className="mt-7 rounded-xl bg-white px-6 py-3 text-sm font-bold text-[#0B1020] transition hover:bg-slate-100">
            Suggest a Tool
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left lg:px-8">
          <div>
            <div className="font-extrabold">KT VEEXORA</div>
            <div className="mt-1 text-xs text-slate-500">
              Everything You Need. One Place.
            </div>
          </div>

          <div className="text-xs text-slate-500">
            Your files are processed locally in your browser whenever
            possible.
          </div>

          <div className="text-xs text-slate-400">
            © {new Date().getFullYear()} KT VEEXORA
          </div>
        </div>
      </footer>
    </main>
  );
}