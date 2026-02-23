# Database Architecture

## Context and Problem Statement

Which database type would be best for the project, when our requirement is that the application only needs to run on a local device?

## Considered Options

* SQLite
* PostgreSQL

## Decision Outcome

Chosen option: "SQLite", because we do not require a server and multiple users concurrently which PostgreSQL would offer. Therefore, we have chosen SQLite, because it lets the application run on localhost.
