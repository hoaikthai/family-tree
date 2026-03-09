-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Trees
CREATE TABLE trees (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name        text        NOT NULL,
  is_public   boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Persons
CREATE TABLE persons (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tree_id             uuid        NOT NULL REFERENCES trees ON DELETE CASCADE,
  first_name          text        NOT NULL,
  last_name           text,
  gender              text        CHECK (gender IN ('male', 'female', 'other')),
  birth_date          date,
  is_birth_year_only  boolean     NOT NULL DEFAULT false,
  death_date          date,
  is_death_year_only  boolean     NOT NULL DEFAULT false,
  photo_url           text,
  notes               text,
  position_x          float       NOT NULL DEFAULT 0,
  position_y          float       NOT NULL DEFAULT 0,
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- Unions (family units)
CREATE TABLE unions (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tree_id     uuid        NOT NULL REFERENCES trees ON DELETE CASCADE,
  position_x  float       NOT NULL DEFAULT 0,
  position_y  float       NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Union parents (max 2 per union)
CREATE TABLE union_members (
  union_id    uuid NOT NULL REFERENCES unions ON DELETE CASCADE,
  person_id   uuid NOT NULL REFERENCES persons ON DELETE CASCADE,
  PRIMARY KEY (union_id, person_id)
);

-- Union children
CREATE TABLE union_children (
  union_id    uuid NOT NULL REFERENCES unions ON DELETE CASCADE,
  person_id   uuid NOT NULL REFERENCES persons ON DELETE CASCADE,
  PRIMARY KEY (union_id, person_id)
);

-- Enable RLS on all tables
ALTER TABLE trees          ENABLE ROW LEVEL SECURITY;
ALTER TABLE persons        ENABLE ROW LEVEL SECURITY;
ALTER TABLE unions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE union_members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE union_children ENABLE ROW LEVEL SECURITY;

-- RLS: trees
CREATE POLICY "trees_owner_all" ON trees
  USING (owner_id = auth.uid());

CREATE POLICY "trees_public_read" ON trees
  FOR SELECT USING (is_public = true);

-- RLS: persons
CREATE POLICY "persons_owner_all" ON persons
  USING (tree_id IN (SELECT id FROM trees WHERE owner_id = auth.uid()));

CREATE POLICY "persons_public_read" ON persons
  FOR SELECT USING (
    tree_id IN (SELECT id FROM trees WHERE is_public = true)
  );

-- RLS: unions
CREATE POLICY "unions_owner_all" ON unions
  USING (tree_id IN (SELECT id FROM trees WHERE owner_id = auth.uid()));

CREATE POLICY "unions_public_read" ON unions
  FOR SELECT USING (
    tree_id IN (SELECT id FROM trees WHERE is_public = true)
  );

-- RLS: union_members
CREATE POLICY "union_members_owner_all" ON union_members
  USING (union_id IN (
    SELECT id FROM unions WHERE tree_id IN (
      SELECT id FROM trees WHERE owner_id = auth.uid()
    )
  ));

CREATE POLICY "union_members_public_read" ON union_members
  FOR SELECT USING (
    union_id IN (
      SELECT id FROM unions WHERE tree_id IN (
        SELECT id FROM trees WHERE is_public = true
      )
    )
  );

-- RLS: union_children
CREATE POLICY "union_children_owner_all" ON union_children
  USING (union_id IN (
    SELECT id FROM unions WHERE tree_id IN (
      SELECT id FROM trees WHERE owner_id = auth.uid()
    )
  ));

CREATE POLICY "union_children_public_read" ON union_children
  FOR SELECT USING (
    union_id IN (
      SELECT id FROM unions WHERE tree_id IN (
        SELECT id FROM trees WHERE is_public = true
      )
    )
  );
