import { DocumentType } from "@/types/master/DocumentType";

export const formSettings = {
  documents: [
    {
      objtype: DocumentType.Quotation,
      headerFieds: {
        CardCode: { visible: true, enable: true },
        CardName: { visible: true, enable: true },
        DocNum: { visible: true, enable: true },
        DocStatus: { visible: true, enable: true },
        DocDate: { visible: true, enable: true },
        DocDueDate: { visible: true, enable: true },
        TaxDate: { visible: true, enable: true },
        Comments: { visible: true, enable: true },
        TotalBeforeDiscount: { visible: true, enable: true },
        DiscountPercent: { visible: true, enable: true },
        DiscountSum: { visible: true, enable: true },
        TotalFreight: { visible: true, enable: true },
        Rounding: { visible: true, enable: true },
        RoundingValue: { visible: true, enable: true },
        TaxTotal: { visible: true, enable: true },
        DocTotal: { visible: true, enable: true },
        CopyTo: { visible: true, enable: true },
        CopyFrom: { visible: true, enable: true }
      },
      linesFieds: {
        ItemCode: { visible: true, enable: true },
        ItemName: { visible: true, enable: true },
        Quantity: { visible: true, enable: true },
        OnHand: { visible: true, enable: true },
        Price: { visible: true, enable: true },
        DiscountPercent: { visible: true, enable: true },
        TaxCode: { visible: true, enable: true },
        LineTotal: { visible: true, enable: true },
        WarehouseCode: { visible: true, enable: true },
        UoMCode: { visible: true, enable: true },
        Freight1Type: { visible: true, enable: true },
        Freight1LCAmount: { visible: true, enable: true },
        Freight2Type: { visible: true, enable: true },
        Freight2LCAmount: { visible: true, enable: true },
        Freight3Type: { visible: true, enable: true },
        Freight3LCAmount: { visible: true, enable: true }
      }
    },
    {
      objtype: DocumentType.Order,
      headerFieds: {
        CardCode: { visible: true, enable: true },
        CardName: { visible: true, enable: true },
        DocNum: { visible: true, enable: true },
        DocStatus: { visible: true, enable: true },
        DocDate: { visible: true, enable: true },
        DocDueDate: { visible: true, enable: true },
        TaxDate: { visible: true, enable: true },
        Comments: { visible: true, enable: true },
        TotalBeforeDiscount: { visible: true, enable: true },
        DiscountPercent: { visible: true, enable: true },
        DiscountSum: { visible: true, enable: true },
        TotalFreight: { visible: true, enable: true },
        Rounding: { visible: true, enable: true },
        RoundingValue: { visible: true, enable: true },
        TaxTotal: { visible: true, enable: true },
        DocTotal: { visible: true, enable: true },
        CopyTo: { visible: true, enable: true },
        CopyFrom: { visible: true, enable: true }
      },
      linesFieds: {
        ItemCode: { visible: true, enable: true },
        ItemName: { visible: true, enable: true },
        Quantity: { visible: true, enable: true },
        OnHand: { visible: true, enable: true },
        Price: { visible: true, enable: false },
        DiscountPercent: { visible: true, enable: false },
        TaxCode: { visible: true, enable: false },
        LineTotal: { visible: true, enable: false },
        WarehouseCode: { visible: true, enable: true },
        UoMCode: { visible: true, enable: true },
        Freight1Type: { visible: true, enable: false },
        Freight1LCAmount: { visible: true, enable: false },
        Freight2Type: { visible: true, enable: false },
        Freight2LCAmount: { visible: true, enable: false },
        Freight3Type: { visible: true, enable: false },
        Freight3LCAmount: { visible: true, enable: false },
      
      }
    },
    {
      objtype: DocumentType.Delivery,
      headerFieds: {
        CardCode: { visible: true, enable: true },
        CardName: { visible: true, enable: true },
        DocNum: { visible: true, enable: true },
        DocStatus: { visible: true, enable: true },
        DocDate: { visible: true, enable: true },
        DocDueDate: { visible: true, enable: true },
        TaxDate: { visible: true, enable: true },
        Comments: { visible: true, enable: true },
        TotalBeforeDiscount: { visible: true, enable: true },
        DiscountPercent: { visible: true, enable: false },
        DiscountSum: { visible: true, enable: false },
        TotalFreight: { visible: true, enable: true },
        Rounding: { visible: true, enable: false },
        RoundingValue: { visible: true, enable: false },
        TaxTotal: { visible: true, enable: true },
        DocTotal: { visible: true, enable: false },
        CopyTo: { visible: true, enable: true },
        CopyFrom: { visible: true, enable: true }
      },
      linesFieds: {
        ItemCode: { visible: true, enable: true },
        ItemName: { visible: true, enable: true },
        Quantity: { visible: true, enable: true },
        OnHand: { visible: true, enable: true },
        Price: { visible: true, enable: false },
        DiscountPercent: { visible: true, enable: false },
        TaxCode: { visible: true, enable: false },
        LineTotal: { visible: true, enable: true },
        WarehouseCode: { visible: true, enable: true },
        UoMCode: { visible: true, enable: true },
        Freight1Type: { visible: true, enable: false },
        Freight1LCAmount: { visible: true, enable: false },
        Freight2Type: { visible: true, enable: false },
        Freight2LCAmount: { visible: true, enable: false },
        Freight3Type: { visible: true, enable: false },
        Freight3LCAmount: { visible: true, enable: false }
      }
    },
    {
      objtype: DocumentType.ARInvoice,
      headerFieds: {
        CardCode: { visible: true, enable: true },
        CardName: { visible: true, enable: true },
        DocNum: { visible: true, enable: true },
        DocStatus: { visible: true, enable: true },
        DocDate: { visible: true, enable: true },
        DocDueDate: { visible: true, enable: true },
        TaxDate: { visible: true, enable: true },
        Comments: { visible: true, enable: true },
        TotalBeforeDiscount: { visible: true, enable: true },
        DiscountPercent: { visible: true, enable: true },
        DiscountSum: { visible: true, enable: true },
        TotalFreight: { visible: true, enable: true },
        Rounding: { visible: true, enable: true },
        RoundingValue: { visible: true, enable: true },
        TaxTotal: { visible: true, enable: true },
        DocTotal: { visible: true, enable: true },
        CopyTo: { visible: true, enable: true },
        CopyFrom: { visible: true, enable: true }
      },
      linesFieds: {
        ItemCode: { visible: true, enable: true },
        ItemName: { visible: true, enable: true },
        Quantity: { visible: true, enable: true },
        OnHand: { visible: true, enable: true },
        Price: { visible: true, enable: true },
        DiscountPercent: { visible: true, enable: true },
        TaxCode: { visible: true, enable: true },
        LineTotal: { visible: true, enable: true },
        WarehouseCode: { visible: true, enable: true },
        UoMCode: { visible: true, enable: true },
        Freight1Type: { visible: true, enable: true },
        Freight1LCAmount: { visible: true, enable: true },
        Freight2Type: { visible: true, enable: true },
        Freight2LCAmount: { visible: true, enable: true },
        Freight3Type: { visible: true, enable: true },
        Freight3LCAmount: { visible: true, enable: true }
      }
    },
    {
      objtype: DocumentType.SalesReturn,
      headerFieds: {
        CardCode: { visible: true, enable: true },
        CardName: { visible: true, enable: true },
        DocNum: { visible: true, enable: true },
        DocStatus: { visible: true, enable: true },
        DocDate: { visible: true, enable: true },
        DocDueDate: { visible: true, enable: true },
        TaxDate: { visible: true, enable: true },
        Comments: { visible: true, enable: true },
        TotalBeforeDiscount: { visible: true, enable: true },
        DiscountPercent: { visible: true, enable: true },
        DiscountSum: { visible: true, enable: true },
        TotalFreight: { visible: true, enable: true },
        Rounding: { visible: true, enable: true },
        RoundingValue: { visible: true, enable: true },
        TaxTotal: { visible: true, enable: true },
        DocTotal: { visible: true, enable: true },
        CopyTo: { visible: true, enable: true },
        CopyFrom: { visible: true, enable: true }
      },
      linesFieds: {
        ItemCode: { visible: true, enable: true },
        ItemName: { visible: true, enable: true },
        Quantity: { visible: true, enable: true },
        OnHand: { visible: true, enable: true },
        Price: { visible: true, enable: true },
        DiscountPercent: { visible: true, enable: true },
        TaxCode: { visible: true, enable: true },
        LineTotal: { visible: true, enable: true },
        WarehouseCode: { visible: true, enable: true },
        UoMCode: { visible: true, enable: true },
        Freight1Type: { visible: true, enable: true },
        Freight1LCAmount: { visible: true, enable: true },
        Freight2Type: { visible: true, enable: true },
        Freight2LCAmount: { visible: true, enable: true },
        Freight3Type: { visible: true, enable: true },
        Freight3LCAmount: { visible: true, enable: true }
      }
    },
    {
      objtype: DocumentType.ProductionOrder,
      headerFieds: {
        DocNum: { visible: true, enable: true },
        DocStatus: { visible: true, enable: true },
        DocDate: { visible: true, enable: true },
        DocDueDate: { visible: true, enable: true },
        TaxDate: { visible: true, enable: true },
        Comments: { visible: true, enable: true }
      },
      linesFieds: {
        ItemCode: { visible: true, enable: true },
        ItemName: { visible: true, enable: true },
        Quantity: { visible: true, enable: true },
        WarehouseCode: { visible: true, enable: true }
      },
      additional: [
        { key: "CopyFrom", visible: true, enable: true }
      ]
    },
    {
      objtype: DocumentType.IssueForProduction,
      headerFieds: {
        DocNum: { visible: true, enable: true },
        DocStatus: { visible: true, enable: true },
        DocDate: { visible: true, enable: true },
        DocDueDate: { visible: true, enable: true },
        TaxDate: { visible: true, enable: true },
        Comments: { visible: true, enable: true }
      },
      linesFieds: {
        ItemCode: { visible: true, enable: true },
        ItemName: { visible: true, enable: true },
        Quantity: { visible: true, enable: true },
        WarehouseCode: { visible: true, enable: true }
      },
      additional: []
    },
    {
      objtype: DocumentType.ReceiptFromProduction,
      headerFieds: {
        DocNum: { visible: true, enable: true },
        DocStatus: { visible: true, enable: true },
        DocDate: { visible: true, enable: true },
        DocDueDate: { visible: true, enable: true },
        TaxDate: { visible: true, enable: true },
        Comments: { visible: true, enable: true }
      },
      linesFieds: {
        ItemCode: { visible: true, enable: true },
        ItemName: { visible: true, enable: true },
        Quantity: { visible: true, enable: true },
        WarehouseCode: { visible: true, enable: true }
      },
      additional: []
    }
  ]
} as const;