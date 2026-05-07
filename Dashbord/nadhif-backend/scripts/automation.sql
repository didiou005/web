-- =====================================================
-- NETTOYAGE ET AUTOMATISATION DES PLAINTES
-- =====================================================

-- 0. Supprimer les anciens triggers et fonctions s'ils existent
DROP TRIGGER IF EXISTS before_insert_complaint ON complaints;
DROP TRIGGER IF EXISTS before_insert_complaint_code ON complaints;

DROP FUNCTION IF EXISTS detect_region_and_commune_from_gps CASCADE;
DROP FUNCTION IF EXISTS generate_complaint_code CASCADE;
DROP FUNCTION IF EXISTS set_code_if_null CASCADE;

-- 1. Fonction pour générer un code unique (Format: TSK-YYYYMMDD-XXXX)
CREATE OR REPLACE FUNCTION generate_complaint_code()
RETURNS TRIGGER AS $$
DECLARE
    date_part TEXT;
    seq_part TEXT;
    new_code TEXT;
BEGIN
    -- Obtenir la date au format YYYYMMDD
    date_part := to_char(NOW(), 'YYYYMMDD');
    
    -- Générer une séquence aléatoire de 4 caractères ou utiliser une séquence si vous en avez une
    -- Ici, on utilise un random pour simplifier, mais une SEQUENCE est recommandée pour l'unicité stricte
    seq_part := lpad(floor(random() * 10000)::text, 4, '0');
    
    new_code := 'TSK-' || date_part || '-' || seq_part;
    
    -- Assurer l'unicité (boucle simple en cas de collision, très rare)
    WHILE EXISTS (SELECT 1 FROM complaints WHERE code = new_code) LOOP
        seq_part := lpad(floor(random() * 10000)::text, 4, '0');
        new_code := 'TSK-' || date_part || '-' || seq_part;
    END LOOP;
    
    NEW.code := new_code;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- 2. Fonction pour détecter la Région et la Commune via GPS
CREATE OR REPLACE FUNCTION detect_region_and_commune_from_gps()
RETURNS TRIGGER AS $$
DECLARE
    found_region_id UUID;
    found_commune_id INTEGER;
    backup_commune_id INTEGER;
BEGIN
    -- Si la localisation GPS est présente
    IF NEW.gps_location IS NOT NULL THEN
        
        -- A. Chercher la Région contenant ce point
        SELECT id, commune_id 
        INTO found_region_id, found_commune_id
        FROM regions
        WHERE ST_Contains(geom, NEW.gps_location)
        LIMIT 1;

        -- Si une région est trouvée
        IF found_region_id IS NOT NULL THEN
            NEW.region_id := found_region_id;
            NEW.is_region_covered := TRUE;
            
            -- Si la région est liée à une commune, on l'utilise
            IF found_commune_id IS NOT NULL THEN
                NEW.commune_id := found_commune_id;
            END IF;
        ELSE 
            -- Pas de région trouvée
            NEW.is_region_covered := FALSE;
            NEW.region_id := NULL;
        END IF;

        -- B. Si Commune ID est toujours NULL (pas de région ou région sans commune)
        
        IF NEW.commune_id IS NULL THEN
             -- Fallback : assigner à la première commune 'Bouira' ou ID 1 par défaut
             SELECT id INTO backup_commune_id FROM communes WHERE name = 'Bouira' LIMIT 1;
             
             IF backup_commune_id IS NULL THEN
                 SELECT id INTO backup_commune_id FROM communes LIMIT 1;
             END IF;
             
             NEW.commune_id := backup_commune_id;
        END IF;

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- 3. Trigger global avant insertion 
-- Ce trigger doit s'exécuter avant l'insertion pour définir commune_id et éviter l'erreur NOT NULL
CREATE TRIGGER before_insert_complaint
BEFORE INSERT ON complaints
FOR EACH ROW
EXECUTE FUNCTION detect_region_and_commune_from_gps();

-- Trigger pour le code (si code est NULL)
CREATE OR REPLACE FUNCTION set_code_if_null()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.code IS NULL THEN
       -- Appelle la logique de génération en interne
       DECLARE
        date_part TEXT := to_char(NOW(), 'YYYYMMDD');
        seq_part TEXT := lpad(floor(random() * 10000)::text, 4, '0');
       BEGIN
        NEW.code := 'TSK-' || date_part || '-' || seq_part;
       END;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_insert_complaint_code
BEFORE INSERT ON complaints
FOR EACH ROW
WHEN (NEW.code IS NULL)
EXECUTE FUNCTION set_code_if_null();
