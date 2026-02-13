"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import {
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Users,
  CreditCard,
  Activity,
  TrendingUp,
  Package,
  ShoppingCart
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Label,
  LabelList,
  Line,
  LineChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  Rectangle,
  ReferenceLine,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Pie,
  PieChart,
  Cell
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from "@/components/ui/chart";

// --- DUMMY DATA ---

const salesData = [
  { month: "Jan", sales: 4500, revenue: 2400 },
  { month: "Feb", sales: 5200, revenue: 3100 },
  { month: "Mar", sales: 4800, revenue: 2900 },
  { month: "Apr", sales: 6100, revenue: 4200 },
  { month: "May", sales: 5900, revenue: 3800 },
  { month: "Jun", sales: 7200, revenue: 5100 },
];

const categoryData = [
  { name: "Electronics", value: 400, color: "var(--chart-1)" },
  { name: "Furniture", value: 300, color: "var(--chart-2)" },
  { name: "Clothing", value: 300, color: "var(--chart-3)" },
  { name: "Groceries", value: 200, color: "var(--chart-4)" },
];

const transactionData = [
  { id: "TX-1001", customer: "ABC Traders", type: "Sales Order", amount: "$355.10", status: "Completed", date: "2024-02-06" },
  { id: "TX-1002", customer: "BlueTech Pty", type: "Delivery Note", amount: "$618.10", status: "Pending", date: "2024-02-05" },
  { id: "TX-1003", customer: "Nova Retail", type: "AR Invoice", amount: "$1,222.50", status: "Completed", date: "2024-02-04" },
  { id: "TX-1004", customer: "Horizon Logistics", type: "Inventory Transfer", amount: "$543.10", status: "Cancelled", date: "2024-02-03" },
  { id: "TX-1005", customer: "Gamma Solutions", type: "Sales Quotation", amount: "$890.00", status: "Completed", date: "2024-02-02" },
];

