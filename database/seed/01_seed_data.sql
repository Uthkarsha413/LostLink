-- ============================================================
-- LostLink - Initial Seed Data
-- PES University RR Campus
-- Generated from the supplied campus room dataset (228 rows).
-- All room records remain PROVISIONAL pending physical verification.
-- MySQL 8.0.16+
-- ============================================================

USE lostlink_db;
START TRANSACTION;

-- 1. Application roles
INSERT INTO roles (role_name, description)
SELECT seed.role_name, seed.description
FROM (
    SELECT 'STUDENT' AS role_name, 'Student or campus user' AS description
    UNION ALL SELECT 'MODERATOR', 'Reviews reports and escalates claims'
    UNION ALL SELECT 'ADMIN', 'Manages the platform and makes final claim decisions'
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM roles r WHERE r.role_name = seed.role_name);

-- 2. Initial item categories
INSERT INTO categories (category_name, description)
SELECT seed.category_name, seed.description
FROM (
    SELECT 'Electronics' AS category_name, 'Phones, laptops, tablets and electronic devices' AS description
    UNION ALL SELECT 'Bags', 'Backpacks, handbags, wallets and luggage'
    UNION ALL SELECT 'Documents', 'Identity cards, certificates, books and papers'
    UNION ALL SELECT 'Accessories', 'Watches, jewellery, glasses and personal accessories'
    UNION ALL SELECT 'Clothing', 'Clothing, footwear and wearable items'
    UNION ALL SELECT 'Keys', 'Keys, keychains and access cards'
    UNION ALL SELECT 'Stationery', 'Pens, calculators, notebooks and stationery'
    UNION ALL SELECT 'Sports Equipment', 'Sports gear and fitness accessories'
    UNION ALL SELECT 'Other', 'Items not covered by the listed categories'
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM categories c WHERE c.category_name = seed.category_name);

-- 3. Campus root
INSERT INTO campus_locations
    (parent_location_id, location_code, location_name, location_type, data_status)
SELECT NULL, 'RR', 'RR Campus', 'CAMPUS', 'PROVISIONAL'
WHERE NOT EXISTS (
    SELECT 1 FROM campus_locations
    WHERE location_type = 'CAMPUS' AND location_name = 'RR Campus'
);

-- 4. Blocks
SET @rr_campus_id = (
    SELECT location_id FROM campus_locations
    WHERE location_type = 'CAMPUS' AND location_name = 'RR Campus'
    ORDER BY location_id LIMIT 1
);

INSERT INTO campus_locations
    (parent_location_id, location_code, location_name, location_type, data_status, source_data_status, verification_needed)
SELECT @rr_campus_id, seed.block_code, seed.block_name, 'BLOCK', 'PROVISIONAL',
       'Block name supplied in the campus dataset',
       'Confirm official block name and physical boundaries'
FROM (
    SELECT 'BE' AS block_code, 'BE Block' AS block_name
    UNION ALL SELECT 'F', 'F Block / Panini Block'
) AS seed
WHERE NOT EXISTS (
    SELECT 1 FROM campus_locations existing
    WHERE existing.parent_location_id = @rr_campus_id
      AND existing.location_type = 'BLOCK'
      AND existing.location_code = seed.block_code
);

-- 5. Floors (labels preserved exactly as supplied)

INSERT INTO campus_locations
    (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, data_status, source_data_status, verification_needed)
SELECT b.location_id, 'BE-00', 'Ground', 'FLOOR', 0, 'Ground', 'PROVISIONAL',
       'Floor record generated from supplied campus dataset',
       'Confirm physical floor mapping and signage'
FROM campus_locations b
WHERE b.location_type = 'BLOCK' AND b.location_code = 'BE'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = b.location_id
        AND existing.location_code = 'BE-00'
  );

INSERT INTO campus_locations
    (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, data_status, source_data_status, verification_needed)
SELECT b.location_id, 'BE-01', '1st Floor', 'FLOOR', 1, '1st Floor', 'PROVISIONAL',
       'Floor record generated from supplied campus dataset',
       'Confirm physical floor mapping and signage'
FROM campus_locations b
WHERE b.location_type = 'BLOCK' AND b.location_code = 'BE'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = b.location_id
        AND existing.location_code = 'BE-01'
  );

INSERT INTO campus_locations
    (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, data_status, source_data_status, verification_needed)
SELECT b.location_id, 'BE-02', '2nd Floor', 'FLOOR', 2, '2nd Floor', 'PROVISIONAL',
       'Floor record generated from supplied campus dataset',
       'Confirm physical floor mapping and signage'
FROM campus_locations b
WHERE b.location_type = 'BLOCK' AND b.location_code = 'BE'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = b.location_id
        AND existing.location_code = 'BE-02'
  );

INSERT INTO campus_locations
    (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, data_status, source_data_status, verification_needed)
SELECT b.location_id, 'BE-03', '3rd Floor', 'FLOOR', 3, '3rd Floor', 'PROVISIONAL',
       'Floor record generated from supplied campus dataset',
       'Confirm physical floor mapping and signage'
FROM campus_locations b
WHERE b.location_type = 'BLOCK' AND b.location_code = 'BE'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = b.location_id
        AND existing.location_code = 'BE-03'
  );

INSERT INTO campus_locations
    (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, data_status, source_data_status, verification_needed)
SELECT b.location_id, 'BE-04', '4th Floor', 'FLOOR', 4, '4th Floor', 'PROVISIONAL',
       'Floor record generated from supplied campus dataset',
       'Confirm physical floor mapping and signage'
FROM campus_locations b
WHERE b.location_type = 'BLOCK' AND b.location_code = 'BE'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = b.location_id
        AND existing.location_code = 'BE-04'
  );

