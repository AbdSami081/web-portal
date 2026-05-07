"use client"

import { KPIWidget } from "@/components/dashboard/widgets/kpi/KPIWidget"
import { TableWidget } from "@/components/dashboard/widgets/tables/TableWidget"
import { GraphWidget } from "@/components/dashboard/widgets/graph/GraphWidget"

export default function InventoryAnalyticsPage() {
  // 1. KPI Data
  const totalStockData = { value: "14,850", trend: 6.2, previous: "13,900", unit: "Items" }
  const inventoryValueData = { value: "1.2M", trend: 4.1, previous: "1.15M" }
  const turnoverRatioData = { value: "5.4x", trend: 1.2, previous: "4.8x" }
  const warehouseCapacityData = { value: "82%", trend: -3.5, previous: "85%" }

  // 2. Bar Chart Data (Category vs Target)
  const categoryStock = [
    { category: 'Electronics', stock: 3200, target: 3500 },
    { category: 'Furniture', stock: 1800, target: 2000 },
    { category: 'Stationery', stock: 5400, target: 5000 },
    { category: 'Hardware', stock: 2950, target: 3200 },
    { category: 'Packaging', stock: 4200, target: 4000 },
    { category: 'Spare Parts', stock: 1500, target: 1200 },
  ]

  // 3. Area Chart Data (Monthly Inventory Value)
  const inventoryTrend = [
    { month: 'Jan', value: 850, cost: 640 },
    { month: 'Feb', value: 880, cost: 670 },
    { month: 'Mar', value: 920, cost: 690 },
    { month: 'Apr', value: 1050, cost: 780 },
    { month: 'May', value: 1100, cost: 820 },
    { month: 'Jun', value: 1200, cost: 860 },
  ]

  // 4. Line Chart Data (Demand vs Fulfillment)
  const fulfillmentData = [
    { week: 'W1', demand: 1200, fulfilled: 1150 },
    { week: 'W2', demand: 1400, fulfilled: 1380 },
    { week: 'W3', demand: 1800, fulfilled: 1500 },
    { week: 'W4', demand: 1500, fulfilled: 1480 },
    { week: 'W5', demand: 2100, fulfilled: 2050 },
    { week: 'W6', demand: 1900, fulfilled: 1900 },
  ]

  // 5. Large Area Chart Data (Warehouse Logistics Volume)
  const logisticsData = [
    { day: 'Mon', incoming: 400, outgoing: 350 },
    { day: 'Tue', incoming: 480, outgoing: 420 },
    { day: 'Wed', incoming: 350, outgoing: 500 },
    { day: 'Thu', incoming: 600, outgoing: 450 },
    { day: 'Fri', incoming: 550, outgoing: 650 },
    { day: 'Sat', incoming: 200, outgoing: 300 },
    { day: 'Sun', incoming: 150, outgoing: 100 },
  ]

  // Table Data 1: Low Stock Items
  const lowStockItems = [
    { Item: "Pro Display", Stock: 12, Status: "Critical" },
    { Item: "Desk Chair", Stock: 5, Status: "Critical" },
    { Item: "Keyboard", Stock: 25, Status: "Warning" },
    { Item: "USB-C Hub", Stock: 8, Status: "Critical" },
  ]

  // Table Data 2: Top Suppliers
  const topSuppliers = [
    { Code: "V-101", Name: "TechTronics Inc", Rating: "4.9/5", Delivery: "98% On-Time" },
    { Code: "V-102", Name: "Global Furnitures", Rating: "4.7/5", Delivery: "95% On-Time" },
    { Code: "V-103", Name: "Office Pro", Rating: "4.5/5", Delivery: "92% On-Time" },
    { Code: "V-104", Name: "Pak Logistics", Rating: "4.8/5", Delivery: "96% On-Time" },
  ]

  // Table Data 3: Recent Deliveries
  const recentMovements = [
    { Doc: "PO-4091", Type: "Incoming", Qty: 500, Date: "Today", Status: "Received" },
    { Doc: "SO-8812", Type: "Outgoing", Qty: 150, Date: "Today", Status: "Dispatched" },
    { Doc: "TR-2011", Type: "Transfer", Qty: 50, Date: "Yesterday", Status: "Completed" },
    { Doc: "PO-4092", Type: "Incoming", Qty: 1000, Date: "Yesterday", Status: "Pending QC" },
  ]

  return (
    <div className="p-6 space-y-8 bg-background min-h-screen overflow-y-auto w-full">
      {/* Header */}
      <div className="flex flex-col space-y-1 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Inventory Analytics</h1>
          <p className="text-muted-foreground text-sm">Real-time deep dive into warehouse stock, valuations, and supply chain logistics.</p>
        </div>
      </div>

      {/* Row 1: KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPIWidget id="stock-kpi" title="Total Stock Items" data={totalStockData} type="inventory" />
        <KPIWidget id="value-kpi" title="Inventory Potential" data={inventoryValueData} type="sales" />
        <KPIWidget id="turnover-kpi" title="Turnover Ratio" data={turnoverRatioData} type="default" />
        <KPIWidget id="capacity-kpi" title="Warehouse Capacity" data={warehouseCapacityData} type="product" />
      </div>

      {/* Row 2: Large Bar Chart + Small Table */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 h-[450px]">
          <GraphWidget
            id="category-stock"
            title="Inventory Distribution vs Target (by Category)"
            data={categoryStock}
            type="bar"
            xAxisKey="category"
            series={[
              { dataKey: 'stock', name: 'Current Stock', color: 'hsl(142, 71%, 45%)' },
              { dataKey: 'target', name: 'Target Level', color: 'hsl(217, 91%, 60%)' }
            ]}
          />
        </div>
        <div className="xl:col-span-1 h-[450px]">
          <TableWidget
            id="low-stock-items"
            title="Critical Stock Alerts"
            data={lowStockItems}
            primaryKey="Item"
          />
        </div>
      </div>

      {/* Row 3: Two Side-by-Side Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[400px]">
        <GraphWidget
          id="inventory-trend"
          title="Market Value vs Base Cost (Over 6 Months)"
          data={inventoryTrend}
          type="area"
          xAxisKey="month"
          series={[
            { dataKey: 'value', name: 'Market Value (K)', color: 'hsl(280, 65%, 60%)' },
            { dataKey: 'cost', name: 'Purchase Cost (K)', color: 'hsl(43, 96%, 56%)' }
          ]}
        />
        <GraphWidget
          id="fulfillment-trend"
          title="Weekly Demand vs Fulfillment Rate"
          data={fulfillmentData}
          type="line"
          xAxisKey="week"
          series={[
            { dataKey: 'demand', name: 'Total Demand', color: 'hsl(348, 83%, 47%)' },
            { dataKey: 'fulfilled', name: 'Successfully Fulfilled', color: 'hsl(142, 71%, 45%)' }
          ]}
        />
      </div>

      {/* Row 4: Side By Side Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[400px]">
        <TableWidget
          id="top-suppliers"
          title="Top Performing Suppliers"
          data={topSuppliers}
          primaryKey="Code"
        />
        <TableWidget
          id="recent-movements"
          title="Recent Warehouse Operations"
          data={recentMovements}
          primaryKey="Doc"
        />
      </div>

      {/* Row 5: Full Width Area Chart for Logistics */}
      <div className="w-full h-[450px]">
        <GraphWidget
          id="logistics-volume"
          title="Warehouse Logistics Volume (Current Week)"
          data={logisticsData}
          type="area"
          xAxisKey="day"
          series={[
            { dataKey: 'incoming', name: 'Incoming Volume (Units)', color: 'hsl(217, 91%, 60%)' },
            { dataKey: 'outgoing', name: 'Outgoing Volume (Units)', color: 'hsl(280, 65%, 60%)' }
          ]}
        />
      </div>
    </div>
  )
}
