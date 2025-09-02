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
      // Quiz tables
      quizzes: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          host_id: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          host_id: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          host_id?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      quiz_rooms: {
        Row: {
          id: string;
          quiz_id: string;
          host_id: string;
          room_name: string;
          pin: string;
          status: 'waiting' | 'active' | 'finished';
          current_question_index: number;
          started_at: string | null;
          ended_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          quiz_id: string;
          host_id: string;
          room_name: string;
          pin: string;
          status?: 'waiting' | 'active' | 'finished';
          current_question_index?: number;
          started_at?: string | null;
          ended_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          quiz_id?: string;
          host_id?: string;
          room_name?: string;
          pin?: string;
          status?: 'waiting' | 'active' | 'finished';
          current_question_index?: number;
          started_at?: string | null;
          ended_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      quiz_questions: {
        Row: {
          id: string;
          quiz_id: string;
          question_text: string;
          question_type: 'multiple_choice' | 'true_false';
          options: string[] | null;
          correct_answer: string;
          points: number;
          time_limit: number;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          quiz_id: string;
          question_text: string;
          question_type?: 'multiple_choice' | 'true_false';
          options?: string[] | null;
          correct_answer: string;
          points?: number;
          time_limit?: number;
          order_index: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          quiz_id?: string;
          question_text?: string;
          question_type?: 'multiple_choice' | 'true_false';
          options?: string[] | null;
          correct_answer?: string;
          points?: number;
          time_limit?: number;
          order_index?: number;
          created_at?: string;
        };
      };
      quiz_participants: {
        Row: {
          id: string;
          room_id: string;
          user_id: string;
          display_name: string;
          score: number;
          joined_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          user_id: string;
          display_name: string;
          score?: number;
          joined_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          user_id?: string;
          display_name?: string;
          score?: number;
          joined_at?: string;
        };
      };
      quiz_answers: {
        Row: {
          id: string;
          room_id: string;
          question_id: string;
          participant_id: string;
          answer: string;
          is_correct: boolean;
          points_earned: number;
          time_taken: number | null;
          answered_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          question_id: string;
          participant_id: string;
          answer: string;
          is_correct: boolean;
          points_earned?: number;
          time_taken?: number | null;
          answered_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          question_id?: string;
          participant_id?: string;
          answer?: string;
          is_correct?: boolean;
          points_earned?: number;
          time_taken?: number | null;
          answered_at?: string;
        };
      };

      // Social Quest tables
      social_quests: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          context: string;
          hashtags: string | null;
          social_platforms: string[];
          ai_prompt: string | null;
          organizer_id: string;
          organizer_name: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          context: string;
          hashtags?: string | null;
          social_platforms: string[];
          ai_prompt?: string | null;
          organizer_id: string;
          organizer_name: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          context?: string;
          hashtags?: string | null;
          social_platforms?: string[];
          ai_prompt?: string | null;
          organizer_id?: string;
          organizer_name?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      social_quest_participants: {
        Row: {
          id: string;
          quest_id: string;
          user_id: string;
          display_name: string;
          shared_on: string[];
          shared_at: string;
        };
        Insert: {
          id?: string;
          quest_id: string;
          user_id: string;
          display_name: string;
          shared_on?: string[];
          shared_at?: string;
        };
        Update: {
          id?: string;
          quest_id?: string;
          user_id?: string;
          display_name?: string;
          shared_on?: string[];
          shared_at?: string;
        };
      };
      social_quest_shares: {
        Row: {
          id: string;
          quest_id: string;
          participant_id: string;
          platform: string;
          share_url: string | null;
          message_text: string | null;
          shared_at: string;
        };
        Insert: {
          id?: string;
          quest_id: string;
          participant_id: string;
          platform: string;
          share_url?: string | null;
          message_text?: string | null;
          shared_at?: string;
        };
        Update: {
          id?: string;
          quest_id?: string;
          participant_id?: string;
          platform?: string;
          share_url?: string | null;
          message_text?: string | null;
          shared_at?: string;
        };
      };
      bounty_awards: {
        Row: {
          id: string;
          bounty_id: string;
          recipient_id: string;
          recipient_name: string;
          award_amount: number;
          award_currency: string;
          note: string | null;
          awarded_at: string;
        };
        Insert: {
          id?: string;
          bounty_id: string;
          recipient_id: string;
          recipient_name: string;
          award_amount: number;
          award_currency?: string;
          note?: string | null;
          awarded_at?: string;
        };
        Update: {
          id?: string;
          bounty_id?: string;
          recipient_id?: string;
          recipient_name?: string;
          award_amount?: number;
          award_currency?: string;
          note?: string | null;
          awarded_at?: string;
        };
      };
      bounty_contributions: {
        Row: {
          id: string;
          bounty_id: string;
          contributor_id: string;
          description: string | null;
          pr_url: string | null;
          commit_hash: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          bounty_id: string;
          contributor_id: string;
          description?: string | null;
          pr_url?: string | null;
          commit_hash?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          bounty_id?: string;
          contributor_id?: string;
          description?: string | null;
          pr_url?: string | null;
          commit_hash?: string | null;
          created_at?: string;
        };
      };
      bounty_applications: {
        Row: {
          id: string;
          bounty_id: string;
          applicant_id: string;
          applicant_name: string;
          pitch: string;
          portfolio_url: string | null;
          status: 'pending' | 'accepted' | 'rejected';
          created_at: string;
        };
        Insert: {
          id?: string;
          bounty_id: string;
          applicant_id: string;
          applicant_name: string;
          pitch: string;
          portfolio_url?: string | null;
          status?: 'pending' | 'accepted' | 'rejected';
          created_at?: string;
        };
        Update: {
          id?: string;
          bounty_id?: string;
          applicant_id?: string;
          applicant_name?: string;
          pitch?: string;
          portfolio_url?: string | null;
          status?: 'pending' | 'accepted' | 'rejected';
          created_at?: string;
        };
      };
      bounties: {
        Row: {
          id: string;
          title: string;
          description: string;
          tags: string[] | null;
          reward_amount: number;
          reward_currency: string;
          repo_url: string | null;
          issue_url: string | null;
          attachment_url: string | null;
          poster_id: string;
          poster_name: string;
          status: 'open' | 'in_review' | 'awarded' | 'closed';
          deadline: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          tags?: string[] | null;
          reward_amount: number;
          reward_currency?: string;
          repo_url?: string | null;
          issue_url?: string | null;
          attachment_url?: string | null;
          poster_id: string;
          poster_name: string;
          status?: 'open' | 'in_review' | 'awarded' | 'closed';
          deadline?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          tags?: string[] | null;
          reward_amount?: number;
          reward_currency?: string;
          repo_url?: string | null;
          issue_url?: string | null;
          attachment_url?: string | null;
          poster_id?: string;
          poster_name?: string;
          status?: 'open' | 'in_review' | 'awarded' | 'closed';
          deadline?: string | null;
          created_at?: string;
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
