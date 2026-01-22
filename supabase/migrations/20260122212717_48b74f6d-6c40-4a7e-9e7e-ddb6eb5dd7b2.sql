-- =============================================
-- MORE MISSING COLUMNS AND TABLES
-- =============================================

-- Add more columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS postpaid_due_cycle TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_2fa_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_status TEXT DEFAULT 'active';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS commission_override DECIMAL(5,2);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;

-- Add columns to support_agent_presence
ALTER TABLE public.support_agent_presence ADD COLUMN IF NOT EXISTS active_chat_count INTEGER DEFAULT 0;

-- Add columns to popup_messages
ALTER TABLE public.popup_messages ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE public.popup_messages ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Add columns to ip_logs
ALTER TABLE public.ip_logs ADD COLUMN IF NOT EXISTS action_type TEXT;
ALTER TABLE public.ip_logs ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE public.ip_logs ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.ip_logs ADD COLUMN IF NOT EXISTS region TEXT;

-- Create chat_customer_names table
CREATE TABLE IF NOT EXISTS public.chat_customer_names (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  indian_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_customer_names ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Chat customer names viewable by authenticated" ON public.chat_customer_names FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage chat customer names" ON public.chat_customer_names FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Create proof_of_work table (alias for proof_submissions with legacy name)
CREATE TABLE IF NOT EXISTS public.proof_of_work (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  work_type TEXT NOT NULL,
  work_title TEXT,
  description TEXT,
  proof_url TEXT,
  proof_urls JSONB,
  product_link TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  commission_amount DECIMAL(10,2),
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.proof_of_work ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own proof_of_work" ON public.proof_of_work FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create proof_of_work" ON public.proof_of_work FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update pending proof_of_work" ON public.proof_of_work FOR UPDATE TO authenticated USING (auth.uid() = user_id AND status = 'pending');
CREATE POLICY "Admins can manage proof_of_work" ON public.proof_of_work FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Create order_chat_messages table (alias for order_messages)
CREATE TABLE IF NOT EXISTS public.order_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('user', 'admin', 'support')),
  message TEXT NOT NULL,
  attachment_url TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.order_chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own order_chat_messages" ON public.order_chat_messages FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_id AND orders.dropshipper_user_id = auth.uid())
);
CREATE POLICY "Users can insert order_chat_messages" ON public.order_chat_messages FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_id AND orders.dropshipper_user_id = auth.uid())
);
CREATE POLICY "Admins can manage order_chat_messages" ON public.order_chat_messages FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'support'))
);

-- Add realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.proof_of_work;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.postpaid_transactions;