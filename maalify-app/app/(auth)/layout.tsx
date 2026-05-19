import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFB] px-4">
      <div className="w-full max-w-md">
        {/* Logo + back link */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-[#475569] hover:text-[#1E3A5F] transition-colors mb-4">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Kembali ke beranda
          </Link>
          <h1 className="text-2xl font-bold text-[#1E3A5F]">Maalify</h1>
          <p className="text-sm text-[#475569] mt-1">Pencatatan Keuangan Keluarga</p>
        </div>
        {children}
      </div>
    </div>
  );
}
