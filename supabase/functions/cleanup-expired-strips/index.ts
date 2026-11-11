import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cleanup-secret',
  'Content-Type': 'application/json',
}

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: corsHeaders,
    })
  }

  const cleanupSecret = Deno.env.get('CLEANUP_SECRET')
  const bearerToken = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  const headerSecret = request.headers.get('x-cleanup-secret')

  if (!cleanupSecret || (bearerToken !== cleanupSecret && headerSecret !== cleanupSecret)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: corsHeaders,
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'Storage service is not configured' }), {
      status: 500,
      headers: corsHeaders,
    })
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: expired, error: queryError } = await supabase
    .from('sessions')
    .select('id,file_path')
    .lte('expires_at', new Date().toISOString())
    .limit(500)

  if (queryError) {
    return new Response(JSON.stringify({ error: queryError.message }), {
      status: 500,
      headers: corsHeaders,
    })
  }

  if (!expired?.length) {
    return new Response(JSON.stringify({ deleted: 0 }), { headers: corsHeaders })
  }

  const paths = expired.map((session) => session.file_path)
  const { error: storageError } = await supabase.storage.from('strips').remove(paths)

  if (storageError) {
    return new Response(JSON.stringify({ error: storageError.message }), {
      status: 500,
      headers: corsHeaders,
    })
  }

  const ids = expired.map((session) => session.id)
  const { error: deleteError } = await supabase.from('sessions').delete().in('id', ids)

  if (deleteError) {
    return new Response(JSON.stringify({ error: deleteError.message }), {
      status: 500,
      headers: corsHeaders,
    })
  }

  return new Response(JSON.stringify({ deleted: expired.length }), { headers: corsHeaders })
})
