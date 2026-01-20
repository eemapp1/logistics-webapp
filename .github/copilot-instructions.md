# EEM Transport Manager - AI Coding Guidelines

## Architecture Overview
This is a React TypeScript SPA for managing transport shipments using Vite as the build tool and Supabase as the backend database. The app follows a component-based architecture with:
- **Routing**: React Router DOM with HashRouter, protected routes wrapped in Layout component
- **State Management**: React Context (ShipmentContext for data, ThemeContext for UI)
- **Styling**: Tailwind CSS with dark mode support, Lucide React icons
- **Data Flow**: Supabase tables (`shipments`, `clients`) fetched via context providers, real-time calculations in components using `useMemo`

## Key Patterns & Conventions
- **File Structure**: Components in `/components`, pages in `/pages`, contexts in `/contexts`, services in `/services`
- **Data Models**: Defined in `types.ts` with enums for `UserRole`, `PaymentMethod`, `Currency`, etc.
- **Code Formatting**: French language strings/comments, specific code formats (e.g., `BL-YY-XXXX` for shipments, `DEP-YYYYMMDD-XXX` for departures)
- **Component Patterns**: `StatCard` for dashboard metrics, `ProtectedLayout` for auth routing
- **Data Fetching**: Async functions in contexts with error handling, data transformation from Supabase snake_case to camelCase

## Development Workflow
- **Build Commands**: `npm run dev` (Vite dev server on port 3000), `npm run build`, `npm run preview`.
- **Environment**: Requires `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env` file.
- **Printing**: Custom HTML/CSS generation in `printService.ts` for receipts (80mm thermal) and labels (100x150mm).

## Integration Points
- **Supabase**: Primary data source with tables for shipments, clients, transactions.
- **Charts**: Recharts library for dashboard visualizations (BarChart, AreaChart).
- **Icons**: Lucide React for consistent iconography.
- **Routing**: Hash-based routing for static hosting compatibility.

## Common Tasks
- **Adding New Pages**: Create in `/pages`, add route in `App.tsx` with appropriate protection.
- **Data Operations**: Use ShipmentContext methods (`fetchShipments`, `addShipment`) for CRUD.
- **UI Components**: Follow Tailwind classes with dark mode variants (`dark:bg-slate-900`).
- **Financial Calculations**: Mirror logic from `Dashboard.tsx` and `CashRegister.tsx` for consistency.

## Developer Workflows
- **Testing**: Use Jest for unit tests, ensure coverage for critical components.
- **Debugging**: Utilize React DevTools for component state inspection and performance profiling.
- **Building**: Run `npm run build` to create production-ready assets.

## Project-Specific Conventions
- **Naming Conventions**: Use camelCase for variables and functions, PascalCase for components.
- **Error Handling**: Centralized error handling in context providers, display user-friendly messages.
- **Localization**: French language support integrated throughout the application.

## Examples
- **Data Fetching**: Fetching data pattern:
  ```typescript
  const { data, error } = await supabase.from('shipments').select('*').order('created_at', { ascending: false });
  ```
- **Context Usage**: Using ShipmentContext:
  ```typescript
  const { shipments, fetchShipments } = useShipments();
  ```
- **Route Protection**: Protecting routes:
  ```jsx
  <Route element={<ProtectedLayout user={user} onLogout={onLogout} />}>  
    <Route path="/dashboard" element={<Dashboard />} />
  </Route>
  ```

## Conclusion
This document serves as a guide for AI coding agents to understand the architecture, workflows, and conventions of the EEM Transport Manager codebase. For further details, refer to the specific files and components mentioned throughout this document.

## Integration Points
- **Supabase**: Primary data source with tables for shipments, clients, transactions
- **Charts**: Recharts library for dashboard visualizations (BarChart, AreaChart)
- **Icons**: Lucide React for consistent iconography
- **Routing**: Hash-based routing for static hosting compatibility

## Common Tasks
- **Adding New Pages**: Create in `/pages`, add route in `App.tsx` with appropriate protection
- **Data Operations**: Use ShipmentContext methods (`fetchShipments`, `addShipment`) for CRUD
- **UI Components**: Follow Tailwind classes with dark mode variants (`dark:bg-slate-900`)
- **Financial Calculations**: Mirror logic from `Dashboard.tsx` and `CashRegister.tsx` for consistency

## Code Examples
```typescript
// Fetching data pattern
const { data, error } = await supabase.from('shipments').select('*').order('created_at', { ascending: false });

// Context usage
const { shipments, fetchShipments } = useShipments();

// Route protection
<Route element={<ProtectedLayout user={user} onLogout={onLogout} />}>
  <Route path="/dashboard" element={<Dashboard />} />
</Route>
```</content>
<parameter name="filePath">c:\Users\youss\Desktop\APPEEM\eem-transport-manager (1)\.github\copilot-instructions.md