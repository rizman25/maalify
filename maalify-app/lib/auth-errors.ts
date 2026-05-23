/**
 * Translates raw Supabase auth error messages into user-friendly Indonesian text.
 * BUG-R3-009 fix — prevents raw English technical errors from showing to users.
 */
export function translateAuthError(message: string): string {
  const msg = message.toLowerCase();

  // Registration errors
  if (msg.includes("user already registered") || msg.includes("already been registered") || msg.includes("email already in use")) {
    return "Email ini sudah terdaftar. Silakan masuk atau gunakan email lain.";
  }
  if (msg.includes("unable to validate email address") || msg.includes("invalid email")) {
    return "Format email tidak valid. Periksa kembali alamat email kamu.";
  }
  if (msg.includes("password should be at least")) {
    return "Password terlalu pendek. Minimal 8 karakter.";
  }
  if (msg.includes("signup is disabled") || msg.includes("signups not allowed")) {
    return "Pendaftaran sementara tidak tersedia. Coba lagi nanti.";
  }
  if (msg.includes("email rate limit") || msg.includes("email link is invalid or has expired") || msg.includes("rate limit")) {
    return "Terlalu banyak percobaan. Tunggu beberapa saat sebelum mencoba lagi.";
  }

  // Login errors
  if (msg.includes("invalid login credentials") || msg.includes("invalid credentials") || msg.includes("email not confirmed")) {
    return "Email atau password salah. Periksa kembali dan coba lagi.";
  }
  if (msg.includes("email not confirmed")) {
    return "Email belum diverifikasi. Cek kotak masuk emailmu untuk link verifikasi.";
  }

  // Session / token errors
  if (msg.includes("auth session missing") || msg.includes("no session") || msg.includes("session_not_found")) {
    return "Sesi tidak ditemukan. Silakan minta link reset password baru.";
  }
  if (msg.includes("token has expired") || msg.includes("otp expired") || msg.includes("link is invalid or has expired")) {
    return "Link sudah kedaluwarsa. Silakan minta link reset password baru.";
  }
  if (msg.includes("token not found") || msg.includes("invalid token")) {
    return "Link tidak valid. Silakan minta link reset password baru.";
  }

  // Password update errors
  if (msg.includes("new password should be different") || msg.includes("different from the old password") || msg.includes("same as the old password")) {
    return "Password baru tidak boleh sama dengan password lama.";
  }
  if (msg.includes("weak password") || msg.includes("password is too weak")) {
    return "Password terlalu lemah. Gunakan kombinasi huruf, angka, dan karakter khusus.";
  }

  // Network / server errors
  if (msg.includes("fetch failed") || msg.includes("network") || msg.includes("failed to fetch")) {
    return "Gagal terhubung ke server. Periksa koneksi internetmu dan coba lagi.";
  }
  if (msg.includes("timeout") || msg.includes("timed out")) {
    return "Koneksi timeout. Coba lagi dalam beberapa saat.";
  }

  // Generic fallback — still friendly, no raw text
  return "Terjadi kesalahan. Coba lagi, atau hubungi bantuan jika masalah berlanjut.";
}
