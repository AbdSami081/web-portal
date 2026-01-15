import { Badge } from "./ui/badge";


interface StatusBadgeProps {
  value: string;
}

export function StatusBadge({ value }: StatusBadgeProps) {
  const normalized = value.toLowerCase();
  const styles: Record<string, string> = {
    paid: "bg-green-200 text-green-800",
    unpaid: "bg-red-200 text-red-800",
    pending: "bg-yellow-200 text-yellow-900",
    refunded: "bg-blue-200 text-blue-900",
    fulfilled: "bg-green-200 text-green-800",
    unfulfilled: "bg-yellow-200 text-yellow-900",
    cancelled: "bg-red-200 text-red-800",
  };

  const badgeStyle = styles[normalized] || "bg-muted text-muted-foreground";

  return (
    <Badge className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeStyle} hover:text-white`}>
      {value.charAt(0).toUpperCase() + value.slice(1)}
    </Badge>
  );
}
