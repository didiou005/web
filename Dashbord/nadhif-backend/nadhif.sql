-- =====================================================
-- NADHIF BOUIRA - BASE DE DONNÉES COMPLÈTE
-- Version finale avec communes simplifiées
-- Plaintes anonymes
-- =====================================================

-- Extension PostGIS pour géolocalisation
CREATE EXTENSION IF NOT EXISTS postgis;

-- =====================================================
-- 1. COMMUNES DE LA WILAYA (simplifiée)
-- =====================================================
CREATE TABLE communes (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(150) NOT NULL UNIQUE,
  code_postal  VARCHAR(20),
  created_at   TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_communes_name ON communes(name);

-- Données : 43 communes de Bouira
INSERT INTO communes (name, code_postal) VALUES
('Aghbalou', '10000'),
('Ahl El Ksar', '10000'),
('Ain Bessem', '10170'),
('Ain El Hadjar', '10000'),
('Ain Laloui', '10000'),
('Ain Turk', '10000'),
('Aomar', '10000'),
('Ath Mansour', '10000'),
('Bechloul', '10000'),
('Bir Ghbalou', '10000'),
('Boukram', '10000'),
('Bordj Okhriss', '10000'),
('Bouira', '10000'),
('Chorfa', '10000'),
('Dechmia', '10000'),
('Dirah', '10000'),
('Djebahia', '10000'),
('El Adjiba', '10000'),
('El Asnam', '10000'),
('El Hachimia', '10000'),
('El Hakimia', '10000'),
('El Khabouzia', '10000'),
('El Mokrani', '10000'),
('Guerrouma', '10000'),
('Hadjera Zerga', '10000'),
('Haizer', '10000'),
('Kadiria', '10000'),
('Lakhdaria', '10100'),
('Maala', '10000'),
('Maamora', '10000'),
('Mchedallah', '10110'),
('Mezdour', '10000'),
('Oued El Berdi', '10000'),
('Ouled Rached', '10000'),
('Raouraoua', '10000'),
('Ridane', '10000'),
('Saharidj', '10000'),
('Souk El Khemis', '10000'),
('Sour El Ghozlane', '10200'),
('Taghzout', '10000'),
('Taguedite', '10000'),
('Taourirt', '10000'),
('Zbarbar', '10000');

-- =====================================================
-- 2. ADMINS (Dashboard)
-- =====================================================
CREATE TABLE admin_users (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email          VARCHAR(255) UNIQUE NOT NULL,
  full_name      VARCHAR(150) NOT NULL,
  password_hash  VARCHAR(255) NOT NULL,
  role           VARCHAR(20) NOT NULL CHECK (role IN ('super_admin','admin')),
  function       VARCHAR(100),
  is_active      BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMP DEFAULT NOW(),
  last_login_at  TIMESTAMP
);

-- =====================================================
-- 3. RÉGIONS EPIC NADHIF
-- =====================================================
CREATE TABLE regions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code          VARCHAR(50) UNIQUE NOT NULL,
  name          VARCHAR(150) NOT NULL,
  commune_id    INTEGER REFERENCES communes(id),
  color_hex     VARCHAR(7) DEFAULT '#00C853',
  population    INTEGER,
  geom          GEOMETRY(POLYGON, 4326) NOT NULL,
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_regions_geom ON regions USING GIST(geom);

-- =====================================================
-- 4. ÉQUIPES
-- =====================================================
CREATE TABLE teams (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(150) NOT NULL,
  region_id     UUID REFERENCES regions(id),
  working_hours VARCHAR(100),
  vehicle_info  TEXT,
  created_at    TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 5. MEMBRES D'ÉQUIPE
-- =====================================================
CREATE TABLE team_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id     UUID REFERENCES teams(id) ON DELETE CASCADE,
  full_name   VARCHAR(150) NOT NULL,
  role        VARCHAR(100),
  phone       VARCHAR(30),
  created_at  TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 6. PLAINTES (ANONYMES)
-- =====================================================
CREATE TABLE complaints (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code              VARCHAR(50) UNIQUE NOT NULL,
  commune_id        INTEGER REFERENCES communes(id) NOT NULL,
  address_text      TEXT,
  waste_type        VARCHAR(20) NOT NULL CHECK (waste_type IN ('menager','inerte')),
  complaint_type    VARCHAR(50),
  comment           VARCHAR(500),
  region_id         UUID REFERENCES regions(id),
  is_region_covered BOOLEAN NOT NULL DEFAULT FALSE,
  status            VARCHAR(20) NOT NULL DEFAULT 'en_attente' CHECK (status IN ('en_attente','en_cours','resolue')),
  gps_location      GEOMETRY(POINT, 4326) NOT NULL,
  team_id           UUID REFERENCES teams(id),
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT check_complaint_type CHECK (
    (waste_type = 'menager' AND complaint_type IS NOT NULL) OR
    (waste_type = 'inerte' AND complaint_type IS NULL)
  )
);

CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_region ON complaints(region_id);
CREATE INDEX idx_complaints_commune ON complaints(commune_id);
CREATE INDEX idx_complaints_code ON complaints(code);
CREATE INDEX idx_complaints_gps ON complaints USING GIST(gps_location);

-- =====================================================
-- 7. PHOTOS DES PLAINTES
-- =====================================================
CREATE TABLE complaint_photos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id  UUID REFERENCES complaints(id) ON DELETE CASCADE,
  url           TEXT NOT NULL,
  created_at    TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 8. HISTORIQUE DES STATUTS
-- =====================================================
CREATE TABLE complaint_status_history (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id   UUID REFERENCES complaints(id) ON DELETE CASCADE,
  old_status     VARCHAR(20),
  new_status     VARCHAR(20) NOT NULL,
  changed_by_id  UUID REFERENCES admin_users(id),
  changed_at     TIMESTAMP DEFAULT NOW(),
  note           TEXT
);

-- =====================================================
-- 9. COMMENTAIRES INTERNES
-- =====================================================
CREATE TABLE complaint_comments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id   UUID REFERENCES complaints(id) ON DELETE CASCADE,
  author_id      UUID REFERENCES admin_users(id),
  comment        TEXT NOT NULL,
  created_at     TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 10. AUDIT CONNEXIONS (Obsolète, gardé pour compatibilité)
-- =====================================================
CREATE TABLE login_audit (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id     UUID REFERENCES admin_users(id),
  email        VARCHAR(255),
  ip_address   VARCHAR(64),
  user_agent   TEXT,
  success      BOOLEAN NOT NULL,
  created_at   TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 11. JOURNAL D'ACTIVITÉ GLOBAL (NOUVEAU - SYSTEME UNIFIÉ)
-- =====================================================
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  action_type VARCHAR(50) NOT NULL, -- CREATE, UPDATE, DELETE, LOGIN, EXPORT
  entity_type VARCHAR(50) NOT NULL, -- COMPLAINT, REGION, TEAM, EMPLOYEE, SYSTEM
  entity_id VARCHAR(100), -- ID de l'objet impacté
  description TEXT, -- Description lisible
  metadata JSONB, -- Détails techniques (champs modifiés, etc.)
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
INSERT INTO admin_users (
  email,
  full_name,
  password_hash,
  role,
  function,
  is_active
)
DELETE FROM admin_users
WHERE email = 'admin@nadhif.com';

INSERT INTO admin_users (
  email,
  full_name,
  password_hash,
  role,
  function,
  is_active
)
VALUES (
  'admin@nadhif.dz',
  'Super Admin',
  '$2b$12$qhCYk9rxlU6CN7H8gvZpG.vrjbf2n6A9j8dL8j5cBxl9caFWqdV6a',
  'super_admin',
  'Administrateur Principal',
  TRUE
);
CREATE INDEX idx_logs_admin ON activity_logs(admin_id);
CREATE INDEX idx_logs_created_at ON activity_logs(created_at);
CREATE INDEX idx_logs_action ON activity_logs(action_type);