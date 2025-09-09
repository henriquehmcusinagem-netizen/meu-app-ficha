-- Add all missing columns to fichas_tecnicas table
ALTER TABLE public.fichas_tecnicas 
ADD COLUMN IF NOT EXISTS cor_pintura TEXT,
ADD COLUMN IF NOT EXISTS peso_peca_galv TEXT,
ADD COLUMN IF NOT EXISTS tempera_reven TEXT,
ADD COLUMN IF NOT EXISTS torno_grande NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS torno_pequeno NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS cnc_tf NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS fresa_furad NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS plasma_oxicorte NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS dobra NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS calandra NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS macarico_solda NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS des_montg NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS balanceamento NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS mandrilhamento NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS tratamento NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS pintura_horas NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS lavagem_acab NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS programacao_cam NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS eng_tec NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS desenho TEXT,
ADD COLUMN IF NOT EXISTS observacoes TEXT,
ADD COLUMN IF NOT EXISTS descricao_geral TEXT,
ADD COLUMN IF NOT EXISTS material_base TEXT,
ADD COLUMN IF NOT EXISTS dimensoes TEXT,
ADD COLUMN IF NOT EXISTS tolerancia TEXT,
ADD COLUMN IF NOT EXISTS acabamento_superficie TEXT,
ADD COLUMN IF NOT EXISTS norma_aplicavel TEXT,
ADD COLUMN IF NOT EXISTS certificacao TEXT,
ADD COLUMN IF NOT EXISTS condicoes_especiais TEXT;

-- Create storage bucket for ficha photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('ficha-fotos', 'ficha-fotos', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for the ficha-fotos bucket
CREATE POLICY "Authenticated users can view ficha photos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'ficha-fotos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can upload ficha photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'ficha-fotos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update ficha photos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'ficha-fotos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete ficha photos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'ficha-fotos' AND auth.uid() IS NOT NULL);

-- Add storage_path column to fotos table to store the path in Supabase Storage
ALTER TABLE public.fotos 
ADD COLUMN IF NOT EXISTS storage_path TEXT;