INSERT INTO campus_locations
    (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, data_status, source_data_status, verification_needed)
SELECT b.location_id, 'BE-05', '5th Floor', 'FLOOR', 5, '5th Floor', 'PROVISIONAL',
       'Floor record generated from supplied campus dataset',
       'Confirm physical floor mapping and signage'
FROM campus_locations b
WHERE b.location_type = 'BLOCK' AND b.location_code = 'BE'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = b.location_id
        AND existing.location_code = 'BE-05'
  );

INSERT INTO campus_locations
    (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, data_status, source_data_status, verification_needed)
SELECT b.location_id, 'BE-06', '6th Floor', 'FLOOR', 6, '6th Floor', 'PROVISIONAL',
       'Floor record generated from supplied campus dataset',
       'Confirm physical floor mapping and signage'
FROM campus_locations b
WHERE b.location_type = 'BLOCK' AND b.location_code = 'BE'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = b.location_id
        AND existing.location_code = 'BE-06'
  );

INSERT INTO campus_locations
    (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, data_status, source_data_status, verification_needed)
SELECT b.location_id, 'BE-07', '7th Floor', 'FLOOR', 7, '7th Floor', 'PROVISIONAL',
       'Floor record generated from supplied campus dataset',
       'Confirm physical floor mapping and signage'
FROM campus_locations b
WHERE b.location_type = 'BLOCK' AND b.location_code = 'BE'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = b.location_id
        AND existing.location_code = 'BE-07'
  );

INSERT INTO campus_locations
    (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, data_status, source_data_status, verification_needed)
SELECT b.location_id, 'BE-08', '8th Floor', 'FLOOR', 8, '8th Floor', 'PROVISIONAL',
       'Floor record generated from supplied campus dataset',
       'Confirm physical floor mapping and signage'
FROM campus_locations b
WHERE b.location_type = 'BLOCK' AND b.location_code = 'BE'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = b.location_id
        AND existing.location_code = 'BE-08'
  );

INSERT INTO campus_locations
    (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, data_status, source_data_status, verification_needed)
SELECT b.location_id, 'BE-09', '9th Floor', 'FLOOR', 9, '9th Floor', 'PROVISIONAL',
       'Floor record generated from supplied campus dataset',
       'Confirm physical floor mapping and signage'
FROM campus_locations b
WHERE b.location_type = 'BLOCK' AND b.location_code = 'BE'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = b.location_id
        AND existing.location_code = 'BE-09'
  );

INSERT INTO campus_locations
    (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, data_status, source_data_status, verification_needed)
SELECT b.location_id, 'BE-10', '10th Floor', 'FLOOR', 10, '10th Floor', 'PROVISIONAL',
       'Floor record generated from supplied campus dataset',
       'Confirm physical floor mapping and signage'
FROM campus_locations b
WHERE b.location_type = 'BLOCK' AND b.location_code = 'BE'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = b.location_id
        AND existing.location_code = 'BE-10'
  );

INSERT INTO campus_locations
    (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, data_status, source_data_status, verification_needed)
SELECT b.location_id, 'BE-11', '11th Floor', 'FLOOR', 11, '11th Floor', 'PROVISIONAL',
       'Floor record generated from supplied campus dataset',
       'Confirm physical floor mapping and signage'
FROM campus_locations b
WHERE b.location_type = 'BLOCK' AND b.location_code = 'BE'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = b.location_id
        AND existing.location_code = 'BE-11'
  );

INSERT INTO campus_locations
    (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, data_status, source_data_status, verification_needed)
SELECT b.location_id, 'BE-12', '12th Floor', 'FLOOR', 12, '12th Floor', 'PROVISIONAL',
       'Floor record generated from supplied campus dataset',
       'Confirm physical floor mapping and signage'
FROM campus_locations b
WHERE b.location_type = 'BLOCK' AND b.location_code = 'BE'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = b.location_id
        AND existing.location_code = 'BE-12'
  );

INSERT INTO campus_locations
    (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, data_status, source_data_status, verification_needed)
SELECT b.location_id, 'F-01', 'Level 1 (physical floor mapping pending)', 'FLOOR', 1, 'Level 1 (physical floor mapping pending)', 'PROVISIONAL',
       'Floor record generated from supplied campus dataset',
       'Confirm physical floor mapping and signage'
FROM campus_locations b
WHERE b.location_type = 'BLOCK' AND b.location_code = 'F'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = b.location_id
        AND existing.location_code = 'F-01'
  );

INSERT INTO campus_locations
    (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, data_status, source_data_status, verification_needed)
SELECT b.location_id, 'F-02', 'Level 2 (physical floor mapping pending)', 'FLOOR', 2, 'Level 2 (physical floor mapping pending)', 'PROVISIONAL',
       'Floor record generated from supplied campus dataset',
       'Confirm physical floor mapping and signage'
FROM campus_locations b
WHERE b.location_type = 'BLOCK' AND b.location_code = 'F'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = b.location_id
        AND existing.location_code = 'F-02'
  );

INSERT INTO campus_locations
    (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, data_status, source_data_status, verification_needed)
SELECT b.location_id, 'F-03', 'Level 3 (physical floor mapping pending)', 'FLOOR', 3, 'Level 3 (physical floor mapping pending)', 'PROVISIONAL',
       'Floor record generated from supplied campus dataset',
       'Confirm physical floor mapping and signage'
FROM campus_locations b
WHERE b.location_type = 'BLOCK' AND b.location_code = 'F'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = b.location_id
        AND existing.location_code = 'F-03'
  );

INSERT INTO campus_locations
    (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, data_status, source_data_status, verification_needed)
