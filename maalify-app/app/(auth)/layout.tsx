import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    // Force light mode on auth pages — always white regardless of user theme
    <div
      data-force-light="true"
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
      style={{
        backgroundColor: "#F8FAFB",
        color: "#0F172A",
      }}
    >
      <div className="w-full max-w-md flex flex-col gap-6">

        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#1E3A5F] mb-3">
            <span className="text-white font-bold text-xl">M</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1E3A5F]">Maalify</h1>
          <p className="text-sm text-[#475569] mt-1">Pencatatan Keuangan Keluarga</p>
        </div>

        {/* Auth card */}
        {children}

        {/* Back link — di bawah card */}
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
  );
}
