import { Metadata } from "next";
import PanduanPublicClient from "./PanduanPublicClient";

export const metadata: Metadata = {
  title: "Panduan Penggunaan — Maalify",
  description:
    "Panduan lengkap cara menggunakan Maalify: pencatatan transaksi, manajemen anggaran, dompet, tabungan, hutang, laporan, dan sistem peran anggota keluarga.",
};

export default function PanduanPublicPage() {
  return <PanduanPublicClient />;
}
