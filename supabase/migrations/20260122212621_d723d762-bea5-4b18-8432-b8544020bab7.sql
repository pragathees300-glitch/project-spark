-- =============================================
-- RLS POLICIES FOR ALL TABLES
-- =============================================

-- Products policies
CREATE POLICY "Products are viewable by everyone" ON public.products FOR SELECT USING (true);
CREATE POLICY "Products admin insert" ON public.products FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Products admin update" ON public.products FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Products admin delete" ON public.products FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Product media policies
CREATE POLICY "Product media viewable by everyone" ON public.product_media FOR SELECT USING (true);
CREATE POLICY "Product media admin insert" ON public.product_media FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Product media admin update" ON public.product_media FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Product media admin delete" ON public.product_media FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage profiles" ON public.profiles FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- User roles policies
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own role" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Storefront products policies
CREATE POLICY "Storefront products viewable by everyone" ON public.storefront_products FOR SELECT USING (true);
CREATE POLICY "Users can insert own storefront products" ON public.storefront_products FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own storefront products" ON public.storefront_products FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own storefront products" ON public.storefront_products FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Product reviews policies
CREATE POLICY "Approved reviews viewable by everyone" ON public.product_reviews FOR SELECT USING (is_approved = true);
CREATE POLICY "Users can insert reviews" ON public.product_reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage reviews" ON public.product_reviews FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Orders policies
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = dropshipper_user_id);
CREATE POLICY "Users can create orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = dropshipper_user_id);
CREATE POLICY "Users can update own orders" ON public.orders FOR UPDATE TO authenticated USING (auth.uid() = dropshipper_user_id);
CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'support'))
);
CREATE POLICY "Admins can update orders" ON public.orders FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'support'))
);

-- Order status history policies
CREATE POLICY "Users can view own order history" ON public.order_status_history FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_id AND orders.dropshipper_user_id = auth.uid())
);
CREATE POLICY "Admins can manage order history" ON public.order_status_history FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'support'))
);

-- Order messages policies
CREATE POLICY "Users can view own order messages" ON public.order_messages FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_id AND orders.dropshipper_user_id = auth.uid())
);
CREATE POLICY "Users can insert order messages" ON public.order_messages FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_id AND orders.dropshipper_user_id = auth.uid())
);
CREATE POLICY "Admins can manage order messages" ON public.order_messages FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'support'))
);

-- Chat messages policies
CREATE POLICY "Users can view own chat" ON public.chat_messages FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert chat" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all chat" ON public.chat_messages FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'support'))
);
CREATE POLICY "Admins can insert chat" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'support'))
);
CREATE POLICY "Admins can update chat" ON public.chat_messages FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'support'))
);

-- Chat sessions policies
CREATE POLICY "Users can view own session" ON public.chat_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert session" ON public.chat_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own session" ON public.chat_sessions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all sessions" ON public.chat_sessions FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'support'))
);
CREATE POLICY "Admins can update sessions" ON public.chat_sessions FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'support'))
);

-- Support agent presence policies
CREATE POLICY "Agent presence viewable by authenticated" ON public.support_agent_presence FOR SELECT TO authenticated USING (true);
CREATE POLICY "Agents can insert presence" ON public.support_agent_presence FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Agents can update presence" ON public.support_agent_presence FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Agents can delete presence" ON public.support_agent_presence FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Chat reassignment logs policies
CREATE POLICY "Admins can view reassignment logs" ON public.chat_reassignment_logs FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'support'))
);
CREATE POLICY "Admins can insert reassignment logs" ON public.chat_reassignment_logs FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'support'))
);

