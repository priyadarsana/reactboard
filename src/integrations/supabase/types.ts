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
      announcements: {
        Row: {
          body: string
          category: Database["public"]["Enums"]["announcement_category"]
          created_at: string
          created_by: string
          id: string
          pinned: boolean | null
          read_receipts: Json | null
          schedule_at: string | null
          targets: string[] | null
          title: string
        }
        Insert: {
          body: string
          category: Database["public"]["Enums"]["announcement_category"]
          created_at?: string
          created_by: string
          id?: string
          pinned?: boolean | null
          read_receipts?: Json | null
          schedule_at?: string | null
          targets?: string[] | null
          title: string
        }
        Update: {
          body?: string
          category?: Database["public"]["Enums"]["announcement_category"]
          created_at?: string
          created_by?: string
          id?: string
          pinned?: boolean | null
          read_receipts?: Json | null
          schedule_at?: string | null
          targets?: string[] | null
          title?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string
          after: Json | null
          before: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          timestamp: string
        }
        Insert: {
          action: string
          actor_id: string
          after?: Json | null
          before?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          timestamp?: string
        }
        Update: {
          action?: string
          actor_id?: string
          after?: Json | null
          before?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          timestamp?: string
        }
        Relationships: []
      }
      chat_channels: {
        Row: {
          context_id: string | null
          created_at: string
          id: string
          name: string
          type: string
        }
        Insert: {
          context_id?: string | null
          created_at?: string
          id?: string
          name: string
          type: string
        }
        Update: {
          context_id?: string | null
          created_at?: string
          id?: string
          name?: string
          type?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          attachments: string[] | null
          author_id: string
          body: string
          channel_id: string
          created_at: string
          flags: string[] | null
          id: string
        }
        Insert: {
          attachments?: string[] | null
          author_id: string
          body: string
          channel_id: string
          created_at?: string
          flags?: string[] | null
          id?: string
        }
        Update: {
          attachments?: string[] | null
          author_id?: string
          body?: string
          channel_id?: string
          created_at?: string
          flags?: string[] | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      faculty_status: {
        Row: {
          faculty_id: string
          id: string
          office_hours: string | null
          room: string | null
          state: Database["public"]["Enums"]["presence_state"]
          updated_at: string
        }
        Insert: {
          faculty_id: string
          id?: string
          office_hours?: string | null
          room?: string | null
          state?: Database["public"]["Enums"]["presence_state"]
          updated_at?: string
        }
        Update: {
          faculty_id?: string
          id?: string
          office_hours?: string | null
          room?: string | null
          state?: Database["public"]["Enums"]["presence_state"]
          updated_at?: string
        }
        Relationships: []
      }
      lost_items: {
        Row: {
          category: Database["public"]["Enums"]["lost_item_category"]
          created_at: string
          description: string | null
          id: string
          photos: string[] | null
          reporter_id: string
          status: Database["public"]["Enums"]["lost_item_status"]
          time_window_end: string | null
          time_window_start: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["lost_item_category"]
          created_at?: string
          description?: string | null
          id?: string
          photos?: string[] | null
          reporter_id: string
          status?: Database["public"]["Enums"]["lost_item_status"]
          time_window_end?: string | null
          time_window_start?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["lost_item_category"]
          created_at?: string
          description?: string | null
          id?: string
          photos?: string[] | null
          reporter_id?: string
          status?: Database["public"]["Enums"]["lost_item_status"]
          time_window_end?: string | null
          time_window_start?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          payload: Json | null
          read: boolean | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          payload?: Json | null
          read?: boolean | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          payload?: Json | null
          read?: boolean | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      od_requests: {
        Row: {
          applicant_id: string
          approver_id: string | null
          attachments: string[] | null
          created_at: string
          end_date: string
          history: Json | null
          id: string
          purpose: string
          start_date: string
          status: Database["public"]["Enums"]["od_status"]
          updated_at: string
        }
        Insert: {
          applicant_id: string
          approver_id?: string | null
          attachments?: string[] | null
          created_at?: string
          end_date: string
          history?: Json | null
          id?: string
          purpose: string
          start_date: string
          status?: Database["public"]["Enums"]["od_status"]
          updated_at?: string
        }
        Update: {
          applicant_id?: string
          approver_id?: string | null
          attachments?: string[] | null
          created_at?: string
          end_date?: string
          history?: Json | null
          id?: string
          purpose?: string
          start_date?: string
          status?: Database["public"]["Enums"]["od_status"]
          updated_at?: string
        }
        Relationships: []
      }
      pins: {
        Row: {
          created_at: string
          created_by: string
          id: string
          item_id: string
          lat: number
          lng: number
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          item_id: string
          lat: number
          lng: number
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          item_id?: string
          lat?: number
          lng?: number
        }
        Relationships: [
          {
            foreignKeyName: "pins_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "lost_items"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          department: string | null
          email: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          email: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          department?: string | null
          email?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      queries: {
        Row: {
          accepted_reply_id: string | null
          author_id: string
          body: string
          created_at: string
          id: string
          status: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          accepted_reply_id?: string | null
          author_id: string
          body: string
          created_at?: string
          id?: string
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          accepted_reply_id?: string | null
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      query_replies: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          query_id: string
          upvotes: number | null
          verified: boolean | null
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          query_id: string
          upvotes?: number | null
          verified?: boolean | null
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          query_id?: string
          upvotes?: number | null
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "query_replies_query_id_fkey"
            columns: ["query_id"]
            isOneToOne: false
            referencedRelation: "queries"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      votes: {
        Row: {
          created_at: string
          id: string
          pin_id: string
          user_id: string
          vote_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          pin_id: string
          user_id: string
          vote_type: string
        }
        Update: {
          created_at?: string
          id?: string
          pin_id?: string
          user_id?: string
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_pin_id_fkey"
            columns: ["pin_id"]
            isOneToOne: false
            referencedRelation: "pins"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      announcement_category: "events" | "holidays" | "exams" | "maintenance"
      app_role: "student" | "faculty" | "moderator" | "admin"
      lost_item_category:
        | "electronics"
        | "books"
        | "accessories"
        | "clothing"
        | "id_cards"
        | "other"
      lost_item_status: "open" | "matched" | "returned"
      od_status: "pending" | "approved" | "rejected"
      presence_state: "present" | "absent" | "on_leave"
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
    Enums: {
      announcement_category: ["events", "holidays", "exams", "maintenance"],
      app_role: ["student", "faculty", "moderator", "admin"],
      lost_item_category: [
        "electronics",
        "books",
        "accessories",
        "clothing",
        "id_cards",
        "other",
      ],
      lost_item_status: ["open", "matched", "returned"],
      od_status: ["pending", "approved", "rejected"],
      presence_state: ["present", "absent", "on_leave"],
    },
  },
} as const
