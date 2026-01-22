-- =============================================
-- FINAL MISSING COLUMNS AND TABLES
-- =============================================

-- Add more columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS allow_payout_with_dues BOOLEAN DEFAULT false;

-- Add columns to wallet_transactions
ALTER TABLE public.wallet_transactions ADD COLUMN IF NOT EXISTS order_id UUID;

-- Add columns to kyc_submissions
ALTER TABLE public.kyc_submissions ADD COLUMN IF NOT EXISTS aadhaar_number TEXT;
ALTER TABLE public.kyc_submissions ADD COLUMN IF NOT EXISTS pan_number TEXT;
ALTER TABLE public.kyc_submissions ADD COLUMN IF NOT EXISTS aadhaar_front_url TEXT;
ALTER TABLE public.kyc_submissions ADD COLUMN IF NOT EXISTS aadhaar_back_url TEXT;
ALTER TABLE public.kyc_submissions ADD COLUMN IF NOT EXISTS pan_url TEXT;
ALTER TABLE public.kyc_submissions ADD COLUMN IF NOT EXISTS bank_statement_url TEXT;
ALTER TABLE public.kyc_submissions ADD COLUMN IF NOT EXISTS utility_bill_url TEXT;
ALTER TABLE public.kyc_submissions ADD COLUMN IF NOT EXISTS additional_doc_url TEXT;

-- Add columns to chat_sessions
ALTER TABLE public.chat_sessions ADD COLUMN IF NOT EXISTS user_messages_cleared_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.chat_sessions ADD COLUMN IF NOT EXISTS admin_messages_cleared_at TIMESTAMP WITH TIME ZONE;

-- Add columns to products (stock alias)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0;

-- Create agent_chat_presence table
CREATE TABLE IF NOT EXISTS public.agent_chat_presence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL,
  user_id UUID NOT NULL,
  is_viewing BOOLEAN DEFAULT true,
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(agent_id, user_id)
);

ALTER TABLE public.agent_chat_presence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Agent presence viewable by authenticated" ON public.agent_chat_presence FOR SELECT TO authenticated USING (true);
CREATE POLICY "Agents can manage own presence" ON public.agent_chat_presence FOR ALL TO authenticated USING (auth.uid() = agent_id);

-- Create force_logout_events table
CREATE TABLE IF NOT EXISTS public.force_logout_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  reason TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.force_logout_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own logout events" ON public.force_logout_events FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage logout events" ON public.force_logout_events FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Create create_audit_log function
CREATE OR REPLACE FUNCTION public.create_audit_log(
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_old_data JSONB DEFAULT NULL,
  p_new_data JSONB DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.settings_audit_logs (setting_key, old_value, new_value, changed_by)
  VALUES (p_entity_type || ':' || p_action, p_old_data, p_new_data, COALESCE(p_user_id, auth.uid()))
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SET search_path = public SECURITY DEFINER;

-- Add columns to chat_customer_names
ALTER TABLE public.chat_customer_names ADD COLUMN IF NOT EXISTS indian_name_id UUID;

-- Enable realtime for agent_chat_presence
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_chat_presence;