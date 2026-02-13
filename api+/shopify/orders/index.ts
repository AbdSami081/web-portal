// import { LoaderFunction } from "@remix-run/node";
// import { fetchShopifyOrders } from "~/utils/shopify.orders";

// export const loader: LoaderFunction = async () => {
//   try {
//     const orders = await fetchShopifyOrders();
//     return new Response(JSON.stringify(orders), {
//       headers: {
//         "Content-Type": "application/json",
//       },
//       status: 200,
//     });
//   } catch (error) {
//     console.error("Error fetching Shopify orders:", error);
//     return new Response(
//       JSON.stringify({ error: "Failed to fetch Shopify orders" }),
//       {
//         headers: {
//           "Content-Type": "application/json",
//         },
//         status: 500,
//       }
//     );
//   }
// };
