-- IN-APP CHAT & HELP SESSION TRACKING SYSTEM
-- Real-time messaging and session management

-- 1. HELP SESSIONS TABLE
-- Track active help sessions from start to completion
CREATE TABLE IF NOT EXISTS help_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    helper_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    poster_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Session status
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    
    -- Session details
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    
    -- Location tracking
    helper_current_latitude DECIMAL(10, 8),
    helper_current_longitude DECIMAL(11, 8),
    distance_to_problem DECIMAL(10, 2),
    estimated_arrival_time TIMESTAMPTZ,
    
    -- Session metadata
    total_messages INT DEFAULT 0,
    last_message_at TIMESTAMPTZ,
    
    -- Completion details
    completion_note TEXT,
    completion_image TEXT,
    rating_by_poster INT CHECK (rating_by_poster >= 1 AND rating_by_poster <= 5),
    rating_by_helper INT CHECK (rating_by_helper >= 1 AND rating_by_helper <= 5),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. CHAT MESSAGES TABLE
-- Store all chat messages between helper and poster
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES help_sessions(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Message content
    message_type VARCHAR(20) NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'location', 'system')),
    content TEXT NOT NULL,
    
    -- For image messages
    image_url TEXT,
    
    -- For location messages
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    location_name TEXT,
    
    -- Message status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. SESSION UPDATES TABLE
