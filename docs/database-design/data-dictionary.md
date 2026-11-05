
# LostLink — Database Data Dictionary

## 1. USERS

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| user_id | BIGINT | PK, AUTO_INCREMENT | Unique user ID |
| full_name | VARCHAR(100) | NOT NULL | Full name |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Login email |
| password_hash | VARCHAR(255) | NOT NULL | Hashed password |
| university_id | VARCHAR(50) | UNIQUE | University identifier |
| phone_number | VARCHAR(20) | NULL | Contact number |
| account_status | ENUM | NOT NULL, DEFAULT ACTIVE | Account status |
| email_verified | BOOLEAN | DEFAULT FALSE | Email verification |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | DATETIME | ON UPDATE CURRENT_TIMESTAMP | Last update |

## 2. ROLES

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| role_id | INT | PK, AUTO_INCREMENT | Unique role ID |
| role_name | VARCHAR(30) | UNIQUE, NOT NULL | STUDENT / MODERATOR / ADMIN |
| description | VARCHAR(255) | NULL | Role description |

## 3. USER_ROLES

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| user_id | BIGINT | PK, FK | References USERS |
| role_id | INT | PK, FK | References ROLES |
| assigned_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Assignment timestamp |
| assigned_by | BIGINT | FK, NULL | Role assigning user |

Composite Primary Key: (user_id, role_id)
