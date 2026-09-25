"use client";

import Link from "next/link";
import { useState } from "react";

export default function CreateAccountPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setSubmitted(false);
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!agreed) {
      setError("Please agree to the VEEXORA terms and privacy policy.");
      return;
    }

    setSubmitted(true);
  };

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
            href="/"
            className="text-sm font-semibold text-gray-600 hover:text-[#2563EB]"
          >
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* Create Account */}
      <section className="flex min-h-[calc(100vh-81px)] items-center justify-center px-5 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-violet-50 text-3xl">
              🚀
            </div>

            <h1 className="mt-6 text-3xl font-black tracking-tight">
              Create your account
            </h1>

            <p className="mt-3 text-sm text-gray-500">
              Get started with KT VEEXORA.
            </p>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
            <form onSubmit={handleSubmit}>
              {/* Full Name */}
              <label className="block text-sm font-semibold text-gray-800">
                Full name
              </label>

              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100"
              />

              {/* Email */}
              <label className="mt-5 block text-sm font-semibold text-gray-800">
                Email address
              </label>

              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100"
              />

              {/* Password */}
              <label className="mt-5 block text-sm font-semibold text-gray-800">
                Password
              </label>

              <div className="relative mt-2">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 pr-20 text-sm outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500 hover:text-[#2563EB]"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              {/* Confirm Password */}
              <label className="mt-5 block text-sm font-semibold text-gray-800">
                Confirm password
              </label>

              <div className="relative mt-2">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Enter password again"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 pr-20 text-sm outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500 hover:text-[#2563EB]"
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>

              {/* Terms */}
              <label className="mt-5 flex items-start gap-3 text-xs leading-5 text-gray-500">
                <input
                  type="checkbox"
                  required
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300"
                />

                <span>
                  I agree to the VEEXORA terms and privacy policy.
                </span>
              </label>

              {/* Create Account */}
              <button
                type="submit"
                className="mt-6 w-full rounded-xl bg-[#2563EB] px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
              >
                Create Account
              </button>

              {/* Error */}
              {error && (
                <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-600">
                  {error}
                </div>
              )}

              {/* Success */}
              {submitted && (
                <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-center text-sm font-medium text-blue-700">
                  Account creation is not connected yet. Your secure account
                  system will be activated when the backend is added.
                </div>
              )}
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-gray-100" />
              <span className="text-xs text-gray-400">OR</span>
              <div className="h-px flex-1 bg-gray-100" />
            </div>

            {/* Google */}
            <button
              type="button"
              className="w-full rounded-xl border border-gray-200 px-5 py-3.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Continue with Google
            </button>

            {/* Sign In */}
            <p className="mt-6 text-center text-sm text-gray-500">
              Already have an account?{" "}
              <Link
                href="/sign-in"
                className="font-bold text-[#2563EB] hover:text-blue-700"
              >
                Sign In
              </Link>
            </p>
          </div>

          <p className="mt-6 text-center text-xs leading-5 text-gray-400">
            Account authentication will be connected to a secure backend
            later.
          </p>
        </div>
      </section>
    </main>
  );
}