SELECT b.location_id, 'F-04', 'Level 4 (physical floor mapping pending)', 'FLOOR', 4, 'Level 4 (physical floor mapping pending)', 'PROVISIONAL',
       'Floor record generated from supplied campus dataset',
       'Confirm physical floor mapping and signage'
FROM campus_locations b
WHERE b.location_type = 'BLOCK' AND b.location_code = 'F'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = b.location_id
        AND existing.location_code = 'F-04'
  );

INSERT INTO campus_locations
    (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, data_status, source_data_status, verification_needed)
SELECT b.location_id, 'F-05', 'Level 5 (physical floor mapping pending)', 'FLOOR', 5, 'Level 5 (physical floor mapping pending)', 'PROVISIONAL',
       'Floor record generated from supplied campus dataset',
       'Confirm physical floor mapping and signage'
FROM campus_locations b
WHERE b.location_type = 'BLOCK' AND b.location_code = 'F'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = b.location_id
        AND existing.location_code = 'F-05'
  );

INSERT INTO campus_locations
    (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, data_status, source_data_status, verification_needed)
SELECT b.location_id, 'F-06', 'Level 6 (physical floor mapping pending)', 'FLOOR', 6, 'Level 6 (physical floor mapping pending)', 'PROVISIONAL',
       'Floor record generated from supplied campus dataset',
       'Confirm physical floor mapping and signage'
FROM campus_locations b
WHERE b.location_type = 'BLOCK' AND b.location_code = 'F'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = b.location_id
        AND existing.location_code = 'F-06'
  );

INSERT INTO campus_locations
    (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, data_status, source_data_status, verification_needed)
SELECT b.location_id, 'F-07', 'Level 7 (physical floor mapping pending)', 'FLOOR', 7, 'Level 7 (physical floor mapping pending)', 'PROVISIONAL',
       'Floor record generated from supplied campus dataset',
       'Confirm physical floor mapping and signage'
FROM campus_locations b
WHERE b.location_type = 'BLOCK' AND b.location_code = 'F'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = b.location_id
        AND existing.location_code = 'F-07'
  );

INSERT INTO campus_locations
    (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, data_status, source_data_status, verification_needed)
SELECT b.location_id, 'F-08', 'Level 8 (physical floor mapping pending)', 'FLOOR', 8, 'Level 8 (physical floor mapping pending)', 'PROVISIONAL',
       'Floor record generated from supplied campus dataset',
       'Confirm physical floor mapping and signage'
FROM campus_locations b
WHERE b.location_type = 'BLOCK' AND b.location_code = 'F'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = b.location_id
        AND existing.location_code = 'F-08'
  );

