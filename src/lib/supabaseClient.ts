import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

export async function getGoogleAccessToken() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    console.error("No session found", error);
    return null;
  }

  // Google ka provider_token uthana hoga
  const token = session.provider_token || session.access_token;
  console.log("Google Token:", token);
  return token;
}
