import { BadgeDollarSign, Factory, LayoutDashboardIcon, Package } from "lucide-react";

// Types for the menu with string-based icons
export type MenuItem = {
    id: string;
    title: string;
    url: string;
    isMain?: boolean;
    iconName?: string; // Changed from icon component to string name
    isActive?: boolean;
    items?: {
        id: string;
        title: string;
        url: string;
    }[];
};

export const SERVER_MENUS: MenuItem[] = [
    {
        id: "236b9ba5-7a7e-491f-a9d8-f26653eae468",
        title: "Dashboard",
        url: "/dashboard",
        isMain: true,
        iconName: "LayoutDashboardIcon",
    },
    {
        id: "135e11d0-4f7a-4290-840c-102486b4bd78",
        title: "Sales",
        url: "/dashboard/sales",
        isMain: true,
        iconName: "BadgeDollarSign",
        items: [
            {
                id: "fd5f1fde-252f-486b-bfe8-115c2400dc86",
                title: "Sales Quotation",
                url: "/dashboard/sales/quotation/new",
            },
            {
                id: "b683b385-cdab-4677-90c0-94cdd22970d4",
                title: "Sales Order",
                url: "/dashboard/sales/order",
            },
            {
                id: "267b80a3-f1d3-4cee-ba5a-fc58b341e018",
                title: "Delivery",
                url: "/dashboard/sales/delivery",
            },
            {
                id: "f46c594d-61ca-487d-8e20-1f9b0372931d",
                title: "A/R Invoice",
                url: "/dashboard/sales/invoice",
            }
        ],
    },
    {
        id: "9ba8eab6-540c-4603-8dab-85b1641c8400",
        title: "Inventory",
        url: "#",
        iconName: "Package",
        isActive: true,
        items: [
            {
                id: "4a0874bf-e293-4d45-a464-8508588e7fdc",
                title: "Inventory Transfer Request",
                url: "/dashboard/inventory/transfer-request",
            },
            {
                id: "0cfd14b5-f714-4f56-b552-bca3b2fec8e6",
                title: "Inventory Transfer",
                url: "/dashboard/inventory/transfer",
            }
        ],
    },
    {
        id: "6e90c734-ab74-4dcb-9d08-66c3cc21123f",
        title: "Production",
        url: "#",
        iconName: "Factory",
        isActive: true,
        items: [
            {
                id: "39dcf313-04a4-49df-943f-866483b30538",
                title: "Issue For Production",
                url: "/dashboard/production/issue-for-production",
            },
            {
                id: "aba68f41-0e50-4624-9ae5-f917299ea8c6",
                title: "Receipt From Production",
                url: "/dashboard/production/receipt-from-production",
            }
        ],
    }
];
