#!/bin/bash

psql -U $POSTGRES_USER -d $POSTGRES_DB -a -f /dumps/dump.sql nsf-prototype