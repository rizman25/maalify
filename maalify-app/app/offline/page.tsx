export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)] px-4">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-brand-primary flex items-center justify-center">
          <span className="text-white font-bold text-4xl">M</span>
        </div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
          Tidak Ada Koneksi
        </h1>
        <p className="text-[var(--text-secondary)] text-sm mb-6">
          Maalify membutuhkan koneksi internet untuk mengakses data keuangan keluarga Anda.
          Periksa koneksi internet Anda, lalu coba lagi.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 bg-brand-primary text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
        >
          Coba Lagi
        </button>
      </div>
    </div>
  );
}