-- Track important events during help session
CREATE TABLE IF NOT EXISTS session_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES help_sessions(id) ON DELETE CASCADE,
    
    -- Update type
    update_type VARCHAR(30) NOT NULL CHECK (update_type IN (
        'session_started',
        'helper_on_way',
        'helper_arrived',
        'work_started',
        'work_in_progress',
        'work_completed',
        'session_completed',
        'session_cancelled'
    )),
    
    -- Update details
    title VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Location at time of update
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_help_sessions_problem ON help_sessions(problem_id);
CREATE INDEX IF NOT EXISTS idx_help_sessions_helper ON help_sessions(helper_id);
CREATE INDEX IF NOT EXISTS idx_help_sessions_poster ON help_sessions(poster_id);
CREATE INDEX IF NOT EXISTS idx_help_sessions_status ON help_sessions(status);
CREATE INDEX IF NOT EXISTS idx_help_sessions_started ON help_sessions(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_receiver ON chat_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_unread ON chat_messages(receiver_id, is_read) WHERE is_read = FALSE;

CREATE INDEX IF NOT EXISTS idx_session_updates_session ON session_updates(session_id);
CREATE INDEX IF NOT EXISTS idx_session_updates_type ON session_updates(update_type);
CREATE INDEX IF NOT EXISTS idx_session_updates_created ON session_updates(created_at DESC);

-- 5. FUNCTIONS

-- Function to create help session when help is accepted
CREATE OR REPLACE FUNCTION create_help_session(
    p_problem_id UUID,
    p_helper_id UUID,
    p_poster_id UUID
) RETURNS UUID AS $$
DECLARE
    v_session_id UUID;
BEGIN
    INSERT INTO help_sessions (problem_id, helper_id, poster_id, status)
    VALUES (p_problem_id, p_helper_id, p_poster_id, 'active')
    RETURNING id INTO v_session_id;
    
    INSERT INTO session_updates (session_id, update_type, title, description, created_by)
    VALUES (
        v_session_id,
        'session_started',
        'Help Session Started',
        'Helper has accepted to help with this problem',
        p_helper_id
    );
    
    INSERT INTO chat_messages (session_id, sender_id, receiver_id, message_type, content)
    VALUES (
        v_session_id,
        p_helper_id,
        p_poster_id,
        'system',
        'Help session started. You can now chat with each other!'
    );
    
    RETURN v_session_id;
END;
$$ LANGUAGE plpgsql;

-- Function to send chat message
CREATE OR REPLACE FUNCTION send_chat_message(
    p_session_id UUID,
    p_sender_id UUID,
    p_receiver_id UUID,
    p_message_type VARCHAR,
    p_content TEXT,
    p_image_url TEXT DEFAULT NULL,
    p_latitude DECIMAL DEFAULT NULL,
    p_longitude DECIMAL DEFAULT NULL,
    p_location_name TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_message_id UUID;
BEGIN
    INSERT INTO chat_messages (
        session_id, sender_id, receiver_id, message_type, content,
        image_url, latitude, longitude, location_name
    )
    VALUES (
        p_session_id, p_sender_id, p_receiver_id, p_message_type, p_content,
        p_image_url, p_latitude, p_longitude, p_location_name
    )
    RETURNING id INTO v_message_id;
    
    UPDATE help_sessions
    SET 
        total_messages = total_messages + 1,
        last_message_at = NOW(),
        updated_at = NOW()
    WHERE id = p_session_id;
    
    RETURN v_message_id;
END;
$$ LANGUAGE plpgsql;

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_read(
    p_session_id UUID,
    p_user_id UUID
) RETURNS INT AS $$
DECLARE
    v_count INT;
BEGIN
    UPDATE chat_messages
    SET 
        is_read = TRUE,
        read_at = NOW()
    WHERE 
        session_id = p_session_id
        AND receiver_id = p_user_id
        AND is_read = FALSE;
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get unread message count
CREATE OR REPLACE FUNCTION get_unread_count(
    p_user_id UUID
) RETURNS TABLE (
    session_id UUID,
    unread_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cm.session_id,
        COUNT(*)::BIGINT as unread_count
    FROM chat_messages cm
    WHERE 
        cm.receiver_id = p_user_id
        AND cm.is_read = FALSE
    GROUP BY cm.session_id;
END;
$$ LANGUAGE plpgsql;

-- Function to complete help session
CREATE OR REPLACE FUNCTION complete_help_session(
    p_session_id UUID,
    p_completion_note TEXT DEFAULT NULL,
    p_completion_image TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE help_sessions
    SET 
        status = 'completed',
        completed_at = NOW(),
        completion_note = p_completion_note,
        completion_image = p_completion_image,
        updated_at = NOW()
    WHERE id = p_session_id;
    
    INSERT INTO session_updates (session_id, update_type, title, description)
    VALUES (
        p_session_id,
        'session_completed',
        'Problem Solved!',
        'The help session has been completed successfully'
    );
    
    INSERT INTO chat_messages (
        session_id, 
        sender_id, 
        receiver_id, 
        message_type, 
        content
    )
    SELECT 
        p_session_id,
        helper_id,
        poster_id,
        'system',
        'Problem has been marked as solved. Thank you for helping!'
    FROM help_sessions
    WHERE id = p_session_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to update helper location
CREATE OR REPLACE FUNCTION update_helper_location(
    p_session_id UUID,
    p_latitude DECIMAL,
    p_longitude DECIMAL
) RETURNS BOOLEAN AS $$
DECLARE
    v_problem_lat DECIMAL;
    v_problem_lng DECIMAL;
    v_distance DECIMAL;
BEGIN
    SELECT p.latitude, p.longitude
    INTO v_problem_lat, v_problem_lng
    FROM help_sessions hs
    JOIN problems p ON p.id = hs.problem_id
    WHERE hs.id = p_session_id;
    
    v_distance := calculate_distance_km(p_latitude, p_longitude, v_problem_lat, v_problem_lng);
    
    UPDATE help_sessions
    SET 
        helper_current_latitude = p_latitude,
        helper_current_longitude = p_longitude,
        distance_to_problem = v_distance,
        updated_at = NOW()
    WHERE id = p_session_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 6. TRIGGERS

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_help_sessions_updated_at ON help_sessions;
DROP TRIGGER IF EXISTS update_chat_messages_updated_at ON chat_messages;

-- Create triggers
CREATE TRIGGER update_help_sessions_updated_at
    BEFORE UPDATE ON help_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_messages_updated_at
    BEFORE UPDATE ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. ROW LEVEL SECURITY (RLS)

ALTER TABLE help_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_updates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own sessions" ON help_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON help_sessions;
DROP POLICY IF EXISTS "Users can insert sessions" ON help_sessions;
DROP POLICY IF EXISTS "Users can view their own messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can send messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can update their received messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can view session updates" ON session_updates;
DROP POLICY IF EXISTS "Users can create session updates" ON session_updates;

-- Help sessions policies
CREATE POLICY "Users can view their own sessions"
    ON help_sessions FOR SELECT
    USING (auth.uid() = helper_id OR auth.uid() = poster_id);

CREATE POLICY "Users can insert sessions"
    ON help_sessions FOR INSERT
    WITH CHECK (auth.uid() = helper_id OR auth.uid() = poster_id);

CREATE POLICY "Users can update their own sessions"
    ON help_sessions FOR UPDATE
    USING (auth.uid() = helper_id OR auth.uid() = poster_id);

-- Chat messages policies
CREATE POLICY "Users can view their own messages"
    ON chat_messages FOR SELECT
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
    ON chat_messages FOR INSERT
    WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their received messages"
    ON chat_messages FOR UPDATE
    USING (auth.uid() = receiver_id);

-- Session updates policies
CREATE POLICY "Users can view session updates"
    ON session_updates FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM help_sessions
            WHERE id = session_updates.session_id
            AND (helper_id = auth.uid() OR poster_id = auth.uid())
        )
    );

CREATE POLICY "Users can create session updates"
    ON session_updates FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM help_sessions
            WHERE id = session_updates.session_id
            AND (helper_id = auth.uid() OR poster_id = auth.uid())
        )
    );

-- MIGRATION COMPLETE
