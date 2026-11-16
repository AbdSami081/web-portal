# Arrow Document Navigation

## Maqsad

Header ke First, Previous, Next aur Last arrows se current document type ke
documents navigate karna. Navigation page reload kiye baghair hoti hai aur
document existing document header loader se form/store mein load hota hai.

## Mukhtasar flow

1. User header mein arrow click karta hai.
2. `HeaderAction.tsx` current `objectCode` aur route (`pathname`) se backend
   resource name resolve karta hai.
3. `getDocumentsList()` ke zariye us resource ki complete document list pages
   mein mangwayi jati hai.
4. Results ko `DocEntry` ke ascending order mein sort karke arrow ke mutabiq
   target record select hota hai.
5. Target ka `DocNum` aur `objectCode` custom browser event
   `portal:document-navigation` mein dispatch hota hai.
6. Matching document header event receive karke apna existing `fetchDocument`
   chalata hai. Woh form aur document store update karta hai; page refresh nahi
   hota.
7. Document load hone par success toast aata hai. Operation ke dauran spinner
   sirf clicked arrow par hota hai.

## API aur pagination

Shared list API:

```text
GET api/Documents/getAll/{resourceName}?skip={skip}&top={top}
```

Isay `api+/sap/common/documentService.ts` mein `getDocumentsList()` call karta
hai. `apiClient` request ke saath application authentication aur API base URL
handle karta hai. Response ke `value` array se documents milte hain.

Arrow navigation mein `top=20` hai, jo document modal ke page size ke mutabiq
hai. Pehli request `skip=0` se shuru hoti hai. Har full 20-record page ke baad
`skip` 20 barhaya jata hai aur agla page fetch hota hai. Yeh tab tak chalta hai
jab tak API 20 se kam records wala page ya khaali page na de. Isliye Last sirf
modal mein abhi dikh rahe records mein se nahi, tamam fetched pages mein se
highest `DocEntry` wala valid document chunta hai.

`documentService.ts` response list par `hasMore` property bhi rakhta hai:
backend `hasMore` bheje to usay use karta hai, warna page size ke mutabiq
fallback deta hai. Arrow pagination apni loop ke liye page length check karti
hai.

## Arrow selection ka rule

API se mile tamam records:

- valid `DocEntry` aur positive `DocNum` ke liye filter hote hain;
- phir `DocEntry` ke ascending order mein sort hote hain.

| Arrow | Select kiya jane wala record |
| --- | --- |
| First | Sabse chhota `DocEntry` |
| Previous | Current `DocEntry` se chhota, sabse bara `DocEntry` |
| Next | Current `DocEntry` se bara, sabse chhota `DocEntry` |
| Last | Sabse bara `DocEntry` |

Previous aur Next ke liye current `DocEntry` zaroori hai. First aur Last new,
unsaved document par bhi chal sakte hain.

`DocEntry` list sort/compare karne ke liye hai. Target document kholne ke liye
`DocNum` header ke existing fetch method ko diya jata hai, kyunki document
headers apne document fetch APIs ko document number se call karte hain.

## Resource mapping

`HeaderAction.tsx` ka `resolveResource()` document type ke mutabiq
`resourceName` deta hai. Maujooda mapping ke examples:

| Document group | Resource names |
| --- | --- |
| Sales | `Quotations`, `Orders`, `DeliveryNotes`, `Invoices`, `Returns`, `ReturnRequest`, `DownPayments`, `CreditNotes` |
| Purchase | `PurchaseQuotations`, `PurchaseOrders`, `PurchaseDeliveryNotes`, `PurchaseInvoices`, `PurchaseReturns`, `PurchaseCreditNotes`, `GoodsReturnRequest`, `PurchaseRequests`, `PurchaseDownPayments` |
| Inventory | `StockTransfers`, `InventoryTransferRequests`, `GoodIssues` |
| Production | `ProductionOrders`, `InventoryGenExits`, `InventoryGenEntries` |

Kuch SAP object codes shared hote hain. Unke liye `pathname` se distinction
hoti hai—misal ke taur par sales aur purchase down payments, purchase request
aur AP down-payment request, reserve invoice, aur inventory Good Issue versus
production Issue for Production.

## In-page event aur document loading

`HeaderAction.tsx` yeh event dispatch karta hai:

```ts
{
  objectCode,
  docNum,
  handled,
  onComplete
}
```

Yeh document header components event listen karte hain:

- `components/sales/shared/DocumentHeader.tsx`
- `components/Inventory/shared/InvDocumentHeader.tsx`
- `components/purchase/PurchaseVendorHeader.tsx`
- `components/production/shared/PRDDocumentHeader.tsx`

Har listener apna `objectCode` match karta hai. Match par woh event ko handled
mark karke us header ka pehle se maujood `fetchDocument(docNum)` chalata hai.
Is tarah document ke fields, lines aur store update karne ke liye duplicate
loading logic nahi banti.

Successful load par relevant header success toast dikhata hai. Agar target na
mile to info toast; list fetch fail ho to error toast aata hai. `onComplete`
spinner aur active-arrow state ko reset karta hai. Loader sirf clicked arrow
par dikhaya jata hai.

## Is functionality se related files

| File | Zimmedari |
| --- | --- |
| `components/Custom/HeaderAction.tsx` | Arrow buttons, resource mapping, pagination, arrow selection, event dispatch aur spinner |
| `api+/sap/common/documentService.ts` | Shared `getDocumentsList()` API wrapper aur `hasMore` fallback |
| `components/sales/shared/DocumentHeader.tsx` | Sales document event listener, existing fetch aur success toast |
| `components/Inventory/shared/InvDocumentHeader.tsx` | Inventory document event listener aur existing fetch |
| `components/purchase/PurchaseVendorHeader.tsx` | Purchase document event listener, existing fetch aur success toast |
| `components/production/shared/PRDDocumentHeader.tsx` | Production document event listener, existing fetch aur success toast |

## Verification

TypeScript check:

```text
npx tsc --noEmit
```

Arrow navigation changes ke baad yeh check pass hua.
