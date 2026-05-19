"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import KategoriModal from "@/components/pengaturan/KategoriModal";
import { formatRupiah } from "@/lib/utils";

interface Profile { id: string; name: string; email: string; avatar_url: string | null; }
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

type Tab = "profil" | "household" | "kategori" | "aktivitas" | "keamanan";

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
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");

  // Household state
  const [hhName, setHhName] = useState(household.name);
  const [hhDesc, setHhDesc] = useState(household.description ?? "");
  const [savingHh, setSavingHh] = useState(false);
  const [hhMsg, setHhMsg] = useState("");
  const [copied, setCopied] = useState(false);

  // Member management state
  const [memberAction, setMemberAction] = useState<{ id: string; action: "remove" | "promote" | "demote" | "leave" } | null>(null);
  const [memberLoading, setMemberLoading] = useState(false);
  const [memberMsg, setMemberMsg] = useState("");

  // Kategori state
  const [catModal, setCatModal] = useState<{ mode: "add" | "edit"; cat?: Category } | null>(null);
  const [catFilter, setCatFilter] = useState<"all" | "expense" | "income">("all");

  // Keamanan state
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [savingPass, setSavingPass] = useState(false);
  const [passMsg, setPassMsg] = useState("");
  const [passErr, setPassErr] = useState("");

  const handleSaved = useCallback(() => {
    setCatModal(null);
    router.refresh();
  }, [router]);

  async function saveProfile() {
    if (!profileName.trim()) return;
    setSavingProfile(true);
    setProfileMsg("");
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error } = await supabase.from("users").update({ name: profileName.trim() }).eq("id", userId);
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
      setHhMsg("Household berhasil disimpan");
      router.refresh();
    } catch { setHhMsg("Gagal menyimpan"); }
    finally { setSavingHh(false); }
  }

  async function copyInviteCode() {
    await navigator.clipboard.writeText(household.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          // Redirect to login since user no longer has a household
          await supabase.auth.signOut();
          router.push("/login");
          return;
        }
      } else {
        const newRole = memberAction.action === "promote" ? "admin" : "member";
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

  const filteredCats = categories.filter(c =>
    catFilter === "all" ? true : c.type === catFilter
  );

  const adminCount = members.filter(m => m.role === "admin").length;
  const myMembership = members.find(m => m.user?.id === userId);
  const isLastAdmin = userRole === "admin" && adminCount === 1;

  const TABS: { id: Tab; label: string }[] = [
    { id: "profil",    label: "Profil" },
    { id: "household", label: "Household" },
    { id: "kategori",  label: "Kategori" },
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
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Belum Bergabung ke Household</h2>
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
              <p className="text-[10px] text-[var(--text-secondary)] mt-1.5">Minta kode dari admin household di Pengaturan → Household → Kode Undangan</p>
            </div>

            {joinError && <p className="text-xs text-danger bg-red-50 px-3 py-2 rounded-lg">{joinError}</p>}

            <button
              onClick={handleJoinHousehold}
              disabled={joinLoading || joinCode.trim().length < 4}
              className="w-full py-3 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {joinLoading ? "Bergabung..." : "Gabung Household"}
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
              <div className="w-16 h-16 rounded-2xl bg-brand-primary flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                {initials}
              </div>
              <div>
                <p className="font-semibold text-[var(--text-primary)]">{profile.name}</p>
                <p className="text-sm text-[var(--text-secondary)]">{profile.email}</p>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5 capitalize">{userRole}</p>
              </div>
            </div>

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
              {profileMsg && (
                <p className={`text-xs ${profileMsg.includes("berhasil") ? "text-green-600" : "text-red-500"}`}>{profileMsg}</p>
              )}
              <button onClick={saveProfile} disabled={savingProfile || profileName === profile.name}
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
              <p className="font-semibold text-[var(--text-primary)]">Info Household</p>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--text-secondary)]">Nama Household</label>
                <input type="text" value={hhName} onChange={(e) => setHhName(e.target.value)}
                  disabled={userRole !== "admin"}
                  maxLength={100}
                  className="w-full border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] bg-[var(--bg-card)] outline-none focus:border-brand-primary transition-colors disabled:bg-[var(--bg-elevated)] disabled:text-[var(--text-secondary)]" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--text-secondary)]">Deskripsi <span className="font-normal italic">(opsional)</span></label>
                <textarea value={hhDesc} onChange={(e) => setHhDesc(e.target.value)}
                  disabled={userRole !== "admin"}
                  rows={2} maxLength={200}
                  className="w-full border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] bg-[var(--bg-card)] outline-none focus:border-brand-primary transition-colors resize-none disabled:bg-[var(--bg-elevated)] disabled:text-[var(--text-secondary)]" />
              </div>
              {hhMsg && (
                <p className={`text-xs ${hhMsg.includes("berhasil") ? "text-green-600" : "text-red-500"}`}>{hhMsg}</p>
              )}
              {userRole === "admin" && (
                <button onClick={saveHousehold} disabled={savingHh}
                  className="w-full py-2.5 rounded-xl bg-brand-primary text-white text-sm font-medium hover:bg-brand-primary/90 disabled:opacity-50 transition-colors">
                  {savingHh ? "Menyimpan..." : "Simpan Household"}
                </button>
              )}
            </div>

            {/* Invite code */}
            <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-5 space-y-3">
              <div>
                <p className="font-semibold text-[var(--text-primary)]">Kode Undangan</p>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">Bagikan ke anggota keluarga untuk bergabung</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-3">
                  <p className="font-mono font-bold text-lg text-[var(--text-primary)] tracking-widest text-center">
                    {household.invite_code}
                  </p>
                </div>
                <button onClick={copyInviteCode}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    copied ? "bg-green-100 text-green-700" : "bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-brand-primary hover:text-white hover:border-brand-primary"
                  }`}>
                  {copied ? "✓ Disalin" : "Salin"}
                </button>
              </div>
              <p className="text-[10px] text-[var(--text-secondary)]">
                Anggota baru dapat memasukkan kode ini saat mendaftar di halaman Register → "Gabung via Kode"
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
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                          m.role === "admin" ? "bg-brand-primary/10 text-brand-primary" : "bg-[var(--bg-elevated)] text-[var(--text-secondary)]"
                        }`}>
                          {m.role === "admin" ? "Admin" : "Member"}
                        </span>
                      </div>

                      {/* Admin controls for non-self members */}
                      {userRole === "admin" && !isMe && (
                        <div className="flex gap-2 mt-2 ml-12">
                          {!isPendingAction ? (
                            <>
                              {m.role === "member" ? (
                                <button
                                  onClick={() => setMemberAction({ id: m.id, action: "promote" })}
                                  className="text-[10px] px-2.5 py-1 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors"
                                >
                                  Jadikan Admin
                                </button>
                              ) : (
                                <button
                                  onClick={() => setMemberAction({ id: m.id, action: "demote" })}
                                  className="text-[10px] px-2.5 py-1 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors"
                                >
                                  Jadikan Member
                                </button>
                              )}
                              <button
                                onClick={() => setMemberAction({ id: m.id, action: "remove" })}
                                className="text-[10px] px-2.5 py-1 rounded-lg border border-red-200 text-danger hover:bg-red-50 transition-colors"
                              >
                                Hapus
                              </button>
                            </>
                          ) : (
                            <div className="flex items-center gap-2">
                              <p className="text-[10px] text-[var(--text-secondary)]">
                                {memberAction.action === "remove" ? "Hapus anggota ini?" :
                                 memberAction.action === "promote" ? "Jadikan admin?" : "Jadikan member?"}
                              </p>
                              <button
                                onClick={executeMemberAction}
                                disabled={memberLoading}
                                className="text-[10px] px-2.5 py-1 rounded-lg bg-danger text-white disabled:opacity-50"
                              >
                                {memberLoading ? "..." : "Ya"}
                              </button>
                              <button
                                onClick={() => setMemberAction(null)}
                                className="text-[10px] px-2.5 py-1 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
                              >
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
                      onClick={() => isLastAdmin ? null : setMemberAction({ id: myMembership.id, action: "leave" })}
                      disabled={isLastAdmin}
                      className="text-xs text-danger hover:underline disabled:opacity-40 disabled:cursor-not-allowed disabled:no-underline"
                      title={isLastAdmin ? "Tidak bisa keluar karena kamu satu-satunya admin" : undefined}
                    >
                      {isLastAdmin ? "Tidak bisa keluar (satu-satunya admin)" : "Keluar dari Household"}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── KATEGORI ─── */}
        {tab === "kategori" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-1.5">
                {(["all","expense","income"] as const).map(f => (
                  <button key={f} onClick={() => setCatFilter(f)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      catFilter === f ? "bg-brand-primary text-white" : "bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}>
                    {f === "all" ? "Semua" : f === "expense" ? "Pengeluaran" : "Pemasukan"}
                  </button>
                ))}
              </div>
              <button onClick={() => setCatModal({ mode: "add" })}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-primary text-white text-xs font-medium hover:bg-brand-primary/90 transition-colors">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Tambah
              </button>
            </div>

            <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-elevated)]">
                <p className="text-xs font-semibold text-[var(--text-secondary)] tracking-widest uppercase">Default</p>
              </div>
              <div className="divide-y divide-[var(--border)]">
                {filteredCats.filter(c => c.is_default).map(c => (
                  <div key={c.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                      style={{ backgroundColor: (c.color ?? "#94A3B8") + "20" }}>
                      {c.icon ?? "💰"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--text-primary)]">{c.name}</p>
                    </div>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      c.type === "expense" ? "bg-red-50 text-red-500" : "bg-green-50 text-green-600"
                    }`}>
                      {c.type === "expense" ? "Pengeluaran" : "Pemasukan"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-elevated)]">
                <p className="text-xs font-semibold text-[var(--text-secondary)] tracking-widest uppercase">
                  Kategori Saya ({categories.filter(c => !c.is_default).length})
                </p>
              </div>
              {filteredCats.filter(c => !c.is_default).length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-[var(--text-secondary)]">Belum ada kategori custom</p>
                  <button onClick={() => setCatModal({ mode: "add" })}
                    className="text-xs text-brand-primary hover:underline mt-1 inline-block">
                    + Buat kategori baru
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-[var(--border)]">
                  {filteredCats.filter(c => !c.is_default).map(c => (
                    <button key={c.id} onClick={() => setCatModal({ mode: "edit", cat: c })}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-elevated)] transition-colors text-left">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                        style={{ backgroundColor: (c.color ?? "#94A3B8") + "20" }}>
                        {c.icon ?? "💰"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[var(--text-primary)]">{c.name}</p>
                      </div>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full mr-1 ${
                        c.type === "expense" ? "bg-red-50 text-red-500" : "bg-green-50 text-green-600"
                      }`}>
                        {c.type === "expense" ? "Pengeluaran" : "Pemasukan"}
                      </span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-secondary)] flex-shrink-0">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                  ))}
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
                  <span className="font-medium text-[var(--text-primary)] capitalize">{userRole}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-secondary)]">Household</span>
                  <span className="font-medium text-[var(--text-primary)]">{household.name}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {catModal && (
        <KategoriModal
          mode={catModal.mode}
          category={catModal.cat}
          householdId={householdId}
          onClose={() => setCatModal(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
