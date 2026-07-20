// Supabase Edge Function: welcome
// Trigger: call after successful signup to create profile row and send welcome email
import { serve } from 'https://deno.land/std@0.203.0/http/server.ts'

serve(async (req) => {
  try {
    const { user } = await req.json();
    const SUPABASE_URL = Deno.env.get('AUTH_SUPABASE_URL') || Deno.env.get('VITE_SUPABASE_URL') || Deno.env.get('SUPABASE_URL');
    const SERVICE_KEY = Deno.env.get('AUTH_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!SUPABASE_URL || !SERVICE_KEY) return new Response('Missing env', { status: 500 });

    const profile = {
      id: user.id,
      username: user.user_metadata?.username || null,
      full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
      bio: user.user_metadata?.bio || null,
      avatar_url: user.user_metadata?.avatar_url || null,
    };

    const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        Prefer: 'return=representation',
      },
      body: JSON.stringify(profile),
    });

    if (!res.ok) {
      const text = await res.text();
      return new Response(text, { status: res.status });
    }

    return new Response('OK');
  } catch (err) {
    return new Response(String(err), { status: 500 });
  }
});
