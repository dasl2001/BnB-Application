import type { SupabaseClient } from "@supabase/supabase-js";
export type Vars = {
  supa: SupabaseClient; 
  authUser: { id: string } | null;
};
