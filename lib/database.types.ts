// Hand-written to match supabase/migrations/0001_init.sql. Kept minimal:
// just enough for @supabase/supabase-js to type `.from(table)` calls.
export interface Database {
  __InternalSupabase: {
    PostgrestVersion: "12";
  };
  public: {
    Tables: {
      groups: {
        Row: {
          id: string;
          code: string;
          name: string;
          member_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          member_count?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["groups"]["Insert"]>;
        Relationships: [];
      };
      members: {
        Row: {
          id: string;
          group_id: string;
          name: string;
          submitted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          name: string;
          submitted_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["members"]["Insert"]>;
        Relationships: [];
      };
      responses: {
        Row: {
          id: string;
          member_id: string;
          hard_constraints: unknown;
          preferences: unknown;
          created_at: string;
        };
        Insert: {
          id?: string;
          member_id: string;
          hard_constraints: unknown;
          preferences: unknown;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["responses"]["Insert"]>;
        Relationships: [];
      };
      listings: {
        Row: {
          id: string;
          source: string;
          source_url: string;
          title: string;
          locality: string;
          rent: number;
          bhk: number;
          bathrooms: number;
          floor: number;
          has_lift: boolean;
          parking: boolean;
          pet_friendly: boolean;
          furnished: string;
          amenities: string[];
          scraped_at: string;
        };
        Insert: {
          id?: string;
          source: string;
          source_url: string;
          title: string;
          locality: string;
          rent: number;
          bhk: number;
          bathrooms: number;
          floor: number;
          has_lift?: boolean;
          parking?: boolean;
          pet_friendly?: boolean;
          furnished?: string;
          amenities?: string[];
          scraped_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["listings"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
