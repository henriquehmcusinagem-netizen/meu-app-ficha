-- Corrigir função para ter search_path seguro
DROP FUNCTION IF EXISTS public.is_user_authorized(TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.is_user_authorized(user_phone TEXT DEFAULT NULL, user_email TEXT DEFAULT NULL)
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER 
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.usuarios_autorizados 
    WHERE ativo = true 
    AND (
      (user_phone IS NOT NULL AND telefone = user_phone) OR
      (user_email IS NOT NULL AND email = user_email)
    )
  );
END;
$$;