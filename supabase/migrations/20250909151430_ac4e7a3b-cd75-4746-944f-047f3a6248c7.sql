-- Criar bucket de storage para fotos das fichas técnicas
INSERT INTO storage.buckets (id, name, public) VALUES ('ficha-fotos', 'ficha-fotos', true);

-- Políticas RLS para o bucket ficha-fotos
CREATE POLICY "Authenticated users can view ficha photos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'ficha-fotos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can upload ficha photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'ficha-fotos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update their ficha photos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'ficha-fotos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete their ficha photos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'ficha-fotos' AND auth.uid() IS NOT NULL);