import apiClient from "@/lib/apiClient";

export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (!err || typeof err !== "object") return fallback;
  const e = err as { response?: { data?: { Message?: string; message?: string } }; message?: string };
  return (
    e.response?.data?.Message ||
    e.response?.data?.message ||
    e.message ||
    fallback
  );
}
