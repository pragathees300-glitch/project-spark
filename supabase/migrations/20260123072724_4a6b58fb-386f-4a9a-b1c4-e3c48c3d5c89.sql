-- Recovery helper: reconcile a missing/mismatched profile (and roles) by the authenticated user's email.
-- This fixes the "Account not found" case where auth user exists but profiles row is missing or linked to a different user_id.

CREATE OR REPLACE FUNCTION public.reconcile_profile_and_roles_by_email()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_name text := null;
  v_profile_id uuid := null;
  v_existing_user_id uuid := null;
  v_roles text[] := ARRAY[]::text[];
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF v_email = '' THEN
    RAISE EXCEPTION 'No email claim found';
  END IF;

  v_name := nullif(coalesce(auth.jwt() -> 'user_metadata' ->> 'name', ''), '');

  -- Find any existing profile row for this email
  SELECT id, user_id
    INTO v_profile_id, v_existing_user_id
  FROM public.profiles
  WHERE lower(email) = v_email
  LIMIT 1;

  IF v_profile_id IS NULL THEN
    -- Create profile for this user
    INSERT INTO public.profiles (user_id, email, name)
    VALUES (v_uid, v_email, coalesce(v_name, split_part(v_email, '@', 1)))
    RETURNING id, user_id
    INTO v_profile_id, v_existing_user_id;
  ELSE
    -- If profile exists but is linked to a different user_id, re-link it
    IF v_existing_user_id IS DISTINCT FROM v_uid THEN
      -- capture old roles before moving
      SELECT array_agg(role::text)
        INTO v_roles
      FROM public.user_roles
      WHERE user_id = v_existing_user_id;

      UPDATE public.profiles
      SET user_id = v_uid,
          updated_at = now()
      WHERE id = v_profile_id;

      -- Re-create roles on the new user_id (avoid duplicates)
      IF v_roles IS NOT NULL AND array_length(v_roles, 1) IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role)
        SELECT v_uid, (unnest(v_roles))::public.app_role
        ON CONFLICT (user_id, role) DO NOTHING;

        -- Remove old role rows (optional cleanup)
        DELETE FROM public.user_roles
        WHERE user_id = v_existing_user_id;
      END IF;

      v_existing_user_id := v_uid;
    END IF;
  END IF;

  -- Ensure at least a 'user' role exists (keeps app working for normal users)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_uid, 'user'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN jsonb_build_object(
    'user_id', v_uid,
    'email', v_email,
    'profile_id', v_profile_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.reconcile_profile_and_roles_by_email() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reconcile_profile_and_roles_by_email() TO authenticated;
