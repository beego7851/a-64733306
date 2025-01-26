CREATE OR REPLACE FUNCTION get_user_session_info(user_id_param UUID)
RETURNS TABLE (
    last_login TIMESTAMPTZ,
    is_active BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        MAX(created_at) as last_login,
        EXISTS (
            SELECT 1 
            FROM auth.sessions 
            WHERE user_id = user_id_param 
            AND not_after > now()
        ) as is_active
    FROM auth.sessions
    WHERE user_id = user_id_param;
END;
$$;