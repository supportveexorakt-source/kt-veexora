"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setSending(true);
    setSubmitted(false);
    setError("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          subject,
          message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to send your message.");
      }

      setSubmitted(true);

      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-[#0B1020]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0B1020] text-lg font-black text-white">
              V
            </div>

            <div>
              <div className="text-lg font-black tracking-tight">
                KT VEEXORA
              </div>
              <div className="text-[10px] font-medium text-gray-500">
                Everything You Need. One Place.
              </div>
            </div>
          </Link>

          <Link
            href="/"
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
          >
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-gray-100 bg-gradient-to-b from-blue-50/60 to-white">
        <div className="mx-auto max-w-5xl px-6 py-20 text-center">
          <div className="mb-5 inline-flex rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-semibold text-[#2563EB]">
            Contact KT VEEXORA
          </div>

          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
            Get in touch
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-gray-600 sm:text-lg">
            Have a question, suggestion, or need help with something?
            Send us a message and we&apos;ll get back to you.
          </p>
        </div>
      </section>

      {/* Contact Content */}
      <section className="mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-[0.8fr_1.2fr]">
        {/* Left information */}
        <div>
          <h2 className="text-2xl font-black">Let&apos;s talk</h2>

          <p className="mt-4 leading-7 text-gray-600">
            We&apos;re building KT VEEXORA to make everyday digital tasks
            simpler, faster, and more accessible.
          </p>

          <div className="mt-8 space-y-4">
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
              <div className="text-sm font-bold text-[#0B1020]">
                Support
              </div>
              <p className="mt-1 text-sm leading-6 text-gray-600">
                For questions, technical issues, or general support, use the
                contact form.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
              <div className="text-sm font-bold text-[#0B1020]">
                Suggest a Tool
              </div>
              <p className="mt-1 text-sm leading-6 text-gray-600">
                Have an idea for a useful tool? We&apos;d love to hear it.
              </p>

              <Link
                href="/suggest-tool"
                className="mt-3 inline-block text-sm font-semibold text-[#2563EB] hover:underline"
              >
                Suggest a Tool →
              </Link>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
              <div className="text-sm font-bold text-[#0B1020]">
                Privacy
              </div>
              <p className="mt-1 text-sm leading-6 text-gray-600">
                Learn how KT VEEXORA handles information and privacy.
              </p>

              <Link
                href="/privacy"
                className="mt-3 inline-block text-sm font-semibold text-[#2563EB] hover:underline"
              >
                Read Privacy Policy →
              </Link>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xl shadow-gray-100/60 sm:p-8">
          <h2 className="text-2xl font-black">Send us a message</h2>

          <p className="mt-2 text-sm text-gray-500">
            All fields are required.
          </p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold">
                Full name
              </label>

              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Email
              </label>

              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Subject
              </label>

              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="How can we help?"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Message
              </label>

              <textarea
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your message..."
                rows={6}
                className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50"
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full rounded-xl bg-[#2563EB] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sending ? "Sending..." : "Send Message"}
            </button>

            {submitted && (
              <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-center text-sm font-medium text-green-700">
                Your message has been sent successfully.
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-600">
                {error}
              </div>
            )}
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-[#0B1020] text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="font-black">KT VEEXORA</div>
            <div className="mt-1 text-xs text-gray-400">
              Everything You Need. One Place.
            </div>
          </div>

          <div className="flex flex-wrap gap-5 text-sm text-gray-400">
            <Link href="/" className="hover:text-white">
              Home
            </Link>

            <Link href="/tools" className="hover:text-white">
              Tools
            </Link>

            <Link href="/privacy" className="hover:text-white">
              Privacy
            </Link>

            <Link href="/contact" className="text-white">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}