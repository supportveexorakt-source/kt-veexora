import Link from "next/link";

const sections = [
  { id: "introduction", title: "Introduction" },
  { id: "information", title: "Information We Collect" },
  { id: "files", title: "Uploaded Files & Processing" },
  { id: "use", title: "How We Use Information" },
  { id: "cookies", title: "Cookies & Technologies" },
  { id: "third-party", title: "Third-Party Services" },
  { id: "security", title: "Data Security" },
  { id: "choices", title: "Your Choices" },
  { id: "updates", title: "Policy Updates" },
  { id: "contact", title: "Contact" },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#f7f9fc] text-[#0B1020]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563EB] via-[#7C3AED] to-[#06B6D4] text-xl font-black text-white shadow-sm">
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
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 hover:text-[#2563EB]"
          >
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-20">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3.5 py-1.5 text-xs font-bold text-[#2563EB]">
              <span>🔒</span>
              Privacy & Security
            </div>

            <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
              Privacy Policy
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-gray-600 sm:text-lg">
              We believe useful digital tools should also respect your
              privacy. This policy explains how information may be handled
              when you use KT VEEXORA.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3 text-xs text-gray-500">
              <span className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                Last updated: September 2026
              </span>

              <span className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                KT VEEXORA
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[240px_minmax(0,1fr)]">
          {/* Table of Contents */}
          <aside className="hidden lg:block">
            <div className="sticky top-28 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                On this page
              </p>

              <nav className="mt-4 space-y-1">
                {sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="block rounded-lg px-3 py-2 text-sm text-gray-600 transition hover:bg-blue-50 hover:text-[#2563EB]"
                  >
                    {section.title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Policy */}
          <article className="min-w-0">
            {/* Privacy Principle */}
            <div className="mb-8 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-violet-50 p-6 sm:p-7">
              <div className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
                  🛡️
                </div>

                <div>
                  <h2 className="font-bold">Our privacy approach</h2>

                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    KT VEEXORA is being designed with privacy-conscious
                    processing in mind. Where a tool supports local browser
                    processing, files can be processed on your device instead
                    of being sent to a server.
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
              {/* 1 */}
              <section
                id="introduction"
                className="scroll-mt-28 border-b border-gray-100 p-6 sm:p-9"
              >
                <SectionNumber number="01" />
                <h2 className="mt-4 text-2xl font-bold">
                  Introduction
                </h2>

                <p className="mt-4 leading-7 text-gray-600">
                  KT VEEXORA is a digital utility platform designed to bring
                  useful image, document, PDF, and other digital tools together
                  in one place.
                </p>

                <p className="mt-4 leading-7 text-gray-600">
                  This Privacy Policy explains the types of information that
                  may be collected, how information may be used, and how
                  privacy is considered when you use our website and services.
                </p>
              </section>

              {/* 2 */}
              <section
                id="information"
                className="scroll-mt-28 border-b border-gray-100 p-6 sm:p-9"
              >
                <SectionNumber number="02" />
                <h2 className="mt-4 text-2xl font-bold">
                  Information We Collect
                </h2>

                <p className="mt-4 leading-7 text-gray-600">
                  Depending on the features you use, KT VEEXORA may handle
                  information such as:
                </p>

                <ul className="mt-5 space-y-3">
                  <Bullet>
                    Account information such as your name and email address
                    when account features are available.
                  </Bullet>

                  <Bullet>
                    Information you voluntarily provide through forms,
                    feedback, or tool suggestions.
                  </Bullet>

                  <Bullet>
                    Basic technical information that may be necessary to
                    operate, secure, and improve the website.
                  </Bullet>
                </ul>
              </section>

              {/* 3 */}
              <section
                id="files"
                className="scroll-mt-28 border-b border-gray-100 p-6 sm:p-9"
              >
                <SectionNumber number="03" />
                <h2 className="mt-4 text-2xl font-bold">
                  Uploaded Files & Processing
                </h2>

                <p className="mt-4 leading-7 text-gray-600">
                  Many current KT VEEXORA tools are designed to process files
                  directly inside your browser. When local processing is used,
                  the file can be processed on your device without being
                  uploaded to our servers.
                </p>

                <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                  <div className="flex gap-3">
                    <span className="text-lg">✓</span>

                    <div>
                      <h3 className="font-bold text-emerald-900">
                        Local processing
                      </h3>

                      <p className="mt-1 text-sm leading-6 text-emerald-800">
                        Tools that explicitly perform processing in your
                        browser are designed to keep that processing on your
                        device.
                      </p>
                    </div>
                  </div>
                </div>

                <p className="mt-6 leading-7 text-gray-600">
                  Data handling may differ for future tools or features that
                  require server-side processing. The applicable information
                  will be communicated as those services are introduced.
                </p>
              </section>

              {/* 4 */}
              <section
                id="use"
                className="scroll-mt-28 border-b border-gray-100 p-6 sm:p-9"
              >
                <SectionNumber number="04" />
                <h2 className="mt-4 text-2xl font-bold">
                  How We Use Information
                </h2>

                <p className="mt-4 leading-7 text-gray-600">
                  Information may be used for purposes such as:
                </p>

                <ul className="mt-5 space-y-3">
                  <Bullet>
                    Providing and maintaining KT VEEXORA services.
                  </Bullet>

                  <Bullet>
                    Improving website performance, usability, and reliability.
                  </Bullet>

                  <Bullet>
                    Responding to questions, feedback, and support requests.
                  </Bullet>

                  <Bullet>
                    Protecting the platform against misuse and security
                    threats.
                  </Bullet>

                  <Bullet>
                    Developing new tools and features.
                  </Bullet>
                </ul>
              </section>

              {/* 5 */}
              <section
                id="cookies"
                className="scroll-mt-28 border-b border-gray-100 p-6 sm:p-9"
              >
                <SectionNumber number="05" />
                <h2 className="mt-4 text-2xl font-bold">
                  Cookies & Similar Technologies
                </h2>

                <p className="mt-4 leading-7 text-gray-600">
                  KT VEEXORA may use cookies or similar technologies as the
                  platform develops. These technologies may support essential
                  functionality, preferences, analytics, security, or account
                  features.
                </p>

                <p className="mt-4 leading-7 text-gray-600">
                  Any future use of non-essential technologies will be
                  implemented according to the applicable requirements and
                  choices made available to users.
                </p>
              </section>

              {/* 6 */}
              <section
                id="third-party"
                className="scroll-mt-28 border-b border-gray-100 p-6 sm:p-9"
              >
                <SectionNumber number="06" />
                <h2 className="mt-4 text-2xl font-bold">
                  Third-Party Services
                </h2>

                <p className="mt-4 leading-7 text-gray-600">
                  Some future KT VEEXORA features may use third-party
                  services, integrations, hosting providers, analytics
                  services, authentication providers, or other external
                  infrastructure.
                </p>

                <p className="mt-4 leading-7 text-gray-600">
                  Where applicable, those third parties may process information
                  according to their own privacy policies and terms.
                </p>
              </section>

              {/* 7 */}
              <section
                id="security"
                className="scroll-mt-28 border-b border-gray-100 p-6 sm:p-9"
              >
                <SectionNumber number="07" />
                <h2 className="mt-4 text-2xl font-bold">
                  Data Security
                </h2>

                <p className="mt-4 leading-7 text-gray-600">
                  We intend to use reasonable technical and organizational
                  measures to protect information handled by KT VEEXORA.
                </p>

                <p className="mt-4 leading-7 text-gray-600">
                  However, no website, application, or method of electronic
                  transmission can guarantee absolute security.
                </p>
              </section>

              {/* 8 */}
              <section
                id="choices"
                className="scroll-mt-28 border-b border-gray-100 p-6 sm:p-9"
              >
                <SectionNumber number="08" />
                <h2 className="mt-4 text-2xl font-bold">
                  Your Choices
                </h2>

                <p className="mt-4 leading-7 text-gray-600">
                  Depending on the services available, users may have choices
                  regarding account information, uploaded files, cookies,
                  communications, and other information.
                </p>

                <p className="mt-4 leading-7 text-gray-600">
                  Additional privacy controls may be introduced as the
                  platform's account and backend systems are developed.
                </p>
              </section>

              {/* 9 */}
              <section
                id="updates"
                className="scroll-mt-28 border-b border-gray-100 p-6 sm:p-9"
              >
                <SectionNumber number="09" />
                <h2 className="mt-4 text-2xl font-bold">
                  Policy Updates
                </h2>

                <p className="mt-4 leading-7 text-gray-600">
                  This Privacy Policy may be updated as KT VEEXORA introduces
                  new tools, services, technologies, and backend functionality.
                </p>

                <p className="mt-4 leading-7 text-gray-600">
                  When appropriate, the updated version will be published on
                  this page with a revised update date.
                </p>
              </section>

              {/* 10 */}
              <section
                id="contact"
                className="scroll-mt-28 p-6 sm:p-9"
              >
                <SectionNumber number="10" />
                <h2 className="mt-4 text-2xl font-bold">
                  Contact
                </h2>

                <p className="mt-4 leading-7 text-gray-600">
                  If you have questions about this Privacy Policy or the
                  privacy practices of KT VEEXORA, a dedicated contact channel
                  will be provided as the platform develops.
                </p>
              </section>
            </div>

            {/* Important Notice */}
            <div className="mt-8 rounded-2xl border border-amber-100 bg-amber-50 p-5 sm:p-6">
              <div className="flex gap-3">
                <span className="text-lg">ℹ️</span>

                <div>
                  <h3 className="font-bold text-amber-900">
                    Important notice
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-amber-800">
                    This Privacy Policy is currently an informational draft
                    for the KT VEEXORA website. It should be reviewed and
                    finalized with appropriate legal advice before the
                    platform is publicly launched or production account and
                    data-processing systems are activated.
                  </p>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-10 lg:px-8">
          <div className="flex flex-col justify-between gap-6 sm:flex-row">
            <div>
              <Link href="/" className="text-lg font-extrabold">
                KT VEEXORA
              </Link>

              <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
                Everything You Need. One Place.
              </p>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-gray-500">
              <Link href="/" className="hover:text-[#2563EB]">
                Home
              </Link>

              <Link href="/tools" className="hover:text-[#2563EB]">
                Tools
              </Link>

              <Link
                href="/privacy"
                className="font-semibold text-[#2563EB]"
              >
                Privacy
              </Link>

              <Link href="/suggest-tool" className="hover:text-[#2563EB]">
                Suggest a Tool
              </Link>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-5 text-xs text-gray-400">
            © 2026 KT VEEXORA. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}

function SectionNumber({ number }: { number: string }) {
  return (
    <span className="inline-flex rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold tracking-wider text-[#2563EB]">
      {number}
    </span>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3 text-sm leading-6 text-gray-600">
      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2563EB]" />
      <span>{children}</span>
    </li>
  );
}