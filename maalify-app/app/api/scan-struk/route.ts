import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const PROMPT = `Kamu adalah asisten OCR untuk aplikasi keuangan keluarga Indonesia. Analisis struk/kuitansi/invoice/nota ini dan ekstrak informasi transaksi.

Kembalikan HANYA JSON valid (tanpa markdown, tanpa teks lain) dengan format:
{
  "merchant": "nama toko, merchant, atau pengirim",
  "date": "YYYY-MM-DD atau null jika tidak ada tanggal",
  "total": angka_integer_dalam_rupiah_tanpa_titik_koma,
  "items": [{"name": "nama item atau deskripsi", "price": angka_integer}],
  "transaction_type": "expense atau income",
  "description": "deskripsi ringkas max 80 karakter, contoh: Belanja Indomaret, Makan KFC, Transfer Gaji",
  "confidence": "high, medium, atau low"
}

Aturan penting:
- total harus integer murni dalam rupiah (contoh: 85000, bukan "85.000" atau "85,000")
- Struk belanja/makan/beli → transaction_type = "expense"
- Struk gaji/slip gaji/transfer masuk/pendapatan → transaction_type = "income"
- description singkat dan informatif dalam Bahasa Indonesia
- Jika nominal tidak terbaca jelas → confidence = "low", total = 0
- Jika tanggal tidak ada → date = null`;

const MODEL = "google/gemini-2.0-flash-001";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json({ error: "OPENROUTER_API_KEY belum dikonfigurasi" }, { status: 500 });
  }

  let file: File | null = null;
  try {
    const formData = await req.formData();
    file = formData.get("file") as File | null;
  } catch {
    return NextResponse.json({ error: "Gagal membaca file" }, { status: 400 });
  }

  if (!file) return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "Format tidak didukung. Gunakan JPG, PNG, WEBP, atau PDF" }, { status: 400 });
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Ukuran file maksimal 10MB" }, { status: 400 });
  }

  try {
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    const body = {
      model: MODEL,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: PROMPT },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
      max_tokens: 1024,
      temperature: 0.1,
    };

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "https://maalify.app",
        "X-Title": "Maalify - Scan Struk",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: `OpenRouter error: ${errText}` }, { status: 500 });
    }

    const json = await res.json();
    const raw = (json.choices?.[0]?.message?.content ?? "").trim();

    // Strip markdown code blocks jika ada
    const cleaned = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();

    let parsed: {
      merchant: string;
      date: string | null;
      total: number;
      items: { name: string; price: number }[];
      transaction_type: "income" | "expense";
      description: string;
      confidence: "high" | "medium" | "low";
    };

    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: "Gagal membaca hasil analisis. Coba foto yang lebih jelas." }, { status: 422 });
    }

    const today = new Date().toISOString().split("T")[0];
    return NextResponse.json({
      merchant: String(parsed.merchant ?? "").slice(0, 100),
      date: parsed.date ?? today,
      total: Math.max(0, Math.round(Number(parsed.total) || 0)),
      items: Array.isArray(parsed.items) ? parsed.items.slice(0, 20) : [],
      transaction_type: parsed.transaction_type === "income" ? "income" : "expense",
      description: String(parsed.description ?? parsed.merchant ?? "").slice(0, 100),
      confidence: parsed.confidence ?? "medium",
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Terjadi kesalahan";
    return NextResponse.json({ error: `Analisis gagal: ${msg}` }, { status: 500 });
  }
}
