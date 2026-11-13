const yesNo = (value: unknown) => value === "tYES" || value === true;

export function mapSalesDocumentToTabFields(doc: Record<string, any>) {
  return {
  
    ShipToCode: doc.ShipToCode ?? "",
    ShipToAddress: doc.Address2 ?? "",
    PayToCode: doc.PayToCode ?? "",
    BillToAddress: doc.Address ?? "",
    AddressExtension: doc.AddressExtension ?? undefined,
    TransportationCode: doc.TransportationCode ?? "",
    LanguageCode: doc.LanguageCode ?? "",
    ProcureNonDropShip: yesNo(doc.ProcureNonDropShip),
    ProcureDropShip: yesNo(doc.ProcureDropShip),
    Confirmed: yesNo(doc.Confirmed),
    BPChannelCode: doc.BPChannelCode ?? "",
    BPChannelContact: doc.BPChannelContact ?? "",

    
    JournalMemo: doc.JournalMemo ?? "",
    PaymentGroupCode: doc.PaymentGroupCode ?? "",
    PaymentMethod: doc.PaymentMethod ?? "",
    ExtraMonth: doc.ExtraMonth ?? 0,
    ExtraDays: doc.ExtraDays ?? 0,
    CashDiscountDateOffset: doc.CashDiscountDateOffset ?? "",
    UseShpdGoodsAct: yesNo(doc.UseShpdGoodsAct),
    Project: doc.Project ?? "",
    QRCodeFrom: doc.QRCodeFrom ?? "",
    Indicator: doc.Indicator ?? "",
    FederalTaxID: doc.FederalTaxID ?? "",
    NumAtCard: doc.NumAtCard ?? "",
  };
}
