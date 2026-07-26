/**
 * Supabase sxemasining tip ta'rifi — `supabase gen types typescript` chiqaradigan
 * shakl bilan bir xil. Yangilash:
 *
 *     npx supabase gen types typescript --project-id <PROJECT_ID> > lib/database.types.ts
 *
 * Bu fayl 0001–0017 migratsiyalaridan olingan yagona haqiqat manbai. `lib/types.ts`
 * ichidagi domen tiplari shu yerdan `Tables<"...">` orqali kelib chiqadi — shuning
 * uchun sxema o'zgarsa, faylni qayta generatsiya qilish kifoya.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      teams: {
        Row: {
          id: string;
          slug: string;
          name: string;
          init: string;
          crest_gradient: string;
          crest_border: string;
          crest_color: string;
          logo_url: string | null;
          coach_email: string | null;
          coach_id: string | null;
          status: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          init: string;
          crest_gradient: string;
          crest_border?: string;
          crest_color?: string;
          logo_url?: string | null;
          coach_email?: string | null;
          coach_id?: string | null;
          status?: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["teams"]["Insert"]>;
        Relationships: [];
      };

      tournaments: {
        Row: {
          id: string;
          slug: string;
          name: string;
          dates_label: string;
          starts_on: string;
          ends_on: string;
          team_count: number;
          status: string;
          logo_url: string | null;
          regulations: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          dates_label: string;
          starts_on: string;
          ends_on: string;
          team_count?: number;
          status: string;
          logo_url?: string | null;
          regulations?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tournaments"]["Insert"]>;
        Relationships: [];
      };

      standings: {
        Row: {
          id: string;
          tournament_id: string;
          team_id: string;
          group_name: string;
          pos: number;
          played: number;
          won: number;
          drawn: number;
          lost: number;
          goals_for: number;
          goals_against: number;
          points: number;
        };
        Insert: {
          id?: string;
          tournament_id: string;
          team_id: string;
          group_name?: string;
          pos: number;
          played?: number;
          won?: number;
          drawn?: number;
          lost?: number;
          goals_for?: number;
          goals_against?: number;
          points?: number;
        };
        Update: Partial<Database["public"]["Tables"]["standings"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "standings_tournament_id_fkey";
            columns: ["tournament_id"];
            isOneToOne: false;
            referencedRelation: "tournaments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "standings_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };

      matches: {
        Row: {
          id: string;
          tournament_id: string;
          group_name: string | null;
          home_team_id: string;
          away_team_id: string;
          home_score: number;
          away_score: number;
          status: string;
          minute: number | null;
          venue: string | null;
          kickoff_at: string;
          is_featured: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          tournament_id: string;
          group_name?: string | null;
          home_team_id: string;
          away_team_id: string;
          home_score?: number;
          away_score?: number;
          status: string;
          minute?: number | null;
          venue?: string | null;
          kickoff_at: string;
          is_featured?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["matches"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "matches_tournament_id_fkey";
            columns: ["tournament_id"];
            isOneToOne: false;
            referencedRelation: "tournaments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "matches_home_team_id_fkey";
            columns: ["home_team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "matches_away_team_id_fkey";
            columns: ["away_team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };

      player_stats: {
        Row: {
          id: string;
          player_name: string;
          team_id: string;
          goals: number;
          assists: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          player_name: string;
          team_id: string;
          goals?: number;
          assists?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["player_stats"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "player_stats_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };

      profiles: {
        Row: {
          id: string;
          user_id: string | null;
          email: string | null;
          full_name: string;
          avatar_url: string | null;
          position: string | null;
          matches_played: number;
          goals: number;
          assists: number;
          team_id: string | null;
          role: string;
          push_enabled: boolean;
          email_enabled: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          email?: string | null;
          full_name: string;
          avatar_url?: string | null;
          position?: string | null;
          matches_played?: number;
          goals?: number;
          assists?: number;
          team_id?: string | null;
          role?: string;
          push_enabled?: boolean;
          email_enabled?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "profiles_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };

      news: {
        Row: {
          id: string;
          title: string;
          body: string;
          cover_gradient: string;
          published_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          body: string;
          cover_gradient?: string;
          published_at?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["news"]["Insert"]>;
        Relationships: [];
      };

      sponsors: {
        Row: {
          id: string;
          name: string;
          logo_url: string | null;
          link_url: string | null;
          is_featured: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          logo_url?: string | null;
          link_url?: string | null;
          is_featured?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["sponsors"]["Insert"]>;
        Relationships: [];
      };

      app_settings: {
        Row: {
          id: string;
          telegram_support_url: string | null;
          phone_support: string | null;
          app_name: string | null;
          system_status: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          telegram_support_url?: string | null;
          phone_support?: string | null;
          app_name?: string | null;
          system_status?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["app_settings"]["Insert"]>;
        Relationships: [];
      };

      players: {
        Row: {
          id: string;
          team_id: string;
          number: number;
          name: string;
          position: string;
          is_starter: boolean;
          photo_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          number: number;
          name: string;
          position: string;
          is_starter?: boolean;
          photo_url?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["players"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "players_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };

      lineups: {
        Row: {
          id: string;
          team_id: string;
          formation: string;
          captain_player_id: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          formation?: string;
          captain_player_id?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["lineups"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "lineups_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: true;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lineups_captain_player_id_fkey";
            columns: ["captain_player_id"];
            isOneToOne: false;
            referencedRelation: "players";
            referencedColumns: ["id"];
          },
        ];
      };

      coach_invites: {
        Row: {
          id: string;
          email: string;
          invited_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          invited_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["coach_invites"]["Insert"]>;
        Relationships: [];
      };

      notifications: {
        Row: {
          id: string;
          recipient_role: string | null;
          recipient_id: string | null;
          type: string;
          payload: Json;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          recipient_role?: string | null;
          recipient_id?: string | null;
          type: string;
          payload?: Json;
          read?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
        Relationships: [];
      };

      user_favorites: {
        Row: {
          id: string;
          user_id: string;
          team_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          team_id: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_favorites"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "user_favorites_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };

      chat_messages: {
        Row: {
          id: string;
          match_id: string;
          user_id: string | null;
          author_name: string;
          author_init: string;
          avatar_gradient: string;
          text: string;
          is_bot: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          match_id: string;
          user_id?: string | null;
          author_name: string;
          author_init: string;
          avatar_gradient: string;
          text: string;
          is_bot?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["chat_messages"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "chat_messages_match_id_fkey";
            columns: ["match_id"];
            isOneToOne: false;
            referencedRelation: "matches";
            referencedColumns: ["id"];
          },
        ];
      };
    };

    Views: Record<never, never>;

    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      is_coach: { Args: Record<string, never>; Returns: boolean };
      is_team_coach: { Args: { p_team_id: string }; Returns: boolean };
      recalc_standings: { Args: { p_tournament_id: string }; Returns: undefined };
    };

    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};

/** `Tables<"teams">` → teams jadvalining Row tipi. */
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

/** `TablesInsert<"teams">` → teams jadvaliga INSERT payload tipi. */
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

/** `TablesUpdate<"teams">` → teams jadvalini UPDATE payload tipi. */
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
