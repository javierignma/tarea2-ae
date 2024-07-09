#!/bin/bash

sqlite3 ./db/iot_api.db ".read ./api.sql"
