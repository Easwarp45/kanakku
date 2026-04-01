# UPI Split Payments — Discovery + Implementation Blueprint

This document captures what the current Kanakku app already supports for splits/UPI, what is missing for production-grade UPI split payments, and a concrete implementation plan. Fill the discovery section before locking the architecture and PSP choice.

## Current State (from code)
- Groups + expense splits: group expenses and member splits are created via [src/pages/AddGroupExpense.tsx](../src/pages/AddGroupExpense.tsx) and [src/hooks/useGroups.ts](../src/hooks/useGroups.ts); data lives in `group_expenses` + `expense_splits`.
- Settlements (manual): users record off-platform payments in [src/pages/SettleUp.tsx](../src/pages/SettleUp.tsx) using `settlements` table; no real payment rail.
- UPI demo: [src/pages/UPIIntegration.tsx](../src/pages/UPIIntegration.tsx) + [src/hooks/useUPIDemo.ts](../src/hooks/useUPIDemo.ts) simulate SMS parsing and add expenses but do not create collect requests, handle webhooks, or tie to groups/splits.
- Currency layer: conversions happen client-side to a base currency (see [src/hooks/useCurrency.ts](../src/hooks/useCurrency.ts)). Amounts stored in INR-equivalent; keep that invariant for PSP amounts (paise integers).

## Scope note: offline-only splits (no payment gateway)
Per latest requirement, there is **no PSP/UPI collect or payout**. The app remains an expense ledger that splits amounts and tracks who owes whom. Settlements are recorded manually; balances clear when users mark as settled.

## Discovery (answered)
- **Use case & model**: P2P friend groups (roommates, trips, dinners); 2–6 people; one-time per expense; payer initiates; typical ₹100–₹10,000.
- **PSP/aggregator**: **None (offline ledger)** — no collect requests or payouts.
- **Split mechanics**: Equal or custom amounts; payer decides; no recurring/mandates; max 6 recipients.
- **Settlement model**: Record-only. Users mark legs settled manually (e.g., after cash/UPI outside app). Balances compute from expenses − splits − settlements.
- **Tech stack/infra**: Supabase Postgres + Edge (if needed), REST; React/Tailwind frontend; Sentry + Supabase logs.
- **Scale/SLAs**: 10–50 peak TPS; ~20 concurrent splits; API <500ms; MAU 500–5K.
- **Compliance**: No payment data stored; contacts access requires user consent; standard privacy for profile data.

### Detailed discovery answers (locked for offline mode)
- **Primary**: P2P friend groups; secondary ad-hoc splits. Group size 2–6; per-split ₹100–₹10,000; payer initiates.
- **PSP**: None (offline). UPI happens outside the app; we only record.
- **Mechanics**: Equal/custom splits; payer sets shares; max 6 recipients.
- **Model**: Record-only. Expense creates `expense_splits`; user marks legs settled in `settlements` table; balances derive from existing hooks.
- **Stack**: Supabase + React; optional Edge functions for contact import if needed.
- **Scale**: Peak 10–50 TPS; 20 concurrent splits; API SLA <500ms; MAU 500–5K; 2K–20K splits/month.
- **Compliance**: No payment credentials; contacts access must be permissioned and limited to minimal fields.

## Phase 2 — Architecture Decision
- **Chosen**: **Record-only splits (no PSP)**. Keep existing `group_expenses`, `expense_splits`, and `settlements` as the source of truth. Users pay however they like (UPI/cash outside the app) and mark legs settled manually. If a PSP is added later, re-enable Pattern B section.

## Phase 3 — Data Model (no PSP)
Use existing tables:
- `group_expenses` and `expense_splits` for splits.
- `settlements` for manual settlement records.

Optional (contacts import): store minimal contact rows if fetched from device (name, phone hash, display label) in a new table `contacts` keyed by user_id; keep PII minimal and permissioned.

## Phase 4 — API / Edge (optional)
- Contact import endpoint (if device contacts are synced) to upsert minimal contact info and prevent duplicates.
- Convenience endpoint to bulk-create `expense_splits` from a contact selection and equal/custom amounts.

## Phase 5 — Frontend Wiring (Kanakku)
- **Group detail / balances**: keep existing balances; show per-leg status (unsettled/settled) using `expense_splits.is_settled` and `settlements` derived view.
- **Settle Up flow**: retain current manual settlement form; optionally add quick-equal button to auto-fill equal shares for selected members.
- **Add Group Expense**: add “split equally” quick toggle to pre-fill equal shares for selected members; allow custom override.
- **Contact pickers**: allow selecting contacts to add as group members (after consent), then preselect them in split UI.

## Phase 6 — Consistency and UX
- Treat `expense_splits.is_settled` as source of truth; update via `settlements` or explicit toggle.
- Prevent double-add of the same contact as member; normalize phone numbers; store hashed phone for matching.
- Keep offline capability: allow creating expenses/splits offline and sync later.

## Phase 7 — Observability
- Track: splits created, unsettled count per group, average time-to-settle (manual), offline-to-sync success rate.

## Phase 8 — Security & Compliance Guardrails
- Contacts: request permission explicitly; store minimal fields; hash phone for matching; allow user to revoke imported contacts.
- RLS: restrict group data to members; settlements and splits remain member-scoped.

## Implementation Checklist (offline splits)
- [x] Confirm scope: record-only splits, no PSP.
- [ ] (Optional) Add `contacts` table for minimal contact storage with RLS.
- [ ] Add equal-split autofill to [src/pages/AddGroupExpense.tsx](../src/pages/AddGroupExpense.tsx) for selected members.
- [ ] Enhance [src/pages/SettleUp.tsx](../src/pages/SettleUp.tsx) with quick-fill from balances (simplified debts) and a “mark leg settled” shortcut.
- [ ] Add contact picker flow to invite/import contacts into groups, then preselect them in split UI.
- [ ] Ensure offline support for creating expenses/splits and syncing later.

## Kanakku App Wiring (practical steps in this repo)
- Add an equal-split toggle that divides amount by selected members (already computed as `equalShare` in AddGroupExpense; just expose a “fill amounts” action when custom is on, or keep as-is for equal mode).
- Use contacts: after permission, list device contacts; let user pick and add as group members; store minimal fields (name, phone hash) and map to `group_members`.
- Balances/Settle Up: keep current `useGroupBalances` output; add “Mark settled” per leg to flip `expense_splits.is_settled` or insert a `settlements` row.
- Notifications (optional): surface reminders for unsettled splits using existing notification manager.
