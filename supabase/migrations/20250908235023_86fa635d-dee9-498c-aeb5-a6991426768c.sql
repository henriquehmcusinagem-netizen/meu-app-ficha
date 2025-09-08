-- Criar tabela para usuários autorizados
CREATE TABLE public.usuarios_autorizados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telefone TEXT UNIQUE,
  email TEXT UNIQUE,
  nome TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CHECK (telefone IS NOT NULL OR email IS NOT NULL)
);

-- Habilitar RLS
ALTER TABLE public.usuarios_autorizados ENABLE ROW LEVEL SECURITY;

-- Política: apenas usuários autenticados podem ver a lista
CREATE POLICY "Authenticated users can view authorized users" 
ON public.usuarios_autorizados 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Adicionar colunas de auditoria às tabelas existentes
ALTER TABLE public.fichas_tecnicas 
ADD COLUMN IF NOT EXISTS criado_por UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS editado_por UUID REFERENCES auth.users(id);

ALTER TABLE public.materiais 
ADD COLUMN IF NOT EXISTS criado_por UUID REFERENCES auth.users(id);

ALTER TABLE public.fotos 
ADD COLUMN IF NOT EXISTS criado_por UUID REFERENCES auth.users(id);

-- Atualizar RLS policies para "authenticated users only" ao invés de "allow all"
DROP POLICY IF EXISTS "Allow all access to fichas_tecnicas" ON public.fichas_tecnicas;
DROP POLICY IF EXISTS "Allow all access to materiais" ON public.materiais;  
DROP POLICY IF EXISTS "Allow all access to fotos" ON public.fotos;

-- Novas policies: apenas usuários autenticados
CREATE POLICY "Authenticated users can access fichas_tecnicas" 
ON public.fichas_tecnicas 
FOR ALL 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can access materiais" 
ON public.materiais 
FOR ALL 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can access fotos" 
ON public.fotos 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Inserir alguns usuários autorizados de exemplo
INSERT INTO public.usuarios_autorizados (telefone, email, nome) VALUES
('+5511999999999', 'admin@empresa.com', 'Administrador Sistema'),
('+5511888888888', 'usuario@empresa.com', 'Usuário Teste');

-- Função para verificar se usuário está autorizado
CREATE OR REPLACE FUNCTION public.is_user_authorized(user_phone TEXT DEFAULT NULL, user_email TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;