-- 6. Room records (all 228 source rows; blank source values become NULL)
-- Room IDs, room type, use, equipment, source status and verification notes
-- are preserved from the supplied dataset.

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'G01', 'G01', 'ROOM', 0, 'Ground', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-00'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'G01'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'G02', 'G02', 'ROOM', 0, 'Ground', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-00'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'G02'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'G03', 'G03', 'ROOM', 0, 'Ground', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-00'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'G03'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'G04', 'G04', 'ROOM', 0, 'Ground', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-00'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'G04'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'G05', 'G05', 'ROOM', 0, 'Ground', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-00'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'G05'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'G06', 'G06', 'ROOM', 0, 'Ground', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-00'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'G06'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'G07', 'G07', 'ROOM', 0, 'Ground', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-00'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'G07'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'G08', 'G08', 'ROOM', 0, 'Ground', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-00'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'G08'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'G09', 'G09', 'ROOM', 0, 'Ground', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-00'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'G09'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'G10', 'G10', 'ROOM', 0, 'Ground', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-00'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'G10'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'G11', 'G11', 'ROOM', 0, 'Ground', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-00'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'G11'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'G12', 'G12', 'ROOM', 0, 'Ground', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-00'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'G12'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0101', 'B0101', 'ROOM', 1, '1st Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-01'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0101'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0102', 'B0102', 'ROOM', 1, '1st Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-01'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0102'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0103', 'B0103', 'ROOM', 1, '1st Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-01'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0103'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0104', 'B0104', 'ROOM', 1, '1st Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-01'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0104'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0105', 'B0105', 'ROOM', 1, '1st Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-01'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0105'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0106', 'B0106', 'ROOM', 1, '1st Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-01'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0106'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0107', 'B0107', 'ROOM', 1, '1st Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-01'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0107'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0108', 'B0108', 'ROOM', 1, '1st Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-01'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0108'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0109', 'B0109', 'ROOM', 1, '1st Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-01'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0109'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0110', 'B0110', 'ROOM', 1, '1st Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-01'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0110'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0111', 'B0111', 'ROOM', 1, '1st Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-01'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0111'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0112', 'B0112', 'ROOM', 1, '1st Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-01'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0112'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0201', 'B0201', 'ROOM', 2, '2nd Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-02'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0201'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0202', 'B0202', 'ROOM', 2, '2nd Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-02'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0202'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0203', 'B0203', 'ROOM', 2, '2nd Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-02'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0203'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0204', 'B0204', 'ROOM', 2, '2nd Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-02'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0204'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0205', 'B0205', 'ROOM', 2, '2nd Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-02'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0205'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0206', 'B0206', 'ROOM', 2, '2nd Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-02'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0206'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0207', 'B0207', 'ROOM', 2, '2nd Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-02'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0207'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0208', 'B0208', 'ROOM', 2, '2nd Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-02'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0208'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0209', 'B0209', 'ROOM', 2, '2nd Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-02'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0209'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0210', 'B0210', 'ROOM', 2, '2nd Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-02'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0210'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0211', 'B0211', 'ROOM', 2, '2nd Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-02'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0211'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0212', 'B0212', 'ROOM', 2, '2nd Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-02'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0212'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0301', 'B0301', 'ROOM', 3, '3rd Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-03'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0301'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0302', 'B0302', 'ROOM', 3, '3rd Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-03'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0302'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0303', 'B0303', 'ROOM', 3, '3rd Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-03'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0303'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0304', 'B0304', 'ROOM', 3, '3rd Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-03'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0304'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0305', 'B0305', 'ROOM', 3, '3rd Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-03'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0305'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0306', 'B0306', 'ROOM', 3, '3rd Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-03'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0306'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0307', 'B0307', 'ROOM', 3, '3rd Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-03'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0307'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0308', 'B0308', 'ROOM', 3, '3rd Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-03'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0308'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0309', 'B0309', 'ROOM', 3, '3rd Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-03'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0309'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0310', 'B0310', 'ROOM', 3, '3rd Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-03'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0310'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0311', 'B0311', 'ROOM', 3, '3rd Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-03'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0311'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0312', 'B0312', 'ROOM', 3, '3rd Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-03'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0312'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0401', 'B0401', 'ROOM', 4, '4th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-04'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0401'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0402', 'B0402', 'ROOM', 4, '4th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-04'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0402'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0403', 'B0403', 'ROOM', 4, '4th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-04'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0403'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0404', 'B0404', 'ROOM', 4, '4th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-04'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0404'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0405', 'B0405', 'ROOM', 4, '4th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-04'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0405'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0406', 'B0406', 'ROOM', 4, '4th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-04'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0406'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0407', 'B0407', 'ROOM', 4, '4th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-04'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0407'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0408', 'B0408', 'ROOM', 4, '4th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-04'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0408'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0409', 'B0409', 'ROOM', 4, '4th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-04'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0409'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0410', 'B0410', 'ROOM', 4, '4th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-04'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0410'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0411', 'B0411', 'ROOM', 4, '4th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-04'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0411'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0412', 'B0412', 'ROOM', 4, '4th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-04'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0412'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0501', 'B0501', 'ROOM', 5, '5th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-05'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0501'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0502', 'B0502', 'ROOM', 5, '5th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-05'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0502'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0503', 'B0503', 'ROOM', 5, '5th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-05'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0503'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0504', 'B0504', 'ROOM', 5, '5th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-05'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0504'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0505', 'B0505', 'ROOM', 5, '5th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-05'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0505'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0506', 'B0506', 'ROOM', 5, '5th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-05'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0506'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0507', 'B0507', 'ROOM', 5, '5th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-05'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0507'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0508', 'B0508', 'ROOM', 5, '5th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-05'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0508'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0509', 'B0509', 'ROOM', 5, '5th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-05'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0509'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0510', 'B0510', 'ROOM', 5, '5th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-05'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0510'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0511', 'B0511', 'ROOM', 5, '5th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-05'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0511'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0512', 'B0512', 'ROOM', 5, '5th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-05'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0512'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0601', 'B0601', 'ROOM', 6, '6th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-06'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0601'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0602', 'B0602', 'ROOM', 6, '6th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-06'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0602'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0603', 'B0603', 'ROOM', 6, '6th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-06'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0603'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0604', 'B0604', 'ROOM', 6, '6th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-06'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0604'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0605', 'B0605', 'ROOM', 6, '6th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-06'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0605'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0606', 'B0606', 'ROOM', 6, '6th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-06'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0606'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0607', 'B0607', 'ROOM', 6, '6th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-06'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0607'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0608', 'B0608', 'ROOM', 6, '6th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-06'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0608'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0609', 'B0609', 'ROOM', 6, '6th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-06'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0609'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0610', 'B0610', 'ROOM', 6, '6th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-06'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0610'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0611', 'B0611', 'ROOM', 6, '6th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-06'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0611'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0612', 'B0612', 'ROOM', 6, '6th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-06'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0612'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0701', 'B0701', 'ROOM', 7, '7th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-07'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0701'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0702', 'B0702', 'ROOM', 7, '7th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-07'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0702'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0703', 'B0703', 'ROOM', 7, '7th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-07'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0703'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0704', 'B0704', 'ROOM', 7, '7th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-07'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0704'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0705', 'B0705', 'ROOM', 7, '7th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-07'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0705'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0706', 'B0706', 'ROOM', 7, '7th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-07'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0706'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0707', 'B0707', 'ROOM', 7, '7th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-07'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0707'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0708', 'B0708', 'ROOM', 7, '7th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-07'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0708'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0709', 'B0709', 'ROOM', 7, '7th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-07'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0709'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0710', 'B0710', 'ROOM', 7, '7th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-07'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0710'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0711', 'B0711', 'ROOM', 7, '7th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-07'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0711'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0712', 'B0712', 'ROOM', 7, '7th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-07'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0712'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0801', 'B0801', 'ROOM', 8, '8th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-08'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0801'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0802', 'B0802', 'ROOM', 8, '8th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-08'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0802'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0803', 'B0803', 'ROOM', 8, '8th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-08'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0803'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0804', 'B0804', 'ROOM', 8, '8th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-08'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0804'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0805', 'B0805', 'ROOM', 8, '8th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-08'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0805'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0806', 'B0806', 'ROOM', 8, '8th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-08'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0806'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0807', 'B0807', 'ROOM', 8, '8th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-08'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0807'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0808', 'B0808', 'ROOM', 8, '8th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-08'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0808'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0809', 'B0809', 'ROOM', 8, '8th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-08'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0809'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0810', 'B0810', 'ROOM', 8, '8th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-08'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0810'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0811', 'B0811', 'ROOM', 8, '8th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-08'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0811'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0812', 'B0812', 'ROOM', 8, '8th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-08'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0812'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0901', 'B0901', 'ROOM', 9, '9th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-09'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0901'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0902', 'B0902', 'ROOM', 9, '9th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-09'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0902'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0903', 'B0903', 'ROOM', 9, '9th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-09'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0903'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0904', 'B0904', 'ROOM', 9, '9th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-09'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0904'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0905', 'B0905', 'ROOM', 9, '9th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-09'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0905'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0906', 'B0906', 'ROOM', 9, '9th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-09'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0906'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0907', 'B0907', 'ROOM', 9, '9th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-09'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0907'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0908', 'B0908', 'ROOM', 9, '9th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-09'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0908'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0909', 'B0909', 'ROOM', 9, '9th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-09'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0909'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0910', 'B0910', 'ROOM', 9, '9th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-09'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0910'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0911', 'B0911', 'ROOM', 9, '9th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-09'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0911'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B0912', 'B0912', 'ROOM', 9, '9th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-09'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B0912'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B1001', 'B1001', 'ROOM', 10, '10th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-10'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B1001'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B1002', 'B1002', 'ROOM', 10, '10th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-10'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B1002'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B1003', 'B1003', 'ROOM', 10, '10th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-10'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B1003'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B1004', 'B1004', 'ROOM', 10, '10th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-10'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B1004'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B1005', 'B1005', 'ROOM', 10, '10th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-10'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B1005'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B1006', 'B1006', 'ROOM', 10, '10th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-10'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B1006'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B1007', 'B1007', 'ROOM', 10, '10th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-10'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B1007'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B1008', 'B1008', 'ROOM', 10, '10th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-10'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B1008'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B1009', 'B1009', 'ROOM', 10, '10th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-10'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B1009'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B1010', 'B1010', 'ROOM', 10, '10th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-10'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B1010'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B1011', 'B1011', 'ROOM', 10, '10th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-10'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B1011'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B1012', 'B1012', 'ROOM', 10, '10th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-10'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B1012'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B1101', 'B1101', 'ROOM', 11, '11th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-11'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B1101'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B1102', 'B1102', 'ROOM', 11, '11th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-11'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B1102'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B1103', 'B1103', 'ROOM', 11, '11th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-11'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B1103'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B1104', 'B1104', 'ROOM', 11, '11th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-11'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B1104'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B1105', 'B1105', 'ROOM', 11, '11th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-11'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B1105'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B1106', 'B1106', 'ROOM', 11, '11th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-11'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B1106'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B1107', 'B1107', 'ROOM', 11, '11th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-11'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B1107'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B1108', 'B1108', 'ROOM', 11, '11th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-11'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B1108'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B1109', 'B1109', 'ROOM', 11, '11th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-11'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B1109'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B1110', 'B1110', 'ROOM', 11, '11th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-11'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B1110'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B1111', 'B1111', 'ROOM', 11, '11th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-11'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B1111'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B1112', 'B1112', 'ROOM', 11, '11th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-11'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B1112'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B1201', 'B1201', 'ROOM', 12, '12th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-12'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B1201'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B1202', 'B1202', 'ROOM', 12, '12th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-12'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B1202'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B1203', 'B1203', 'ROOM', 12, '12th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-12'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B1203'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B1204', 'B1204', 'ROOM', 12, '12th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-12'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B1204'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B1205', 'B1205', 'ROOM', 12, '12th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-12'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B1205'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B1206', 'B1206', 'ROOM', 12, '12th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-12'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B1206'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B1207', 'B1207', 'ROOM', 12, '12th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-12'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B1207'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B1208', 'B1208', 'ROOM', 12, '12th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-12'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B1208'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B1209', 'B1209', 'ROOM', 12, '12th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-12'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B1209'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B1210', 'B1210', 'ROOM', 12, '12th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-12'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B1210'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B1211', 'B1211', 'ROOM', 12, '12th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-12'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B1211'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'B1212', 'B1212', 'ROOM', 12, '12th Floor', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional ID generated from user''s numbering pattern', 'Confirm physical room exists, signage, use and exact location'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'BE-12'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'B1212'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'F0101', 'F0101', 'ROOM', 1, 'Level 1 (physical floor mapping pending)', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional placeholder; numbering convention not supplied', 'Confirm actual floor label, room ID, use and whether basement/8th floor included'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'F-01'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'F0101'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'F0102', 'F0102', 'ROOM', 1, 'Level 1 (physical floor mapping pending)', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional placeholder; numbering convention not supplied', 'Confirm actual floor label, room ID, use and whether basement/8th floor included'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'F-01'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'F0102'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'F0103', 'F0103', 'ROOM', 1, 'Level 1 (physical floor mapping pending)', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional placeholder; numbering convention not supplied', 'Confirm actual floor label, room ID, use and whether basement/8th floor included'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'F-01'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'F0103'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'F0104', 'F0104', 'ROOM', 1, 'Level 1 (physical floor mapping pending)', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional placeholder; numbering convention not supplied', 'Confirm actual floor label, room ID, use and whether basement/8th floor included'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'F-01'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'F0104'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'F0105', 'F0105', 'ROOM', 1, 'Level 1 (physical floor mapping pending)', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional placeholder; numbering convention not supplied', 'Confirm actual floor label, room ID, use and whether basement/8th floor included'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'F-01'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'F0105'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'F0106', 'F0106', 'ROOM', 1, 'Level 1 (physical floor mapping pending)', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional placeholder; numbering convention not supplied', 'Confirm actual floor label, room ID, use and whether basement/8th floor included'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'F-01'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'F0106'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'F0107', 'F0107', 'ROOM', 1, 'Level 1 (physical floor mapping pending)', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional placeholder; numbering convention not supplied', 'Confirm actual floor label, room ID, use and whether basement/8th floor included'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'F-01'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'F0107'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'F0108', 'F0108', 'ROOM', 1, 'Level 1 (physical floor mapping pending)', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional placeholder; numbering convention not supplied', 'Confirm actual floor label, room ID, use and whether basement/8th floor included'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'F-01'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'F0108'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'F0109', 'F0109', 'ROOM', 1, 'Level 1 (physical floor mapping pending)', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional placeholder; numbering convention not supplied', 'Confirm actual floor label, room ID, use and whether basement/8th floor included'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'F-01'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'F0109'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'F0201', 'F0201', 'ROOM', 2, 'Level 2 (physical floor mapping pending)', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional placeholder; numbering convention not supplied', 'Confirm actual floor label, room ID, use and whether basement/8th floor included'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'F-02'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'F0201'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'F0202', 'F0202', 'ROOM', 2, 'Level 2 (physical floor mapping pending)', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional placeholder; numbering convention not supplied', 'Confirm actual floor label, room ID, use and whether basement/8th floor included'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'F-02'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'F0202'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'F0203', 'F0203', 'ROOM', 2, 'Level 2 (physical floor mapping pending)', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional placeholder; numbering convention not supplied', 'Confirm actual floor label, room ID, use and whether basement/8th floor included'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'F-02'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'F0203'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'F0204', 'F0204', 'ROOM', 2, 'Level 2 (physical floor mapping pending)', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional placeholder; numbering convention not supplied', 'Confirm actual floor label, room ID, use and whether basement/8th floor included'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'F-02'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'F0204'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'F0205', 'F0205', 'ROOM', 2, 'Level 2 (physical floor mapping pending)', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional placeholder; numbering convention not supplied', 'Confirm actual floor label, room ID, use and whether basement/8th floor included'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'F-02'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'F0205'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'F0206', 'F0206', 'ROOM', 2, 'Level 2 (physical floor mapping pending)', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional placeholder; numbering convention not supplied', 'Confirm actual floor label, room ID, use and whether basement/8th floor included'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'F-02'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'F0206'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'F0207', 'F0207', 'ROOM', 2, 'Level 2 (physical floor mapping pending)', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional placeholder; numbering convention not supplied', 'Confirm actual floor label, room ID, use and whether basement/8th floor included'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'F-02'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'F0207'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'F0208', 'F0208', 'ROOM', 2, 'Level 2 (physical floor mapping pending)', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional placeholder; numbering convention not supplied', 'Confirm actual floor label, room ID, use and whether basement/8th floor included'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'F-02'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'F0208'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'F0209', 'F0209', 'ROOM', 2, 'Level 2 (physical floor mapping pending)', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional placeholder; numbering convention not supplied', 'Confirm actual floor label, room ID, use and whether basement/8th floor included'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'F-02'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'F0209'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'F0301', 'F0301', 'ROOM', 3, 'Level 3 (physical floor mapping pending)', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional placeholder; numbering convention not supplied', 'Confirm actual floor label, room ID, use and whether basement/8th floor included'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'F-03'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'F0301'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'F0302', 'F0302', 'ROOM', 3, 'Level 3 (physical floor mapping pending)', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional placeholder; numbering convention not supplied', 'Confirm actual floor label, room ID, use and whether basement/8th floor included'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'F-03'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'F0302'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'F0303', 'F0303', 'ROOM', 3, 'Level 3 (physical floor mapping pending)', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional placeholder; numbering convention not supplied', 'Confirm actual floor label, room ID, use and whether basement/8th floor included'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'F-03'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'F0303'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'F0304', 'F0304', 'ROOM', 3, 'Level 3 (physical floor mapping pending)', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional placeholder; numbering convention not supplied', 'Confirm actual floor label, room ID, use and whether basement/8th floor included'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'F-03'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'F0304'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'F0305', 'F0305', 'ROOM', 3, 'Level 3 (physical floor mapping pending)', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional placeholder; numbering convention not supplied', 'Confirm actual floor label, room ID, use and whether basement/8th floor included'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'F-03'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'F0305'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'F0306', 'F0306', 'ROOM', 3, 'Level 3 (physical floor mapping pending)', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional placeholder; numbering convention not supplied', 'Confirm actual floor label, room ID, use and whether basement/8th floor included'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'F-03'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'F0306'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'F0307', 'F0307', 'ROOM', 3, 'Level 3 (physical floor mapping pending)', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional placeholder; numbering convention not supplied', 'Confirm actual floor label, room ID, use and whether basement/8th floor included'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'F-03'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'F0307'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'F0308', 'F0308', 'ROOM', 3, 'Level 3 (physical floor mapping pending)', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional placeholder; numbering convention not supplied', 'Confirm actual floor label, room ID, use and whether basement/8th floor included'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'F-03'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'F0308'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'F0309', 'F0309', 'ROOM', 3, 'Level 3 (physical floor mapping pending)', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional placeholder; numbering convention not supplied', 'Confirm actual floor label, room ID, use and whether basement/8th floor included'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'F-03'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'F0309'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'F0401', 'F0401', 'ROOM', 4, 'Level 4 (physical floor mapping pending)', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional placeholder; numbering convention not supplied', 'Confirm actual floor label, room ID, use and whether basement/8th floor included'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'F-04'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'F0401'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'F0402', 'F0402', 'ROOM', 4, 'Level 4 (physical floor mapping pending)', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional placeholder; numbering convention not supplied', 'Confirm actual floor label, room ID, use and whether basement/8th floor included'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'F-04'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'F0402'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'F0403', 'F0403', 'ROOM', 4, 'Level 4 (physical floor mapping pending)', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional placeholder; numbering convention not supplied', 'Confirm actual floor label, room ID, use and whether basement/8th floor included'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'F-04'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'F0403'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'F0404', 'F0404', 'ROOM', 4, 'Level 4 (physical floor mapping pending)', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional placeholder; numbering convention not supplied', 'Confirm actual floor label, room ID, use and whether basement/8th floor included'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'F-04'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'F0404'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'F0405', 'F0405', 'ROOM', 4, 'Level 4 (physical floor mapping pending)', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional placeholder; numbering convention not supplied', 'Confirm actual floor label, room ID, use and whether basement/8th floor included'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'F-04'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'F0405'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'F0406', 'F0406', 'ROOM', 4, 'Level 4 (physical floor mapping pending)', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional placeholder; numbering convention not supplied', 'Confirm actual floor label, room ID, use and whether basement/8th floor included'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'F-04'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'F0406'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'F0407', 'F0407', 'ROOM', 4, 'Level 4 (physical floor mapping pending)', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional placeholder; numbering convention not supplied', 'Confirm actual floor label, room ID, use and whether basement/8th floor included'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'F-04'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'F0407'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'F0408', 'F0408', 'ROOM', 4, 'Level 4 (physical floor mapping pending)', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional placeholder; numbering convention not supplied', 'Confirm actual floor label, room ID, use and whether basement/8th floor included'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'F-04'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'F0408'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'F0409', 'F0409', 'ROOM', 4, 'Level 4 (physical floor mapping pending)', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional placeholder; numbering convention not supplied', 'Confirm actual floor label, room ID, use and whether basement/8th floor included'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'F-04'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'F0409'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'F0501', 'F0501', 'ROOM', 5, 'Level 5 (physical floor mapping pending)', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional placeholder; numbering convention not supplied', 'Confirm actual floor label, room ID, use and whether basement/8th floor included'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'F-05'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'F0501'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'F0502', 'F0502', 'ROOM', 5, 'Level 5 (physical floor mapping pending)', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional placeholder; numbering convention not supplied', 'Confirm actual floor label, room ID, use and whether basement/8th floor included'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'F-05'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'F0502'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'F0503', 'F0503', 'ROOM', 5, 'Level 5 (physical floor mapping pending)', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional placeholder; numbering convention not supplied', 'Confirm actual floor label, room ID, use and whether basement/8th floor included'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'F-05'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'F0503'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'F0504', 'F0504', 'ROOM', 5, 'Level 5 (physical floor mapping pending)', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional placeholder; numbering convention not supplied', 'Confirm actual floor label, room ID, use and whether basement/8th floor included'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'F-05'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'F0504'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'F0505', 'F0505', 'ROOM', 5, 'Level 5 (physical floor mapping pending)', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional placeholder; numbering convention not supplied', 'Confirm actual floor label, room ID, use and whether basement/8th floor included'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'F-05'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'F0505'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'F0506', 'F0506', 'ROOM', 5, 'Level 5 (physical floor mapping pending)', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional placeholder; numbering convention not supplied', 'Confirm actual floor label, room ID, use and whether basement/8th floor included'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'F-05'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'F0506'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'F0507', 'F0507', 'ROOM', 5, 'Level 5 (physical floor mapping pending)', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional placeholder; numbering convention not supplied', 'Confirm actual floor label, room ID, use and whether basement/8th floor included'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'F-05'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'F0507'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'F0508', 'F0508', 'ROOM', 5, 'Level 5 (physical floor mapping pending)', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional placeholder; numbering convention not supplied', 'Confirm actual floor label, room ID, use and whether basement/8th floor included'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'F-05'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'F0508'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'F0509', 'F0509', 'ROOM', 5, 'Level 5 (physical floor mapping pending)', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional placeholder; numbering convention not supplied', 'Confirm actual floor label, room ID, use and whether basement/8th floor included'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'F-05'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'F0509'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'F0601', 'F0601', 'ROOM', 6, 'Level 6 (physical floor mapping pending)', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional placeholder; numbering convention not supplied', 'Confirm actual floor label, room ID, use and whether basement/8th floor included'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'F-06'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'F0601'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'F0602', 'F0602', 'ROOM', 6, 'Level 6 (physical floor mapping pending)', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional placeholder; numbering convention not supplied', 'Confirm actual floor label, room ID, use and whether basement/8th floor included'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'F-06'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'F0602'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'F0603', 'F0603', 'ROOM', 6, 'Level 6 (physical floor mapping pending)', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional placeholder; numbering convention not supplied', 'Confirm actual floor label, room ID, use and whether basement/8th floor included'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'F-06'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'F0603'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'F0604', 'F0604', 'ROOM', 6, 'Level 6 (physical floor mapping pending)', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional placeholder; numbering convention not supplied', 'Confirm actual floor label, room ID, use and whether basement/8th floor included'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'F-06'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'F0604'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'F0605', 'F0605', 'ROOM', 6, 'Level 6 (physical floor mapping pending)', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional placeholder; numbering convention not supplied', 'Confirm actual floor label, room ID, use and whether basement/8th floor included'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'F-06'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'F0605'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'F0606', 'F0606', 'ROOM', 6, 'Level 6 (physical floor mapping pending)', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional placeholder; numbering convention not supplied', 'Confirm actual floor label, room ID, use and whether basement/8th floor included'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'F-06'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'F0606'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'F0607', 'F0607', 'ROOM', 6, 'Level 6 (physical floor mapping pending)', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional placeholder; numbering convention not supplied', 'Confirm actual floor label, room ID, use and whether basement/8th floor included'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'F-06'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'F0607'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'F0608', 'F0608', 'ROOM', 6, 'Level 6 (physical floor mapping pending)', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional placeholder; numbering convention not supplied', 'Confirm actual floor label, room ID, use and whether basement/8th floor included'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'F-06'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'F0608'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'F0609', 'F0609', 'ROOM', 6, 'Level 6 (physical floor mapping pending)', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional placeholder; numbering convention not supplied', 'Confirm actual floor label, room ID, use and whether basement/8th floor included'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'F-06'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'F0609'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'F0701', 'F0701', 'ROOM', 7, 'Level 7 (physical floor mapping pending)', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional placeholder; numbering convention not supplied', 'Confirm actual floor label, room ID, use and whether basement/8th floor included'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'F-07'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'F0701'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'F0702', 'F0702', 'ROOM', 7, 'Level 7 (physical floor mapping pending)', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional placeholder; numbering convention not supplied', 'Confirm actual floor label, room ID, use and whether basement/8th floor included'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'F-07'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'F0702'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'F0703', 'F0703', 'ROOM', 7, 'Level 7 (physical floor mapping pending)', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional placeholder; numbering convention not supplied', 'Confirm actual floor label, room ID, use and whether basement/8th floor included'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'F-07'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'F0703'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'F0704', 'F0704', 'ROOM', 7, 'Level 7 (physical floor mapping pending)', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional placeholder; numbering convention not supplied', 'Confirm actual floor label, room ID, use and whether basement/8th floor included'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'F-07'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'F0704'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'F0705', 'F0705', 'ROOM', 7, 'Level 7 (physical floor mapping pending)', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional placeholder; numbering convention not supplied', 'Confirm actual floor label, room ID, use and whether basement/8th floor included'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'F-07'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'F0705'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'F0706', 'F0706', 'ROOM', 7, 'Level 7 (physical floor mapping pending)', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional placeholder; numbering convention not supplied', 'Confirm actual floor label, room ID, use and whether basement/8th floor included'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'F-07'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'F0706'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'F0707', 'F0707', 'ROOM', 7, 'Level 7 (physical floor mapping pending)', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional placeholder; numbering convention not supplied', 'Confirm actual floor label, room ID, use and whether basement/8th floor included'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'F-07'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'F0707'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'F0708', 'F0708', 'ROOM', 7, 'Level 7 (physical floor mapping pending)', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional placeholder; numbering convention not supplied', 'Confirm actual floor label, room ID, use and whether basement/8th floor included'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'F-07'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'F0708'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'F0709', 'F0709', 'ROOM', 7, 'Level 7 (physical floor mapping pending)', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional placeholder; numbering convention not supplied', 'Confirm actual floor label, room ID, use and whether basement/8th floor included'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'F-07'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'F0709'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'F0801', 'F0801', 'ROOM', 8, 'Level 8 (physical floor mapping pending)', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional placeholder; numbering convention not supplied', 'Confirm actual floor label, room ID, use and whether basement/8th floor included'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'F-08'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'F0801'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'F0802', 'F0802', 'ROOM', 8, 'Level 8 (physical floor mapping pending)', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional placeholder; numbering convention not supplied', 'Confirm actual floor label, room ID, use and whether basement/8th floor included'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'F-08'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'F0802'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'F0803', 'F0803', 'ROOM', 8, 'Level 8 (physical floor mapping pending)', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional placeholder; numbering convention not supplied', 'Confirm actual floor label, room ID, use and whether basement/8th floor included'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'F-08'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'F0803'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'F0804', 'F0804', 'ROOM', 8, 'Level 8 (physical floor mapping pending)', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional placeholder; numbering convention not supplied', 'Confirm actual floor label, room ID, use and whether basement/8th floor included'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'F-08'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'F0804'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'F0805', 'F0805', 'ROOM', 8, 'Level 8 (physical floor mapping pending)', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional placeholder; numbering convention not supplied', 'Confirm actual floor label, room ID, use and whether basement/8th floor included'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'F-08'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'F0805'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'F0806', 'F0806', 'ROOM', 8, 'Level 8 (physical floor mapping pending)', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional placeholder; numbering convention not supplied', 'Confirm actual floor label, room ID, use and whether basement/8th floor included'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'F-08'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'F0806'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'F0807', 'F0807', 'ROOM', 8, 'Level 8 (physical floor mapping pending)', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional placeholder; numbering convention not supplied', 'Confirm actual floor label, room ID, use and whether basement/8th floor included'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'F-08'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'F0807'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'F0808', 'F0808', 'ROOM', 8, 'Level 8 (physical floor mapping pending)', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional placeholder; numbering convention not supplied', 'Confirm actual floor label, room ID, use and whether basement/8th floor included'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'F-08'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'F0808'
  );

