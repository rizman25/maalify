import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Force light styles — injected directly into head, overrides .dark input rules */}
      <style>{`
        .auth-wrap { background-color: #F8FAFB !important; color: #0F172A !important; }
        .auth-wrap * { box-sizing: border-box; }

        /* Reset all form elements to light */
        .auth-wrap input:not([type="checkbox"]):not([type="radio"]),
        .auth-wrap select,
        .auth-wrap textarea {
          background-color: #FFFFFF !important;
          border-color: #E2E8F0 !important;
          color: #0F172A !important;
        }
        .auth-wrap input::placeholder,
        .auth-wrap textarea::placeholder {
          color: #94A3B8 !important;
          opacity: 1 !important;
        }
        .auth-wrap input:focus,
        .auth-wrap select:focus,
        .auth-wrap textarea:focus {
          background-color: #FFFFFF !important;
          outline: none !important;
        }

        /* Override browser autofill (Chrome blue tint) */
        .auth-wrap input:-webkit-autofill,
        .auth-wrap input:-webkit-autofill:hover,
        .auth-wrap input:-webkit-autofill:focus,
        .auth-wrap input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 1000px #FFFFFF inset !important;
          -webkit-text-fill-color: #0F172A !important;
          transition: background-color 5000s ease-in-out 0s;
        }

        /* Phone input wrapper background */
        .auth-phone-wrap { background-color: #FFFFFF !important; }
        .auth-phone-prefix { background-color: #F1F5F9 !important; color: #475569 !important; }
      `}</style>

      <div className="auth-wrap min-h-screen flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-md flex flex-col gap-6">

          {/* Logo */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-3" style={{ backgroundColor: "#1E3A5F" }}>
              <span style={{ color: "white", fontWeight: "bold", fontSize: "20px" }}>M</span>
            </div>
            <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#1E3A5F" }}>Maalify</h1>
            <p style={{ fontSize: "14px", color: "#475569", marginTop: "4px" }}>Pencatatan Keuangan Keluarga</p>
          </div>

          {/* Auth card */}
          {children}

          {/* Back link */}
          <div className="text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-[#475569] hover:text-[#1E3A5F] transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              Kembali ke beranda
            </Link>
          </div>

        </div>
      </div>
    </>
  );
}
