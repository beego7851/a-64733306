-- Create an enum for password reset types
CREATE TYPE password_reset_type AS ENUM ('admin', 'self_service');

-- Create password reset logs table
CREATE TABLE IF NOT EXISTS password_reset_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_number TEXT NOT NULL,
    reset_type password_reset_type NOT NULL,
    performed_by UUID REFERENCES auth.users(id),
    client_info JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    success BOOLEAN NOT NULL,
    error_code TEXT,
    error_message TEXT
);

-- Create the password reset function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION handle_password_reset(
    member_number TEXT,
    new_password TEXT,
    admin_user_id UUID DEFAULT NULL,
    current_password TEXT DEFAULT NULL,
    ip_address TEXT DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    client_info JSONB DEFAULT NULL
) RETURNS JSONB 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_user_id UUID;
    v_member_record RECORD;
    v_reset_type password_reset_type;
    v_response JSONB;
    v_error_code TEXT;
    v_error_message TEXT;
    v_success BOOLEAN;
BEGIN
    -- Input validation with detailed logging
    IF new_password IS NULL OR length(new_password) < 8 THEN
        RAISE NOTICE 'Password validation failed: length < 8 or null';
        RAISE EXCEPTION 'Invalid password' USING ERRCODE = 'INVALID_PASSWORD';
    END IF;

    -- Get member record and auth user id with logging
    SELECT id, auth_user_id, verified, status 
    INTO v_member_record
    FROM members 
    WHERE members.member_number = handle_password_reset.member_number;

    IF v_member_record IS NULL THEN
        RAISE NOTICE 'Member not found: %', member_number;
        RAISE EXCEPTION 'Member not found' USING ERRCODE = 'MEMBER_NOT_FOUND';
    END IF;

    -- Enhanced permission checking with logging
    IF admin_user_id IS NOT NULL THEN
        RAISE NOTICE 'Admin reset attempt by user: %', admin_user_id;
        IF NOT EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = admin_user_id 
            AND role = 'admin'::app_role
        ) THEN
            RAISE NOTICE 'Unauthorized admin reset attempt by user: %', admin_user_id;
            RAISE EXCEPTION 'Unauthorized admin reset attempt' USING ERRCODE = 'UNAUTHORIZED';
        END IF;
        v_reset_type := 'admin';
    ELSE
        IF current_password IS NULL THEN
            RAISE NOTICE 'Self-service reset attempt without current password';
            RAISE EXCEPTION 'Current password required' USING ERRCODE = 'CURRENT_PASSWORD_REQUIRED';
        END IF;
        v_reset_type := 'self_service';
    END IF;

    -- Begin password update with enhanced error handling
    BEGIN
        RAISE NOTICE 'Attempting password update for auth_user_id: %', v_member_record.auth_user_id;
        
        -- Use auth.update_user() instead of direct update
        PERFORM auth.update_user(
            v_member_record.auth_user_id,
            JSONB_BUILD_OBJECT('password', new_password)
        );

        -- Update member record
        UPDATE members 
        SET 
            updated_at = now(),
            password_reset_required = FALSE
        WHERE member_number = handle_password_reset.member_number;

        v_success := TRUE;
        v_response := jsonb_build_object(
            'success', TRUE,
            'message', 'Password successfully reset',
            'details', jsonb_build_object(
                'timestamp', now(),
                'member_number', member_number,
                'reset_type', v_reset_type
            )
        );

        RAISE NOTICE 'Password reset successful for member: %', member_number;

    EXCEPTION WHEN OTHERS THEN
        v_success := FALSE;
        v_error_code := SQLSTATE;
        v_error_message := SQLERRM;
        
        RAISE NOTICE 'Password reset failed: % %', SQLSTATE, SQLERRM;
        
        v_response := jsonb_build_object(
            'success', FALSE,
            'error', SQLERRM,
            'code', SQLSTATE,
            'details', jsonb_build_object(
                'timestamp', now(),
                'member_number', member_number,
                'error_details', format('Error occurred during password update: %s', SQLERRM)
            )
        );
    END;

    -- Log the reset attempt with enhanced details
    INSERT INTO password_reset_logs (
        member_number,
        reset_type,
        performed_by,
        client_info,
        ip_address,
        user_agent,
        success,
        error_code,
        error_message
    ) VALUES (
        member_number,
        v_reset_type,
        COALESCE(admin_user_id, v_member_record.auth_user_id),
        client_info,
        ip_address,
        user_agent,
        v_success,
        v_error_code,
        v_error_message
    );

    RETURN v_response;
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON TYPE password_reset_type TO authenticated;
GRANT EXECUTE ON FUNCTION handle_password_reset TO authenticated;

-- Create policy for password reset logs
CREATE POLICY "Enable read access for admins" ON password_reset_logs
    FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_roles.user_id = auth.uid() 
        AND role = 'admin'
    ));

-- Grant RLS permissions
ALTER TABLE password_reset_logs ENABLE ROW LEVEL SECURITY;