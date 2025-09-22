-- Create fichas_tecnicas table
CREATE TABLE public.fichas_tecnicas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_ftc TEXT NOT NULL,
  data_criacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  data_ultima_edicao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'finalizada')),
  
  -- Client data
  cliente TEXT NOT NULL,
  solicitante TEXT NOT NULL,
  contato TEXT,
  data_visita TEXT,
  data_entrega TEXT,
  
  -- Piece data
  nome_peca TEXT NOT NULL,
  quantidade TEXT NOT NULL,
  servico TEXT NOT NULL,
  
  -- Execution details
  tipo_execucao TEXT DEFAULT 'INTERNA',
  visita_tecnica TEXT DEFAULT 'NAO',
  peca_amostra TEXT DEFAULT 'NAO',
  origem_projeto TEXT DEFAULT 'CLIENTE',
  desenho_finalizado TEXT DEFAULT 'NAO',
  transporte TEXT DEFAULT 'CLIENTE',
  
  -- Treatments
  pintura TEXT DEFAULT 'NAO',
  galvanizacao TEXT DEFAULT 'NAO',
  tratamento_termico TEXT DEFAULT 'NAO',
  dureza TEXT,
  ensaio_lp TEXT DEFAULT 'NAO',
  solda TEXT DEFAULT 'NAO',
  usinagem TEXT DEFAULT 'NAO',
  
  -- Service hours
  horas_torno DECIMAL(10,2) DEFAULT 0,
  horas_fresa DECIMAL(10,2) DEFAULT 0,
  horas_furadeira DECIMAL(10,2) DEFAULT 0,
  horas_solda DECIMAL(10,2) DEFAULT 0,
  horas_pintura DECIMAL(10,2) DEFAULT 0,
  horas_montagem DECIMAL(10,2) DEFAULT 0,
  horas_outros DECIMAL(10,2) DEFAULT 0,
  
  -- Control numbers
  numero_orcamento TEXT,
  numero_os TEXT,
  numero_nf TEXT,
  
  -- Calculated totals
  total_horas_servico DECIMAL(10,2) DEFAULT 0,
  total_material_peca DECIMAL(10,2) DEFAULT 0,
  total_material_todas_pecas DECIMAL(10,2) DEFAULT 0,
  
  UNIQUE(numero_ftc)
);

-- Create materiais table
CREATE TABLE public.materiais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ficha_id UUID NOT NULL REFERENCES public.fichas_tecnicas(id) ON DELETE CASCADE,
  ordem INTEGER NOT NULL,
  descricao TEXT NOT NULL,
  quantidade TEXT NOT NULL,
  unidade TEXT DEFAULT 'UN',
  valor_unitario DECIMAL(10,2) NOT NULL DEFAULT 0,
  fornecedor TEXT,
  cliente_interno TEXT,
  valor_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create fotos table for metadata
CREATE TABLE public.fotos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ficha_id UUID NOT NULL REFERENCES public.fichas_tecnicas(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  size INTEGER NOT NULL,
  type TEXT NOT NULL DEFAULT 'image/jpeg',
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.fichas_tecnicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materiais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fotos ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since no auth is implemented yet)
CREATE POLICY "Allow all access to fichas_tecnicas" ON public.fichas_tecnicas FOR ALL USING (true);
CREATE POLICY "Allow all access to materiais" ON public.materiais FOR ALL USING (true);
CREATE POLICY "Allow all access to fotos" ON public.fotos FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX idx_fichas_tecnicas_numero_ftc ON public.fichas_tecnicas(numero_ftc);
CREATE INDEX idx_fichas_tecnicas_cliente ON public.fichas_tecnicas(cliente);
CREATE INDEX idx_fichas_tecnicas_data_criacao ON public.fichas_tecnicas(data_criacao);
CREATE INDEX idx_materiais_ficha_id ON public.materiais(ficha_id);
CREATE INDEX idx_fotos_ficha_id ON public.fotos(ficha_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.data_ultima_edicao = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_fichas_tecnicas_updated_at
  BEFORE UPDATE ON public.fichas_tecnicas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();