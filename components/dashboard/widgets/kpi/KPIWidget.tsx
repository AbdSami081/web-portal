import { BaseWidget } from "@/components/dashboard/BaseWidget"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  ShoppingCart,
  Users,
  Factory,
  Box,
} from "lucide-react"

export type KPIData = {
  value: string | number
  trend: number
  previous?: string
  unit?: string
}

export type KPIWidgetProps = {
  id?: string
  title: string
  data: KPIData
  loading?: boolean
  type?: "sales" | "inventory" | "purchase" | "customer" | "product" | "default"
}

export function KPIWidget({
  id = "kpi-widget",
  title,
  data,
  loading = false,
  type = "default",
}: KPIWidgetProps) {
  const getIcon = () => {
    switch (type) {
      case "sales":
        return <ShoppingCart className="w-5 h-5 text-primary" />
      case "inventory":
        return <Package className="w-5 h-5 text-orange-500" />
      case "purchase":
        return <DollarSign className="w-5 h-5 text-emerald-500" />
      case "customer":
        return <Users className="w-5 h-5 text-blue-500" />
      case "product":
        return <Factory className="w-5 h-5 text-purple-500" />
      default:
        return <Box className="w-5 h-5 text-muted-foreground" />
    }
  }

  return (
    <BaseWidget id={id} title={title} isLoading={loading}>
      <div className="flex flex-col justify-center h-full space-y-2 relative">
        <div className="absolute top-0 right-0 p-1 opacity-10">
          {getIcon()}
        </div>
        <div className="text-3xl font-bold tracking-tight text-foreground">
          {data.value}
          <span className="text-sm font-normal text-muted-foreground ml-1">{data.unit}</span>
        </div>
        <div className="flex items-center space-x-2 text-xs font-medium">
          {data.trend > 0 ? (
            <span className="flex items-center text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">
              <TrendingUp className="w-3 h-3 mr-1" />
              {data.trend || 0}%
            </span>
          ) : (
            <span className="flex items-center text-rose-600 bg-rose-500/10 px-1.5 py-0.5 rounded">
              <TrendingDown className="w-3 h-3 mr-1" />
              {Math.abs(data.trend || 0)}%
            </span>
          )}
          {data.previous && (
            <span className="text-muted-foreground truncate">
              vs last period ({data.previous})
            </span>
          )}
        </div>
      </div>
    </BaseWidget>
  )
}
