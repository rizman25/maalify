"use client";

export default function PrintButton() {
  return (
    <button
      className="toolbar-btn"
      onClick={() => window.print()}
    >
      🖨️ Cetak / Simpan PDF
    </button>
  );
}
