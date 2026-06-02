import { clientConfig } from "./clientConfig";


export const getClientSettings = () => {
  const clientId =
    process.env.NEXT_PUBLIC_CLIENT_ID!;

  return (
    clientConfig[
      clientId as keyof typeof clientConfig
    ] || {}
  );
};