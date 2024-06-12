FROM postgis/postgis

COPY ./scripts/init-db.sh /docker-entrypoint-initdb.d/
COPY ./seed/dump.sql ./dumps/dump.sql