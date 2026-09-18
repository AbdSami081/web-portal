"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import apiClient from "@/lib/apiClient";
import { GenericModal } from "@/modals/GenericModal";
import { buildDocumentUrl, getMenuInfoByObjectCode, getMenuUrlsByObjectCode } from "@/lib/menu-lookup";
import { stageDocNavParams } from "@/lib/docNavParams";
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


type DashboardSummaryItem = {
  title: string;
  amount: string | number;
  category: string;
  cardKey: string;
  docType?: string | number;
  trend?: string;
  trendValue?: string | number;
  description?: string;
};

type DashboardSummaryGroup = {
  category: string;
  cards: DashboardSummaryItem[];
};

const iconForCard = (title: string) => {
  const normalizedTitle = title.toLowerCase();

  if (normalizedTitle.includes("purchase") || normalizedTitle.includes("quotation") || normalizedTitle.includes("invoice")) {
    return ShoppingCart;
  }
  if (normalizedTitle.includes("inventory") || normalizedTitle.includes("item") || normalizedTitle.includes("receipt") || normalizedTitle.includes("issue")) {
    return Package;
  }
  if (normalizedTitle.includes("payment") || normalizedTitle.includes("bank")) {
    return CreditCard;
  }
  return Activity;
};

const getSummaryItems = (data: unknown): DashboardSummaryItem[] => {
  const response = data as any;
  const envelope = response?.value ?? response?.data ?? response;
  const list = Array.isArray(envelope)
    ? envelope
    : Array.isArray(envelope?.items)
      ? envelope.items
      : Array.isArray(envelope?.cards)
        ? envelope.cards
        : envelope && typeof envelope === "object"
          ? Object.entries(envelope)
            .filter(([, value]) => Array.isArray(value))
            .flatMap(([category, cards]) => (cards as any[]).map((card) => ({ ...card, category })))
          : [];

  if (!Array.isArray(list)) return [];

  return list.flatMap((item: any) => {
    const category = String(item.category ?? item.Category ?? item.group ?? item.Group ?? item.groupName ?? item.GroupName ?? "Other");
    const cards = Array.isArray(item.cards ?? item.Cards ?? item.items ?? item.Items)
      ? item.cards ?? item.Cards ?? item.items ?? item.Items
      : [item];

    return cards.map((card: any) => ({
      title: String(card.title ?? card.Title ?? card.name ?? card.Name ?? card.label ?? card.Label ?? card.cardTitle ?? card.CardTitle ?? card.cardName ?? card.CardName ?? ""),
      amount: card.amount ?? card.Amount ?? card.count ?? card.Count ?? card.value ?? card.Value ?? card.cardValue ?? card.CardValue ?? 0,
      category: String(card.category ?? card.Category ?? category),
      cardKey: String(card.cardKey ?? card.CardKey ?? card.cardkey ?? card.Cardkey ?? card.card_key ?? card.Card_Key ?? card.dashboardCardKey ?? card.DashboardCardKey ?? card.key ?? card.Key ?? ""),
      docType: card.docType ?? card.DocType ?? card.documentType ?? card.DocumentType ?? card.objectType ?? card.ObjectType ?? card.objectCode ?? card.ObjectCode,
      trend: card.trend ?? card.Trend,
      trendValue: card.trendValue ?? card.TrendValue,
      description: card.description ?? card.Description,
    })).filter((card: DashboardSummaryItem) => card.title);
  });
};

const getDocumentRows = (data: unknown): Record<string, unknown>[] => {
  const raw = data as any;
  const rows = Array.isArray(raw) ? raw : raw?.value ?? raw?.data ?? raw?.items ?? raw?.documents ?? [];
  return Array.isArray(rows) ? rows : [];
};

const getDocumentTotal = (data: unknown): number | undefined => {
  const raw = data as any;
  const total = raw?.total ?? raw?.totalCount ?? raw?.count ?? raw?.totalRecords;
  const numericTotal = Number(total);
  return Number.isFinite(numericTotal) ? numericTotal : undefined;
};

const groupSummaryItems = (items: DashboardSummaryItem[]): DashboardSummaryGroup[] => {
  return items.reduce<DashboardSummaryGroup[]>((groups, item) => {
    const group = groups.find((entry) => entry.category === item.category);
    if (group) {
      group.cards.push(item);
    } else {
      groups.push({ category: item.category, cards: [item] });
    }
    return groups;
  }, []);
};

const getDocumentRoute = (docType: string | number, category: string, title: string) => {
  const routes = getMenuUrlsByObjectCode(docType);
  if (routes.length === 0) return getMenuInfoByObjectCode(docType)?.url;

  const context = `${category} ${title}`.toLowerCase();
  const preferredModule = context.includes("issue for production")
    ? "production"
    : context.includes("good issue")
      ? "inventory"
      : context.includes("inventory")
    ? "inventory"
    : context.includes("production")
      ? "production"
      : context.includes("purchase") || context.includes("purchasing")
        ? "purchase"
        : context.includes("sales")
          ? "sales"
          : "";

  if (preferredModule) {
    const moduleRoute = routes.find((route) => route.toLowerCase().includes(`/dashboard/${preferredModule}/`));
    if (moduleRoute) return moduleRoute;
  }

  return routes[0];
};

