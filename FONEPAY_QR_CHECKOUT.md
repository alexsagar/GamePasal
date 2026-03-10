# Archived Fonepay QR Checkout Notes

This file is retained as historical documentation only.

## Status

The Fonepay QR checkout flow described in earlier versions of the project is not part of the current live customer checkout implementation.

## Current Checkout Method

The active GamePasal checkout flow uses:

- `eSewa` only

## Why This File Still Exists

This document remains in the repository for:

- migration reference
- viva discussion about earlier design decisions
- understanding legacy code that may still exist in non-active paths

## Important Warning

Do not use this file as the source of truth for current payment behavior. For current project behavior, follow:

- [README.md](D:\GamePasals\README.md)
- [MIGRATION.md](D:\GamePasals\MIGRATION.md)

## Historical Summary

The earlier QR checkout concept included:

- manual QR payment submission
- receipt verification
- admin-side confirmation workflow
- payment status polling

Those ideas are no longer the active customer path in the present codebase.

