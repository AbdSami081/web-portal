// // Secure SAP item price lookup
// // import type { LoaderFunctionArgs } from '@remix-run/node';
// import { json } from 'zod';
// import { MasterDataService } from '@/lib/sap/service_layer/masterDataService'; 
// // import { getItemPrice } from '@/lib/s ap/service_layer/items';

// export async function loader({ request }: LoaderFunctionArgs) {
//   const url = new URL(request.url);
//   const itemCode = url.searchParams.get('itemCode');
//   const priceList = url.searchParams.get('priceList');

//   if (!itemCode || !priceList) {
//     return json({ error: 'Missing itemCode or priceList' }, { status: 400 });
//   }

//   try {
//     const price = await MasterDataService.getItemPrices(itemCode, parseInt(priceList, 10));
//     return json({ price });
//   } catch (error: any) {
//     console.error('❌ Failed to fetch item price:', error);
//     return json({ error: 'Failed to fetch item price' }, { status: 500 });
//   }
// }
