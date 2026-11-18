/**
 * DAR MAROC AI — Edge Function `ai-auth`
 * Supabase Edge Function (Deno / TypeScript)
 *
 * Rôle :
 * - Vérification du JWT Supabase (authentification serveur)
 * - Retour du rôle et des permissions de l'utilisateur (depuis admin_users)
 * - Endpoint de login (délégue à Supabase Auth)
 * - Endpoint de logout
 *
 * Aucun secret n'est exposé côté client. Le JWT est vérifié côté serveur.
 *
 * Variables d'environnement (Supabase Dashboard > Settings > Secrets) :
 * - Aucune clé supplémentaire requise (utilise SUPABASE_URL et SUPABASE_ANON_KEY
 *   injectées automatiquement par Supabase)
 *
 * Non déployé sans autorisation spécifique.
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

interface AuthRequest {
  action: 'verify' | 'login' | 'logout';
  email?: string;
  password?: string;
}

interface AuthResponse {
  success: boolean;
  user?: {
    id: string;
    email: string | null;
    role: string;
    isAdmin: boolean;
  };
  token?: string;
  error?: string;
  code?: string;
}

// ---------- Vérification du rôle utilisateur ----------
async function getUserRole(
  supabaseClient: ReturnType<typeof createClient>,
  userId: string
): Promise<{ role: string; isAdmin: boolean; actif: boolean }> {
  try {
    // Chercher par auth_id (lien auth.users.id → admin_users.auth_id)
    const { data, error } = await supabaseClient
      .from('admin_users')
      .select('role, actif')
      .eq('auth_id', userId)
      .single();

    if (error || !data) {
      return { role: 'client', isAdmin: false, actif: true };
    }

    return {
      role: data.role || 'client',
      isAdmin: data.role === 'admin' || data.role === 'superadmin',
      actif: data.actif !== false,
    };
  } catch (e) {
    return { role: 'client', isAdmin: false, actif: true };
  }
}

serve(async (req) => {
  // Gestion CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Méthode non autorisée' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  let supabaseClient: ReturnType<typeof createClient> | null = null;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';

    const body: AuthRequest = await req.json();
    const action = body.action || 'verify';

    // ---------- ACTION : VÉRIFIER (JWT) ----------
    if (action === 'verify') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(
          JSON.stringify({ success: false, error: 'Authentification requise', code: 'AUTH_REQUIRED' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const jwt = authHeader.slice(7);
      supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });

      const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
      if (authError || !user) {
        return new Response(
          JSON.stringify({ success: false, error: 'Utilisateur non authentifié', code: 'AUTH_INVALID' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const roleInfo = await getUserRole(supabaseClient, user.id);
      if (!roleInfo.actif) {
        return new Response(
          JSON.stringify({ success: false, error: 'Compte inactif', code: 'ACCOUNT_INACTIVE' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const response: AuthResponse = {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          role: roleInfo.role,
          isAdmin: roleInfo.isAdmin,
        },
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ---------- ACTION : LOGIN ----------
    if (action === 'login') {
      if (!body.email || !body.password) {
        return new Response(
          JSON.stringify({ success: false, error: 'Email et mot de passe requis', code: 'MISSING_CREDENTIALS' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: body.email,
        password: body.password,
      });

      if (error || !data.user || !data.session) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Identifiants incorrects',
            code: 'LOGIN_FAILED',
          }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Vérifier le rôle dans admin_users
      const roleInfo = await getUserRole(supabaseClient, data.user.id);
      if (!roleInfo.actif) {
        await supabaseClient.auth.signOut();
        return new Response(
          JSON.stringify({ success: false, error: 'Compte inactif', code: 'ACCOUNT_INACTIVE' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const response: AuthResponse = {
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
          role: roleInfo.role,
          isAdmin: roleInfo.isAdmin,
        },
        token: data.session.access_token,
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ---------- ACTION : LOGOUT ----------
    if (action === 'logout') {
      const authHeader = req.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const jwt = authHeader.slice(7);
        supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: { Authorization: authHeader } },
        });
        await supabaseClient.auth.signOut();
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Déconnecté' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Action inconnue', code: 'UNKNOWN_ACTION' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: 'Erreur interne', code: 'INTERNAL_ERROR' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
