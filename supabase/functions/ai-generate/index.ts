/**
 * DAR MAROC AI — Edge Function `ai-generate`
 * Supabase Edge Function (Deno / TypeScript)
 *
 * Rôle :
 * - Point d'entrée unique pour toutes les requêtes IA des agents DAR MAROC AI
 * - Les clés API sont stockées dans Supabase Secrets (jamais exposées côté client)
 * - Authentification Supabase (JWT) requise pour tous les appels
 * - Autorisation par rôle (vérifiée dans la table admin_users)
 * - Fournisseur principal + fournisseur de secours avec basculement automatique
 * - Idempotence via header Idempotency-Key
 * - Rate limiting par utilisateur (fenêtre glissante 1 heure, en mémoire)
 * - Journalisation sans secrets
 * - Protection contre les appels abusifs (taille prompt, rate limiting)
 *
 * Variables d'environnement (Supabase Dashboard > Settings > Secrets) :
 * - GEMINI_API_KEY : clé API Google Gemini (fournisseur principal)
 * - NVIDIA_API_KEY : clé API NVIDIA NIM (fournisseur de secours)
 * - OPENCODE_API_KEY : clé OpenCode Console (optionnel)
 * - AI_MAX_REQUESTS_PER_USER_PER_HOUR : limite de requêtes (défaut 100)
 * - AI_MAX_TOKENS_PER_REQUEST : max tokens par requête (défaut 2000)
 * - SUPABASE_URL : URL du projet Supabase (fourni automatiquement)
 * - SUPABASE_ANON_KEY : clé anon du projet (fourni automatiquement)
 *
 * Rôles requis :
 * - Tout utilisateur authentifié : génération texte (fournisseur local de secours)
 * - admin / superadmin : génération via fournisseurs externes (Gemini, NVIDIA)
 *
 * Non déployé sans autorisation spécifique.
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://dar-maroc.github.io',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, idempotency-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

interface AiRequest {
  provider?: 'gemini' | 'nvidia' | 'opencode' | 'auto';
  model?: string;
  capability?: 'text' | 'vision' | 'image' | 'reasoning' | 'multilingual';
  prompt: string;
  system?: string;
  temperature?: number;
  maxOutputTokens?: number;
  context?: Record<string, unknown> | null;
  idempotency_key?: string;
}

interface AiResponse {
  text: string;
  provider: string;
  model: string;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
  isFallback?: boolean;
  isCached?: boolean;
}

interface QuotaState {
  used: number;
  limit: number;
  resetAt: string | null;
  exhausted: boolean;
  lastError: string | null;
  lastCheck: string | null;
}

// ---------- Rate limiting en mémoire (fenêtre glissante 1 heure) ----------
// Réinitialisé à chaque cold start. En production, utiliser une table Supabase ou Redis.
const rateLimitMap = new Map<string, { timestamps: number[] }>();

function getRateLimitKey(userId: string | null): string {
  return userId || 'anonymous';
}

function checkRateLimit(key: string, limit: number): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 heure
  const entry = rateLimitMap.get(key) || { timestamps: [] };

  // Supprimer les timestamps hors de la fenêtre
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  if (entry.timestamps.length >= limit) {
    const oldest = Math.min(...entry.timestamps);
    return { allowed: false, remaining: 0, resetIn: oldest + windowMs - now };
  }

  entry.timestamps.push(now);
  rateLimitMap.set(key, entry);
  return { allowed: true, remaining: limit - entry.timestamps.length, resetIn: 0 };
}

// ---------- Vérification du rôle utilisateur ----------
async function getUserRole(
  supabaseClient: ReturnType<typeof createClient>,
  userId: string
): Promise<{ role: string | null; isAdmin: boolean; error: string | null }> {
  try {
    const { data, error } = await supabaseClient
      .from('admin_users')
      .select('role, actif')
      .eq('auth_id', userId) // auth_id lié à auth.users.id
      .single();

    if (error || !data) {
      // L'utilisateur n'est pas dans admin_users → rôle client par défaut
      return { role: 'client', isAdmin: false, error: null };
    }

    return {
      role: data.role || 'client',
      isAdmin: data.role === 'admin' || data.role === 'superadmin',
      error: data.actif === false ? 'Compte inactif' : null,
    };
  } catch (e) {
    return { role: null, isAdmin: false, error: e?.message || String(e) };
  }
}

// ---------- Vérification des capacités par rôle ----------
function canUseExternalProvider(role: string | null, isAdmin: boolean): boolean {
  // Seuls les admins peuvent utiliser les fournisseurs externes payants
  return isAdmin === true;
}

function canUseLocalFallback(role: string | null): boolean {
  // Tout utilisateur authentifié peut utiliser le fallback local
  return role !== null;
}

// ---------- Appel fournisseur Gemini ----------
async function callGemini(
  apiKey: string,
  model: string,
  prompt: string,
  system?: string,
  temperature = 0.7,
  maxOutputTokens = 500
): Promise<AiResponse> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const body: Record<string, unknown> = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature,
      maxOutputTokens: Math.min(maxOutputTokens, 2000),
    },
  };

  if (system) {
    (body as Record<string, unknown>).systemInstruction = {
      parts: [{ text: system }],
    };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (res.status === 429) {
    throw new Error('QUOTA_EXHAUSTED');
  }
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`GEMINI_HTTP_${res.status}: ${errorText.slice(0, 200)}`);
  }

  const data = await res.json();
  const text =
    data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || '').join('') ||
    '';

  return {
    text,
    provider: 'gemini',
    model,
    usage: data.usageMetadata
      ? {
          prompt_tokens: data.usageMetadata.promptTokenCount,
          completion_tokens: data.usageMetadata.candidatesTokenCount,
          total_tokens: data.usageMetadata.totalTokenCount,
        }
      : undefined,
  };
}

// ---------- Appel fournisseur NVIDIA NIM ----------
async function callNvidia(
  apiKey: string,
  model: string,
  prompt: string,
  system?: string,
  temperature = 0.7,
  maxOutputTokens = 500
): Promise<AiResponse> {
  const url = 'https://integrate.api.nvidia.com/v1/chat/completions';

  const messages: Array<{ role: string; content: string }> = [];
  if (system) messages.push({ role: 'system', content: system });
  messages.push({ role: 'user', content: prompt });

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: Math.min(maxOutputTokens, 4096),
      stream: false,
    }),
  });

  if (res.status === 429) {
    throw new Error('QUOTA_EXHAUSTED');
  }
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`NVIDIA_HTTP_${res.status}: ${errorText.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || '';

  return {
    text,
    provider: 'nvidia',
    model,
    usage: data.usage
      ? {
          prompt_tokens: data.usage.prompt_tokens,
          completion_tokens: data.usage.completion_tokens,
          total_tokens: data.usage.total_tokens,
        }
      : undefined,
  };
}

// ---------- Fournisseur local de secours (gratuit, aucune clé externe) ----------
function localFallback(prompt: string, system?: string): AiResponse {
  const lower = (prompt + ' ' + (system || '')).toLowerCase();
  let text = '[Mode local — générateur de secours]';

  if (/merci|thank|شكرا|شكراً/.test(lower)) {
    text = 'Avec plaisir ! Nous restons à votre disposition 😊';
  } else if (/horaire|heure|open|ساعات|مواعيد/.test(lower)) {
    text = '🕐 Nos horaires : Lundi – Samedi, 9h à 19h.\n📍 Av. Annarjis, Agadir, Maroc.';
  } else if (/prix|budget|tarif|combien|cost|price|سعر|ثمن/.test(lower)) {
    text = '💰 Nous pouvons vous proposer des biens selon votre budget. Dites-nous votre ville préférée !';
  } else if (/contact|join|tel|appel|whatsapp|email|mail|تواصل|اتصال|هاتف/.test(lower)) {
    text = '📲 Pour nous joindre :\n• WhatsApp : +33 7 72 20 88 85\n• Mobile : +212 665 310 308 / +212 667 090 303\n• Bureau : 05 25 26 14 86\n• Email : Dar.maroc4@gmail.com';
  } else if (/description|rédige|écris|write/.test(lower)) {
    text = '[Mode local — aperçu réutilisable]\n\n🏡 DarMaroc — Bien à Agadir\n✨ Clé en main, vue mer, proche plage.\n📲 Devis WhatsApp : lien DarMaroc\n\n#ImmobilierAgadir #DarMaroc #GestionLocative';
  } else if (/email|voyageur|arrivée|check-in/.test(lower)) {
    text = 'Objet : Votre arrivée DarMaroc\n\nBonjour,\n\nNous vous accueillons à [logement]. Check-in à partir de 15 h.\n\nContacts utiles : WhatsApp DarMaroc.\n\nCordialement,\nL\'équipe DarMaroc';
  } else {
    text += '\n\nRéponse préparée localement pour : "' + (prompt.slice(0, 100) || '(vide)') + '".\nConfigurez un fournisseur IA via les Edge Functions Supabase pour une génération enrichie.';
  }

  return {
    text,
    provider: 'local',
    model: 'local-keyword',
    usage: null,
    isFallback: true,
  };
}

// ---------- Journalisation (sans secrets) ----------
async function logAiEvent(
  supabaseClient: ReturnType<typeof createClient>,
  userId: string | null,
  provider: string,
  model: string,
  success: boolean,
  errorMessage: string | null,
  tokenCount: number | null
) {
  try {
    await supabaseClient.from('ai_agent_logs').insert({
      agent_id: 'ai-generate-edge',
      action: success ? 'generate_success' : 'generate_error',
      level: success ? 'info' : 'error',
      message: success
        ? `Génération IA réussie (${provider}/${model})`
        : `Erreur génération IA (${provider}/${model}): ${errorMessage}`,
      context: {
        provider,
        model,
        success,
        user_id: userId || null,
        token_count: tokenCount || null,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (e) {
    // Échec de journalisation ne doit pas bloquer la réponse
    console.error('Journalisation échouée:', e.message);
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
  let userId: string | null = null;
  let userRole: string | null = null;
  let isAdmin = false;
  let requestId: string | null = null;

  try {
    // ---------- Authentification Supabase (JWT) ----------
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authentification requise', code: 'AUTH_REQUIRED' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const jwt = authHeader.slice(7);
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';

    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Utilisateur non authentifié', code: 'AUTH_INVALID' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    userId = user.id;

    // ---------- Vérification du rôle ----------
    const roleInfo = await getUserRole(supabaseClient, userId);
    userRole = roleInfo.role;
    isAdmin = roleInfo.isAdmin === true;

    if (roleInfo.error) {
      return new Response(
        JSON.stringify({ error: roleInfo.error, code: 'ACCOUNT_INACTIVE' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ---------- Rate limiting ----------
    const rateLimit = Number(Deno.env.get('AI_MAX_REQUESTS_PER_USER_PER_HOUR') || '100');
    const rl = checkRateLimit(getRateLimitKey(userId), rateLimit);
    if (!rl.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Limite de requêtes atteinte',
          code: 'RATE_LIMIT_EXCEEDED',
          remaining: 0,
          resetIn: rl.resetIn,
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ---------- Parsing du corps ----------
    const body: AiRequest = await req.json();
    if (!body.prompt || typeof body.prompt !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Champ "prompt" requis', code: 'MISSING_PROMPT' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Protection contre les appels abusifs (taille du payload)
    if (body.prompt.length > 10000) {
      return new Response(
        JSON.stringify({ error: 'Prompt trop long (max 10 000 caractères)', code: 'PROMPT_TOO_LONG' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const maxTokens = Number(Deno.env.get('AI_MAX_TOKENS_PER_REQUEST') || '2000');
    const maxOutputTokens = Math.min(Number(body.maxOutputTokens) || 500, maxTokens);

    requestId = body.idempotency_key || crypto.randomUUID();

    // ---------- Vérification idempotence ----------
    if (body.idempotency_key) {
      try {
        const { data: existing } = await supabaseClient
          .from('ai_missions')
          .select('id, status, result')
          .eq('idempotency_key', body.idempotency_key)
          .single();
        if (existing && existing.status === 'executed' && existing.result) {
          return new Response(
            JSON.stringify({
              text: (existing.result as { text?: string }).text || '',
              provider: 'cached',
              model: 'cached',
              usage: null,
              isCached: true,
              idempotency_key: requestId,
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } catch (e) {
        // Table peut ne pas exister encore, ignorer
      }
    }

    // ---------- Sélection des fournisseurs ----------
    const geminiKey = Deno.env.get('GEMINI_API_KEY') || '';
    const nvidiaKey = Deno.env.get('NVIDIA_API_KEY') || '';

    const requestedProvider = body.provider || 'auto';
    const capability = body.capability || 'text';

    let result: AiResponse | null = null;
    let lastError: string | null = null;

    const tryProvider = async (
      name: 'gemini' | 'nvidia' | 'local'
    ): Promise<AiResponse> => {
      if (name === 'gemini') {
        if (!geminiKey) throw new Error('GEMINI_NOT_CONFIGURED');
        if (!canUseExternalProvider(userRole, isAdmin)) {
          throw new Error('ROLE_NOT_AUTHORIZED');
        }
        return callGemini(
          geminiKey,
          body.model || 'gemini-2.0-flash',
          body.prompt,
          body.system,
          body.temperature,
          maxOutputTokens
        );
      }
      if (name === 'nvidia') {
        if (!nvidiaKey) throw new Error('NVIDIA_NOT_CONFIGURED');
        if (!canUseExternalProvider(userRole, isAdmin)) {
          throw new Error('ROLE_NOT_AUTHORIZED');
        }
        return callNvidia(
          nvidiaKey,
          body.model || 'nvidia/nemotron-3.5-super-vl-120b-a12b',
          body.prompt,
          body.system,
          body.temperature,
          maxOutputTokens
        );
      }
      if (!canUseLocalFallback(userRole)) {
        throw new Error('LOCAL_NOT_AUTHORIZED');
      }
      return localFallback(body.prompt, body.system);
    };

    // Ordre de tentative selon la demande
    const order: Array<'gemini' | 'nvidia' | 'local'> = [];
    if (requestedProvider === 'gemini') order.push('gemini', 'nvidia', 'local');
    else if (requestedProvider === 'nvidia') order.push('nvidia', 'gemini', 'local');
    else if (requestedProvider === 'local') order.push('local');
    else order.push('gemini', 'nvidia', 'local'); // auto

    for (const provider of order) {
      try {
        result = await tryProvider(provider);
        lastError = null;
        break;
      } catch (err: any) {
        lastError = err?.message || String(err);
        console.error(`Fournisseur ${provider} échoué:`, lastError);
        continue;
      }
    }

    if (!result) {
      // Tous les fournisseurs externes ont échoué → dernier recours local
      if (canUseLocalFallback(userRole)) {
        result = localFallback(body.prompt, body.system);
      } else {
        throw new Error('NO_AUTHORIZED_PROVIDER');
      }
      lastError = lastError || 'Tous les fournisseurs externes indisponibles';
    }

    // ---------- Journalisation ----------
    await logAiEvent(
      supabaseClient,
      userId,
      result.provider,
      result.model,
      !result.isFallback,
      lastError,
      result.usage?.total_tokens || null
    );

    return new Response(
      JSON.stringify({
        text: result.text,
        provider: result.provider,
        model: result.model,
        usage: result.usage,
        isFallback: result.isFallback || false,
        isCached: result.isCached || false,
        idempotency_key: requestId,
        warning: lastError ? `Fournisseur de secours utilisé (dernière erreur: ${lastError})` : null,
        user_role: userRole,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    // Journaliser l'erreur sans exposer de secrets
    try {
      if (supabaseClient && userId) {
        await supabaseClient.from('ai_agent_logs').insert({
          agent_id: 'ai-generate-edge',
          action: 'generate_error',
          level: 'error',
          message: `Erreur interne: ${err?.message || String(err)}`,
          context: { user_id: userId, timestamp: new Date().toISOString() },
        });
      }
    } catch {
      // Ignorer
    }

    return new Response(
      JSON.stringify({ error: 'Erreur interne du serveur IA', code: 'INTERNAL_ERROR' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
