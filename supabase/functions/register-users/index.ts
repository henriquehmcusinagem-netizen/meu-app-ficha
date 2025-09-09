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
    // Initialize Supabase Admin client
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

    const users = [
      'contato@hmcusinagem.com.br',
      'compras@hmcusinagem.com.br', 
      'producao@hmcusinagem.com.br'
    ];

    const password = '@Hmcusinagem402';
    const results = [];

    console.log('Starting user registration process...');

    for (const email of users) {
      console.log(`Processing user: ${email}`);
      
      // Check if user already exists by listing users and filtering by email
      const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (listError) {
        console.error(`Error listing users:`, listError);
        results.push({
          email,
          status: 'error',
          message: `Error checking existing users: ${listError.message}`
        });
        continue;
      }
      
      const userExists = existingUsers.users.some(user => user.email === email);
      
      if (userExists) {
        console.log(`User ${email} already exists, skipping...`);
        results.push({
          email,
          status: 'exists',
          message: 'User already exists'
        });
        continue;
      }

      // Create new user
      const { data: newUser, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          created_by: 'admin'
        }
      });

      if (error) {
        console.error(`Error creating user ${email}:`, error);
        results.push({
          email,
          status: 'error',
          message: error.message
        });
      } else {
        console.log(`User ${email} created successfully`);
        results.push({
          email,
          status: 'created',
          message: 'User created successfully',
          userId: newUser.user?.id
        });
      }
    }

    console.log('Registration process completed:', results);

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in register-users function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});