# Migration Notes

This document describes the current migration direction of the GamePasal project and records the move away from legacy payment experiments toward the active production path.

## Purpose

The repository previously contained multiple overlapping payment approaches, including wallet-based flows and QR-based manual verification. The active application has been consolidated around a simpler and more maintainable checkout model.

## Current Target State

The intended live state is:

- single customer checkout method through `eSewa`
- no wallet-based checkout path
- no active Fonepay QR checkout path
- centralized order-state transitions
- order totals derived from actual product price data

## Major Migration Changes

### Checkout

- Removed wallet-based checkout from the active customer flow
- Removed QR-based customer checkout from the active customer flow
- Standardized payment initiation through eSewa
- Fixed cart clearing so items are removed only after verified payment success

### Order Workflow

- Standardized canonical order statuses
- Centralized order transition rules in the state machine
- Enforced valid transitions for payment, processing, delivery, completion, cancellation, failure, and refund states

### Product Catalog

- Unified sorting and filtering behavior
- Added content-based recommendations
- Standardized recommendation scoring and fallback behavior

### Admin

- Updated product loading to fetch full admin catalog data
- Added order view and delete actions
- Improved filtering behavior in product management

## Legacy Areas Still Present in the Repository

Some files remain in the repository for historical or transitional reasons. They should not be treated as the active customer payment architecture:

- old QR payment pages and setup notes
- archived payment intent references
- earlier wallet-oriented model fields

If a future cleanup pass is planned, these areas can be removed after confirming they are no longer needed for reference or migration history.

## Recommended Cleanup Sequence

1. Keep the eSewa verification flow stable.
2. Confirm all checkout totals match the backend source of truth.
3. Remove any unused payment UI that is not reachable from the live app.
4. Remove dead backend routes and models only after route-level verification.
5. Re-run lint and build checks after each cleanup phase.

## Verification Checklist

- Cart total matches checkout total
- Checkout total matches eSewa request amount
- Verified eSewa callback moves order to `payment_verified`
- Cart clears only after verified payment success
- Admin can view, update, fulfill, and delete eligible orders
- Product and gift card listings show complete admin data

