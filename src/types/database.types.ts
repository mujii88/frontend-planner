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
      projects: {
        Row: {
          id: string
          user_id: string
          title: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          created_at?: string
        }
      }
      nodes: {
        Row: {
          id: string
          project_id: string
          user_id: string
          parent_id: string | null
          type: 'page' | 'organism' | 'molecule' | 'atom' | 'hook' | 'context'
          name: string
          description: string | null
          content: Json
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          parent_id?: string | null
          type: 'page' | 'organism' | 'molecule' | 'atom' | 'hook' | 'context'
          name: string
          description?: string | null
          content?: Json
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          parent_id?: string | null
          type?: 'page' | 'organism' | 'molecule' | 'atom' | 'hook' | 'context'
          name?: string
          description?: string | null
          content?: Json
          created_at?: string
        }
      }
    }
  }
}