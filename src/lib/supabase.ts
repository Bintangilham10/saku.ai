import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const noStoreFetch: typeof fetch = (url, options = {}) =>
  fetch(url, {
    ...options,
    cache: "no-store",
  });

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export function hasSupabaseServiceRole() {
  return Boolean(supabaseUrl && supabaseServiceRoleKey);
}

export const supabase =
  isSupabaseConfigured() && supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          fetch: noStoreFetch,
        },
      })
    : null;

export async function createSupabaseServerClient() {
  if (!isSupabaseConfigured() || !supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  const { getToken } = await auth();
  const token = await getToken();

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
      fetch: noStoreFetch,
    },
  });
}

export function createSupabaseAdminClient() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      fetch: noStoreFetch,
    },
  });
}
