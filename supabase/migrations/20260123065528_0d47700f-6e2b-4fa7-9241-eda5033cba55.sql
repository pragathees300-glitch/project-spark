-- Create function to mask customer PII in orders
CREATE OR REPLACE FUNCTION public.get_dropshipper_orders_masked()
RETURNS TABLE (
  id uuid,
  order_number text,
  status text,
  quantity integer,
  selling_price numeric,
  base_price numeric,
  created_at timestamptz,
  updated_at timestamptz,
  paid_at timestamptz,
  completed_at timestamptz,
  payment_link text,
  payment_link_clicked_at timestamptz,
  storefront_product_id uuid,
  dropshipper_user_id uuid,
  customer_name_masked text,
  customer_email_masked text,
  customer_phone_masked text,
  customer_address_masked text,
  product_id uuid,
  product_name text,
  product_image_url text,
  product_base_price numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.order_number,
    o.status,
    o.quantity,
    o.selling_price,
    o.base_price,
    o.created_at,
    o.updated_at,
    o.paid_at,
    o.completed_at,
    o.payment_link,
    o.payment_link_clicked_at,
    o.storefront_product_id,
    o.dropshipper_user_id,
    -- Mask customer name: show first 2 chars + ***
    CASE 
      WHEN LENGTH(o.customer_name) > 2 THEN 
        LEFT(o.customer_name, 2) || '***'
      ELSE '***'
    END AS customer_name_masked,
    -- Mask email: show first 2 chars + *** + domain
    CASE 
      WHEN o.customer_email LIKE '%@%' THEN 
        LEFT(SPLIT_PART(o.customer_email, '@', 1), 2) || '***@' || SPLIT_PART(o.customer_email, '@', 2)
      ELSE '***'
    END AS customer_email_masked,
    -- Mask phone: show last 4 digits
    CASE 
      WHEN o.customer_phone IS NOT NULL AND LENGTH(o.customer_phone) > 4 THEN 
        '***' || RIGHT(o.customer_phone, 4)
      ELSE o.customer_phone
    END AS customer_phone_masked,
    -- Mask address: show first 10 chars + ***
    CASE 
      WHEN LENGTH(o.customer_address) > 10 THEN 
        LEFT(o.customer_address, 10) || '***'
      ELSE '***'
    END AS customer_address_masked,
    -- Product info from join
    p.id AS product_id,
    p.name AS product_name,
    p.image_url AS product_image_url,
    p.base_price AS product_base_price
  FROM orders o
  LEFT JOIN storefront_products sp ON o.storefront_product_id = sp.id
  LEFT JOIN products p ON sp.product_id = p.id
  WHERE o.dropshipper_user_id = auth.uid()
  ORDER BY o.created_at DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_dropshipper_orders_masked() TO authenticated;