# Archived QR Payment Setup

This document is archived and no longer describes the active checkout implementation.

## Current Status

The present GamePasal application does not use QR payment as the customer checkout method. The active checkout path is eSewa.

## Reason for Retention

This file remains for historical context only. It may help explain:

- previous experiments in payment handling
- repository history
- design decisions discussed during project review

## Do Not Use This as Current Setup

For the current system, rely on:

- [README.md](D:\GamePasals\README.md)
- [MIGRATION.md](D:\GamePasals\MIGRATION.md)

## If You Need to Remove Legacy QR Code

Before deleting any QR-related code or docs:

1. confirm it is not mounted in the backend router
2. confirm it is not linked from the frontend
3. confirm no admin workflow still depends on it
4. verify frontend build and backend syntax checks afterward

