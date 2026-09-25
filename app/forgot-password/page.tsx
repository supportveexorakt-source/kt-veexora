"use client";

import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <main className="min-h-screen bg-[#f7f9fc] text-[#0B1020]">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white">
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
            href="/sign-in"
            className="text-sm font-semibold text-gray-600 hover:text-[#2563EB]"
          >
            ← Back to Sign In
          </Link>
        </div>
      </header>

      {/* Forgot Password */}
      <section className="flex min-h-[calc(100vh-81px)] items-center justify-center px-5 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-violet-50 text-3xl">
              🔐
            </div>

            <h1 className="mt-6 text-3xl font-black tracking-tight">
              Forgot your password?
            </h1>

            <p className="mt-3 text-sm leading-6 text-gray-500">
              Enter your email address and we&apos;ll help you reset your
              password.
            </p>
          </div>

          {!submitted ? (
            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSubmitted(true);
                }}
              >
                <label className="block text-sm font-semibold text-gray-800">
                  Email address
                </label>

                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100"
                />

                <button
                  type="submit"
                  className="mt-6 w-full rounded-xl bg-[#2563EB] px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
                >
                  Send Reset Link
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-500">
                Remember your password?{" "}
                <Link
                  href="/sign-in"
                  className="font-bold text-[#2563EB] hover:text-blue-700"
                >
                  Sign In
                </Link>
              </p>
            </div>
          ) : (
            <div className="rounded-3xl border border-green-100 bg-white p-8 text-center shadow-sm">
              <div className="text-5xl">📩</div>

              <h2 className="mt-5 text-2xl font-bold">
                Check your email
              </h2>

              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-gray-500">
                If an account exists for that email address, a password reset
                link will be sent when the authentication system is connected.
              </p>

              <Link
                href="/sign-in"
                className="mt-7 inline-block rounded-xl bg-[#2563EB] px-6 py-3 text-sm font-bold text-white hover:bg-blue-700"
              >
                Back to Sign In
              </Link>
            </div>
          )}

          <p className="mt-6 text-center text-xs leading-5 text-gray-400">
            Password recovery will be connected to the secure authentication
            backend later.
          </p>
        </div>
      </section>
    </main>
  );
}