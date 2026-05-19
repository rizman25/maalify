export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFB] px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#1E3A5F]">Maalify</h1>
          <p className="text-sm text-[#475569] mt-1">Pencatatan Keuangan Keluarga</p>
        </div>
        {children}
      </div>
    </div>
  );
}
