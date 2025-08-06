export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          avatar_url: string | null;
          wallet_address: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          avatar_url?: string | null;
          wallet_address?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          avatar_url?: string | null;
          wallet_address?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      hackathons: {
        Row: {
          id: string;
          title: string;
          description: string;
          start_date: string;
          end_date: string;
          cover_image: string | null;
          tags: string[];
          host_id: string;
          slug: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          start_date: string;
          end_date: string;
          cover_image?: string | null;
          tags?: string[];
          host_id: string;
          slug: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          start_date?: string;
          end_date?: string;
          cover_image?: string | null;
          tags?: string[];
          host_id?: string;
          slug?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      teams: {
        Row: {
          id: string;
          hackathon_id: string;
          name: string;
          description: string | null;
          slug: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          hackathon_id: string;
          name: string;
          description?: string | null;
          slug: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          hackathon_id?: string;
          name?: string;
          description?: string | null;
          slug?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      team_members: {
        Row: {
          id: string;
          team_id: string;
          user_id: string;
          role: "leader" | "member";
          joined_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          user_id: string;
          role?: "leader" | "member";
          joined_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          user_id?: string;
          role?: "leader" | "member";
          joined_at?: string;
        };
      };
      submissions: {
        Row: {
          id: string;
          team_id: string;
          github_link: string | null;
          demo_link: string | null;
          tech_stack: string[];
          description: string | null;
          submitted_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          github_link?: string | null;
          demo_link?: string | null;
          tech_stack?: string[];
          description?: string | null;
          submitted_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          github_link?: string | null;
          demo_link?: string | null;
          tech_stack?: string[];
          description?: string | null;
          submitted_at?: string;
          updated_at?: string;
        };
      };
      judges: {
        Row: {
          id: string;
          hackathon_id: string;
          user_id: string;
          assigned_at: string;
        };
        Insert: {
          id?: string;
          hackathon_id: string;
          user_id: string;
          assigned_at?: string;
        };
        Update: {
          id?: string;
          hackathon_id?: string;
          user_id?: string;
          assigned_at?: string;
        };
      };
      scores: {
        Row: {
          id: string;
          team_id: string;
          judge_id: string;
          score: number;
          comment: string | null;
          scored_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          judge_id: string;
          score: number;
          comment?: string | null;
          scored_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          judge_id?: string;
          score?: number;
          comment?: string | null;
          scored_at?: string;
        };
      };
      winners: {
        Row: {
          id: string;
          team_id: string;
          hackathon_id: string;
          rank: number;
          prize_text: string | null;
          announced_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          hackathon_id: string;
          rank: number;
          prize_text?: string | null;
          announced_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          hackathon_id?: string;
          rank?: number;
          prize_text?: string | null;
          announced_at?: string;
        };
      };
      events: {
        Row: {
          id: string;
          name: string;
          description: string;
          start_time: string;
          end_time: string;
          organizer_id: string;
          organizer_name: string;
          banner_image_url: string | null;
          location: string | null;
          is_online: boolean;
          participant_limit: number | null;
          tags: string[] | null;
          custom_fields: unknown[] | null;
          registration_deadline: string | null;
          website_url: string | null;
          discord_url: string | null;
          twitter_url: string | null;
          requirements: string | null;
          short_code: string;
          is_multi_day: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          start_time: string;
          end_time: string;
          organizer_id: string;
          organizer_name: string;
          banner_image_url?: string | null;
          location?: string | null;
          is_online?: boolean;
          participant_limit?: number | null;
          tags?: string[] | null;
          custom_fields?: unknown[] | null;
          registration_deadline?: string | null;
          website_url?: string | null;
          discord_url?: string | null;
          twitter_url?: string | null;
          requirements?: string | null;
          short_code: string;
          is_multi_day?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          start_time?: string;
          end_time?: string;
          organizer_id?: string;
          organizer_name?: string;
          banner_image_url?: string | null;
          location?: string | null;
          is_online?: boolean;
          participant_limit?: number | null;
          tags?: string[] | null;
          custom_fields?: unknown[] | null;
          registration_deadline?: string | null;
          website_url?: string | null;
          discord_url?: string | null;
          twitter_url?: string | null;
          requirements?: string | null;
          short_code?: string;
          is_multi_day?: boolean;
          created_at?: string;
        };
      };
      event_days: {
        Row: {
          id: string;
          event_id: string;
          day_number: number;
          day_name: string | null;
          start_time: string;
          end_time: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          day_number: number;
          day_name?: string | null;
          start_time: string;
          end_time: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          day_number?: number;
          day_name?: string | null;
          start_time?: string;
          end_time?: string;
          created_at?: string;
        };
      };
      event_participants: {
        Row: {
          id: string;
          event_id: string;
          user_id: string;
          status: string;
          registered_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          user_id: string;
          status?: string;
          registered_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          user_id?: string;
          status?: string;
          registered_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
};
