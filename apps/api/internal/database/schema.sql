-- ============================================
-- TEMPO DATABASE SCHEMA
-- ============================================
-- This file defines the structure of our database.
-- PostgreSQL uses SQL (Structured Query Language) to define tables.
-- Think of tables like spreadsheets - rows are records, columns are fields.

-- ============================================
-- USERS TABLE
-- ============================================
-- Stores all registered users
-- Every user has a unique ID, email, and password hash
CREATE TABLE IF NOT EXISTS users (
    -- UUID: Universally Unique Identifier
    -- Better than auto-increment integers because:
    -- 1. Can't guess other user IDs (security)
    -- 2. Can generate IDs before inserting (useful for distributed systems)
    -- 3. No conflicts when merging databases
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Email must be unique - no two users can have same email
    -- VARCHAR(255) means variable-length string up to 255 characters
    email VARCHAR(255) UNIQUE NOT NULL,
    
    -- We NEVER store plain passwords!
    -- This stores a bcrypt hash (one-way encryption)
    -- Even if database is hacked, passwords are safe
    password_hash VARCHAR(255) NOT NULL,
    
    -- Display name shown to other users
    name VARCHAR(100) NOT NULL,
    
    -- Profile picture URL (optional, hence no NOT NULL)
    avatar_url VARCHAR(500),
    
    -- Timestamps for auditing
    -- TIMESTAMP WITH TIME ZONE stores time with timezone info
    -- Important for users in different timezones
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PROJECTS TABLE
-- ============================================
-- Stores video editing projects
-- Each project belongs to one owner (user)
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign Key: Links to users table
    -- ON DELETE CASCADE: If user is deleted, their projects are too
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Project metadata
    name VARCHAR(255) NOT NULL,
    description TEXT, -- TEXT allows unlimited length
    
    -- Thumbnail for project preview
    thumbnail_url VARCHAR(500),
    
    -- Store the Yjs document state for collaboration
    -- BYTEA is binary data - Yjs state is binary
    yjs_state BYTEA,
    
    -- Project settings as JSON
    -- JSONB is binary JSON - faster queries than regular JSON
    settings JSONB DEFAULT '{}',
    
    -- Soft delete: Instead of deleting, mark as deleted
    -- This allows "undo" and data recovery
    is_deleted BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- COLLABORATORS TABLE
-- ============================================
-- Junction table: Links users to projects they can access
-- This is a many-to-many relationship:
-- - One user can collaborate on many projects
-- - One project can have many collaborators
CREATE TABLE IF NOT EXISTS collaborators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Which project
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Which user
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Permission level using ENUM (predefined values)
    -- 'owner' - Full control (there's only one, stored in projects.owner_id too)
    -- 'editor' - Can edit the project
    -- 'viewer' - Can only view, not edit
    role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
    
    -- Who invited this collaborator
    invited_by UUID REFERENCES users(id),
    
    -- Invitation status
    status VARCHAR(20) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'accepted', 'declined')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint: A user can only be added to a project once
    UNIQUE(project_id, user_id)
);

-- ============================================
-- INVITATIONS TABLE
-- ============================================
-- Stores pending invitations (before user accepts)
-- Needed for inviting users who haven't registered yet
CREATE TABLE IF NOT EXISTS invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Email of invited person (might not have account yet)
    email VARCHAR(255) NOT NULL,
    
    -- Who sent the invitation
    invited_by UUID NOT NULL REFERENCES users(id),
    
    -- What role they'll get when they accept
    role VARCHAR(20) NOT NULL CHECK (role IN ('editor', 'viewer')),
    
    -- Unique token for the invitation link
    -- User clicks link with this token to accept
    token UUID DEFAULT gen_random_uuid(),
    
    -- Invitation expires after 7 days
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '7 days',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Can only invite same email to same project once
    UNIQUE(project_id, email)
);

-- ============================================
-- REFRESH TOKENS TABLE
-- ============================================
-- Stores refresh tokens for JWT authentication
-- This allows "remember me" and secure token rotation
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- The actual token (hashed for security)
    token_hash VARCHAR(255) NOT NULL,
    
    -- When this token expires
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Track where the token was created (for security auditing)
    user_agent VARCHAR(500),
    ip_address VARCHAR(45), -- IPv6 can be up to 45 chars
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Was this token revoked? (logout, security breach)
    revoked BOOLEAN DEFAULT FALSE
);

-- ============================================
-- INDEXES
-- ============================================
-- Indexes make queries faster by creating lookup tables
-- Like an index in a book - find topics without reading every page
-- Without indexes, database scans every row (slow!)

-- Find user by email (used in login)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Find projects by owner (used in dashboard)
CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);

-- Find collaborators by project (used when loading project)
CREATE INDEX IF NOT EXISTS idx_collaborators_project ON collaborators(project_id);

-- Find collaborators by user (used in dashboard - "projects I collaborate on")
CREATE INDEX IF NOT EXISTS idx_collaborators_user ON collaborators(user_id);

-- Find invitations by email (used when user registers)
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);

-- Find refresh tokens by user (used in logout all devices)
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);

