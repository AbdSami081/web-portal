export type MenuItem = {
    id: string;
    title: string;
    url: string;
    isMain?: boolean;
    iconName?: string;
    isActive?: boolean;
    objectCode?: string | number;
    isReporting?: boolean;
    items?: MenuItem[];
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
        id: "05057fb5-59d0-4084-85ef-b79248a401a4",
        title: "Analytics",
        url: "#",
        isMain: true,
        iconName: "BarChart2",
        isActive: true,
        items: [
            {
                id: "fff64255-b781-4c97-be4b-ef87ae8ca013",
                title: "Inventory Dashboard",
                url: "/dashboard/analytics/inventory",
            },
        ],
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
                objectCode: 23,
                isReporting: true,
            },
            {
                id: "b683b385-cdab-4677-90c0-94cdd22970d4",
                title: "Sales Order",
                url: "/dashboard/sales/order",
                objectCode: 17,
                isReporting: true,
            },
            {
                id: "267b80a3-f1d3-4cee-ba5a-fc58b341e018",
                title: "Delivery",
                url: "/dashboard/sales/delivery",
                objectCode: 15,
                isReporting: true,
            },
            {
                id: "f46c594d-61ca-487d-8e20-1f9b0372931d",
                title: "A/R Invoice",
                url: "/dashboard/sales/invoice",
                objectCode: 13,
                isReporting: true,
            }
        ],
    },
    {
        id: "b7cf9fca-1d1d-4ce5-8ae6-09a7bafd13ce",
        title: "Purchasing",
        url: "#",
        iconName: "ShoppingCart",
        isActive: true,
        items: [
            {
                id: "8a4b1eed-bb98-4ce2-ade2-63cf9f77ec37",
                title: "Purchase Quotation",
                url: "/dashboard/purchase/quotation/new",
                objectCode: 54,
                isReporting: true,
            },
            {
                id: "a234f19e-11e6-42b8-b982-76d987948bcd",
                title: "Purchase Order",
                url: "/dashboard/purchase/order/new",
                objectCode: 22,
                isReporting: true,
            },
            {
                id: "2294ad1e-c1fd-44c0-ad1e-e1320ca7c0e7",
                title: "Goods Receipt PO",
                url: "/dashboard/purchase/grpo/new",
                objectCode: 20,
                isReporting: true,
            },
            {
                id: "e9abfe0b-c738-4942-a643-3e3ca2db5016",
                title: "A/P Invoice",
                url: "/dashboard/purchase/invoice/new",
                objectCode: 18,
                isReporting: true,
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
                objectCode: 1250000001,
                isReporting: true,
            },
            {
                id: "0cfd14b5-f714-4f56-b552-bca3b2fec8e6",
                title: "Inventory Transfer",
                url: "/dashboard/inventory/transfer",
                objectCode: 67,
                isReporting: true,
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
                id: "0421fa1f-fd91-41e7-8444-bd2c35235911",
                title: "Production Order",
                url: "/dashboard/production/production-order",
                objectCode: 202,
                isReporting: true,
            },
            {
                id: "39dcf313-04a4-49df-943f-866483b30538",
                title: "Issue For Production",
                url: "/dashboard/production/issue-for-production",
                objectCode: 60,
                isReporting: true,
            },
            {
                id: "aba68f41-0e50-4624-9ae5-f917299ea8c6",
                title: "Receipt From Production",
                url: "/dashboard/production/receipt-from-production",
                objectCode: 59,
                isReporting: true,
            }
        ],
    },
    {
        id: "41d32b37-f60a-4f85-879b-9ef904695054",
        title: "Reporting",
        url: "#",
        iconName: "FileText",
        isActive: true,
        items: [
            {
                id: "e250a09e-1ea0-4640-8561-ea3fa2526b40",
                title: "Manage Reports",
                url: "#",
                items: [
                    {
                        id: "a67c4065-5bd6-426b-bb81-c339ddc4276b",
                        title: "Import Report",
                        url: "/dashboard/reports/upload",
                    },
                    {
                        id: "3351796e-25ad-4bc1-8e47-28a47c19bceb",
                        title: "Update Report",
                        url: "/dashboard/reports/update",
                    }
                ]
            },
            {
                id: "278db848-0aa3-4dff-a8d3-dad1206c5b84",
                title: "Report Generate",
                url: "/dashboard/reports/generate",
            }
        ],
    },
    {
        id: "debc3362-4bc4-4664-9726-a143aea26ec2",
        title: "Administration",
        url: "#",
        iconName: "Settings",
        isActive: true,
        items: [
            {
                id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
                title: "Module Access",
                url: "/dashboard/authorization",
            },
            {
                id: "7b157858-90e3-4295-9ea8-1412a7b6ea3e",
                title: "Report Access",
                url: "/dashboard/administration/report-access",
            }
        ],
    }

];
