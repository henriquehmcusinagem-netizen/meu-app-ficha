import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

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
    console.log('Starting password reset process...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Create admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const usersToReset = [
      'contato@hmcusinagem.com.br',
      'compras@hmcusinagem.com.br', 
      'producao@hmcusinagem.com.br'
    ];

    const newPassword = '@hmc402';
    const results = [];

    // Reset password for each user
    for (const email of usersToReset) {
      console.log(`Resetting password for: ${email}`);
      
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
        // First get user by email to get their ID
        (await supabaseAdmin.auth.admin.listUsers()).data.users.find(u => u.email === email)?.id || '',
        { 
          password: newPassword,
          email_confirm: true // Ensure email is confirmed
        }
      );

      if (error) {
        console.error(`Error resetting password for ${email}:`, error);
        results.push({ email, success: false, error: error.message });
      } else {
        console.log(`Successfully reset password for ${email}`);
        results.push({ email, success: true });
      }
    }

    // Alternative approach: Update by email directly
    const resetResults = [];
    
    for (const email of usersToReset) {
      console.log(`Alternative reset for: ${email}`);
      
      // Get all users and find by email
      const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (listError) {
        console.error('Error listing users:', listError);
        continue;
      }

      const user = users.users.find(u => u.email === email);
      
      if (!user) {
        console.log(`User ${email} not found`);
        resetResults.push({ email, success: false, error: 'User not found' });
        continue;
      }

      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        { 
          password: newPassword,
          email_confirm: true
        }
      );

      if (error) {
        console.error(`Error updating ${email}:`, error);
        resetResults.push({ email, success: false, error: error.message });
      } else {
        console.log(`Successfully updated password for ${email}`);
        resetResults.push({ email, success: true, userId: user.id });
      }
    }

    console.log('Password reset process completed');

    return new Response(JSON.stringify({ 
      message: 'Password reset process completed',
      results: resetResults,
      newPassword: newPassword
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('Error in reset-user-passwords function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      message: 'Failed to reset passwords'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});