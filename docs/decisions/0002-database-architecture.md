# Database Architecture

## Context and Problem Statement

The app should be run on multiple devices at once, how do we ensure concurrent read and writes?

## Considered Options

* SQLite
* PostgreSQL

## Decision Outcome

Chosen option: "PostgreSQL", because it ensures concurrent writes to the database and does not lock the write.
