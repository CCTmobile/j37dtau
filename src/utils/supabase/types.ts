export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          phone: string | null
          created_at: string
          updated_at: string
          role: Database['public']['Enums']['user_role']
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
          role?: Database['public']['Enums']['user_role']
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
          role?: Database['public']['Enums']['user_role']
        }
      }
      products: {
        Row: {
          id: string
          name: string
          description: string | null
          price: number
          category: string
          image_url: string | null
          images: Json
          sizes: string[]
          colors: string[]
          in_stock: boolean
          original_price: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          price: number
          category: string
          image_url?: string | null
          images?: Json
          sizes?: string[]
          colors?: string[]
          in_stock?: boolean
          original_price?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          price?: number
          category?: string
          image_url?: string | null
          images?: Json
          sizes?: string[]
          colors?: string[]
          in_stock?: boolean
          original_price?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string | null // Made nullable for guest orders
          status: string
          total_amount: number
          shipping_address: Json
          customer_email: string | null // Added for guest orders
          customer_name: string | null // Added for guest orders
          customer_phone: string | null // Added for guest orders
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null // Made nullable for guest orders
          status: string
          total_amount: number
          shipping_address: Json
          customer_email?: string | null // Added for guest orders
          customer_name?: string | null // Added for guest orders
          customer_phone?: string | null // Added for guest orders
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          status?: string
          total_amount?: number
          shipping_address?: Json
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          price_at_purchase: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          quantity: number
          price_at_purchase: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          price_at_purchase?: number
          created_at?: string
        }
      }
      cart: {
        Row: {
          id: string
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      cart_items: {
        Row: {
          id: string
          cart_id: string
          product_id: string
          quantity: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          cart_id: string
          product_id: string
          quantity: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          cart_id?: string
          product_id?: string
          quantity?: number
          created_at?: string
          updated_at?: string
        }
      }
      rewards: {
        Row: {
          id: string
          user_id: string
          points: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          points?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          points?: number
          created_at?: string
          updated_at?: string
        }
      }
      notification_preferences: {
        Row: {
          id: string
          user_id: string
          email_notifications: boolean
          push_notifications: boolean
          system_alerts: boolean
          order_alerts: boolean
          security_alerts: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email_notifications?: boolean
          push_notifications?: boolean
          system_alerts?: boolean
          order_alerts?: boolean
          security_alerts?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          email_notifications?: boolean
          push_notifications?: boolean
          system_alerts?: boolean
          order_alerts?: boolean
          security_alerts?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_order_total: {
        Args: {
          order_id: string
        }
        Returns: number
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      create_order_from_cart: {
        Args: {
          p_user_id: string
          p_shipping_address: Json
        }
        Returns: string
      }
    }
    Enums: {
      user_role: 'customer' | 'admin'
    }
  }
}
