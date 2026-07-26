"use client";

import { useState } from "react";
import { assignCoach, revokeCoach } from "@/lib/actions/coaches";
import { inviteCoach } from "@/lib/actions/coach-invites";
import type { Profile, Team } from "@/lib/types";
import { Toast } from "@/components/Toast";
import { PlusIcon } from "@/components/icons";

/** Admin panel — "Murabbiylar": ro'yxatdan o'tgan foydalanuvchilarga jamoa biriktirish/bekor qilish. */
export function CoachesPanel({ initialUsers, teams }: { initialUsers: Profile[]; teams: Team[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [selectedTeam, setSelectedTeam] = useState<Record<string, string>>({});
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; kind: "success" | "error" } | null>(null);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<string | null>(null);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    setInviteMsg(null);
    const result = await inviteCoach({ email: inviteEmail.trim() });
    if (result.error) {
      setInviteMsg(result.error);
      setToast({ msg: result.error, kind: "error" });
    } else {
      setInviteMsg(null);
      setInviteEmail("");
      setToast({ msg: "Taklif yuborildi", kind: "success" });
    }
    setInviting(false);
  }

  const teamName = (id: string | null) => teams.find((t) => t.id === id)?.name ?? "—";

  async function handleAssign(user: Profile) {
    const teamId = selectedTeam[user.user_id ?? ""] || teams[0]?.id;
    if (!user.user_id || !teamId) return;
    setPendingId(user.user_id);
    const result = await assignCoach(user.user_id, teamId);
    if (result.error) {
      setToast({ msg: result.error, kind: "error" });
    } else {
      setUsers((prev) =>
        prev.map((u) => (u.user_id === user.user_id ? { ...u, role: "coach", team_id: teamId } : u))
      );
      setToast({ msg: "Murabbiy tayinlandi", kind: "success" });
    }
    setPendingId(null);
  }

  async function handleRevoke(user: Profile) {
    if (!user.user_id) return;
    if (!window.confirm(`${user.full_name}ning murabbiylik huquqini bekor qilasizmi?`)) return;
    setPendingId(user.user_id);
    const result = await revokeCoach(user.user_id);
    if (result.error) {
      setToast({ msg: result.error, kind: "error" });
    } else {
      setUsers((prev) =>
        prev.map((u) => (u.user_id === user.user_id ? { ...u, role: "user", team_id: null } : u))
      );
      setToast({ msg: "Bekor qilindi", kind: "success" });
    }
    setPendingId(null);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="text-[13px] font-bold">{users.length} ta ro'yxatdan o'tgan foydalanuvchi</div>
      <div className="text-[11px] text-[rgba(237,244,239,0.45)]">
        Super Admin — barcha jamoalarni to'liq boshqaradi. Murabbiy — faqat o'ziga biriktirilgan jamoani.
      </div>

      <form
        onSubmit={handleInvite}
        className="flex flex-col gap-2 rounded-[16px] border border-white/[0.07] bg-white/[0.04] p-3.5"
      >
        <div className="text-[11.5px] font-bold">Jamoasiz murabbiy sifatida taklif qilish</div>
        <div className="text-[10.5px] text-[rgba(237,244,239,0.4)]">
          Hali ro'yxatdan o'tmagan odam uchun — email orqali taklif qilinadi, u Google bilan kirgach
          avtomatik 'murabbiy' rolini oladi va o'z jamoasini o'zi yaratadi.
        </div>
        <div className="flex gap-2">
          <input
            required
            type="email"
            placeholder="murabbiy@gmail.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="flex-1 rounded-lg border border-white/[0.1] bg-white/[0.05] px-2.5 py-1.5 text-[11.5px] text-[#EDF4EF] outline-none"
          />
          <button
            type="submit"
            disabled={inviting}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-bold text-[#06130B] disabled:opacity-60"
            style={{ background: "linear-gradient(140deg,#2FD871,#128A48)" }}
          >
            <PlusIcon size={12} />
            Taklif qilish
          </button>
        </div>
        {inviteMsg && <div className="text-[11px] text-[#E8A0A0]">{inviteMsg}</div>}
      </form>

      <div className="flex flex-col gap-2">
        {users.map((u) => (
          <div
            key={u.user_id}
            className="flex flex-col gap-2.5 rounded-[16px] border border-white/[0.07] bg-white/[0.04] px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold text-white"
                style={{ background: "linear-gradient(140deg,#2FD871,#128A48)" }}
              >
                {u.full_name.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-bold">{u.full_name}</div>
                <div className="mt-0.5 truncate text-[10.5px] text-[rgba(237,244,239,0.45)]">{u.email}</div>
              </div>
              {u.role === "coach" && (
                <span className="flex-shrink-0 rounded-full bg-[rgba(47,216,113,0.14)] px-2.5 py-1 text-[10px] font-extrabold text-[#3BE07C]">
                  Murabbiy · {teamName(u.team_id)}
                </span>
              )}
            </div>

            {u.role === "coach" ? (
              <button
                onClick={() => handleRevoke(u)}
                disabled={pendingId === u.user_id}
                className="self-start rounded-lg border border-[rgba(220,90,90,0.4)] bg-[rgba(220,90,90,0.1)] px-3 py-1.5 text-[11px] font-semibold text-[#E8A0A0] disabled:opacity-60"
              >
                Murabbiylikni bekor qilish
              </button>
            ) : (
              <div className="flex gap-2">
                <select
                  value={selectedTeam[u.user_id ?? ""] ?? teams[0]?.id ?? ""}
                  onChange={(e) => setSelectedTeam((prev) => ({ ...prev, [u.user_id ?? ""]: e.target.value }))}
                  className="flex-1 rounded-lg border border-white/[0.1] bg-white/[0.05] px-2.5 py-1.5 text-[11.5px] text-[#EDF4EF] outline-none"
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => handleAssign(u)}
                  disabled={pendingId === u.user_id || teams.length === 0}
                  className="rounded-lg px-3 py-1.5 text-[11px] font-bold text-[#06130B] disabled:opacity-60"
                  style={{ background: "linear-gradient(140deg,#2FD871,#128A48)" }}
                >
                  Murabbiy tayinlash
                </button>
              </div>
            )}
          </div>
        ))}
        {users.length === 0 && (
          <div className="rounded-[16px] border border-white/[0.07] bg-white/[0.03] p-6 text-center text-sm text-[rgba(237,244,239,0.45)]">
            Hozircha ro'yxatdan o'tgan foydalanuvchilar yo'q
          </div>
        )}
      </div>

      {toast && <Toast message={toast.msg} kind={toast.kind} onDone={() => setToast(null)} />}
    </div>
  );
}
