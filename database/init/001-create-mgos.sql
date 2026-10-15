\set ON_ERROR_STOP on

\if :{?app_role}
\else
  \set app_role mgos
\endif
\if :{?db_name}
\else
  \set db_name mgos
\endif

SELECT format(
    'CREATE ROLE %I LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE',
    :'app_role'
)
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'app_role')
\gexec

SELECT format('CREATE DATABASE %I OWNER %I', :'db_name', :'app_role')
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = :'db_name')
\gexec

\connect :db_name

CREATE EXTENSION IF NOT EXISTS postgis;
SELECT version();
SELECT PostGIS_Full_Version();