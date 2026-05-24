"use client";

import { useState, useEffect } from "react";

interface Props {
  onClose: () => void;
}

type Tab = "android" | "iphone";

export default function InstallModal({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>("android");
  const [deferredPrompt, setDeferredPrompt] = useState<Event & { prompt: () => void } | null>(null);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as Event & { prompt: () => void });
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleNativeInstall() {
    if (!deferredPrompt) return;
    setInstalling(true);
    deferredPrompt.prompt();
    setDeferredPrompt(null);
    setInstalling(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-sm bg-[var(--bg-surface)] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Install Aplikasi</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="px-5 pb-5 space-y-4">
          {/* Why install banner */}
          <div className="rounded-2xl p-4 text-white" style={{ background: "linear-gradient(135deg, #1E3A5F 0%, #2E8B57 100%)" }}>
            <p className="font-bold text-sm mb-3">Kenapa Install Aplikasi?</p>
            <div className="grid grid-cols-2 gap-y-2 gap-x-4">
              {["Akses cepat", "Fullscreen", "Lebih cepat", "Notifikasi"].map((f) => (
                <div key={f} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-white/30 flex items-center justify-center flex-shrink-0">
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <span className="text-sm">{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Native install button (if supported) */}
          {deferredPrompt && (
            <button
              onClick={handleNativeInstall}
              disabled={installing}
              className="w-full py-3 rounded-xl bg-brand-primary text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-brand-primary/90 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Install Sekarang
            </button>
          )}

          {/* Tab */}
          <div className="flex rounded-xl bg-[var(--bg-elevated)] p-1 gap-1">
            {(["android", "iphone"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  tab === t
                    ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {t === "android" ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85a.637.637 0 0 0-.83.22l-1.88 3.24a11.463 11.463 0 0 0-8.94 0L5.65 5.67a.643.643 0 0 0-.87-.2c-.28.18-.37.54-.22.83L6.4 9.48A10.78 10.78 0 0 0 1 18h22a10.78 10.78 0 0 0-5.4-8.52zM7 15.25a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5zm10 0a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5z"/></svg>
                    Android
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                    iPhone
                  </>
                )}
              </button>
            ))}
          </div>

          {/* Android instructions */}
          {tab === "android" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--color-success, #2E8B57)"><path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85a.637.637 0 0 0-.83.22l-1.88 3.24a11.463 11.463 0 0 0-8.94 0L5.65 5.67a.643.643 0 0 0-.87-.2c-.28.18-.37.54-.22.83L6.4 9.48A10.78 10.78 0 0 0 1 18h22a10.78 10.78 0 0 0-5.4-8.52zM7 15.25a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5zm10 0a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5z"/></svg>
                <p className="font-semibold text-sm text-[var(--text-primary)]">Cara Install di Android</p>
              </div>

              {/* Via Chrome Menu */}
              <div>
                <p className="text-[10px] font-bold tracking-widest uppercase text-brand-primary mb-2">Via Chrome Menu:</p>
                <div className="space-y-2">
                  {[
                    {
                      icon: (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
                        </svg>
                      ),
                      title: 'Tap menu Chrome (titik 3)',
                      desc: 'Pojok kanan atas browser',
                      done: false,
                    },
                    {
                      icon: (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="7 10 12 15 17 10"/>
                          <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                      ),
                      title: '"Install app" atau "Add to Home screen"',
                      desc: 'Ada di dropdown menu',
                      done: false,
                    },
                    {
                      icon: (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      ),
                      title: 'Tap "Install"',
                      desc: 'Selesai! Maalify ada di home screen',
                      done: true,
                    },
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        step.done
                          ? "bg-[var(--color-success,#2E8B57)]"
                          : "bg-[var(--bg-elevated)] text-[var(--text-secondary)]"
                      }`}>
                        {step.icon}
                      </div>
                      <div className="pt-1">
                        <p className="text-sm font-medium text-[var(--text-primary)] leading-tight">{step.title}</p>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Via Address Bar */}
              <div>
                <p className="text-[10px] font-bold tracking-widest uppercase text-brand-primary mb-2">Via Browser Address Bar:</p>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center flex-shrink-0 text-[var(--text-secondary)]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  </div>
                  <div className="pt-1">
                    <p className="text-sm font-medium text-[var(--text-primary)] leading-tight">Tap ikon "Install" di address bar</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">Ikon plus atau download di sebelah URL</p>
                  </div>
                </div>
              </div>

              {/* Tip */}
              <div className="flex gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <span className="text-base flex-shrink-0">💡</span>
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                  <span className="font-bold">Tip:</span> Pastikan menggunakan Chrome, Edge, atau Samsung Internet untuk pengalaman terbaik.
                </p>
              </div>
            </div>
          )}

          {/* iPhone instructions */}
          {tab === "iphone" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--text-secondary)"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                <p className="font-semibold text-sm text-[var(--text-primary)]">Cara Install di iPhone / iPad</p>
              </div>

              <div className="space-y-2">
                {[
                  {
                    icon: (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                        <polyline points="16 6 12 2 8 6"/>
                        <line x1="12" y1="2" x2="12" y2="15"/>
                      </svg>
                    ),
                    title: 'Tap tombol Share (kotak + panah atas)',
                    desc: 'Ada di toolbar bawah Safari',
                    done: false,
                  },
                  {
                    icon: (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="3" width="20" height="14" rx="2"/>
                        <line x1="8" y1="21" x2="16" y2="21"/>
                        <line x1="12" y1="17" x2="12" y2="21"/>
                      </svg>
                    ),
                    title: '"Add to Home Screen"',
                    desc: 'Scroll ke bawah di menu share',
                    done: false,
                  },
                  {
                    icon: (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    ),
                    title: 'Tap "Add" di pojok kanan atas',
                    desc: 'Selesai! Maalify ada di home screen',
                    done: true,
                  },
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      step.done
                        ? "bg-[var(--color-success,#2E8B57)]"
                        : "bg-[var(--bg-elevated)] text-[var(--text-secondary)]"
                    }`}>
                      {step.icon}
                    </div>
                    <div className="pt-1">
                      <p className="text-sm font-medium text-[var(--text-primary)] leading-tight">{step.title}</p>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tip */}
              <div className="flex gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30">
                <span className="text-base flex-shrink-0">💡</span>
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  <span className="font-semibold">Tip:</span> Hanya bisa diinstall melalui Safari. Pastikan iOS 16.4+ untuk notifikasi push.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
