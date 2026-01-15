
"use client"
import { BadgeDollarSign, Factory, LayoutDashboardIcon, Package } from "lucide-react";

export const MENUS = [
   {
    title: "Dashboard",
    url: "/dashboard",
    isMain: true,
    icon: LayoutDashboardIcon,
  },
  {
    title: "Sales",
    url: "/dashboard/sales",
    isMain: true,
    icon: BadgeDollarSign,
    items: [
      {
        title: "Sales Quotation",
        url: "/dashboard/sales/quotation/new",
      },
      {
        title: "Sales Order",
        url: "/dashboard/sales/order",
      },
      {
        title: "Delivery",
        url: "/dashboard/sales/delivery",
      },
      // {
      //   title: "Return",
      //   url: "/dashboard/sales/return",
      // },
      {
        title: "A/R Invoice",
        url: "/dashboard/sales/invoice",
      }
    ],
  },
  // {
  //   title: "Purchase",
  //   url: "#",
  //   icon: Package,
  //   isActive: true,
  //   items: [
  //     {
  //       title: "Purchase Quotation",
  //       url: "/dashboard/purchase/quotation",
  //     },
  //     {
  //       title: "Purchase Order",
  //       url: "/dashboard/purchase/order",
  //     },
  //   ],
  // },
  {
    title: "Inventory",
    url: "#",
    icon: Package,
    isActive: true,
    items: [
      {
        title: "Inventory Transfer Request",
        url: "/dashboard/inventory/transfer-request",
      },
      {
        title: "Inventory Transfer",
        url: "/dashboard/inventory/transfer",
      }
    ],
  },
  {
    title: "Production",
    url: "#",
    icon: Factory,
    isActive: true,
    items: [
      {
        title: "Issue For Production",
        url: "/dashboard/production/issue-for-production",
      },
      {
        title: "Receipt From Production",
        url: "/dashboard/production/receipt-from-production",
      }
    ],
  }
  // {
  //   title: "Shopify",
  //   url: "#",
  //   icon: Package,
  //   isActive: false,
  //   items: [
  //     {
  //       title: "Orders",
  //       url: "/dashboard/shopify/",
  //     },
  //   ],
  // },
  
];
export const Company = {
  name: "Supernova Solutions",
  shortName: "SNS",
};

export const UserInfo = {
  name: "Kashif Younus",
  email: "kashif@example.com",
  avatar: "https://images.unsplash.com/photo-1684369176170-463e84248b70?q=50",
};
