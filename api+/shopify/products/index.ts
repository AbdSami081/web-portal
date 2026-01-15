import { LoaderFunction } from "@remix-run/node";

export const loader: LoaderFunction = async () => {
  try {
    const products = [
      {
        id: 1,
        name: "Product 1",
        price: 100,
      },
      {
        id: 2,
        name: "Product 2",
        price: 200,
      },
      {
        id: 3,
        name: "Product 3",
        price: 300,
      },
      {
        id: 4,
        name: "Product 4",
        price: 400,
      },
      {
        id: 5,
        name: "Product 5",
        price: 500,
      },
    ];
    return new Response(JSON.stringify(products), {
      headers: {
        "Content-Type": "application/json",
      },
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching Shopify orders:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch Shopify orders" }),
      {
        headers: {
          "Content-Type": "application/json",
        },
        status: 500,
      }
    );
  }
};
