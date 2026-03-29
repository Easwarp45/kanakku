# SQL Archive

This directory contains historical SQL scripts and documentation that were used during development but have since been superseded by proper migrations.

## Archived Files

### Group Member Fixes
- `ADD_GROUP_CREATORS_AS_MEMBERS.sql` - Initial fix for auto-adding group creators as members
- `COMPLETE_GROUP_MEMBERS_FIX.sql` - Comprehensive member relationship fixes
- `GROUP_MEMBERS_RLS_FIX.sql` - RLS policy fixes for group_members table
- `FIX_MEMBERS_NOT_LOADING.sql` - Resolution for member loading issues
- `FIX_MEMBERS_DISPLAY.md` - Documentation for member display name resolution

### RLS & Security Fixes
- `COMPLETE_RLS_FIX.sql` - Comprehensive Row Level Security fixes
- `PERMISSIVE_RLS_FIX.sql` - Permissive RLS policy adjustments
- `RLS_POLICY_FIX.md` - RLS policy documentation
- `FIX_PROFILES_FK.sql` - Foreign key fixes for profiles table

### Feature Implementations
- `INVITE_CODE_FIX.sql` - Invite code generation and validation fixes
- `RECEIPT_STORAGE_SETUP.md` - Documentation for receipt storage configuration

### Performance & Optimization
- `PERFORMANCE_OPTIMIZATION.md` - Performance optimization strategies and implementation notes
- `implementation_plan.md` - Implementation plan for "Unknown User" fix and UI improvements

## Important Notes

⚠️ **These files are for reference only**

- All fixes have been consolidated into proper migrations in `supabase/migrations/`
- Do not apply these scripts directly - they may conflict with current schema
- Refer to these for historical context or debugging purposes only

## Current Migration Strategy

All new database changes should be:
1. Created as timestamped migrations in `supabase/migrations/`
2. Tested locally before deployment
3. Documented with inline comments explaining the purpose

## Migration Timeline

See `supabase/migrations/` for the canonical list of applied migrations in chronological order.