const chartConfig = {
  sales: {
    label: "Sales",
    color: "var(--chart-1)",
  },
  revenue: {
    label: "Revenue",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

// --- COMPONENTS ---

const DashboardCard = ({ title, amount, trend, trendValue, icon: Icon, description }: any) => {
  const isPositive = trend === "up";
  return (
    <Card className="overflow-hidden bg-white/50 backdrop-blur-sm border-zinc-200 hover:border-zinc-400 transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="p-2 bg-zinc-100 rounded-lg border border-zinc-200">
          <Icon className="h-4 w-4 text-zinc-900" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-zinc-900">{amount}</div>
        <div className="flex items-center mt-1">
          <span className={`flex items-center text-xs font-medium ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
            {isPositive ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
            {trendValue}
          </span>
          <span className="text-xs text-muted-foreground ml-2">{description}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8 bg-zinc-50/50">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Business Overview</h1>
          <p className="text-muted-foreground">Monitor your business performance and key metrics in real-time.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="h-9 shadow-sm border-zinc-200 hover:bg-zinc-100">Download Report</Button>
          <Button className="h-9 shadow-sm bg-zinc-900 text-white hover:bg-zinc-800">Create New</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Total Revenue"
          amount="$45,231.89"
          trend="up"
          trendValue="+20.1%"
          icon={DollarSign}
          description="from last month"
        />
        <DashboardCard
          title="Active Accounts"
          amount="+2350"
          trend="up"
          trendValue="+180.1%"
          icon={Users}
          description="since last week"
        />
        <DashboardCard
          title="Sales Growth"
          amount="+12.5%"
          trend="up"
          trendValue="+19%"
          icon={CreditCard}
          description="from last month"
        />
        <DashboardCard
          title="Active Sessions"
          amount="+573"
          trend="down"
          trendValue="-2.1%"
          icon={Activity}
          description="since last hour"
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-zinc-200/50 p-1 border border-zinc-200">
          <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Overview</TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Analytics</TabsTrigger>
          <TabsTrigger value="reports" disabled>Reports</TabsTrigger>
          <TabsTrigger value="notifications" disabled>Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
            {/* Main Area Chart */}
            <Card className="lg:col-span-4 border-zinc-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-zinc-900">
                  <TrendingUp className="h-5 w-5 text-zinc-900" />
                  Revenue Performance
                </CardTitle>
                <CardDescription>Showing total revenue for the last 6 months</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px]">
                <ChartContainer config={chartConfig} className="h-full w-full">
                  <AreaChart
                    data={salesData}
                    margin={{ left: 12, right: 12, top: 12, bottom: 0 }}
                  >
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      stroke="var(--muted-foreground)"
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      stroke="var(--muted-foreground)"
                      tickFormatter={(value) => `$${value}`}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent indicator="dot" />}
                    />
                    <Area
                      dataKey="revenue"
                      type="natural"
                      fill="var(--chart-1)"
                      fillOpacity={0.1}
                      stroke="var(--chart-1)"
                      strokeWidth={2}
                      stackId="a"
                    />
                    <Area
                      dataKey="sales"
                      type="natural"
                      fill="var(--chart-2)"
                      fillOpacity={0.4}
                      stroke="var(--chart-2)"
                      strokeWidth={2}
                      stackId="a"
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
              <CardFooter className="flex-col items-start gap-2 text-sm border-t border-zinc-100 mt-2 pt-4">
                <div className="flex gap-2 font-medium leading-none text-zinc-900">
                  Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
                </div>
                <div className="leading-none text-muted-foreground">
                  Showing total visitors for the last 6 months
                </div>
              </CardFooter>
            </Card>

            {/* Distribution Pie Chart */}
            <Card className="lg:col-span-3 border-zinc-200 bg-white shadow-sm">
              <CardHeader className="items-center pb-0">
                <CardTitle className="text-zinc-900">Sales by Category</CardTitle>
                <CardDescription>January - June 2024</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 pb-0 mt-4">
                <ChartContainer
                  config={{}}
                  className="mx-auto aspect-square max-h-[250px]"
                >
                  <PieChart>
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel />}
                    />
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      strokeWidth={5}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                      <Label
                        content={({ viewBox }:any) => {
                          if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                            return (
                              <text
                                x={viewBox.cx}
                                y={viewBox.cy}
                                textAnchor="middle"
                                dominantBaseline="middle"
                              >
                                <tspan
                                  x={viewBox.cx}
                                  y={viewBox.cy}
                                  className="fill-zinc-900 text-3xl font-bold"
                                >
                                  1.2k
                                </tspan>
                                <tspan
                                  x={viewBox.cx}
                                  y={viewBox.cy + 24}
                                  className="fill-muted-foreground text-xs"
                                >
                                  Transactions
                                </tspan>
                              </text>
                            )
                          }
                        }}
                      />
                    </Pie>
                  </PieChart>
                </ChartContainer>
              </CardContent>
              <CardFooter className="flex-col gap-2 text-sm pt-4 border-t border-zinc-100">
                <div className="grid grid-cols-2 gap-4 w-full px-2">
                  {categoryData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full" style={{ background: item.color }} />
                      <span className="text-muted-foreground text-xs">{item.name}</span>
                      <span className="font-medium ml-auto text-xs text-zinc-900">{((item.value / 1200) * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </CardFooter>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
            {/* Recent Activity Table */}
            <Card className="lg:col-span-4 border-zinc-200 bg-white shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-zinc-900">
                    <ShoppingCart className="h-5 w-5 text-zinc-900" />
                    Recent Transactions
                  </CardTitle>
                  <CardDescription>Latest business activities across all modules.</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-xs text-zinc-500 hover:text-zinc-900">View All</Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-zinc-100">
                      <TableHead className="w-[100px] font-semibold text-zinc-900">Doc #</TableHead>
                      <TableHead className="font-semibold text-zinc-900">Customer</TableHead>
                      <TableHead className="font-semibold text-zinc-900">Type</TableHead>
                      <TableHead className="font-semibold text-zinc-900">Amount</TableHead>
                      <TableHead className="font-semibold text-zinc-900">Status</TableHead>
                      <TableHead className="text-right"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactionData.map((tx) => (
                      <TableRow key={tx.id} className="hover:bg-zinc-50/50 transition border-zinc-50">
                        <TableCell className="font-medium text-zinc-900">{tx.id}</TableCell>
                        <TableCell className="text-zinc-600">{tx.customer}</TableCell>
                        <TableCell>
                          <span className="text-xs text-zinc-400 capitalize">{tx.type}</span>
                        </TableCell>
                        <TableCell className="font-semibold text-zinc-900">{tx.amount}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`rounded-full px-2 py-0 font-medium text-[10px] border-none shadow-none ${tx.status === "Completed" ? "bg-emerald-100 text-emerald-700" :
                                tx.status === "Pending" ? "bg-amber-100 text-amber-700" :
                                  "bg-rose-100 text-rose-700"
                              }`}
                          >
                            {tx.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-zinc-100 rounded-lg transition-colors">
                                <MoreHorizontal className="h-4 w-4 text-zinc-500" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 border-zinc-200 shadow-lg">
                              <DropdownMenuItem className="cursor-pointer">View Details</DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer">Edit Document</DropdownMenuItem>
                              <DropdownMenuItem className="text-rose-600 cursor-pointer">Archive</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Side Task List or Quick Actions */}
            <Card className="lg:col-span-3 border-zinc-200 bg-white shadow-sm overflow-hidden">
              <CardHeader className="bg-zinc-50/50 border-b border-zinc-100">
                <CardTitle className="flex items-center gap-2 text-zinc-900">
                  <Package className="h-5 w-5 text-zinc-900" />
                  Operational Overview
                </CardTitle>
                <CardDescription>Inventory and production status.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-4">
                  {[
                    { label: "Inventory Transfer", desc: "5 pending approvals", color: "bg-emerald-500" },
                    { label: "Production Orders", desc: "12 in progress", color: "bg-amber-500" },
                    { label: "Stock Shortages", desc: "3 items critical", color: "bg-rose-500" }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between group cursor-pointer hover:bg-zinc-50 p-2 -m-2 rounded-lg transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`h-1.5 w-1.5 rounded-full ${item.color}`} />
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium text-zinc-900">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-zinc-300 group-hover:text-zinc-600 transition-colors" />
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-zinc-100">
                  <div className="bg-zinc-900 rounded-xl p-5 shadow-inner">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Weekly Target</h4>
                      <span className="text-[10px] bg-white/10 text-white px-2 py-0.5 rounded-full">Week 5</span>
                    </div>
                    <div className="flex items-end justify-between mb-3">
                      <span className="text-2xl font-bold text-white tracking-tight">$12,400</span>
                      <span className="text-xs text-zinc-400 font-medium">82% of $15k</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-white rounded-full transition-all duration-1000 ease-out" style={{ width: '82%' }} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card className="h-[400px] flex items-center justify-center border-zinc-200 border-dashed rounded-xl bg-zinc-50/50">
            <div className="text-center">
              <Activity className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground font-medium">Detailed Analytics View coming soon...</p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}