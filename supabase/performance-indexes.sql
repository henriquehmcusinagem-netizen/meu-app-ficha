-- Performance Indexes for Production
-- Execute these commands in Supabase SQL Editor

-- Index for status filtering (most common query)
CREATE INDEX IF NOT EXISTS idx_fichas_status
ON fichas_tecnicas(status);

-- Index for last edit date ordering (used in ConsultarFichas)
CREATE INDEX IF NOT EXISTS idx_fichas_data_ultima_edicao
ON fichas_tecnicas(data_ultima_edicao DESC);

-- Index for FTC number search
CREATE INDEX IF NOT EXISTS idx_fichas_numero_ftc
ON fichas_tecnicas(numero_ftc);

-- Index for client search
CREATE INDEX IF NOT EXISTS idx_fichas_cliente
ON fichas_tecnicas(cliente);

-- Composite index for status + date queries (common filter combination)
CREATE INDEX IF NOT EXISTS idx_fichas_status_data
ON fichas_tecnicas(status, data_ultima_edicao DESC);

-- Index for creation date
CREATE INDEX IF NOT EXISTS idx_fichas_data_criacao
ON fichas_tecnicas(data_criacao DESC);

-- Index for materials by ficha_id (foreign key optimization)
CREATE INDEX IF NOT EXISTS idx_materiais_ficha_id
ON materiais(ficha_id);

-- Index for photos by ficha_id (foreign key optimization)
CREATE INDEX IF NOT EXISTS idx_fotos_ficha_id
ON fotos(ficha_id);

-- Clean up duplicate storage policies (from migration analysis)
DROP POLICY IF EXISTS "ficha-fotos_auth_upload_4" ON storage.objects;
DROP POLICY IF EXISTS "ficha-fotos_auth_delete_2" ON storage.objects;

-- Add comment for tracking
COMMENT ON INDEX idx_fichas_status IS 'Performance index for status filtering - Production optimization';
COMMENT ON INDEX idx_fichas_data_ultima_edicao IS 'Performance index for date ordering - Production optimization';
COMMENT ON INDEX idx_fichas_numero_ftc IS 'Performance index for FTC number search - Production optimization';