INSERT INTO campus_locations (parent_location_id, location_code, location_name, location_type, floor_number, floor_name, room_type, department_or_use, capacity, equipment, location_notes, data_status, source_data_status, verification_needed)
SELECT f.location_id, 'F0809', 'F0809', 'ROOM', 8, 'Level 8 (physical floor mapping pending)', 'Unclassified room slot', 'Not yet verified', NULL, 'Not yet verified', NULL, 'PROVISIONAL', 'Provisional placeholder; numbering convention not supplied', 'Confirm actual floor label, room ID, use and whether basement/8th floor included'
FROM campus_locations f
WHERE f.location_type = 'FLOOR' AND f.location_code = 'F-08'
  AND NOT EXISTS (
      SELECT 1 FROM campus_locations existing
      WHERE existing.parent_location_id = f.location_id
        AND existing.location_code = 'F0809'
  );

COMMIT;

-- 7. Verification summary
SELECT location_type, data_status, COUNT(*) AS record_count
FROM campus_locations
GROUP BY location_type, data_status
ORDER BY location_type, data_status;

SELECT COUNT(*) AS provisional_room_records
FROM campus_locations
WHERE location_type = 'ROOM' AND data_status = 'PROVISIONAL';

-- Expected room count from the supplied dataset: 228.
-- ============================================================
