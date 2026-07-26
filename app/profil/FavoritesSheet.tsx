"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Sheet, Crest } from "@/components/ui";
import { StarIcon } from "@/components/icons";
import { toggleFavorite } from "@/lib/actions/favorites";
import type { Team } from "@/lib/types";

export function FavoritesSheet({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    Promise.all([
      supabase.from("teams").select("*").order("name", { ascending: true }),
      supabase.from("user_favorites").select("team_id").eq("user_id", userId),
    ]).then(([t, f]) => {
      if (!active) return;
      setTeams((t.data ?? []) as Team[]);
      setFavoriteIds(new Set((f.data ?? []).map((r) => r.team_id as string)));
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [userId]);

  const sorted = [...teams].sort((a, b) => {
    const af = favoriteIds.has(a.id) ? 0 : 1;
    const bf = favoriteIds.has(b.id) ? 0 : 1;
    if (af !== bf) return af - bf;
    return a.name.localeCompare(b.name);
  });

  async function handleToggle(team: Team) {
    const isFav = favoriteIds.has(team.id);
    setPendingId(team.id);
    const result = await toggleFavorite(team.id, !isFav);
    if (!result.error) {
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (isFav) next.delete(team.id);
        else next.add(team.id);
        return next;
      });
    }
    setPendingId(null);
  }

  return (
    <Sheet title="Sevimli jamoalar" onClose={onClose}>
      {loading ? (
        <div className="py-8 text-center text-[12px]" style={{ color: "var(--fg-muted)" }}>
          Yuklanmoqda...
        </div>
      ) : (
        <div className="flex flex-col gap-2 pb-2">
          {sorted.map((team) => {
            const isFav = favoriteIds.has(team.id);
            return (
              <div
                key={team.id}
                className="flex items-center gap-3 rounded-2xl border px-3.5 py-2.5"
                style={{ borderColor: "var(--border)", background: "var(--bg-soft)" }}
              >
                <Crest
                  gradient={team.crest_gradient}
                  init={team.init}
                  border={team.crest_border}
                  color={team.crest_color}
                  size={36}
                />
                <div className="min-w-0 flex-1 truncate text-[13px] font-bold">{team.name}</div>
                <button
                  onClick={() => handleToggle(team)}
                  disabled={pendingId === team.id}
                  aria-label="Sevimli"
                  style={{ color: isFav ? "#F5C24B" : "var(--fg-muted)" }}
                >
                  <StarIcon size={20} filled={isFav} />
                </button>
              </div>
            );
          })}
          {sorted.length === 0 && (
            <div
              className="rounded-2xl border p-6 text-center text-[12.5px]"
              style={{ borderColor: "var(--border)", color: "var(--fg-muted)" }}
            >
              Jamoalar topilmadi
            </div>
          )}
        </div>
      )}
    </Sheet>
  );
}
