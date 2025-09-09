import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { action, email, newPassword } = await req.json();
    console.log(`Admin auth action: ${action} for email: ${email}`);

    if (action === 'list-users') {
      // List all users in Supabase Auth
      const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();
      
      if (error) {
        console.error('Error listing users:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log(`Found ${users.users.length} users in Supabase Auth`);
      
      return new Response(JSON.stringify({ 
        users: users.users.map(user => ({
          id: user.id,
          email: user.email,
          created_at: user.created_at,
          email_confirmed_at: user.email_confirmed_at,
          last_sign_in_at: user.last_sign_in_at
        }))
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'reset-password' && email && newPassword) {
      // Reset user password
      const { data: users } = await supabaseAdmin.auth.admin.listUsers();
      const user = users.users.find(u => u.email === email);
      
      if (!user) {
        return new Response(JSON.stringify({ error: 'User not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        { password: newPassword }
      );

      if (error) {
        console.error(`Error resetting password for ${email}:`, error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log(`Password reset successfully for ${email}`);
      return new Response(JSON.stringify({ 
        success: true,
        message: `Password reset for ${email}`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'check-authorization' && email) {
      // Check if user is in authorized users table
      const { data, error } = await supabaseAdmin.rpc('is_user_authorized', {
        user_phone: null,
        user_email: email
      });
      
      if (error) {
        console.error(`Error checking authorization for ${email}:`, error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log(`Authorization check for ${email}: ${data}`);
      return new Response(JSON.stringify({ 
        authorized: data,
        email: email
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'test-login' && email && newPassword) {
      // Test login with provided credentials
      const supabaseTest = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? ''
      );

      // First check if user is authorized
      const { data: authCheck } = await supabaseAdmin.rpc('is_user_authorized', {
        user_phone: null,
        user_email: email
      });

      console.log(`Authorization check for ${email}: ${authCheck}`);

      if (!authCheck) {
        return new Response(JSON.stringify({ 
          success: false,
          error: 'Email not authorized'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Try to sign in
      const { data, error } = await supabaseTest.auth.signInWithPassword({
        email,
        password: newPassword
      });

      if (error) {
        console.error(`Login test failed for ${email}:`, error);
        return new Response(JSON.stringify({ 
          success: false,
          error: error.message
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log(`Login test successful for ${email}`);
      return new Response(JSON.stringify({ 
        success: true,
        user: {
          id: data.user?.id,
          email: data.user?.email
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in admin-auth function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});