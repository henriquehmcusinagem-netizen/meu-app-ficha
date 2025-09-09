-- Remove function is_user_authorized
DROP FUNCTION IF EXISTS public.is_user_authorized(text, text);

-- Remove table usuarios_autorizados
DROP TABLE IF EXISTS public.usuarios_autorizados;