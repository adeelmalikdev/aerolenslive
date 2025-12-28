import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify the requesting user is an admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Attempting to verify user with token length:', token.length);
    
    const { data: { user: requestingUser }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !requestingUser) {
      console.error('Failed to get requesting user:', userError?.message || 'No user returned');
      return new Response(JSON.stringify({ error: 'Unauthorized', details: userError?.message }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Verified user:', requestingUser.id, requestingUser.email);

    // Check if requesting user is admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', requestingUser.id)
      .eq('role', 'admin')
      .maybeSingle();

    console.log('Role check result:', { roleData, roleError: roleError?.message });

    if (roleError || !roleData) {
      console.error('User is not an admin:', roleError);
      return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Fetching all users for admin:', requestingUser.id);

    // Get all users from auth
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('Failed to list users:', listError);
      throw listError;
    }

    // Get all profiles
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('*');

    if (profilesError) {
      console.error('Failed to fetch profiles:', profilesError);
    }

    // Get all user roles
    const { data: allRoles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('*');

    if (rolesError) {
      console.error('Failed to fetch roles:', rolesError);
    }

    // Combine user data with profiles and roles
    const enrichedUsers = users.map(user => {
      const profile = profiles?.find(p => p.user_id === user.id);
      const userRoles = allRoles?.filter(r => r.user_id === user.id).map(r => r.role) || [];
      
      return {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        full_name: profile?.full_name || user.user_metadata?.full_name || null,
        avatar_url: profile?.avatar_url || null,
        phone_number: profile?.phone_number || null,
        country_code: profile?.country_code || null,
        date_of_birth: profile?.date_of_birth || null,
        roles: userRoles,
        is_admin: userRoles.includes('admin'),
      };
    });

    console.log(`Found ${enrichedUsers.length} users`);

    return new Response(JSON.stringify({ users: enrichedUsers }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in admin-list-users:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});