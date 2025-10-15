export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      brand_hub: {
        Row: {
          brand_vibe_words: string[]
          business_name: string
          created_at: string | null
          id: string
          target_customer: string
          updated_at: string | null
          user_id: string
          what_makes_unique: string
          what_you_sell: string
        }
        Insert: {
          brand_vibe_words: string[]
          business_name: string
          created_at?: string | null
          id?: string
          target_customer: string
          updated_at?: string | null
          user_id: string
          what_makes_unique: string
          what_you_sell: string
        }
        Update: {
          brand_vibe_words?: string[]
          business_name?: string
          created_at?: string | null
          id?: string
          target_customer?: string
          updated_at?: string | null
          user_id?: string
          what_makes_unique?: string
          what_you_sell?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_hub_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      content_plans: {
        Row: {
          created_at: string | null
          end_date: string
          goal: string | null
          id: string
          important_date: string | null
          important_date_label: string | null
          name: string
          platforms: string[]
          sales_channel_type: string
          shot_list: Json | null
          start_date: string
          updated_at: string | null
          user_id: string
          what_promoting: string
        }
        Insert: {
          created_at?: string | null
          end_date: string
          goal?: string | null
          id?: string
          important_date?: string | null
          important_date_label?: string | null
          name: string
          platforms: string[]
          sales_channel_type: string
          shot_list?: Json | null
          start_date: string
          updated_at?: string | null
          user_id: string
          what_promoting: string
        }
        Update: {
          created_at?: string | null
          end_date?: string
          goal?: string | null
          id?: string
          important_date?: string | null
          important_date_label?: string | null
          name?: string
          platforms?: string[]
          sales_channel_type?: string
          shot_list?: Json | null
          start_date?: string
          updated_at?: string | null
          user_id?: string
          what_promoting?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          available_for_interview: boolean | null
          campaigns_count: number | null
          created_at: string | null
          days_since_signup: number | null
          feedback_text: string
          id: string
          page_url: string | null
          posts_count: number | null
          user_email: string | null
          user_id: string | null
          user_plan: string | null
        }
        Insert: {
          available_for_interview?: boolean | null
          campaigns_count?: number | null
          created_at?: string | null
          days_since_signup?: number | null
          feedback_text: string
          id?: string
          page_url?: string | null
          posts_count?: number | null
          user_email?: string | null
          user_id?: string | null
          user_plan?: string | null
        }
        Update: {
          available_for_interview?: boolean | null
          campaigns_count?: number | null
          created_at?: string | null
          days_since_signup?: number | null
          feedback_text?: string
          id?: string
          page_url?: string | null
          posts_count?: number | null
          user_email?: string | null
          user_id?: string | null
          user_plan?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          caption: string
          content_plan_id: string
          created_at: string | null
          deleted: boolean | null
          hook: string | null
          id: string
          platforms: string[]
          post_name: string
          post_number: number
          post_type: string
          scheduled_date: string
          status: string | null
          updated_at: string | null
          user_id: string
          visual_concept: Json
        }
        Insert: {
          caption: string
          content_plan_id: string
          created_at?: string | null
          deleted?: boolean | null
          hook?: string | null
          id?: string
          platforms: string[]
          post_name: string
          post_number: number
          post_type: string
          scheduled_date: string
          status?: string | null
          updated_at?: string | null
          user_id: string
          visual_concept: Json
        }
        Update: {
          caption?: string
          content_plan_id?: string
          created_at?: string | null
          deleted?: boolean | null
          hook?: string | null
          id?: string
          platforms?: string[]
          post_name?: string
          post_number?: number
          post_type?: string
          scheduled_date?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
          visual_concept?: Json
        }
        Relationships: [
          {
            foreignKeyName: "posts_content_plan_id_fkey"
            columns: ["content_plan_id"]
            isOneToOne: false
            referencedRelation: "content_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          ai_regenerations_used_this_period: number | null
          billing_period_end: string | null
          billing_period_start: string | null
          created_at: string | null
          email: string
          id: string
          posts_created_this_period: number | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string | null
          subscription_tier: string | null
        }
        Insert: {
          ai_regenerations_used_this_period?: number | null
          billing_period_end?: string | null
          billing_period_start?: string | null
          created_at?: string | null
          email: string
          id?: string
          posts_created_this_period?: number | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
        }
        Update: {
          ai_regenerations_used_this_period?: number | null
          billing_period_end?: string | null
          billing_period_start?: string | null
          created_at?: string | null
          email?: string
          id?: string
          posts_created_this_period?: number | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
