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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      board_members: {
        Row: {
          board_id: string
          created_at: string
          invited_by: string | null
          role: string
          user_id: string
        }
        Insert: {
          board_id: string
          created_at?: string
          invited_by?: string | null
          role?: string
          user_id: string
        }
        Update: {
          board_id?: string
          created_at?: string
          invited_by?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_members_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
        ]
      }
      boards: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string
          id: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          alt: string | null
          board_id: string
          body: string | null
          caption: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          height: number
          id: string
          preview_image: string | null
          site_name: string | null
          src: string | null
          title: string | null
          type: string
          updated_at: string
          url: string | null
          user_id: string
          width: number
          x: number
          y: number
        }
        Insert: {
          alt?: string | null
          board_id: string
          body?: string | null
          caption?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          height: number
          id: string
          preview_image?: string | null
          site_name?: string | null
          src?: string | null
          title?: string | null
          type: string
          updated_at?: string
          url?: string | null
          user_id: string
          width: number
          x: number
          y: number
        }
        Update: {
          alt?: string | null
          board_id?: string
          body?: string | null
          caption?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          height?: number
          id?: string
          preview_image?: string | null
          site_name?: string | null
          src?: string | null
          title?: string | null
          type?: string
          updated_at?: string
          url?: string | null
          user_id?: string
          width?: number
          x?: number
          y?: number
        }
        Relationships: [
          {
            foreignKeyName: "notes_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      invite_board_member: {
        Args: { p_board_id: string; p_invitee_email: string; p_role?: string }
        Returns: string
      }
      save_boards_snapshot: {
        Args: { p_boards: Json; p_notes: Json; p_user_id: string }
        Returns: undefined
      }
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
