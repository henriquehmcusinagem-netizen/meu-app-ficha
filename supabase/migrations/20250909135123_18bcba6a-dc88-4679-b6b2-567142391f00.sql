-- Create function to generate next FTC number based on database records
CREATE OR REPLACE FUNCTION public.get_next_ftc_number() 
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_year TEXT;
  last_number INTEGER;
  next_number INTEGER;
  ftc_number TEXT;
BEGIN
  -- Get current year
  current_year := EXTRACT(YEAR FROM NOW())::TEXT;
  
  -- Find the last FTC number for the current year
  SELECT COALESCE(
    MAX(
      CASE 
        WHEN numero_ftc ~ ('^' || current_year || '[0-9]{3}$') 
        THEN CAST(SUBSTRING(numero_ftc FROM 5) AS INTEGER)
        ELSE 0
      END
    ), 0
  ) INTO last_number
  FROM fichas_tecnicas
  WHERE numero_ftc LIKE current_year || '%';
  
  -- Calculate next number
  next_number := last_number + 1;
  
  -- Format as YYYY###
  ftc_number := current_year || LPAD(next_number::TEXT, 3, '0');
  
  -- Double check that this number doesn't exist (race condition protection)
  IF EXISTS (SELECT 1 FROM fichas_tecnicas WHERE numero_ftc = ftc_number) THEN
    -- If it exists, try the next number
    next_number := next_number + 1;
    ftc_number := current_year || LPAD(next_number::TEXT, 3, '0');
  END IF;
  
  RETURN ftc_number;
END;
$$;