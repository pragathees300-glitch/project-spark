-- =============================================
-- ADDITIONAL COLUMNS AND TABLES REQUIRED BY CODE
-- =============================================

-- Fix function search paths
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number = 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code = UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add missing columns to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS postpaid_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS postpaid_used DECIMAL(12,2) DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS postpaid_credit_limit DECIMAL(12,2) DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS postpaid_due_date DATE;

-- Add missing columns to support_agent_presence
ALTER TABLE public.support_agent_presence ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false;

-- Add missing columns to popup_messages
ALTER TABLE public.popup_messages ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE public.popup_messages ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'info';
ALTER TABLE public.popup_messages ADD COLUMN IF NOT EXISTS target_type TEXT DEFAULT 'all';
ALTER TABLE public.popup_messages ADD COLUMN IF NOT EXISTS target_roles TEXT[];
ALTER TABLE public.popup_messages ADD COLUMN IF NOT EXISTS target_user_ids UUID[];
ALTER TABLE public.popup_messages ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.popup_messages ADD COLUMN IF NOT EXISTS re_acknowledgment_mode TEXT DEFAULT 'never';
ALTER TABLE public.popup_messages ADD COLUMN IF NOT EXISTS re_ack_period_days INTEGER;
ALTER TABLE public.popup_messages ADD COLUMN IF NOT EXISTS starts_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.popup_messages ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.popup_messages ADD COLUMN IF NOT EXISTS acknowledgment_count INTEGER DEFAULT 0;
ALTER TABLE public.popup_messages ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0;
ALTER TABLE public.popup_messages ADD COLUMN IF NOT EXISTS show_once_per_session BOOLEAN DEFAULT false;
ALTER TABLE public.popup_messages ADD COLUMN IF NOT EXISTS require_acknowledgment BOOLEAN DEFAULT false;

-- Create postpaid_transactions table
CREATE TABLE IF NOT EXISTS public.postpaid_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('credit', 'debit', 'payment', 'adjustment')),
  description TEXT,
  reference_id UUID,
  balance_after DECIMAL(12,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.postpaid_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own postpaid transactions" ON public.postpaid_transactions 
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage postpaid transactions" ON public.postpaid_transactions 
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Create popup_acknowledgments table
CREATE TABLE IF NOT EXISTS public.popup_acknowledgments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  popup_id UUID NOT NULL REFERENCES public.popup_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  acknowledged_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(popup_id, user_id)
);

ALTER TABLE public.popup_acknowledgments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own acknowledgments" ON public.popup_acknowledgments 
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert acknowledgments" ON public.popup_acknowledgments 
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all acknowledgments" ON public.popup_acknowledgments 
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Add storage bucket for uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('products', 'products', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('kyc', 'kyc', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('proofs', 'proofs', false) ON CONFLICT (id) DO NOTHING;

-- Storage policies for uploads bucket
CREATE POLICY "Uploads are viewable by everyone" ON storage.objects FOR SELECT USING (bucket_id = 'uploads');
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'uploads');
CREATE POLICY "Users can update own uploads" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own uploads" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for avatars bucket
CREATE POLICY "Avatars are viewable by everyone" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload avatars" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');

-- Storage policies for products bucket
CREATE POLICY "Products are viewable by everyone" ON storage.objects FOR SELECT USING (bucket_id = 'products');
CREATE POLICY "Admins can upload products" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'products' AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Storage policies for kyc bucket
CREATE POLICY "Users can view own kyc docs" ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'kyc' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can upload kyc docs" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'kyc' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Admins can view all kyc docs" ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'kyc' AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Storage policies for proofs bucket
CREATE POLICY "Users can view own proofs" ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'proofs' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can upload proofs" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'proofs' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Admins can view all proofs" ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'proofs' AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);