-- Quick replies policies
CREATE POLICY "Quick replies viewable by authenticated" ON public.quick_replies FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Admins can manage quick replies" ON public.quick_replies FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Wallet transactions policies
CREATE POLICY "Users can view own transactions" ON public.wallet_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage transactions" ON public.wallet_transactions FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Payout requests policies
CREATE POLICY "Users can view own payouts" ON public.payout_requests FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create payouts" ON public.payout_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage payouts" ON public.payout_requests FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Crypto wallets policies
CREATE POLICY "Crypto wallets viewable by everyone" ON public.crypto_wallets FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage crypto wallets" ON public.crypto_wallets FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Crypto payments policies
CREATE POLICY "Users can view own crypto payments" ON public.crypto_payments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create crypto payments" ON public.crypto_payments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage crypto payments" ON public.crypto_payments FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- KYC submissions policies
CREATE POLICY "Users can view own kyc" ON public.kyc_submissions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create kyc" ON public.kyc_submissions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own kyc" ON public.kyc_submissions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage kyc" ON public.kyc_submissions FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Platform settings policies
CREATE POLICY "Platform settings viewable by authenticated" ON public.platform_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage platform settings" ON public.platform_settings FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Dashboard messages policies
CREATE POLICY "Dashboard messages viewable by authenticated" ON public.dashboard_messages FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Admins can manage dashboard messages" ON public.dashboard_messages FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Popup messages policies
CREATE POLICY "Popup messages viewable by authenticated" ON public.popup_messages FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Admins can manage popup messages" ON public.popup_messages FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- FAQ items policies
CREATE POLICY "FAQ items viewable by everyone" ON public.faq_items FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage faq items" ON public.faq_items FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Video tutorials policies
CREATE POLICY "Video tutorials viewable by everyone" ON public.video_tutorials FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage video tutorials" ON public.video_tutorials FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Video tutorial progress policies
CREATE POLICY "Users can view own progress" ON public.video_tutorial_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert progress" ON public.video_tutorial_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update progress" ON public.video_tutorial_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- User notifications policies
CREATE POLICY "Users can view own notifications" ON public.user_notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.user_notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage notifications" ON public.user_notifications FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Push subscriptions policies
CREATE POLICY "Users can manage own subscriptions" ON public.push_subscriptions FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Work type categories policies
CREATE POLICY "Work type categories viewable by authenticated" ON public.work_type_categories FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Admins can manage work type categories" ON public.work_type_categories FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Work types policies
CREATE POLICY "Work types viewable by authenticated" ON public.work_types FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Admins can manage work types" ON public.work_types FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Proof submissions policies
CREATE POLICY "Users can view own submissions" ON public.proof_submissions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create submissions" ON public.proof_submissions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update pending submissions" ON public.proof_submissions FOR UPDATE TO authenticated USING (auth.uid() = user_id AND status = 'pending');
CREATE POLICY "Admins can manage submissions" ON public.proof_submissions FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Settings audit logs policies
CREATE POLICY "Admins can view audit logs" ON public.settings_audit_logs FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can insert audit logs" ON public.settings_audit_logs FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Login attempts policies
CREATE POLICY "Admins can view login attempts" ON public.login_attempts FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Anyone can insert login attempts" ON public.login_attempts FOR INSERT WITH CHECK (true);

-- IP logs policies
CREATE POLICY "Admins can view ip logs" ON public.ip_logs FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Authenticated can insert ip logs" ON public.ip_logs FOR INSERT TO authenticated WITH CHECK (true);

-- Indian names policies
CREATE POLICY "Indian names viewable by authenticated" ON public.indian_names FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage indian names" ON public.indian_names FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Top dropshippers policies
CREATE POLICY "Top dropshippers viewable by everyone" ON public.top_dropshippers FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage top dropshippers" ON public.top_dropshippers FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Media library policies
CREATE POLICY "Media viewable by authenticated" ON public.media_library FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage media" ON public.media_library FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Postpaid settings policies
CREATE POLICY "Users can view own postpaid" ON public.postpaid_settings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage postpaid" ON public.postpaid_settings FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Level commissions policies
CREATE POLICY "Level commissions viewable by authenticated" ON public.level_commissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage level commissions" ON public.level_commissions FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- User level history policies
CREATE POLICY "Users can view own level history" ON public.user_level_history FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage level history" ON public.user_level_history FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Custom payment methods policies
CREATE POLICY "Custom payment methods viewable by authenticated" ON public.custom_payment_methods FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Admins can manage payment methods" ON public.custom_payment_methods FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Trusted devices policies
CREATE POLICY "Users can manage own devices" ON public.trusted_devices FOR ALL TO authenticated USING (auth.uid() = user_id);

-- MFA settings policies
CREATE POLICY "Users can manage own mfa" ON public.mfa_settings FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Support tickets policies
CREATE POLICY "Users can view own tickets" ON public.support_tickets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create tickets" ON public.support_tickets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tickets" ON public.support_tickets FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage tickets" ON public.support_tickets FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'support'))
);