# UoM (Unit of Measurement) Caching Implementation

## Overview

This implementation provides a global UoM caching solution that loads Unit of Measurement master data once after user login and caches it for the entire session. This eliminates the need for repeated API calls and ensures consistent UoM name display across the application.

The UoM data is fetched from the SAP Business One OData service endpoint `/UnitOfMeasurements` and cached in a Zustand store for quick lookups.

## Architecture

### 1. UoM Store (`stores/useUoMStore.ts`)

The Zustand store manages all UoM data and provides methods to lookup UoM names.

**Key Methods:**
- `loadUoMs()` - Fetches UoM data from the `/UnitOfMeasurements` OData endpoint (called once after login)
- `getUoMName(code)` - Returns the UoM name for a given code, AbsEntry, or identifier
- `reset()` - Clears the store (used during logout)

**Features:**
- Automatic deduplication (only loads once per session)
- Handles multiple UoM identifier types: Code, AbsEntry (numeric), and Name
- Fallback to original code/value if no match found
- Support for special values like `-1` (maps to "Manual")
- Comprehensive logging for debugging

### 2. Master Data Service (`lib/sap/service_layer/masterDataService.ts`)

Updated to fetch UoM data from the correct endpoint:

```typescript
async getUOMs() {
  const params = buildODataQuery({
    select: ["AbsEntry", "Code", "Name"],
  });
  return await fetchData(
    "/UnitOfMeasurements",  // Correct OData endpoint
    params,
    "UnitOfMeasurements"
  );
}
```

### 3. UoM Helper (`lib/sap/helpers/uomHelper.ts`)

Simple wrapper function for easy access to UoM name lookup throughout the application.

```typescript
import { getUoMName } from "@/lib/sap/helpers/uomHelper";

const displayName = getUoMName("-1"); // Returns "Manual"
const displayName = getUoMName("EA"); // Returns "Each"
const displayName = getUoMName(1); // Returns name of UoM with AbsEntry=1
```

### 4. Auth Context Integration (`context/authContext.tsx`)

UoM data is automatically loaded after successful login:
- During initial page load (if token exists)
- After user submits login form
- Prevents duplicate loads with `isLoaded` flag

## API Endpoint Details

**Endpoint:** `/UnitOfMeasurements`

**Request:**
```
GET /UnitOfMeasurements?$select=AbsEntry,Code,Name HTTP/1.1
```

**Response Structure:**
```json
{
  "value": [
    {
      "AbsEntry": -1,
      "Code": "Manual",
      "Name": "Manual"
    },
    {
      "AbsEntry": 1,
      "Code": "EA",
      "Name": "Each"
    },
    {
      "AbsEntry": 2,
      "Code": "BOX",
      "Name": "Box"
    }
  ]
}
```

## Data Flow

```
User Login
    ↓
authContext.login() succeeds
    ↓
useUoMStore.getState().loadUoMs() called
    ↓
API wrapper calls getUOMs() from master-data service
    ↓
MasterDataService.getUOMs() builds OData query
    ↓
fetchData() makes GET request to /UnitOfMeasurements endpoint
    ↓
Response is parsed and cached in Zustand store
    ↓
Components use getUoMName() to display UoM names
```

## Usage

### Option 1: Using the Helper Function (Recommended)

```typescript
import { getUoMName } from "@/lib/sap/helpers/uomHelper";

// In components
const uomName = getUoMName(line.UoMCode);
<span>{uomName}</span>
```

### Option 2: Using the Store Directly

```typescript
import { useUoMStore } from "@/stores/useUoMStore";

export function MyComponent() {
  const getUoMName = useUoMStore(state => state.getUoMName);
  
  return <div>{getUoMName("EA")}</div>;
}
```

### Option 3: Accessing UoM List

```typescript
import { useUoMStore } from "@/stores/useUoMStore";

export function MyComponent() {
  const uoms = useUoMStore(state => state.uoms);
  
  // Custom logic with full UoM data
}
```

## Examples

### Production Order Lines

**Before:**
```typescript
<span>{line.UoMCode}</span> // Displays: "-1", "EA", "Manual", etc.
```

**After:**
```typescript
import { getUoMName } from "@/lib/sap/helpers/uomHelper";

<span>{getUoMName(line.UoMCode)}</span> // Displays: "Manual", "Each", "Manual", etc.
```

### Inventory Transfer Request Lines

```typescript
<Input
  value={getUoMName(draftLine.UoMCode || draftLine.unitMsr)}
  disabled
  readOnly
/>
```

## How UoM Resolution Works

