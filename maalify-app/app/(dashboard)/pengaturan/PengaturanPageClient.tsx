"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { formatRupiah } from "@/lib/utils";

interface Profile { id: string; name: string; email: string; avatar_url: string | null; phone: string | null; }
interface Household { id: string; name: string; description: string | null; invite_code: string; }
interface Member { id: string; role: string; joined_at: string; user: { id: string; name: string; email: string } | null; }
interface Category { id: string; name: string; icon: string | null; color: string | null; type: string; is_default: boolean; household_id: string | null; }
interface ActivityItem { id: string; type: string; amount: number; description: string; created_at: string; actorName: string; }

interface Props {
  profile: Profile;
  household: Household;
  members: Member[];
  categories: Category[];
  activity: ActivityItem[];
  householdId: string;
  userId: string;
  userRole: string;
}

type Tab = "profil" | "household" | "aktivitas" | "keamanan";

export default function PengaturanPageClient({ profile, household, members, categories, activity, householdId, userId, userRole }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("profil");

  // Join household state (for users with no household)
  const [joinCode, setJoinCode] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState("");

  async function handleJoinHousehold() {
    if (joinCode.trim().length < 4) { setJoinError("Kode undangan tidak valid."); return; }
    setJoinLoading(true);
    setJoinError("");
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      // Use SECURITY DEFINER RPC to bypass RLS on households table
      const { data: householdId, error: rpcErr } = await supabase
        .rpc("find_household_by_invite_code", { p_invite_code: joinCode.trim().toUpperCase() });

      if (rpcErr || !householdId) {
        setJoinError("Kode undangan tidak ditemukan.");
        setJoinLoading(false);
        return;
      }

      const { error: insertErr } = await supabase.from("household_members").insert({
        household_id: householdId,
        user_id: userId,
        role: "member",
      });

      if (insertErr) { setJoinError(insertErr.message); setJoinLoading(false); return; }
      router.refresh();
    } catch { setJoinError("Gagal bergabung."); }
    finally { setJoinLoading(false); }
  }

  // Profil state
  const [profileName, setProfileName] = useState(profile.name);
  const [profilePhone, setProfilePhone] = useState(profile.phone ?? "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");

  // Avatar state
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar_url);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const avatarInputRef = useRef<HTMLInputElement>(null);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setAvatarError("Ukuran foto maksimal 2MB"); return; }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setAvatarError("Format foto harus JPG, PNG, atau WebP");
      return;
    }

    setAvatarError("");
    setUploadingAvatar(true);

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${userId}/avatar.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      const avatarUrl = `${publicUrl}?t=${Date.now()}`;

      const { error: updateErr } = await supabase
        .from("users")
        .update({ avatar_url: avatarUrl })
        .eq("id", userId);

      if (updateErr) throw updateErr;

      setAvatarPreview(avatarUrl);
      router.refresh();
    } catch (err: unknown) {
      setAvatarError(err instanceof Error ? err.message : "Gagal upload foto");
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  }

  // Household state
  const [hhName, setHhName] = useState(household.name);
  const [hhDesc, setHhDesc] = useState(household.description ?? "");
  const [savingHh, setSavingHh] = useState(false);
  const [hhMsg, setHhMsg] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Member management state
  type MemberActionType = "remove" | "promote" | "promote_super" | "demote" | "demote_admin" | "leave";
  const [memberAction, setMemberAction] = useState<{ id: string; action: MemberActionType } | null>(null);
  const [memberLoading, setMemberLoading] = useState(false);
  const [memberMsg, setMemberMsg] = useState("");

  // Kategori state

  // Keamanan state
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [savingPass, setSavingPass] = useState(false);
  const [passMsg, setPassMsg] = useState("");
  const [passErr, setPassErr] = useState("");

  const handleSaved = useCallback(() => {
    router.refresh();
  }, [router]);

  async function saveProfile() {
    if (!profileName.trim()) return;
    setSavingProfile(true);
    setProfileMsg("");
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const cleanPhone = profilePhone.replace(/\D/g, "").replace(/^0/, "62") || null;
      const { error } = await supabase.from("users")
        .update({ name: profileName.trim(), phone: cleanPhone })
        .eq("id", userId);
      if (error) throw error;
      setProfileMsg("Profil berhasil disimpan");
      router.refresh();
    } catch { setProfileMsg("Gagal menyimpan"); }
    finally { setSavingProfile(false); }
  }

  async function saveHousehold() {
    if (!hhName.trim()) return;
    setSavingHh(true);
    setHhMsg("");
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error } = await supabase.from("households")
        .update({ name: hhName.trim(), description: hhDesc.trim() || null })
        .eq("id", householdId);
      if (error) throw error;
      setHhMsg("Family berhasil disimpan");
      router.refresh();
    } catch { setHhMsg("Gagal menyimpan"); }
    finally { setSavingHh(false); }
  }

  async function copyInviteCode() {
    await navigator.clipboard.writeText(household.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function getInviteLink() {
    return `${window.location.origin}/join?code=${household.invite_code}`;
  }

  async function copyInviteLink() {
    await navigator.clipboard.writeText(getInviteLink());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  function shareWhatsApp() {
    const link = getInviteLink();
    const text = `Halo! Bergabunglah ke household *${household.name}* di Maalify untuk mencatat keuangan keluarga bersama. Klik link ini: ${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  async function executeMemberAction() {
    if (!memberAction) return;
    setMemberLoading(true);
    setMemberMsg("");
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      if (memberAction.action === "remove" || memberAction.action === "leave") {
        const { error } = await supabase
          .from("household_members")
          .delete()
          .eq("id", memberAction.id);
        if (error) throw error;

        if (memberAction.action === "leave") {
          await supabase.auth.signOut();
          router.push("/login");
          return;
        }
      } else {
        const roleMap: Record<string, string> = {
          promote: "admin",
          promote_super: "super_admin",
          demote: "member",
          demote_admin: "admin",
        };
        const newRole = roleMap[memberAction.action];
        const { error } = await supabase
          .from("household_members")
          .update({ role: newRole })
          .eq("id", memberAction.id);
        if (error) throw error;
      }

      setMemberAction(null);
      router.refresh();
    } catch (e: unknown) {
      setMemberMsg(e instanceof Error ? e.message : "Gagal memproses");
    } finally {
      setMemberLoading(false);
    }
  }

  async function changePassword() {
    setPassErr("");
    setPassMsg("");
    if (newPass.length < 8) { setPassErr("Password minimal 8 karakter"); return; }
    if (newPass !== confirmPass) { setPassErr("Konfirmasi password tidak cocok"); return; }
    setSavingPass(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPass });
      if (error) throw error;
      setPassMsg("Password berhasil diubah");
      setNewPass("");
      setConfirmPass("");
    } catch (e: unknown) {
      setPassErr(e instanceof Error ? e.message : "Gagal mengubah password");
    } finally { setSavingPass(false); }
  }

  const initials = profile.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";


  const myMembership = members.find(m => m.user?.id === userId);
  const managerCount = members.filter(m => m.role === "super_admin" || m.role === "admin").length;
  const canLeave = managerCount > 1 || userRole === "member";

  const isSuperAdmin = userRole === "super_admin";
  const isManager = userRole === "super_admin" || userRole === "admin";

  const ROLE_BADGE: Record<string, string> = {
    super_admin: "bg-amber-100 text-amber-700",
    admin: "bg-brand-primary/10 text-brand-primary",
    member: "bg-[var(--bg-elevated)] text-[var(--text-secondary)]",
  };
  const ROLE_LABEL: Record<string, string> = {
    super_admin: "Super Admin",
    admin: "Admin",
    member: "Member",
  };

  const ACTION_LABEL: Record<string, string> = {
    remove: "Hapus anggota ini?",
    promote: "Jadikan Admin?",
    promote_super: "Jadikan Super Admin?",
    demote: "Jadikan Member?",
    demote_admin: "Jadikan Admin?",
  };

  const TABS: { id: Tab; label: string }[] = [
    { id: "profil",    label: "Profil" },
    { id: "household", label: "Family" },
    { id: "aktivitas", label: "Aktivitas" },
    { id: "keamanan",  label: "Keamanan" },
  ];

  // User has no household — show join form instead of normal settings
  if (!householdId) {
    return (
      <div className="min-h-full flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-5">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--bg-elevated)] flex items-center justify-center text-3xl mx-auto mb-4">🏠</div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Belum Bergabung ke Family</h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1">Masukkan kode undangan dari anggota keluarga kamu</p>
          </div>

          <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">Kode Undangan</label>
              <input
                type="text"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Contoh: AB12CD34"
                maxLength={12}
                className="w-full px-3.5 py-3 rounded-xl border border-[var(--border)] text-base font-mono tracking-widest text-center text-[var(--text-primary)] bg-[var(--bg-surface)] focus:outline-none focus:ring-2 focus:ring-brand-primary uppercase"
              />
              <p className="text-[10px] text-[var(--text-secondary)] mt-1.5">Minta kode dari admin family di Pengaturan → Family → Kode Undangan</p>
            </div>

            {joinError && <p className="text-xs text-danger bg-red-50 px-3 py-2 rounded-lg">{joinError}</p>}

            <button
              onClick={handleJoinHousehold}
              disabled={joinLoading || joinCode.trim().length < 4}
              className="w-full py-3 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {joinLoading ? "Bergabung..." : "Gabung Family"}
            </button>
          </div>

          <p className="text-center text-xs text-[var(--text-secondary)]">
            Login sebagai: <span className="font-medium text-[var(--text-primary)]">{profile.email}</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Pengaturan</h1>
          <p className="text-sm text-[var(--text-secondary)]">Kelola akun dan preferensi</p>
        </div>

        {/* Tab nav */}
        <div className="flex bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-1 gap-1 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-shrink-0 flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                tab === t.id ? "bg-brand-primary text-white shadow-sm" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ─── PROFIL ─── */}
        {tab === "profil" && (
          <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] overflow-hidden">
            <div className="flex items-center gap-4 p-5 border-b border-[var(--border)]">
              {/* Clickable avatar */}
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="relative w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 group focus:outline-none"
                title="Ganti foto profil"
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-brand-primary flex items-center justify-center text-white font-bold text-xl">
                    {initials}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {uploadingAvatar ? (
                    <svg className="animate-spin w-5 h-5 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                  )}
                </div>
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <div>
                <p className="font-semibold text-[var(--text-primary)]">{profile.name}</p>
                <p className="text-sm text-[var(--text-secondary)]">{profile.email}</p>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">{ROLE_LABEL[userRole] ?? userRole}</p>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="text-[10px] text-brand-primary hover:underline mt-1 disabled:opacity-50"
                >
                  {uploadingAvatar ? "Mengupload..." : "Ganti foto"}
                </button>
              </div>
            </div>
            {avatarError && (
              <div className="px-5 py-2 bg-red-50 border-b border-red-100">
                <p className="text-xs text-red-600">{avatarError}</p>
              </div>
            )}

            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--text-secondary)]">Nama Lengkap</label>
                <input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)}
                  maxLength={100}
                  className="w-full border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] bg-[var(--bg-card)] outline-none focus:border-brand-primary transition-colors" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--text-secondary)]">Email</label>
                <input type="text" value={profile.email} disabled
                  className="w-full border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-secondary)] bg-[var(--bg-elevated)] cursor-not-allowed" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--text-secondary)]">
                  No. WhatsApp <span className="font-normal italic">(opsional)</span>
                </label>
                <div className="flex items-center border border-[var(--border)] rounded-xl overflow-hidden focus-within:border-brand-primary transition-colors">
                  <span className="px-3 py-2.5 bg-[var(--bg-elevated)] text-xs text-[var(--text-secondary)] border-r border-[var(--border)] flex-shrink-0 flex items-center gap-1.5">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.091.535 4.06 1.476 5.779L.057 23.514a.75.75 0 0 0 .93.93l5.735-1.419A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.898 0-3.68-.499-5.23-1.374l-.374-.22-3.877.96.977-3.877-.22-.374A10 10 0 1 1 12 22z"/></svg>
                    +62
                  </span>
                  <input
                    type="tel"
                    value={profilePhone}
                    onChange={e => setProfilePhone(e.target.value)}
                    placeholder="812 3456 7890"
                    inputMode="numeric"
                    className="flex-1 px-3 py-2.5 text-sm text-[var(--text-primary)] bg-[var(--bg-card)] outline-none placeholder:text-[var(--text-secondary)]"
                  />
                </div>
              </div>
              {profileMsg && (
                <p className={`text-xs ${profileMsg.includes("berhasil") ? "text-green-600" : "text-red-500"}`}>{profileMsg}</p>
              )}
              <button onClick={saveProfile} disabled={savingProfile || (profileName === profile.name && profilePhone === (profile.phone ?? ""))}
                className="w-full py-2.5 rounded-xl bg-brand-primary text-white text-sm font-medium hover:bg-brand-primary/90 disabled:opacity-50 transition-colors">
                {savingProfile ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </div>
        )}

        {/* ─── HOUSEHOLD ─── */}
        {tab === "household" && (
          <div className="space-y-4">
            {/* Info household */}
            <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-5 space-y-4">
              <p className="font-semibold text-[var(--text-primary)]">Info Family</p>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--text-secondary)]">Nama Family</label>
                <input type="text" value={hhName} onChange={(e) => setHhName(e.target.value)}
                  disabled={!isManager}
                  maxLength={100}
                  className="w-full border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] bg-[var(--bg-card)] outline-none focus:border-brand-primary transition-colors disabled:bg-[var(--bg-elevated)] disabled:text-[var(--text-secondary)]" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--text-secondary)]">Deskripsi <span className="font-normal italic">(opsional)</span></label>
                <textarea value={hhDesc} onChange={(e) => setHhDesc(e.target.value)}
                  disabled={!isManager}
                  rows={2} maxLength={200}
                  className="w-full border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] bg-[var(--bg-card)] outline-none focus:border-brand-primary transition-colors resize-none disabled:bg-[var(--bg-elevated)] disabled:text-[var(--text-secondary)]" />
              </div>
              {hhMsg && (
                <p className={`text-xs ${hhMsg.includes("berhasil") ? "text-green-600" : "text-red-500"}`}>{hhMsg}</p>
              )}
              {isManager && (
                <button onClick={saveHousehold} disabled={savingHh}
                  className="w-full py-2.5 rounded-xl bg-brand-primary text-white text-sm font-medium hover:bg-brand-primary/90 disabled:opacity-50 transition-colors">
                  {savingHh ? "Menyimpan..." : "Simpan Family"}
                </button>
              )}
            </div>

            {/* Invite code */}
            <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-5 space-y-3">
              <div>
                <p className="font-semibold text-[var(--text-primary)]">Undang Anggota</p>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">Bagikan kode atau link ke anggota keluarga</p>
              </div>

              {/* Kode undangan */}
              <div>
                <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Kode Undangan</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-3">
                    <p className="font-mono font-bold text-lg text-[var(--text-primary)] tracking-widest text-center">
                      {household.invite_code}
                    </p>
                  </div>
                  <button onClick={copyInviteCode}
                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-all flex-shrink-0 ${
                      copied ? "bg-green-100 text-green-700" : "bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-brand-primary hover:text-white hover:border-brand-primary"
                    }`}>
                    {copied ? "✓ Disalin" : "Salin"}
                  </button>
                </div>
              </div>

              {/* Link undangan */}
              <div>
                <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Link Undangan</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-3 py-2.5 min-w-0">
                    <p className="text-xs text-[var(--text-secondary)] truncate font-mono">
                      .../join?code={household.invite_code}
                    </p>
                  </div>
                  <button onClick={copyInviteLink}
                    className={`px-3 py-2.5 rounded-xl text-xs font-medium transition-all flex-shrink-0 ${
                      copiedLink ? "bg-green-100 text-green-700" : "bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-brand-primary hover:text-white hover:border-brand-primary"
                    }`}>
                    {copiedLink ? "✓" : "Salin"}
                  </button>
                </div>
              </div>

              {/* Share buttons */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={shareWhatsApp}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366] text-white text-xs font-semibold hover:opacity-90 transition-opacity flex-1 justify-center"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Kirim via WhatsApp
                </button>
              </div>

              <p className="text-[10px] text-[var(--text-secondary)]">
                Anggota yang klik link akan langsung diarahkan ke halaman bergabung. Kode dapat dimasukkan manual saat daftar.
              </p>
            </div>

            {/* Members */}
            <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] overflow-hidden">
              <div className="px-5 py-4 border-b border-[var(--border)]">
                <p className="font-semibold text-[var(--text-primary)]">Anggota ({members.length})</p>
              </div>

              {memberMsg && (
                <div className="px-5 py-3 bg-red-50 border-b border-red-100">
                  <p className="text-xs text-red-600">{memberMsg}</p>
                </div>
              )}

              <div className="divide-y divide-[var(--border)]">
                {members.map(m => {
                  const u = m.user;
                  const initials2 = (u?.name ?? "?").split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
                  const isMe = u?.id === userId;
                  const isPendingAction = memberAction?.id === m.id;

                  return (
                    <div key={m.id} className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-brand-primary/80 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {initials2}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                            {u?.name ?? "?"}{isMe && <span className="ml-1.5 text-[10px] text-brand-primary font-semibold">(Saya)</span>}
                          </p>
                          <p className="text-xs text-[var(--text-secondary)] truncate">{u?.email ?? ""}</p>
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${ROLE_BADGE[m.role] ?? ROLE_BADGE.member}`}>
                          {ROLE_LABEL[m.role] ?? m.role}
                        </span>
                      </div>

                      {/* Manager controls for non-self members */}
                      {isManager && !isMe && !(userRole === "admin" && m.role === "super_admin") && (
                        <div className="flex gap-1.5 mt-2 ml-12 flex-wrap">
                          {!isPendingAction ? (
                            <>
                              {/* Promote/demote buttons */}
                              {m.role === "member" && (
                                <button onClick={() => setMemberAction({ id: m.id, action: "promote" })}
                                  className="text-[10px] px-2.5 py-1 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors">
                                  Jadikan Admin
                                </button>
                              )}
                              {m.role === "member" && isSuperAdmin && (
                                <button onClick={() => setMemberAction({ id: m.id, action: "promote_super" })}
                                  className="text-[10px] px-2.5 py-1 rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-50 transition-colors">
                                  Jadikan Super Admin
                                </button>
                              )}
                              {m.role === "admin" && (
                                <button onClick={() => setMemberAction({ id: m.id, action: "demote" })}
                                  className="text-[10px] px-2.5 py-1 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors">
                                  Jadikan Member
                                </button>
                              )}
                              {m.role === "admin" && isSuperAdmin && (
                                <button onClick={() => setMemberAction({ id: m.id, action: "promote_super" })}
                                  className="text-[10px] px-2.5 py-1 rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-50 transition-colors">
                                  Jadikan Super Admin
                                </button>
                              )}
                              {m.role === "super_admin" && isSuperAdmin && (
                                <button onClick={() => setMemberAction({ id: m.id, action: "demote_admin" })}
                                  className="text-[10px] px-2.5 py-1 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors">
                                  Jadikan Admin
                                </button>
                              )}
                              <button onClick={() => setMemberAction({ id: m.id, action: "remove" })}
                                className="text-[10px] px-2.5 py-1 rounded-lg border border-red-200 text-danger hover:bg-red-50 transition-colors">
                                Hapus
                              </button>
                            </>
                          ) : (
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-[10px] text-[var(--text-secondary)]">
                                {ACTION_LABEL[memberAction.action] ?? "Konfirmasi?"}
                              </p>
                              <button onClick={executeMemberAction} disabled={memberLoading}
                                className="text-[10px] px-2.5 py-1 rounded-lg bg-brand-primary text-white disabled:opacity-50">
                                {memberLoading ? "..." : "Ya"}
                              </button>
                              <button onClick={() => setMemberAction(null)}
                                className="text-[10px] px-2.5 py-1 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]">
                                Batal
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Leave household */}
              {myMembership && (
                <div className="px-5 py-4 border-t border-[var(--border)]">
                  {memberAction?.action === "leave" ? (
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-danger flex-1">Keluar dari household? Kamu akan di-logout.</p>
                      <button
                        onClick={executeMemberAction}
                        disabled={memberLoading}
                        className="text-xs px-3 py-1.5 rounded-lg bg-danger text-white disabled:opacity-50"
                      >
                        {memberLoading ? "..." : "Ya, Keluar"}
                      </button>
                      <button
                        onClick={() => setMemberAction(null)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
                      >
                        Batal
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => canLeave && setMemberAction({ id: myMembership.id, action: "leave" })}
                      disabled={!canLeave}
                      className="text-xs text-danger hover:underline disabled:opacity-40 disabled:cursor-not-allowed disabled:no-underline"
                      title={!canLeave ? "Tidak bisa keluar karena kamu satu-satunya manager" : undefined}
                    >
                      {!canLeave ? "Tidak bisa keluar (satu-satunya manager)" : "Keluar dari Family"}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── AKTIVITAS ─── */}
        {tab === "aktivitas" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-[var(--text-secondary)] tracking-widest uppercase">30 Transaksi Terakhir</p>
              <p className="text-xs text-[var(--text-secondary)]">{members.length} anggota aktif</p>
            </div>

            {activity.length === 0 ? (
              <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] py-12 text-center">
                <p className="text-sm text-[var(--text-secondary)]">Belum ada aktivitas</p>
              </div>
            ) : (
              <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] overflow-hidden">
                <div className="divide-y divide-[var(--border)]">
                  {activity.map(a => {
                    const isIncome = a.type === "income";
                    const dt = new Date(a.created_at);
                    const dateStr = dt.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
                    const timeStr = dt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

                    return (
                      <div key={a.id} className="flex items-center gap-3 px-4 py-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          isIncome ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                        }`}>
                          {isIncome ? "+" : "-"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[var(--text-primary)] truncate">{a.description}</p>
                          <p className="text-[10px] text-[var(--text-secondary)]">
                            oleh <span className="font-medium">{a.actorName}</span> · {dateStr} {timeStr}
                          </p>
                        </div>
                        <p className={`font-financial text-sm font-semibold flex-shrink-0 ${
                          isIncome ? "text-success" : "text-danger"
                        }`}>
                          {isIncome ? "+" : "-"}Rp {formatRupiah(a.amount)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <p className="text-[10px] text-[var(--text-secondary)] text-center">
              Menampilkan 30 transaksi terbaru dari semua anggota household
            </p>
          </div>
        )}

        {/* ─── KEAMANAN ─── */}
        {tab === "keamanan" && (
          <div className="space-y-4">
            <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-5 space-y-4">
              <div>
                <p className="font-semibold text-[var(--text-primary)]">Ganti Password</p>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">Minimal 8 karakter</p>
              </div>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">Password Baru</label>
                  <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)}
                    placeholder="••••••••"
                    className="w-full border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] bg-[var(--bg-card)] outline-none focus:border-brand-primary transition-colors" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">Konfirmasi Password</label>
                  <input type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)}
                    placeholder="••••••••"
                    className="w-full border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] bg-[var(--bg-card)] outline-none focus:border-brand-primary transition-colors" />
                </div>
              </div>
              {passErr && <p className="text-xs text-red-500">{passErr}</p>}
              {passMsg && <p className="text-xs text-green-600">{passMsg}</p>}
              <button onClick={changePassword} disabled={savingPass || !newPass || !confirmPass}
                className="w-full py-2.5 rounded-xl bg-brand-primary text-white text-sm font-medium hover:bg-brand-primary/90 disabled:opacity-50 transition-colors">
                {savingPass ? "Menyimpan..." : "Ubah Password"}
              </button>
            </div>

            <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-5 space-y-3">
              <p className="font-semibold text-[var(--text-primary)]">Info Akun</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-secondary)]">Email</span>
                  <span className="font-medium text-[var(--text-primary)]">{profile.email}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-secondary)]">Role</span>
                  <span className="font-medium text-[var(--text-primary)]">{ROLE_LABEL[userRole] ?? userRole}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-secondary)]">Family</span>
                  <span className="font-medium text-[var(--text-primary)]">{household.name}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
