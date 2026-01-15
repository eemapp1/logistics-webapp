# EEM Transport Manager - Database Setup

## Tables Required

Your app uses 4 main tables in Supabase:

1. **shipments** - Stores all shipment/colis information
2. **clients** - Stores client/customer information
3. **transactions** - Stores income/expenses (dépenses/entrées)
4. **departure_lists** - Stores validated departure lists for drivers

## Setup Instructions

### Option 1: Complete Reset (Recommended if tables exist with wrong schema)

1. **Drop existing tables** (if any):
   - Run `drop-all-tables.sql` in Supabase SQL Editor

2. **Create all tables**:
   - Run `create-all-tables.sql` in Supabase SQL Editor

### Option 2: Create Individual Tables (if some tables already exist)

Run the individual table scripts in this order:
1. `create-clients-table.sql`
2. `create-shipments-table.sql`
3. `create-transactions-table.sql`
4. `create-departure-lists-table.sql`

## Table Schemas

### Shipments Table
- **Primary Key**: id (UUID)
- **Unique**: code (format: BL-YY-XXXX)
- **JSONB**: parcels (array of parcel objects)
- **Financial**: price, currency, advance_amount, remaining_amount
- **Addresses**: sender/receiver info with zip_code, city
- **Timestamps**: created_at, updated_at (auto-managed)

### Clients Table
- **Primary Key**: id (UUID)
- **Unique**: code
- **Basic Info**: name, email, phone

### Transactions Table
- **Primary Key**: id (UUID)
- **Types**: 'Entrée' (Income) or 'Dépense' (Expense)
- **Financial**: amount, currency
- **Optional**: code (linked shipment), client_name, reason

### Departure Lists Table
- **Primary Key**: id (UUID)
- **Unique**: code (format: DEP-YYYYMMDD-XXX)
- **JSONB**: shipments (array of selected shipments)
- **Financial**: discount_percentage, total_driver_mad, total_driver_eur
- **Status**: 'DRAFT' or 'VALIDATED'

## Security Notes

- All tables use **permissive RLS policies** (`FOR ALL USING (true)`) since your app uses mock authentication
- In production, implement proper Supabase Auth and restrict these policies
- The `handle_updated_at()` function automatically updates timestamps on record changes

## Troubleshooting

If you see errors in Supabase SQL Editor:
1. Make sure you're running scripts in the correct order
2. Check that table names don't conflict with existing tables
3. Use the drop script first if recreating tables

After running the scripts, your departure list validation should work without "Erreur lors de la validation" errors.