The `getUoMName()` function matches incoming UoM values against cached data:

1. **Numeric Match (AbsEntry)**: `-1` → finds UoM with `AbsEntry: -1` → returns `Name: "Manual"`
2. **String Code Match**: `"EA"` → finds UoM with `Code: "EA"` → returns `Name: "Each"`
3. **Fallback**: If no match found, returns the original value

## Performance Considerations

- **Single API Call**: UoM data is fetched only once per session
- **In-Memory Cache**: All lookups use cached data (O(n) array search)
- **No Re-renders**: Lookup doesn't trigger component re-renders
- **Type-Safe**: Full TypeScript support with proper typing
- **Minimal Payload**: Only fetches necessary fields (AbsEntry, Code, Name)

## Debugging

The UoM store includes comprehensive logging for debugging:

```javascript
// Check if UoM data is loaded
const state = useUoMStore.getState();
console.log("UoM Data Loaded:", state.isLoaded);
console.log("Number of UoMs:", state.uoms.length);
console.log("UoM List:", state.uoms);
console.log("Error (if any):", state.error);

// Test UoM name resolution
console.log("Manual UoM Name:", state.getUoMName("-1"));
console.log("EA UoM Name:", state.getUoMName("EA"));
```

**Browser Console Logs:**
- `[UoM] Starting to load UoM master data...` - Loading started
- `[UoM] Successfully loaded X UoM entries` - Loading completed successfully
- `[UoM] Error loading UoM data: <error message>` - Error occurred
- `[UoM] No match found for code: <code>, falling back to: <fallback>` - Fallback used

## Integration Checklist

- [x] Updated `masterDataService.ts` to call `/UnitOfMeasurements` endpoint
- [x] Created `useUoMStore.ts` Zustand store with logging
- [x] Updated `authContext.tsx` to load UoMs after login
- [x] Created `uomHelper.ts` utility function
- [x] Updated Production Order line rendering to use `getUoMName()`
- [x] Updated Inventory Transfer Request line rendering to use `getUoMName()`
- [x] Updated column headers to reflect "UoM Name" instead of "UoM Code"

## Troubleshooting

### Issue: UoM names not showing after login

**Symptoms:** Components display UoM codes instead of names (e.g., showing "EA" instead of "Each")

**Solutions:**
1. Check browser console for `[UoM]` log messages
2. Verify the `/UnitOfMeasurements` endpoint is accessible:
   ```javascript
   useUoMStore.getState().isLoaded // Should be true
   useUoMStore.getState().uoms.length // Should be > 0
   ```
3. Check API response: Open DevTools Network tab and search for "UnitOfMeasurements" requests
4. Verify token includes correct permissions for master data access

### Issue: Fallback values displaying

**Symptoms:** Seeing original codes instead of resolved names

**Solutions:**
1. Check if UoM data loaded: `useUoMStore.getState().isLoaded`
2. Verify incoming UoM code matches backend: `useUoMStore.getState().uoms.map(u => u.Code)`
3. Check for special characters or case sensitivity in codes

### Issue: API call fails with 401/403

**Symptoms:** Console shows authentication error

**Solutions:**
1. Verify user is properly authenticated
2. Check if token has required scopes for master data
3. Verify `/UnitOfMeasurements` endpoint is accessible with current user permissions

### Issue: Loading hangs or takes too long

**Symptoms:** UI frozen during login

**Solutions:**
1. Check if backend service is responding
2. Monitor network requests in DevTools
3. Check console for timeout errors
4. Verify no network errors in API calls

## Next Steps (Optional)

To extend UoM caching to other modules:

1. Import `getUoMName` from `lib/sap/helpers/uomHelper`
2. Replace UoM code displays with `getUoMName(value)`
3. Update column/field labels to reflect UoM Name display

Example modules that may benefit:
- Sales documents (Quotations, Orders, Invoices)
- Purchase documents (Quotations, Orders, Invoices)
- Any other module displaying item UoM information

## Files Modified

- `stores/useUoMStore.ts` - New store for UoM caching
- `lib/sap/service_layer/masterDataService.ts` - Updated `getUOMs()` to use `/UnitOfMeasurements`
- `context/authContext.tsx` - Added UoM loading after login
- `lib/sap/helpers/uomHelper.ts` - New helper function
- `components/production/shared/PRDDocumentRow.tsx` - Updated to display UoM names
- `components/production/shared/PRDDocumentItems.tsx` - Updated column header
- `components/Inventory/shared/InvDocumentItemRow.tsx` - Updated to display UoM names
