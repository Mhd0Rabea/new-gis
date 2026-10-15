\set ON_ERROR_STOP on

\if :{?app_role}
\else
  \set app_role mgos
\endif
\if :{?db_name}
\else
  \set db_name mgos
\endif
\if :{?schema_name}
\else
  \set schema_name mgos
\endif

SELECT format(
    'CREATE SCHEMA IF NOT EXISTS %I AUTHORIZATION %I',
    :'schema_name', :'app_role'
)
\gexec

SELECT format('ALTER SCHEMA %I OWNER TO %I', :'schema_name', :'app_role')
\gexec

SELECT format(
    'ALTER ROLE %I IN DATABASE %I SET search_path = %I, public',
    :'app_role', :'db_name', :'schema_name'
)
\gexec

SELECT format(
    'GRANT USAGE, CREATE ON SCHEMA %I TO %I',
    :'schema_name', :'app_role'
)
\gexec