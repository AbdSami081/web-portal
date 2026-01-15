// import axios, { isAxiosError } from "axios";
// import https from "https";

// console.log("🔑 Initializing SAP Service Layer API client...");
// console.log("🔑 SAP Service Layer URL:", process.env.SAP_SERVICE_LAYER_URL);
// const BASE_URL = process.env.SAP_SERVICE_LAYER_URL || "";
// const USERNAME = process.env.SAP_USERNAME || "manager";
// const PASSWORD = process.env.SAP_PASSWORD || "Super@1234";
// const COMPANY_DB = process.env.SAP_COMPANY_DB || "DewanEnt_2025";

// console.log("🔑 SAP Service Layer BASE_URL:", BASE_URL);

// // Configure HTTPS agent
// const httpsAgent = new https.Agent({
//   rejectUnauthorized: process.env.NODE_ENV === "production", // Only verify cert in production
// });

// // Session management
// let cachedSessionToken: string | null = null;

// // Create an Axios instance for SAP Service Layer
// export const sapApi = axios.create({
//   baseURL: BASE_URL,
//   httpsAgent, // Apply the HTTPS agent to all requests
//   headers: {
//     "Content-Type": "application/json",
//     //"Prefer": "odata.maxpagesize=50", // enforce server-side paging
//   },
// });

// // Request interceptor to add session token
// sapApi.interceptors.request.use(
//   async (config) => {
//     // Skip for login request
//     if (config.url === "/Login") return config;

//     // Get or refresh session token
//     const sessionToken = await getSAPSessionToken();

//     // Add session cookie to headers
//     config.headers.Cookie = `B1SESSION=${sessionToken}`;

//     // For SAP HANA Service Layer, you might also need:
//     config.headers["X-SAP-LogonToken"] = sessionToken;

//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// // Response interceptor to handle errors
// sapApi.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config;

//     // Handle self-signed certificate errors
//     if (error.code === "UNABLE_TO_VERIFY_LEAF_SIGNATURE") {
//       console.warn(
//         "⚠️ Self-signed certificate error - adjusting HTTPS agent settings"
//       );
//       httpsAgent.options.rejectUnauthorized = false;
//       return sapApi(originalRequest);
//     }

//     // Handle session timeout/expiration (401 Unauthorized)
//     if (error.response?.status === 401 && !originalRequest._retry) {
//       originalRequest._retry = true;
//       console.log("🔄 Session expired - attempting to refresh...");
//       cachedSessionToken = null; // Clear expired token
//       return sapApi(originalRequest); // Retry with new token
//     }

//     // Handle other errors
//     return Promise.reject(error);
//   }
// );

// // Login function
// async function loginToSAP(): Promise<string> {
//   console.log("🔑 Logging in to SAP Service Layer...");
//   console.log("🔑 SAP Service Layer URL:", BASE_URL);
//   try {
//     const response = await sapApi.post("/Login", {
//       UserName: USERNAME,
//       Password: PASSWORD,
//       CompanyDB: COMPANY_DB,
//     });

//     const sessionId = response.data?.SessionId;
//     if (!sessionId) throw new Error("No SessionId returned from SAP");

//     cachedSessionToken = sessionId;
//     console.log("🔑 SAP Login successful session token:", cachedSessionToken);
//     return sessionId;
//   } catch (error) {
//     // Proper error handling without JSON.stringify
//     console.error("❌ SAP Login failed:");

//     if (isAxiosError(error)) {
//       // Handle Axios-specific errors
//       console.error(`HTTP Error: ${error.response?.status}`, {
//         url: error.config?.url,
//         message: error.message,
//         responseData: error.response?.data,
//       });
//     } else if (error instanceof Error) {
//       // Handle generic errors
//       console.error(error.message);
//     } else {
//       // Handle unexpected error types
//       console.error("Unknown error during SAP login", error);
//     }

//     throw new Error("Failed to authenticate with SAP Service Layer");
//   }
// }

// // Session token management
// export async function getSAPSessionToken(): Promise<string> {
//   if (cachedSessionToken) {
//     //console.log("✅ Using cached SAP session", cachedSessionToken);
//     return cachedSessionToken;
//   }
//   console.log("❌ Can't find SAP session", cachedSessionToken);
//   return await loginToSAP();
// }

// // Helper function to check session validity
// export async function checkSessionValidity(): Promise<boolean> {
//   return !!cachedSessionToken; // Check if session token is available
// }


// ✅ Enhanced SAP Service Layer Auth Utility with robust error handling and logging

import axios, { isAxiosError } from "axios";
import https from "https";

const BASE_URL = process.env.SAP_SERVICE_LAYER_URL || "";
const USERNAME = process.env.SAP_USERNAME || "manager";
const PASSWORD = process.env.SAP_PASSWORD || "Super@123";
const COMPANY_DB = process.env.SAP_COMPANY_DB || "DemoDB";

const httpsAgent = new https.Agent({
  rejectUnauthorized: process.env.NODE_ENV === "production",
});

let cachedSessionToken: string | null = null;

export const sapApi = axios.create({
  baseURL: BASE_URL,
  httpsAgent,
  headers: {
    "Content-Type": "application/json",
  },
});

sapApi.interceptors.request.use(
  async (config) => {
    if (config.url === "/Login") return config;

    try {
      const sessionToken = await getSAPSessionToken();
      if (!sessionToken) throw new Error("SAP session is missing");
      config.headers.Cookie = `B1SESSION=${sessionToken}`;
      config.headers["X-SAP-LogonToken"] = sessionToken;
      return config;
    } catch (err) {
      console.error("❌ Failed to attach SAP session to request", err);
      throw err;
    }
  },
  (error) => {
    console.error("❌ SAP API request setup failed:", error);
    return Promise.reject(error);
  }
);

sapApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.code === "UNABLE_TO_VERIFY_LEAF_SIGNATURE") {
      console.warn("⚠️ SSL cert error – relaxing certificate check");
      httpsAgent.options.rejectUnauthorized = false;
      return sapApi(originalRequest);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      console.warn("🔁 SAP session expired — reauthenticating...");
      cachedSessionToken = null;
      return sapApi(originalRequest);
    }

    // Log all SAP API response errors
    if (isAxiosError(error)) {
      console.error("❌ SAP API Error:", {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
      });
    } else {
      console.error("❌ Unexpected SAP API error:", error);
    }

    return Promise.reject(error);
  }
);

export async function loginToSAP(): Promise<string> {
  try {
    const response = await sapApi.post("/Login", {
      UserName: USERNAME,
      Password: PASSWORD,
      CompanyDB: COMPANY_DB,
    });
    const sessionId = response.data?.SessionId;
    if (!sessionId) throw new Error("No SessionId returned from SAP");
    cachedSessionToken = sessionId;
    console.log("🔐 SAP login successful. SessionId:", sessionId);
    return sessionId;
  } catch (error) {
    console.error("❌ SAP Login Failed:");
    if (isAxiosError(error)) {
      console.error("HTTP Error:", {
        status: error.response?.status,
        message: error.message,
        url: error.config?.url,
        response: error.response?.data,
      });
    } else {
      console.error("Unknown error during SAP login:", error);
    }
    throw new Error("Failed to authenticate with SAP Service Layer");
  }
}

export async function getSAPSessionToken(): Promise<string> {
  if (cachedSessionToken) return cachedSessionToken;
  console.warn("🔍 SAP session not found — logging in...");
  return await loginToSAP();
}

export async function checkSessionValidity(): Promise<boolean> {
  return !!cachedSessionToken;
}
