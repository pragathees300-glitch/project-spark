-- =============================================
-- MORE MISSING TABLES AND COLUMNS
-- =============================================

-- Add more columns to kyc_submissions
ALTER TABLE public.kyc_submissions ADD COLUMN IF NOT EXISTS pan_document_url TEXT;
ALTER TABLE public.kyc_submissions ADD COLUMN IF NOT EXISTS face_image_url TEXT;
ALTER TABLE public.kyc_submissions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Add column to agent_chat_presence
ALTER TABLE public.agent_chat_presence ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create indian_names table (for relation with chat_customer_names)
CREATE TABLE IF NOT EXISTS public.indian_names_list (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  gender TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.indian_names_list ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Indian names list viewable by authenticated" ON public.indian_names_list FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage indian names list" ON public.indian_names_list FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  user_id UUID,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Authenticated can insert audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- Create branding_settings table
CREATE TABLE IF NOT EXISTS public.branding_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  updated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.branding_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Branding settings viewable by everyone" ON public.branding_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage branding settings" ON public.branding_settings FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Create get_assigned_agent_name function
CREATE OR REPLACE FUNCTION public.get_assigned_agent_name(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_agent_name TEXT;
BEGIN
  SELECT agent_name INTO v_agent_name
  FROM public.support_agent_presence
  WHERE user_id = (
    SELECT assigned_agent_id FROM public.chat_sessions WHERE user_id = p_user_id
  );
  RETURN COALESCE(v_agent_name, 'Support Agent');
END;
$$ LANGUAGE plpgsql SET search_path = public SECURITY DEFINER;

-- Create email_mfa_codes table
CREATE TABLE IF NOT EXISTS public.email_mfa_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.email_mfa_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own codes" ON public.email_mfa_codes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create codes" ON public.email_mfa_codes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own codes" ON public.email_mfa_codes FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Create chat_ratings table
CREATE TABLE IF NOT EXISTS public.chat_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own ratings" ON public.chat_ratings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create ratings" ON public.chat_ratings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all ratings" ON public.chat_ratings FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Add missing columns to chat_messages
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Create pending_payment_blocks table
CREATE TABLE IF NOT EXISTS public.pending_payment_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  blocked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reason TEXT,
  blocked_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pending_payment_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own blocks" ON public.pending_payment_blocks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage blocks" ON public.pending_payment_blocks FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Create storefront_settings table
CREATE TABLE IF NOT EXISTS public.storefront_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.storefront_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Storefront settings viewable by everyone" ON public.storefront_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage storefront settings" ON public.storefront_settings FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Create payment_method_icons table
CREATE TABLE IF NOT EXISTS public.payment_method_icons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  icon_url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_method_icons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Payment icons viewable by everyone" ON public.payment_method_icons FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage payment icons" ON public.payment_method_icons FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Create chat_reassignment_settings table
CREATE TABLE IF NOT EXISTS public.chat_reassignment_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_reassignment_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Chat reassignment settings viewable by authenticated" ON public.chat_reassignment_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage chat reassignment settings" ON public.chat_reassignment_settings FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);