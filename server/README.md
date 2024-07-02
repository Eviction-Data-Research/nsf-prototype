# Server

## Technologies

### FastAPI

[FastAPI](https://fastapi.tiangolo.com/) is an API framework for Python, designed for quick development and easy deployment to production.

### SQLAlchemy2

[SQLAlchemy](https://www.sqlalchemy.org/) facilitates queries to SQL database and also acts as an object relational mapper.

## Directory Structure

### /src/controllers

The **controller** part of the MVC pattern. Organized into functions dealing with CARES Act records, eviction records, exports, and suggestions, these methods control how data is queried and processed from the database. Usually, the controllers are responsible for making the call to the database.

### /src/db

The **model** part of the MVC pattern. Describes database schema and houses code related strictly to the operation of the database.

> [!IMPORTANT]
> Exact models are defined in `/src/db/models`, but see the README in the `db` directory from the repository's **root** for more specific details on the schemas of the tables.

### /src/routers

A Python module mirroring the concept of [routers](https://fastapi.tiangolo.com/tutorial/bigger-applications/) in FastAPI. Systematically separates related endpoints together in subdomain parts. For example, `routers/cares` corresponds to an endpoint of `https://<host>/cares`.

### /src/utils

Defines utility functions for establishing connections to the database and constants used throughout the project.