const getFallbackProductionDocType = (category: string, title: string) => {
  const context = `${category} ${title}`.toLowerCase();
  if (!context.includes("production")) return undefined;
  if (context.includes("receipt from production")) return 59;
  if (context.includes("issue for production")) return 60;
  if (context.includes("production order")) return 202;
  return undefined;
};

const DashboardCard = ({ title, amount, trend, trendValue, icon: Icon, description, onClick }: any) => {
  const isPositive = trend === "up";
  const hasTrend = Boolean(trendValue);
  const hasDescription = Boolean(description);

  return (
    <Card onClick={onClick} className={`overflow-hidden bg-white/50 backdrop-blur-sm border-zinc-200 hover:border-zinc-400 transition-all duration-300 ${onClick ? "cursor-pointer" : ""}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="p-2 bg-zinc-100 rounded-lg border border-zinc-200">
          <Icon className="h-4 w-4 text-zinc-900" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-4xl font-bold text-zinc-900">{amount}</div>
        {(hasTrend || hasDescription) && (
          <div className="flex items-center mt-1">
            {hasTrend && (
              <span className={`flex items-center text-xs font-medium ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                {isPositive ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                {trendValue}
              </span>
            )}
            {hasDescription && (
              <span className={`text-xs text-muted-foreground ${hasTrend ? 'ml-2' : ''}`}>{description}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function DashboardPage() {
  const router = useRouter();
  const [summaryGroups, setSummaryGroups] = useState<DashboardSummaryGroup[]>([]);
  const [documentRows, setDocumentRows] = useState<Record<string, unknown>[]>([]);
  const [documentColumns, setDocumentColumns] = useState<{ key: string; label: string }[]>([]);
  const [selectedCard, setSelectedCard] = useState<DashboardSummaryItem | null>(null);
  const [documentsModalOpen, setDocumentsModalOpen] = useState(false);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [hasMoreDocuments, setHasMoreDocuments] = useState(false);
  const DOCUMENTS_PAGE_SIZE = 20;

  const setDocumentPagination = (raw: any, loadedCount: number, pageCount: number) => {
    const total = getDocumentTotal(raw);
    setHasMoreDocuments(
      Boolean(raw?.hasMore) ||
      pageCount === DOCUMENTS_PAGE_SIZE ||
      (total !== undefined && loadedCount < total)
    );
  };

  const openCardDocuments = async (card: DashboardSummaryItem) => {
    if (!card.cardKey) return;

    setIsLoadingDocuments(true);
    try {
      const response = await apiClient.get(`/api/Dashboard/${encodeURIComponent(card.cardKey)}/Documents`, {
        params: { skip: 0, top: DOCUMENTS_PAGE_SIZE },
      });
      const raw = response.data as any;
      const normalizedRows = getDocumentRows(raw);
      const firstRow = normalizedRows[0] ?? {};
      const hiddenKeys = new Set(["DocEntry", "docEntry", "DocType", "docType", "ObjectType", "objectType", "CardKey", "cardKey"]);
      const columns = Object.keys(firstRow)
        .filter((key) => !hiddenKeys.has(key) && typeof firstRow[key] !== "object")
        .map((key) => ({ key, label: key.replace(/([A-Z])/g, " $1").trim() }));

      setDocumentRows(normalizedRows);
      setDocumentColumns(columns);
      setDocumentPagination(raw, normalizedRows.length, normalizedRows.length);
      setSelectedCard(card);
      setDocumentsModalOpen(true);
    } catch (error) {
      console.error("Failed to fetch dashboard documents:", error);
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  const loadMoreDocuments = async () => {
    if (!selectedCard?.cardKey || isLoadingDocuments || !hasMoreDocuments) return;

    setIsLoadingDocuments(true);
    try {
      const response = await apiClient.get(`/api/Dashboard/${encodeURIComponent(selectedCard.cardKey)}/Documents`, {
        params: { skip: documentRows.length, top: DOCUMENTS_PAGE_SIZE },
      });
      const raw = response.data as any;
      const normalizedRows = getDocumentRows(raw);
      const newRows = normalizedRows.filter((row) => {
        const rowKey = row.DocEntry ?? row.docEntry ?? row.DocNum ?? row.docNum ?? row.AbsoluteEntry ?? row.absoluteEntry;
        return !documentRows.some((existingRow) => {
          const existingKey = existingRow.DocEntry ?? existingRow.docEntry ?? existingRow.DocNum ?? existingRow.docNum ?? existingRow.AbsoluteEntry ?? existingRow.absoluteEntry;
          return rowKey !== undefined && rowKey === existingKey;
        });
      });

      setDocumentRows((previousRows) => [...previousRows, ...newRows]);
      setDocumentPagination(raw, documentRows.length + newRows.length, normalizedRows.length);
    } catch (error) {
      console.error("Failed to load more dashboard documents:", error);
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  const openDocument = (row: Record<string, unknown>) => {
    const docEntry = row.DocNum ?? row.docNum ?? row.DocumentNumber ?? row.documentNumber ?? row.DocEntry ?? row.docEntry ?? row.AbsoluteEntry ?? row.absoluteEntry ?? row.DocumentEntry ?? row.documentEntry;
    const docType = row.DocType ?? row.docType ?? row.DocumentType ?? row.documentType ?? row.ObjectType ?? row.objectType ?? row.ObjectCode ?? row.objectCode ?? selectedCard?.docType ?? getFallbackProductionDocType(selectedCard?.category ?? "", selectedCard?.title ?? "");
    if (!docEntry || !docType) return;

    const documentRoute = getDocumentRoute(
      String(docType),
      selectedCard?.category ?? "",
      selectedCard?.title ?? ""
    );
    if (!documentRoute) return;

    const cleanPath = buildDocumentUrl(documentRoute, {
      objectType: String(docType),
      objectEntry: String(docEntry),
      isDraft: false,
    }).split("?")[0];

    stageDocNavParams(cleanPath, {
      docEntry: String(docEntry),
      docType: String(docType),
    });
    setDocumentsModalOpen(false);
    router.push(cleanPath);
  };

  useEffect(() => {
    let isMounted = true;

    const fetchDashboardSummary = async () => {
      try {
        const response = await apiClient.get("api/Dashboard/Summary");
        if (isMounted) {
          setSummaryGroups(groupSummaryItems(getSummaryItems(response.data)));
        }
      } catch (error) {
        console.error("Failed to fetch dashboard summary:", error);
      }
    };

    fetchDashboardSummary();
    const refreshInterval = window.setInterval(fetchDashboardSummary, 30000);
    window.addEventListener("focus", fetchDashboardSummary);

    return () => {
      isMounted = false;
      window.clearInterval(refreshInterval);
      window.removeEventListener("focus", fetchDashboardSummary);
    };
  }, []);

  return (
    <div className="flex w-full flex-col gap-6 p-6 lg:p-8 bg-zinc-50/50">
      {summaryGroups.map((group) => (
        <section key={group.category} className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-900">{group.category}</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
            {group.cards.map((card) => (
              <DashboardCard
                key={`${group.category}-${card.title}`}
                title={card.title}
                amount={card.amount}
                trend={card.trend}
                trendValue={card.trendValue}
                icon={iconForCard(card.title)}
                description={card.description}
                onClick={() => openCardDocuments(card)}
              />
            ))}
          </div>
        </section>
      ))}
      <GenericModal
        open={documentsModalOpen}
        onClose={() => setDocumentsModalOpen(false)}
        onSelect={() => undefined}
        onRowClick={openDocument}
        data={documentRows}
        columns={documentColumns}
        title={`${selectedCard?.title ?? "Documents"} Documents`}
        isLoading={isLoadingDocuments}
        onLoadMore={loadMoreDocuments}
        hasMore={hasMoreDocuments}
      />
    </div>
  );

  /*
  // return (
  //   <div className="flex w-full flex-col gap-6 p-6 lg:p-8 bg-zinc-50/50">

  //     <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      
  //       <div>
  //         <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Business Overview</h1>
  //         <p className="text-muted-foreground">Monitor your business performance and key metrics in real-time.</p>
  //       </div>


        {/* <div className="flex items-center gap-2">
          <Button variant="outline" className="h-9 shadow-sm border-zinc-200 hover:bg-zinc-100">Download Report</Button>
          <Button className="h-9 shadow-sm bg-zinc-900 text-white hover:bg-zinc-800">Create New</Button>
        </div> */ /*}
      // </div>

      {/* <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="My Open Inv. Transfer"
          amount="10"
          trend="up"
          trendValue=""
          icon={DollarSign}
          description=""
        />
        <DashboardCard
          title="My Purchase Order"
          amount="12"
          trend="up"
          trendValue=""
          icon={ShoppingCart}
          description=""
        />
        <DashboardCard
          title="My Open A/R Invoice"
          amount="14"
          trend="up"
          trendValue=""
          icon={Activity}
          description=""
        />
        <DashboardCard
          title="My Sales Order"
          amount="32"
          trend="down"
          trendValue=""
          icon={Package}
          description=""
        />
      </div> */ /*}

      {/* <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-zinc-200/50 p-1 border border-zinc-200">
          <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Overview</TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Analytics</TabsTrigger>
          <TabsTrigger value="reports" disabled>Reports</TabsTrigger>
          <TabsTrigger value="notifications" disabled>Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
        
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
      </Tabs> */
    // </div>
  ;
}
