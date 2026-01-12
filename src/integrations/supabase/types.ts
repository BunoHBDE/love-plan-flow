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
      available_dates: {
        Row: {
          created_at: string
          created_by: string
          date: string
          id: string
          reason: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          date: string
          id?: string
          reason?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          date?: string
          id?: string
          reason?: string | null
        }
        Relationships: []
      }
      blocked_dates: {
        Row: {
          created_at: string
          created_by: string
          date: string
          id: string
          reason: string
        }
        Insert: {
          created_at?: string
          created_by: string
          date: string
          id?: string
          reason: string
        }
        Update: {
          created_at?: string
          created_by?: string
          date?: string
          id?: string
          reason?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          bairro: string | null
          cep: string | null
          cidade: string | null
          complemento: string | null
          cpf: string | null
          created_at: string
          created_by: string
          email: string | null
          estado_uf: string | null
          id: string
          nome: string
          numero: string | null
          rua: string | null
          telefone: string
          updated_at: string
        }
        Insert: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          cpf?: string | null
          created_at?: string
          created_by: string
          email?: string | null
          estado_uf?: string | null
          id?: string
          nome: string
          numero?: string | null
          rua?: string | null
          telefone: string
          updated_at?: string
        }
        Update: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          cpf?: string | null
          created_at?: string
          created_by?: string
          email?: string | null
          estado_uf?: string | null
          id?: string
          nome?: string
          numero?: string | null
          rua?: string | null
          telefone?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address_cep: string | null
          address_city: string | null
          address_complement: string | null
          address_neighborhood: string | null
          address_number: string | null
          address_state: string | null
          address_street: string | null
          avatar_url: string | null
          birth_date: string | null
          company_address: string | null
          company_cep: string | null
          company_city: string | null
          company_cnpj: string | null
          company_complement: string | null
          company_email: string | null
          company_logo_url: string | null
          company_name: string | null
          company_neighborhood: string | null
          company_number: string | null
          company_phone: string | null
          company_state: string | null
          company_street: string | null
          cpf: string | null
          created_at: string
          email: string | null
          full_name: string | null
          gender: string | null
          id: string
          marital_status: string | null
          nationality: string | null
          occupation: string | null
          phone: string | null
          rg: string | null
          subscription_override: boolean | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          address_cep?: string | null
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          company_address?: string | null
          company_cep?: string | null
          company_city?: string | null
          company_cnpj?: string | null
          company_complement?: string | null
          company_email?: string | null
          company_logo_url?: string | null
          company_name?: string | null
          company_neighborhood?: string | null
          company_number?: string | null
          company_phone?: string | null
          company_state?: string | null
          company_street?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          gender?: string | null
          id: string
          marital_status?: string | null
          nationality?: string | null
          occupation?: string | null
          phone?: string | null
          rg?: string | null
          subscription_override?: boolean | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          address_cep?: string | null
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          company_address?: string | null
          company_cep?: string | null
          company_city?: string | null
          company_cnpj?: string | null
          company_complement?: string | null
          company_email?: string | null
          company_logo_url?: string | null
          company_name?: string | null
          company_neighborhood?: string | null
          company_number?: string | null
          company_phone?: string | null
          company_state?: string | null
          company_street?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          marital_status?: string | null
          nationality?: string | null
          occupation?: string | null
          phone?: string | null
          rg?: string | null
          subscription_override?: boolean | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      quote_buffet_options: {
        Row: {
          ano: string
          ativo: boolean
          created_at: string
          id: string
          itens_inclusos: Json
          nome: string
          precos_por_pessoa: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          ano: string
          ativo?: boolean
          created_at?: string
          id?: string
          itens_inclusos?: Json
          nome: string
          precos_por_pessoa?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          ano?: string
          ativo?: boolean
          created_at?: string
          id?: string
          itens_inclusos?: Json
          nome?: string
          precos_por_pessoa?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quote_package_options: {
        Row: {
          ano: string
          ativo: boolean
          created_at: string
          desconto_percentual: number
          desconto_percentual_variavel: number
          descricao: string
          id: string
          itens_pacote: Json
          nome: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ano: string
          ativo?: boolean
          created_at?: string
          desconto_percentual?: number
          desconto_percentual_variavel?: number
          descricao?: string
          id?: string
          itens_pacote?: Json
          nome: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ano?: string
          ativo?: boolean
          created_at?: string
          desconto_percentual?: number
          desconto_percentual_variavel?: number
          descricao?: string
          id?: string
          itens_pacote?: Json
          nome?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_package_options_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      quote_service_options: {
        Row: {
          ano: string
          ativo: boolean
          created_at: string
          descricao: string | null
          id: string
          nome: string
          precos: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          ano: string
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          precos?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          ano?: string
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          precos?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quote_space_prices: {
        Row: {
          ano: string
          ativo: boolean
          created_at: string
          id: string
          itens_inclusos: Json
          nome: string
          precos_por_dia: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          ano: string
          ativo?: boolean
          created_at?: string
          id?: string
          itens_inclusos?: Json
          nome: string
          precos_por_dia?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          ano?: string
          ativo?: boolean
          created_at?: string
          id?: string
          itens_inclusos?: Json
          nome?: string
          precos_por_dia?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quotes: {
        Row: {
          ano_evento: string | null
          canal_entrada: string | null
          client_id: string
          created_at: string
          created_by: string
          data_evento: string | null
          data_status: string
          dia_semana: string | null
          dia_vencimento: number
          extras_json: Json | null
          id: string
          menu_buffet: string | null
          n_convidados: number
          numero_parcelas: number
          observacoes_cliente: string | null
          observacoes_internas: string | null
          pacote: string
          parcelas_json: Json | null
          percentual_sinal: number
          quote_number: string
          status: string
          tipo_evento: string | null
          updated_at: string
          validade: string | null
          valor_sinal: number
          valor_total: number
        }
        Insert: {
          ano_evento?: string | null
          canal_entrada?: string | null
          client_id: string
          created_at?: string
          created_by: string
          data_evento?: string | null
          data_status?: string
          dia_semana?: string | null
          dia_vencimento?: number
          extras_json?: Json | null
          id?: string
          menu_buffet?: string | null
          n_convidados?: number
          numero_parcelas?: number
          observacoes_cliente?: string | null
          observacoes_internas?: string | null
          pacote: string
          parcelas_json?: Json | null
          percentual_sinal?: number
          quote_number: string
          status?: string
          tipo_evento?: string | null
          updated_at?: string
          validade?: string | null
          valor_sinal?: number
          valor_total?: number
        }
        Update: {
          ano_evento?: string | null
          canal_entrada?: string | null
          client_id?: string
          created_at?: string
          created_by?: string
          data_evento?: string | null
          data_status?: string
          dia_semana?: string | null
          dia_vencimento?: number
          extras_json?: Json | null
          id?: string
          menu_buffet?: string | null
          n_convidados?: number
          numero_parcelas?: number
          observacoes_cliente?: string | null
          observacoes_internas?: string | null
          pacote?: string
          parcelas_json?: Json | null
          percentual_sinal?: number
          quote_number?: string
          status?: string
          tipo_evento?: string | null
          updated_at?: string
          validade?: string | null
          valor_sinal?: number
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
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
          role?: Database["public"]["Enums"]["app_role"]
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
      visit_settings: {
        Row: {
          allow_overlapping: boolean
          created_at: string
          default_duration: number
          end_time: string
          id: string
          interval_between_visits: number
          max_visits_per_slot: number
          start_time: string
          updated_at: string
          user_id: string
        }
        Insert: {
          allow_overlapping?: boolean
          created_at?: string
          default_duration?: number
          end_time?: string
          id?: string
          interval_between_visits?: number
          max_visits_per_slot?: number
          start_time?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          allow_overlapping?: boolean
          created_at?: string
          default_duration?: number
          end_time?: string
          id?: string
          interval_between_visits?: number
          max_visits_per_slot?: number
          start_time?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      visits: {
        Row: {
          client_id: string | null
          created_at: string
          created_by: string
          duration: number | null
          guest_count: number | null
          id: string
          notes: string | null
          status: string
          updated_at: string
          visit_date: string
          visit_end_time: string | null
          visit_time: string
          wedding_date: string | null
          wedding_date_status: string
          wedding_month: string | null
          wedding_year: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          created_by: string
          duration?: number | null
          guest_count?: number | null
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
          visit_date: string
          visit_end_time?: string | null
          visit_time: string
          wedding_date?: string | null
          wedding_date_status?: string
          wedding_month?: string | null
          wedding_year?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          created_by?: string
          duration?: number | null
          guest_count?: number | null
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
          visit_date?: string
          visit_end_time?: string | null
          visit_time?: string
          wedding_date?: string | null
          wedding_date_status?: string
          wedding_month?: string | null
          wedding_year?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visits_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
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
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
