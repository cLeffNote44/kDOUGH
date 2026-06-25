// Generated from the Supabase project schema. Regenerate with:
//   supabase gen types typescript --project-id <ref> > src/types/database.types.ts
// (or the Supabase MCP generate_typescript_types tool). Do not edit by hand.

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
      grocery_items: {
        Row: {
          category: string
          checked: boolean
          created_at: string
          id: string
          is_manual: boolean
          list_id: string
          name: string
          quantity: number | null
          recipe_ids: string[] | null
          unit: string | null
        }
        Insert: {
          category?: string
          checked?: boolean
          created_at?: string
          id?: string
          is_manual?: boolean
          list_id: string
          name: string
          quantity?: number | null
          recipe_ids?: string[] | null
          unit?: string | null
        }
        Update: {
          category?: string
          checked?: boolean
          created_at?: string
          id?: string
          is_manual?: boolean
          list_id?: string
          name?: string
          quantity?: number | null
          recipe_ids?: string[] | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grocery_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "grocery_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      grocery_lists: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          user_id: string
          week_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          week_start: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
      meal_plans: {
        Row: {
          created_at: string
          date: string
          id: string
          meal_type: string
          recipe_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          meal_type?: string
          recipe_id: string
          user_id?: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          meal_type?: string
          recipe_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_plans_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          cook_time: number | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          ingredients: Json
          instructions: string | null
          is_favorite: boolean
          prep_time: number | null
          servings: number | null
          source_url: string | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cook_time?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          ingredients?: Json
          instructions?: string | null
          is_favorite?: boolean
          prep_time?: number | null
          servings?: number | null
          source_url?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          cook_time?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          ingredients?: Json
          instructions?: string | null
          is_favorite?: boolean
          prep_time?: number | null
          servings?: number | null
          source_url?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
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
