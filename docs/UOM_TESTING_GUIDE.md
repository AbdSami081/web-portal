# UoM Implementation - Quick Testing Guide

## Verification Steps

### 1. Check UoM Data Loading in Browser Console

After logging in, open DevTools (F12) and run these commands:

```javascript
// Check if UoM data is loaded
const state = useUoMStore.getState();
console.log('✓ UoM Data Loaded:', state.isLoaded);
console.log('✓ Number of UoMs:', state.uoms.length);
console.log('✓ UoM List:', state.uoms);
console.log('✓ Any Errors:', state.error);
```

**Expected Output:**
```
✓ UoM Data Loaded: true
✓ Number of UoMs: 15  (or more, depending on your data)
✓ UoM List: Array(15) [
  { AbsEntry: -1, Code: "Manual", Name: "Manual" },
  { AbsEntry: 1, Code: "EA", Name: "Each" },
  { AbsEntry: 2, Code: "BOX", Name: "Box" },
  ...
]
✓ Any Errors: null
```

### 2. Test UoM Name Resolution

```javascript
// Test resolving specific UoM codes
const state = useUoMStore.getState();

console.log('Manual (AbsEntry=-1):', state.getUoMName("-1"));      // Should output: "Manual"
console.log('Each (Code="EA"):', state.getUoMName("EA"));          // Should output: "Each"
console.log('Box (Code="BOX"):', state.getUoMName("BOX"));         // Should output: "Box"
console.log('Invalid Code:', state.getUoMName("INVALID"));         // Should output: "INVALID" (fallback)
```

### 3. Monitor Network Requests

1. Open DevTools → Network tab
2. Login to the application
3. Look for a request to endpoint containing "UnitOfMeasurements"
4. Expected Response Status: **200 OK**
5. Response should contain array of UoM objects with `AbsEntry`, `Code`, and `Name` fields

### 4. Verify Production Order Display

1. Navigate to Production Order module
2. Load or create a Production Order
3. Check the "UoM Name" column in the items table
4. **Expected:** Should display UoM names (e.g., "Manual", "Each", "Box") instead of codes

### 5. Verify Inventory Transfer Display

1. Navigate to Inventory Transfer Request module
2. Load or create an ITR
3. Check the UoM field in each line item
4. **Expected:** Should display resolved UoM names

### 6. Check Console Logs

The application logs debug information prefixed with `[UoM]`:

```
[UoM] Starting to load UoM master data...
[UoM] Successfully loaded 15 UoM entries
```

Look for these during login to verify loading is happening.

## Common Errors and Solutions

### Error: "Failed to load UoMs"

**Cause:** API endpoint is not accessible or returns an error

**Solution:**
1. Check if `/UnitOfMeasurements` endpoint is available in your SAP instance
2. Verify user has permissions to access master data
3. Check network request in DevTools for error response
4. Check server logs for API errors

### Error: "No match found for code: XX"

**Cause:** UoM code in data doesn't exist in master data

**Solution:**
1. Run: `useUoMStore.getState().uoms.map(u => u.Code)`
2. Verify the incoming UoM code matches one of the codes in the list
3. Check for case sensitivity issues
4. Check for extra spaces or special characters

### UoM names still not showing

**Cause:** Component is not using `getUoMName()` helper

**Solution:**
1. Verify component imports: `import { getUoMName } from "@/lib/sap/helpers/uomHelper"`
2. Check that component calls `getUoMName(uomCode)` when displaying
3. Verify the column/field configuration is enabled

## Debugging Commands

Create a small utility object for easier debugging:

```javascript
// Add this to window for easy access
window.UoMDebug = {
  state: () => useUoMStore.getState(),
  uoms: () => useUoMStore.getState().uoms,
  isLoaded: () => useUoMStore.getState().isLoaded,
  error: () => useUoMStore.getState().error,
  resolve: (code) => useUoMStore.getState().getUoMName(code),
  reload: () => useUoMStore.getState().loadUoMs(),
  reset: () => useUoMStore.getState().reset(),
};

// Then use it like:
// UoMDebug.state()
// UoMDebug.resolve("EA")
// UoMDebug.isLoaded()
```

## Performance Testing

To verify performance is not degraded:

```javascript
// Measure UoM resolution time
console.time('UoM Resolution');
for (let i = 0; i < 1000; i++) {
  useUoMStore.getState().getUoMName("EA");
}
console.timeEnd('UoM Resolution');
// Should be < 10ms for 1000 lookups
```

## API Response Validation

Check the actual API response structure:

```javascript
// After loading, verify the structure
const uoms = useUoMStore.getState().uoms;
if (uoms.length > 0) {
  const sample = uoms[0];
  console.log('Sample UoM Object:', {
    hasAbsEntry: 'AbsEntry' in sample,
    hasCode: 'Code' in sample,
    hasName: 'Name' in sample,
    sample: sample
  });
}
```

## Endpoint Verification

If you need to test the endpoint directly using curl or Postman:

```bash
curl -X GET "http://your-sap-instance/API/v1/UnitOfMeasurements" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

Expected response:
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
    }
  ]
}
```

## Summary Checklist

- [ ] Login and verify `[UoM] Successfully loaded X UoM entries` in console
- [ ] Run `useUoMStore.getState().isLoaded` and get `true`
- [ ] Run `useUoMStore.getState().uoms.length` and get a number > 0
- [ ] Test resolution: `useUoMStore.getState().getUoMName("-1")` returns "Manual"
- [ ] Navigate to Production Order and see UoM names displayed
- [ ] Navigate to Inventory Transfer and see UoM names displayed
- [ ] No errors in browser console related to UoM loading

If all checks pass, the UoM implementation is working correctly!
