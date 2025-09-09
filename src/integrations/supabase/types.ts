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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      fichas_tecnicas: {
        Row: {
          acabamento_superficie: string | null
          balanceamento: number | null
          calandra: number | null
          certificacao: string | null
          cliente: string
          cnc_tf: number | null
          condicoes_especiais: string | null
          contato: string | null
          cor_pintura: string | null
          criado_por: string | null
          data_criacao: string
          data_entrega: string | null
          data_ultima_edicao: string
          data_visita: string | null
          des_montg: number | null
          descricao_geral: string | null
          desenho: string | null
          desenho_finalizado: string | null
          dimensoes: string | null
          dobra: number | null
          dureza: string | null
          editado_por: string | null
          eng_tec: number | null
          ensaio_lp: string | null
          fresa_furad: number | null
          galvanizacao: string | null
          horas_fresa: number | null
          horas_furadeira: number | null
          horas_montagem: number | null
          horas_outros: number | null
          horas_pintura: number | null
          horas_solda: number | null
          horas_torno: number | null
          id: string
          lavagem_acab: number | null
          macarico_solda: number | null
          mandrilhamento: number | null
          material_base: string | null
          nome_peca: string
          norma_aplicavel: string | null
          numero_ftc: string
          numero_nf: string | null
          numero_orcamento: string | null
          numero_os: string | null
          observacoes: string | null
          origem_projeto: string | null
          peca_amostra: string | null
          peso_peca_galv: string | null
          pintura: string | null
          pintura_horas: number | null
          plasma_oxicorte: number | null
          programacao_cam: number | null
          quantidade: string
          servico: string
          solda: string | null
          solicitante: string
          status: string
          tempera_reven: string | null
          tipo_execucao: string | null
          tolerancia: string | null
          torno_grande: number | null
          torno_pequeno: number | null
          total_horas_servico: number | null
          total_material_peca: number | null
          total_material_todas_pecas: number | null
          transporte: string | null
          tratamento: number | null
          tratamento_termico: string | null
          usinagem: string | null
          visita_tecnica: string | null
        }
        Insert: {
          acabamento_superficie?: string | null
          balanceamento?: number | null
          calandra?: number | null
          certificacao?: string | null
          cliente: string
          cnc_tf?: number | null
          condicoes_especiais?: string | null
          contato?: string | null
          cor_pintura?: string | null
          criado_por?: string | null
          data_criacao?: string
          data_entrega?: string | null
          data_ultima_edicao?: string
          data_visita?: string | null
          des_montg?: number | null
          descricao_geral?: string | null
          desenho?: string | null
          desenho_finalizado?: string | null
          dimensoes?: string | null
          dobra?: number | null
          dureza?: string | null
          editado_por?: string | null
          eng_tec?: number | null
          ensaio_lp?: string | null
          fresa_furad?: number | null
          galvanizacao?: string | null
          horas_fresa?: number | null
          horas_furadeira?: number | null
          horas_montagem?: number | null
          horas_outros?: number | null
          horas_pintura?: number | null
          horas_solda?: number | null
          horas_torno?: number | null
          id?: string
          lavagem_acab?: number | null
          macarico_solda?: number | null
          mandrilhamento?: number | null
          material_base?: string | null
          nome_peca: string
          norma_aplicavel?: string | null
          numero_ftc: string
          numero_nf?: string | null
          numero_orcamento?: string | null
          numero_os?: string | null
          observacoes?: string | null
          origem_projeto?: string | null
          peca_amostra?: string | null
          peso_peca_galv?: string | null
          pintura?: string | null
          pintura_horas?: number | null
          plasma_oxicorte?: number | null
          programacao_cam?: number | null
          quantidade: string
          servico: string
          solda?: string | null
          solicitante: string
          status?: string
          tempera_reven?: string | null
          tipo_execucao?: string | null
          tolerancia?: string | null
          torno_grande?: number | null
          torno_pequeno?: number | null
          total_horas_servico?: number | null
          total_material_peca?: number | null
          total_material_todas_pecas?: number | null
          transporte?: string | null
          tratamento?: number | null
          tratamento_termico?: string | null
          usinagem?: string | null
          visita_tecnica?: string | null
        }
        Update: {
          acabamento_superficie?: string | null
          balanceamento?: number | null
          calandra?: number | null
          certificacao?: string | null
          cliente?: string
          cnc_tf?: number | null
          condicoes_especiais?: string | null
          contato?: string | null
          cor_pintura?: string | null
          criado_por?: string | null
          data_criacao?: string
          data_entrega?: string | null
          data_ultima_edicao?: string
          data_visita?: string | null
          des_montg?: number | null
          descricao_geral?: string | null
          desenho?: string | null
          desenho_finalizado?: string | null
          dimensoes?: string | null
          dobra?: number | null
          dureza?: string | null
          editado_por?: string | null
          eng_tec?: number | null
          ensaio_lp?: string | null
          fresa_furad?: number | null
          galvanizacao?: string | null
          horas_fresa?: number | null
          horas_furadeira?: number | null
          horas_montagem?: number | null
          horas_outros?: number | null
          horas_pintura?: number | null
          horas_solda?: number | null
          horas_torno?: number | null
          id?: string
          lavagem_acab?: number | null
          macarico_solda?: number | null
          mandrilhamento?: number | null
          material_base?: string | null
          nome_peca?: string
          norma_aplicavel?: string | null
          numero_ftc?: string
          numero_nf?: string | null
          numero_orcamento?: string | null
          numero_os?: string | null
          observacoes?: string | null
          origem_projeto?: string | null
          peca_amostra?: string | null
          peso_peca_galv?: string | null
          pintura?: string | null
          pintura_horas?: number | null
          plasma_oxicorte?: number | null
          programacao_cam?: number | null
          quantidade?: string
          servico?: string
          solda?: string | null
          solicitante?: string
          status?: string
          tempera_reven?: string | null
          tipo_execucao?: string | null
          tolerancia?: string | null
          torno_grande?: number | null
          torno_pequeno?: number | null
          total_horas_servico?: number | null
          total_material_peca?: number | null
          total_material_todas_pecas?: number | null
          transporte?: string | null
          tratamento?: number | null
          tratamento_termico?: string | null
          usinagem?: string | null
          visita_tecnica?: string | null
        }
        Relationships: []
      }
      fotos: {
        Row: {
          criado_por: string | null
          ficha_id: string
          id: string
          name: string
          size: number
          storage_path: string | null
          type: string
          uploaded_at: string
        }
        Insert: {
          criado_por?: string | null
          ficha_id: string
          id?: string
          name: string
          size: number
          storage_path?: string | null
          type?: string
          uploaded_at?: string
        }
        Update: {
          criado_por?: string | null
          ficha_id?: string
          id?: string
          name?: string
          size?: number
          storage_path?: string | null
          type?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fotos_ficha_id_fkey"
            columns: ["ficha_id"]
            isOneToOne: false
            referencedRelation: "fichas_tecnicas"
            referencedColumns: ["id"]
          },
        ]
      }
      materiais: {
        Row: {
          cliente_interno: string | null
          created_at: string
          criado_por: string | null
          descricao: string
          ficha_id: string
          fornecedor: string | null
          id: string
          ordem: number
          quantidade: string
          unidade: string | null
          valor_total: number
          valor_unitario: number
        }
        Insert: {
          cliente_interno?: string | null
          created_at?: string
          criado_por?: string | null
          descricao: string
          ficha_id: string
          fornecedor?: string | null
          id?: string
          ordem: number
          quantidade: string
          unidade?: string | null
          valor_total?: number
          valor_unitario?: number
        }
        Update: {
          cliente_interno?: string | null
          created_at?: string
          criado_por?: string | null
          descricao?: string
          ficha_id?: string
          fornecedor?: string | null
          id?: string
          ordem?: number
          quantidade?: string
          unidade?: string | null
          valor_total?: number
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "materiais_ficha_id_fkey"
            columns: ["ficha_id"]
            isOneToOne: false
            referencedRelation: "fichas_tecnicas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_next_ftc_number: {
        Args: Record<PropertyKey, never>
        Returns: string
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
