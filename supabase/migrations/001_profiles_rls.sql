-- ================================================================
-- Painel de Gestao Paliativa — Schema de autenticacao
-- Executar no Supabase SQL Editor (Dashboard > SQL Editor)
-- ================================================================

-- 1. Tabela profiles
CREATE TABLE public.profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT NOT NULL,
  nome       TEXT NOT NULL DEFAULT '',
  role       TEXT NOT NULL DEFAULT 'guardiao' CHECK (role IN ('lider', 'guardiao')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_email ON public.profiles(email);

-- 2. Habilitar Row-Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Politicas RLS

-- SELECT: qualquer autenticado pode ler todos os profiles
CREATE POLICY "profiles_select_authenticated"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: somente Lideres podem criar profiles
CREATE POLICY "profiles_insert_lider_only"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'lider'
    )
  );

-- UPDATE: Lider edita qualquer; usuario edita so o proprio (sem mudar role)
CREATE POLICY "profiles_update_lider_or_self"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'lider'
    )
  )
  WITH CHECK (
    -- Self-update: nao pode mudar o proprio role
    (id = auth.uid() AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()))
    OR
    -- Lider update: pode mudar tudo
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'lider'
    )
  );

-- DELETE: somente Lideres, e nao podem deletar a si mesmos
CREATE POLICY "profiles_delete_lider_only"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (
    id != auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'lider'
    )
  );

-- 4. Trigger: auto-cria profile quando usuario e criado no auth
--    O primeiro usuario vira Lider automaticamente (bootstrap)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles LIMIT 1) THEN
    -- Primeiro usuario = Lider (bootstrap)
    INSERT INTO public.profiles (id, email, nome, role, created_by)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'nome', ''),
      'lider',
      NEW.id
    );
  ELSE
    -- Usuarios subsequentes recebem role dos metadados
    INSERT INTO public.profiles (id, email, nome, role, created_by)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'nome', ''),
      COALESCE(NEW.raw_user_meta_data->>'role', 'guardiao'),
      (NEW.raw_user_meta_data->>'created_by')::UUID
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
