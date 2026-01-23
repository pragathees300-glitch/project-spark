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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      agent_chat_presence: {
        Row: {
          agent_id: string
          created_at: string
          id: string
          is_viewing: boolean | null
          last_active_at: string | null
          last_seen_at: string | null
          user_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          id?: string
          is_viewing?: boolean | null
          last_active_at?: string | null
          last_seen_at?: string | null
          user_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          id?: string
          is_viewing?: boolean | null
          last_active_at?: string | null
          last_seen_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      branding_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: string | null
        }
        Relationships: []
      }
      chat_customer_names: {
        Row: {
          created_at: string
          id: string
          indian_name: string
          indian_name_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          indian_name: string
          indian_name_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          indian_name?: string
          indian_name_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          attachment_url: string | null
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          sender_role: string
          user_id: string
        }
        Insert: {
          attachment_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          sender_role: string
          user_id: string
        }
        Update: {
          attachment_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          sender_role?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_ratings: {
        Row: {
          created_at: string
          feedback: string | null
          id: string
          rating: number
          session_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          feedback?: string | null
          id?: string
          rating: number
          session_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          feedback?: string | null
          id?: string
          rating?: number
          session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_ratings_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_reassignment_logs: {
        Row: {
          created_at: string
          from_agent_id: string | null
          id: string
          reason: string | null
          session_id: string | null
          to_agent_id: string | null
        }
        Insert: {
          created_at?: string
          from_agent_id?: string | null
          id?: string
          reason?: string | null
          session_id?: string | null
          to_agent_id?: string | null
        }
        Update: {
          created_at?: string
          from_agent_id?: string | null
          id?: string
          reason?: string | null
          session_id?: string | null
          to_agent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_reassignment_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_reassignment_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: Json | null
        }
        Relationships: []
      }
      chat_sessions: {
        Row: {
          admin_messages_cleared_at: string | null
          assigned_agent_id: string | null
          close_reason: string | null
          created_at: string
          id: string
          previous_agent_id: string | null
          previous_agent_name: string | null
          rating: number | null
          rating_feedback: string | null
          status: string | null
          updated_at: string
          user_id: string
          user_messages_cleared_at: string | null
        }
        Insert: {
          admin_messages_cleared_at?: string | null
          assigned_agent_id?: string | null
          close_reason?: string | null
          created_at?: string
          id?: string
          previous_agent_id?: string | null
          previous_agent_name?: string | null
          rating?: number | null
          rating_feedback?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
          user_messages_cleared_at?: string | null
        }
        Update: {
          admin_messages_cleared_at?: string | null
          assigned_agent_id?: string | null
          close_reason?: string | null
          created_at?: string
          id?: string
          previous_agent_id?: string | null
          previous_agent_name?: string | null
          rating?: number | null
          rating_feedback?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
          user_messages_cleared_at?: string | null
        }
        Relationships: []
      }
      crypto_payments: {
        Row: {
          amount: number
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          id: string
          proof_url: string | null
          status: string | null
          transaction_hash: string | null
          user_id: string
          wallet_id: string | null
        }
        Insert: {
          amount: number
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          id?: string
          proof_url?: string | null
          status?: string | null
          transaction_hash?: string | null
          user_id: string
          wallet_id?: string | null
        }
        Update: {
          amount?: number
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          id?: string
          proof_url?: string | null
          status?: string | null
          transaction_hash?: string | null
          user_id?: string
          wallet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crypto_payments_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "crypto_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      crypto_wallets: {
        Row: {
          address: string
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          network: string | null
          qr_code_url: string | null
          sort_order: number | null
        }
        Insert: {
          address: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          network?: string | null
          qr_code_url?: string | null
          sort_order?: number | null
        }
        Update: {
          address?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          network?: string | null
          qr_code_url?: string | null
          sort_order?: number | null
        }
        Relationships: []
      }
      custom_payment_methods: {
        Row: {
          created_at: string
          description: string | null
          icon_url: string | null
          id: string
          instructions: string | null
          is_active: boolean | null
          name: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon_url?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          name: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          icon_url?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      dashboard_messages: {
        Row: {
          created_at: string
          created_by: string | null
          ends_at: string | null
          id: string
          is_active: boolean | null
          message: string
          starts_at: string | null
          target_role: string | null
          title: string
          type: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          message: string
          starts_at?: string | null
          target_role?: string | null
          title: string
          type?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          message?: string
          starts_at?: string | null
          target_role?: string | null
          title?: string
          type?: string | null
        }
        Relationships: []
      }
      email_mfa_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
          is_used: boolean | null
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          expires_at: string
          id?: string
          is_used?: boolean | null
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          is_used?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      faq_items: {
        Row: {
          answer: string
          category: string | null
          created_at: string
          id: string
          is_active: boolean | null
          question: string
          sort_order: number | null
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          question: string
          sort_order?: number | null
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          question?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      force_logout_events: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          reason: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          reason?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      indian_names: {
        Row: {
          created_at: string
          display_name: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      indian_names_list: {
        Row: {
          created_at: string
          gender: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string
          gender?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string
          gender?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      ip_logs: {
        Row: {
          action: string | null
          action_type: string | null
          city: string | null
          country: string | null
          created_at: string
          id: string
          ip_address: string
          metadata: Json | null
          region: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          action_type?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          ip_address: string
          metadata?: Json | null
          region?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          action_type?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          ip_address?: string
          metadata?: Json | null
          region?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      kyc_submissions: {
        Row: {
          aadhaar_back_url: string | null
          aadhaar_front_url: string | null
          aadhaar_number: string | null
          additional_doc_url: string | null
          address_proof_url: string | null
          bank_statement_url: string | null
          created_at: string
          date_of_birth: string | null
          face_image_url: string | null
          first_name: string
          id: string
          id_back_url: string | null
          id_front_url: string | null
          id_number: string | null
          id_type: string | null
          last_name: string
          nationality: string | null
          pan_document_url: string | null
          pan_number: string | null
          pan_url: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          selfie_url: string | null
          status: string | null
          submitted_at: string | null
          updated_at: string | null
          user_id: string
          utility_bill_url: string | null
        }
        Insert: {
          aadhaar_back_url?: string | null
          aadhaar_front_url?: string | null
          aadhaar_number?: string | null
          additional_doc_url?: string | null
          address_proof_url?: string | null
          bank_statement_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          face_image_url?: string | null
          first_name: string
          id?: string
          id_back_url?: string | null
          id_front_url?: string | null
          id_number?: string | null
          id_type?: string | null
          last_name: string
          nationality?: string | null
          pan_document_url?: string | null
          pan_number?: string | null
          pan_url?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          selfie_url?: string | null
          status?: string | null
          submitted_at?: string | null
          updated_at?: string | null
          user_id: string
          utility_bill_url?: string | null
        }
        Update: {
          aadhaar_back_url?: string | null
          aadhaar_front_url?: string | null
          aadhaar_number?: string | null
          additional_doc_url?: string | null
          address_proof_url?: string | null
          bank_statement_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          face_image_url?: string | null
          first_name?: string
          id?: string
          id_back_url?: string | null
          id_front_url?: string | null
          id_number?: string | null
          id_type?: string | null
          last_name?: string
          nationality?: string | null
          pan_document_url?: string | null
          pan_number?: string | null
          pan_url?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          selfie_url?: string | null
          status?: string | null
          submitted_at?: string | null
          updated_at?: string | null
          user_id?: string
          utility_bill_url?: string | null
        }
        Relationships: []
      }
      level_commissions: {
        Row: {
          bonus_amount: number | null
          commission_rate: number | null
          created_at: string
          id: string
          level_name: string
          min_orders: number | null
        }
        Insert: {
          bonus_amount?: number | null
          commission_rate?: number | null
          created_at?: string
          id?: string
          level_name: string
          min_orders?: number | null
        }
        Update: {
          bonus_amount?: number | null
          commission_rate?: number | null
          created_at?: string
          id?: string
          level_name?: string
          min_orders?: number | null
        }
        Relationships: []
      }
      login_attempts: {
        Row: {
          created_at: string
          email: string
          failure_reason: string | null
          id: string
          ip_address: string | null
          success: boolean | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          email: string
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          success?: boolean | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          success?: boolean | null
          user_agent?: string | null
        }
        Relationships: []
      }
      media_library: {
        Row: {
          created_at: string
          file_size: number | null
          file_type: string | null
          folder: string | null
          id: string
          name: string
          uploaded_by: string | null
          url: string
        }
        Insert: {
          created_at?: string
          file_size?: number | null
          file_type?: string | null
          folder?: string | null
          id?: string
          name: string
          uploaded_by?: string | null
          url: string
        }
        Update: {
          created_at?: string
          file_size?: number | null
          file_type?: string | null
          folder?: string | null
          id?: string
          name?: string
          uploaded_by?: string | null
          url?: string
        }
        Relationships: []
      }
      mfa_settings: {
        Row: {
          backup_codes: Json | null
          created_at: string
          id: string
          is_enabled: boolean | null
          method: string | null
          secret_key: string | null
          user_id: string
        }
        Insert: {
          backup_codes?: Json | null
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          method?: string | null
          secret_key?: string | null
          user_id: string
        }
        Update: {
          backup_codes?: Json | null
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          method?: string | null
          secret_key?: string | null
          user_id?: string
        }
        Relationships: []
      }
      order_chat_messages: {
        Row: {
          attachment_url: string | null
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          order_id: string
          sender_id: string
          sender_role: string
        }
        Insert: {
          attachment_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          order_id: string
          sender_id: string
          sender_role: string
        }
        Update: {
          attachment_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          order_id?: string
          sender_id?: string
          sender_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_chat_messages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_messages: {
        Row: {
          attachment_url: string | null
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          order_id: string
          sender_id: string
          sender_role: string
        }
        Insert: {
          attachment_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          order_id: string
          sender_id: string
          sender_role: string
        }
        Update: {
          attachment_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          order_id?: string
          sender_id?: string
          sender_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_messages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          notes: string | null
          order_id: string
          status: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          order_id: string
          status: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          admin_notes: string | null
          base_price: number
          cancelled_at: string | null
          commission_amount: number | null
          completed_at: string | null
          created_at: string
          customer_address: string
          customer_email: string
          customer_name: string
          customer_phone: string | null
          dropshipper_user_id: string
          id: string
          notes: string | null
          order_number: string
          paid_at: string | null
          payment_link: string | null
          payment_link_clicked_at: string | null
          payment_link_updated_at: string | null
          payment_link_updated_by: string | null
          payment_proof_url: string | null
          quantity: number
          selling_price: number
          status: string
          storefront_product_id: string | null
          tracking_number: string | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          base_price: number
          cancelled_at?: string | null
          commission_amount?: number | null
          completed_at?: string | null
          created_at?: string
          customer_address: string
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          dropshipper_user_id: string
          id?: string
          notes?: string | null
          order_number: string
          paid_at?: string | null
          payment_link?: string | null
          payment_link_clicked_at?: string | null
          payment_link_updated_at?: string | null
          payment_link_updated_by?: string | null
          payment_proof_url?: string | null
          quantity?: number
          selling_price: number
          status?: string
          storefront_product_id?: string | null
          tracking_number?: string | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          base_price?: number
          cancelled_at?: string | null
          commission_amount?: number | null
          completed_at?: string | null
          created_at?: string
          customer_address?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          dropshipper_user_id?: string
          id?: string
          notes?: string | null
          order_number?: string
          paid_at?: string | null
          payment_link?: string | null
          payment_link_clicked_at?: string | null
          payment_link_updated_at?: string | null
          payment_link_updated_by?: string | null
          payment_proof_url?: string | null
          quantity?: number
          selling_price?: number
          status?: string
          storefront_product_id?: string | null
          tracking_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_storefront_product_id_fkey"
            columns: ["storefront_product_id"]
            isOneToOne: false
            referencedRelation: "storefront_products"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_method_icons: {
        Row: {
          created_at: string
          icon_url: string
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string
          icon_url: string
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string
          icon_url?: string
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      payout_requests: {
        Row: {
          amount: number
          created_at: string
          id: string
          payout_details: Json | null
          payout_method: string
          processed_at: string | null
          processed_by: string | null
          rejection_reason: string | null
          status: string | null
          transaction_reference: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          payout_details?: Json | null
          payout_method: string
          processed_at?: string | null
          processed_by?: string | null
          rejection_reason?: string | null
          status?: string | null
          transaction_reference?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          payout_details?: Json | null
          payout_method?: string
          processed_at?: string | null
          processed_by?: string | null
          rejection_reason?: string | null
          status?: string | null
          transaction_reference?: string | null
          user_id?: string
        }
        Relationships: []
      }
      pending_payment_blocks: {
        Row: {
          blocked_at: string | null
          blocked_by: string | null
          created_at: string
          id: string
          reason: string | null
          user_id: string
        }
        Insert: {
          blocked_at?: string | null
          blocked_by?: string | null
          created_at?: string
          id?: string
          reason?: string | null
          user_id: string
        }
        Update: {
          blocked_at?: string | null
          blocked_by?: string | null
          created_at?: string
          id?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json | null
        }
        Relationships: []
      }
      popup_acknowledgments: {
        Row: {
          acknowledged_at: string | null
          created_at: string
          id: string
          popup_id: string
          session_id: string | null
          user_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          created_at?: string
          id?: string
          popup_id: string
          session_id?: string | null
          user_id: string
        }
        Update: {
          acknowledged_at?: string | null
          created_at?: string
          id?: string
          popup_id?: string
          session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "popup_acknowledgments_popup_id_fkey"
            columns: ["popup_id"]
            isOneToOne: false
            referencedRelation: "popup_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      popup_messages: {
        Row: {
          acknowledgment_count: number | null
          content: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          is_blocking: boolean | null
          is_enabled: boolean | null
          message: string | null
          message_type: string | null
          priority: number | null
          re_ack_period_days: number | null
          re_acknowledgment_mode: string | null
          require_acknowledgment: boolean | null
          show_once_per_session: boolean | null
          starts_at: string | null
          target_role: string | null
          target_roles: string[] | null
          target_type: string | null
          target_user_ids: string[] | null
          title: string
          type: string | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          acknowledgment_count?: number | null
          content: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          is_blocking?: boolean | null
          is_enabled?: boolean | null
          message?: string | null
          message_type?: string | null
          priority?: number | null
          re_ack_period_days?: number | null
          re_acknowledgment_mode?: string | null
          require_acknowledgment?: boolean | null
          show_once_per_session?: boolean | null
          starts_at?: string | null
          target_role?: string | null
          target_roles?: string[] | null
          target_type?: string | null
          target_user_ids?: string[] | null
          title: string
          type?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          acknowledgment_count?: number | null
          content?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          is_blocking?: boolean | null
          is_enabled?: boolean | null
          message?: string | null
          message_type?: string | null
          priority?: number | null
          re_ack_period_days?: number | null
          re_acknowledgment_mode?: string | null
          require_acknowledgment?: boolean | null
          show_once_per_session?: boolean | null
          starts_at?: string | null
          target_role?: string | null
          target_roles?: string[] | null
          target_type?: string | null
          target_user_ids?: string[] | null
          title?: string
          type?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: []
      }
      postpaid_settings: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          credit_limit: number | null
          current_balance: number | null
          due_date: string | null
          id: string
          is_enabled: boolean | null
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          credit_limit?: number | null
          current_balance?: number | null
          due_date?: string | null
          id?: string
          is_enabled?: boolean | null
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          credit_limit?: number | null
          current_balance?: number | null
          due_date?: string | null
          id?: string
          is_enabled?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      postpaid_transactions: {
        Row: {
          amount: number
          balance_after: number | null
          created_at: string
          description: string | null
          id: string
          reference_id: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after?: number | null
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number | null
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      product_media: {
        Row: {
          alt_text: string | null
          created_at: string
          id: string
          media_type: string | null
          product_id: string
          sort_order: number | null
          url: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: string
          media_type?: string | null
          product_id: string
          sort_order?: number | null
          url: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: string
          media_type?: string | null
          product_id?: string
          sort_order?: number | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_media_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reviews: {
        Row: {
          created_at: string
          id: string
          is_approved: boolean | null
          product_id: string
          rating: number
          review_text: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_approved?: boolean | null
          product_id: string
          rating: number
          review_text?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_approved?: boolean | null
          product_id?: string
          rating?: number
          review_text?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          base_price: number
          category: string | null
          commission_rate: number | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          max_price: number | null
          min_price: number | null
          name: string
          sku: string | null
          stock: number | null
          stock_quantity: number | null
          updated_at: string
        }
        Insert: {
          base_price: number
          category?: string | null
          commission_rate?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          max_price?: number | null
          min_price?: number | null
          name: string
          sku?: string | null
          stock?: number | null
          stock_quantity?: number | null
          updated_at?: string
        }
        Update: {
          base_price?: number
          category?: string | null
          commission_rate?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          max_price?: number | null
          min_price?: number | null
          name?: string
          sku?: string | null
          stock?: number | null
          stock_quantity?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          allow_payout_with_dues: boolean | null
          commission_override: number | null
          created_at: string
          email: string | null
          email_2fa_enabled: boolean | null
          id: string
          is_active: boolean | null
          last_login_at: string | null
          name: string | null
          phone: string | null
          postpaid_credit_limit: number | null
          postpaid_due_cycle: string | null
          postpaid_due_date: string | null
          postpaid_enabled: boolean | null
          postpaid_used: number | null
          profile_image_url: string | null
          referral_code: string | null
          referred_by: string | null
          storefront_banner_url: string | null
          storefront_description: string | null
          storefront_logo_url: string | null
          storefront_name: string | null
          storefront_slug: string | null
          storefront_theme: string | null
          total_earnings: number | null
          updated_at: string
          user_id: string
          user_level: string | null
          user_status: string | null
          wallet_balance: number | null
        }
        Insert: {
          allow_payout_with_dues?: boolean | null
          commission_override?: number | null
          created_at?: string
          email?: string | null
          email_2fa_enabled?: boolean | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          name?: string | null
          phone?: string | null
          postpaid_credit_limit?: number | null
          postpaid_due_cycle?: string | null
          postpaid_due_date?: string | null
          postpaid_enabled?: boolean | null
          postpaid_used?: number | null
          profile_image_url?: string | null
          referral_code?: string | null
          referred_by?: string | null
          storefront_banner_url?: string | null
          storefront_description?: string | null
          storefront_logo_url?: string | null
          storefront_name?: string | null
          storefront_slug?: string | null
          storefront_theme?: string | null
          total_earnings?: number | null
          updated_at?: string
          user_id: string
          user_level?: string | null
          user_status?: string | null
          wallet_balance?: number | null
        }
        Update: {
          allow_payout_with_dues?: boolean | null
          commission_override?: number | null
          created_at?: string
          email?: string | null
          email_2fa_enabled?: boolean | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          name?: string | null
          phone?: string | null
          postpaid_credit_limit?: number | null
          postpaid_due_cycle?: string | null
          postpaid_due_date?: string | null
          postpaid_enabled?: boolean | null
          postpaid_used?: number | null
          profile_image_url?: string | null
          referral_code?: string | null
          referred_by?: string | null
          storefront_banner_url?: string | null
          storefront_description?: string | null
          storefront_logo_url?: string | null
          storefront_name?: string | null
          storefront_slug?: string | null
          storefront_theme?: string | null
          total_earnings?: number | null
          updated_at?: string
          user_id?: string
          user_level?: string | null
          user_status?: string | null
          wallet_balance?: number | null
        }
        Relationships: []
      }
      proof_of_work: {
        Row: {
          admin_notes: string | null
          commission_amount: number | null
          created_at: string
          description: string | null
          id: string
          product_link: string | null
          proof_url: string | null
          proof_urls: Json | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          user_id: string
          work_title: string | null
          work_type: string
        }
        Insert: {
          admin_notes?: string | null
          commission_amount?: number | null
          created_at?: string
          description?: string | null
          id?: string
          product_link?: string | null
          proof_url?: string | null
          proof_urls?: Json | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          user_id: string
          work_title?: string | null
          work_type: string
        }
        Update: {
          admin_notes?: string | null
          commission_amount?: number | null
          created_at?: string
          description?: string | null
          id?: string
          product_link?: string | null
          proof_url?: string | null
          proof_urls?: Json | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          user_id?: string
          work_title?: string | null
          work_type?: string
        }
        Relationships: []
      }
      proof_submissions: {
        Row: {
          admin_notes: string | null
          commission_amount: number | null
          created_at: string
          description: string | null
          id: string
          product_link: string | null
          proof_url: string | null
          proof_urls: Json | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          user_id: string
          work_title: string
          work_type_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          commission_amount?: number | null
          created_at?: string
          description?: string | null
          id?: string
          product_link?: string | null
          proof_url?: string | null
          proof_urls?: Json | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          user_id: string
          work_title: string
          work_type_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          commission_amount?: number | null
          created_at?: string
          description?: string | null
          id?: string
          product_link?: string | null
          proof_url?: string | null
          proof_urls?: Json | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          user_id?: string
          work_title?: string
          work_type_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proof_submissions_work_type_id_fkey"
            columns: ["work_type_id"]
            isOneToOne: false
            referencedRelation: "work_types"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          keys: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          keys: Json
          user_id: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          keys?: Json
          user_id?: string
        }
        Relationships: []
      }
      quick_replies: {
        Row: {
          category: string | null
          created_at: string
          id: string
          is_active: boolean | null
          message: string
          sort_order: number | null
          title: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          message: string
          sort_order?: number | null
          title: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          message?: string
          sort_order?: number | null
          title?: string
        }
        Relationships: []
      }
      settings_audit_logs: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          new_value: Json | null
          old_value: Json | null
          setting_key: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          setting_key: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          setting_key?: string
        }
        Relationships: []
      }
      storefront_products: {
        Row: {
          created_at: string
          custom_description: string | null
          custom_price: number | null
          id: string
          is_active: boolean | null
          product_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_description?: string | null
          custom_price?: number | null
          id?: string
          is_active?: boolean | null
          product_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          custom_description?: string | null
          custom_price?: number | null
          id?: string
          is_active?: boolean | null
          product_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "storefront_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      storefront_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: Json | null
        }
        Relationships: []
      }
      support_agent_presence: {
        Row: {
          active_chat_count: number | null
          agent_name: string | null
          created_at: string
          id: string
          is_available: boolean | null
          is_online: boolean | null
          last_seen_at: string | null
          user_id: string
        }
        Insert: {
          active_chat_count?: number | null
          agent_name?: string | null
          created_at?: string
          id?: string
          is_available?: boolean | null
          is_online?: boolean | null
          last_seen_at?: string | null
          user_id: string
        }
        Update: {
          active_chat_count?: number | null
          agent_name?: string | null
          created_at?: string
          id?: string
          is_available?: boolean | null
          is_online?: boolean | null
          last_seen_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          created_at: string
          description: string
          id: string
          priority: string | null
          resolved_at: string | null
          status: string | null
          subject: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          description: string
          id?: string
          priority?: string | null
          resolved_at?: string | null
          status?: string | null
          subject: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          description?: string
          id?: string
          priority?: string | null
          resolved_at?: string | null
          status?: string | null
          subject?: string
          user_id?: string
        }
        Relationships: []
      }
      top_dropshippers: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          earnings: number | null
          id: string
          is_active: boolean | null
          rank: number | null
          sort_order: number | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name: string
          earnings?: number | null
          id?: string
          is_active?: boolean | null
          rank?: number | null
          sort_order?: number | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          earnings?: number | null
          id?: string
          is_active?: boolean | null
          rank?: number | null
          sort_order?: number | null
        }
        Relationships: []
      }
      trusted_devices: {
        Row: {
          created_at: string
          device_fingerprint: string
          device_name: string | null
          expires_at: string | null
          id: string
          last_used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device_fingerprint: string
          device_name?: string | null
          expires_at?: string | null
          id?: string
          last_used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          device_fingerprint?: string
          device_name?: string | null
          expires_at?: string | null
          id?: string
          last_used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_level_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          new_level: string
          old_level: string | null
          reason: string | null
          user_id: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_level: string
          old_level?: string | null
          reason?: string | null
          user_id: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_level?: string
          old_level?: string | null
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      video_tutorial_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          is_completed: boolean | null
          user_id: string
          video_id: string
          watched_seconds: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean | null
          user_id: string
          video_id: string
          watched_seconds?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean | null
          user_id?: string
          video_id?: string
          watched_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "video_tutorial_progress_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "video_tutorials"
            referencedColumns: ["id"]
          },
        ]
      }
      video_tutorials: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          sort_order: number | null
          thumbnail_url: string | null
          title: string
          video_url: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          thumbnail_url?: string | null
          title: string
          video_url: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          thumbnail_url?: string | null
          title?: string
          video_url?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number | null
          created_at: string
          description: string | null
          id: string
          order_id: string | null
          reference_id: string | null
          reference_type: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after?: number | null
          created_at?: string
          description?: string | null
          id?: string
          order_id?: string | null
          reference_id?: string | null
          reference_type?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number | null
          created_at?: string
          description?: string | null
          id?: string
          order_id?: string | null
          reference_id?: string | null
          reference_type?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      work_type_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      work_types: {
        Row: {
          category_id: string | null
          commission_amount: number | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          requires_proof: boolean | null
          sort_order: number | null
        }
        Insert: {
          category_id?: string | null
          commission_amount?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          requires_proof?: boolean | null
          sort_order?: number | null
        }
        Update: {
          category_id?: string | null
          commission_amount?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          requires_proof?: boolean | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "work_types_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "work_type_categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_audit_log: {
        Args: {
          p_action: string
          p_entity_id?: string
          p_entity_type: string
          p_new_data?: Json
          p_old_data?: Json
          p_user_id?: string
        }
        Returns: string
      }
      get_assigned_agent_name: { Args: { p_user_id: string }; Returns: string }
      get_dropshipper_orders_masked: {
        Args: never
        Returns: {
          base_price: number
          completed_at: string
          created_at: string
          customer_address_masked: string
          customer_email_masked: string
          customer_name_masked: string
          customer_phone_masked: string
          dropshipper_user_id: string
          id: string
          order_number: string
          paid_at: string
          payment_link: string
          payment_link_clicked_at: string
          product_base_price: number
          product_id: string
          product_image_url: string
          product_name: string
          quantity: number
          selling_price: number
          status: string
          storefront_product_id: string
          updated_at: string
        }[]
      }
      reconcile_profile_and_roles_by_email: { Args: never; Returns: Json }
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
