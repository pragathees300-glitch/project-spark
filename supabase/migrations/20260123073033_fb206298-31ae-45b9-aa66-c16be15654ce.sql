-- Fix overly-permissive RLS policies flagged by the linter

-- 1) audit_logs: prevent authenticated users from inserting arbitrary audit entries for other users
DROP POLICY IF EXISTS "Authenticated can insert audit logs" ON public.audit_logs;
CREATE POLICY "Users can insert own audit logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 2) ip_logs: prevent authenticated users from inserting IP logs for other users
DROP POLICY IF EXISTS "Authenticated can insert ip logs" ON public.ip_logs;
CREATE POLICY "Users can insert own ip logs"
ON public.ip_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 3) login_attempts: avoid WITH CHECK (true) while still allowing pre-auth logging
DROP POLICY IF EXISTS "Anyone can insert login attempts" ON public.login_attempts;
CREATE POLICY "Anyone can insert login attempts"
ON public.login_attempts
FOR INSERT
TO public
WITH CHECK (
  email IS NOT NULL
  AND length(btrim(email)) > 3
  AND length(email) <= 320
);

-- Security fix: profiles should not be universally readable
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
  )
);
