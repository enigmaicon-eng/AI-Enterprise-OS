export function Footer() {
  return (
    <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg)] px-6 py-14">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-10">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                <path d="M6 1L11 3.75V8.25L6 11L1 8.25V3.75L6 1Z" stroke="white" strokeWidth="1.2" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-[var(--fg)] text-sm font-medium">AI Enterprise OS</span>
          </div>
          <p className="text-[var(--fg-subtle)] text-xs max-w-[260px] leading-relaxed">
            Runtime infrastructure for adaptive enterprises.
            Persistent memory. Structured governance.
          </p>
        </div>

        {/* Links */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-16 gap-y-3">
          {[
            { label: "Architecture", href: "#architecture" },
            { label: "Governance",   href: "#governance" },
            { label: "GitHub",       href: "https://github.com/enigmaicon-eng/AI-Enterprise-OS" },
            { label: "Research",     href: "#research" },
            { label: "Vision",       href: "#vision" },
            { label: "Connect",      href: "#connect" },
          ].map((link) => (
            <a
              key={link.label}
              href={link.href}
              target={link.href.startsWith("http") ? "_blank" : undefined}
              rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="text-[var(--fg-muted)] hover:text-[var(--fg)] text-xs transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-10 pt-8 border-t border-[var(--border-subtle)] flex items-center justify-between gap-4">
        <p className="text-[var(--fg-subtle)] text-xs font-mono">© 2026 AI Enterprise OS</p>
        <p className="text-[var(--fg-subtle)] text-xs font-mono">
          <a
            href="https://github.com/enigmaicon-eng/AI-Enterprise-OS/blob/main/LICENSE"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--fg-muted)] transition-colors"
          >
            MIT Licensed
          </a>
          {" · "}Open Source
        </p>
      </div>
    </footer>
  );
}
