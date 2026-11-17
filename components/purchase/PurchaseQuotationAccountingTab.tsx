"use client";

import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { CalendarClock, FileText, Landmark, ReceiptText } from "lucide-react";
import { getBusinessPartnerProjects, getFactoringIndicators, type BusinessPartnerProject, type FactoringIndicator } from "@/api+/sap/BusinessPartner/BPService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ReferenceInformationDialog } from "@/components/sales/shared/ReferenceInformationDialog";

const rowClass = "grid grid-cols-1 gap-1.5 sm:grid-cols-[minmax(125px,0.8fr)_minmax(0,1.2fr)] sm:items-center sm:gap-4";
const inputClass = "h-9 w-full text-sm";
const selectClass = "h-9 w-full text-sm";

export function PurchaseQuotationAccountingTab() {
  const { watch, setValue } = useFormContext<any>();
  const [projects, setProjects] = useState<BusinessPartnerProject[]>([]);
  const [indicators, setIndicators] = useState<FactoringIndicator[]>([]);
  const [referencesOpen, setReferencesOpen] = useState(false);
  const cardCode = String(watch("CardCode") ?? "");
  const isDisabled = Number(watch("DocEntry") ?? 0) > 0 && watch("DocStatus") === "bost_Close";

  useEffect(() => {
    getBusinessPartnerProjects().then(setProjects).catch((error) => {
      console.error("Failed to load purchase quotation projects:", error);
    });
    getFactoringIndicators().then(setIndicators).catch((error) => {
      console.error("Failed to load purchase quotation indicators:", error);
    });
  }, []);

  return (
    <>
      <div className="min-h-[320px] rounded-xl border border-slate-200 bg-slate-50/70 p-5 text-sm">
        <div className="mb-5 flex items-center gap-3 border-b border-slate-200 pb-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700"><ReceiptText className="h-5 w-5" /></span>
          <div><h3 className="text-sm font-semibold text-slate-900">Accounting details</h3><p className="mt-0.5 text-xs text-slate-500">Payment terms, dates and document references</p></div>
        </div>
        <div className="grid w-full grid-cols-1 gap-4 2xl:grid-cols-2">
          <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/40">
            <div className="mb-1 flex items-center gap-2 border-b border-slate-100 pb-3"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700"><Landmark className="h-4 w-4" /></span><div><h4 className="text-sm font-semibold text-slate-800">Payment &amp; due dates</h4><p className="text-xs text-slate-500">Terms and date calculation</p></div></div>
            <div className={rowClass}>
              <label className="text-xs font-medium text-slate-600" htmlFor="purchase-journal-remark">Journal Remark</label>
              <Input id="purchase-journal-remark" value={watch("JournalMemo") ?? ""} onChange={(event) => setValue("JournalMemo", event.target.value, { shouldDirty: true })} className={inputClass} disabled={isDisabled} />
            </div>
            <div className={rowClass}>
              <label className="text-xs font-medium text-slate-600" htmlFor="purchase-payment-terms">Payment Terms</label>
              <Input id="purchase-payment-terms" type="number" value={watch("PaymentGroupCode") ?? ""} onChange={(event) => setValue("PaymentGroupCode", event.target.value, { shouldDirty: true })} className={inputClass} disabled={isDisabled} />
            </div>
            <div className={rowClass}>
              <label className="text-xs font-medium text-slate-600" htmlFor="purchase-payment-method">Payment Method</label>
              <Input id="purchase-payment-method" value={watch("PaymentMethod") ?? ""} onChange={(event) => setValue("PaymentMethod", event.target.value, { shouldDirty: true })} className={inputClass} disabled={isDisabled} />
            </div>
            <div className={rowClass}>
              <label className="text-xs font-medium text-slate-600" htmlFor="purchase-central-bank-indicator">Central Bank Ind.</label>
              <Input id="purchase-central-bank-indicator" value={watch("CentralBankIndicator") ?? ""} onChange={(event) => setValue("CentralBankIndicator", event.target.value, { shouldDirty: true })} className={inputClass} disabled={isDisabled} />
            </div>

            <div className="space-y-3 rounded-lg bg-slate-50 p-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700"><CalendarClock className="h-4 w-4 text-blue-600" />Manually Recalculate Due Date</div>
              <Input
                type="date"
                aria-label="Manually recalculated due date"
                value={watch("ManualDueDate") ?? ""}
                onChange={(event) => setValue("ManualDueDate", event.target.value, { shouldDirty: true })}
                className="h-9 w-full text-sm"
                disabled={isDisabled}
              />
              <div className="flex flex-wrap items-center gap-2">
                <Select value={watch("PayDuMonth") ?? "N"} onValueChange={(value) => setValue("PayDuMonth", value, { shouldDirty: true })} disabled={isDisabled}>
                  <SelectTrigger aria-label="Due date calculation point" className="h-8 w-[160px] text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="N">Selected Date</SelectItem>
                    <SelectItem value="Y">Month Start</SelectItem>
                    <SelectItem value="H">Half Month</SelectItem>
                    <SelectItem value="E">Month End</SelectItem>
                  </SelectContent>
                </Select>
                <Input aria-label="Months" type="number" value={watch("ExtraMonth") ?? 0} onChange={(event) => setValue("ExtraMonth", event.target.value, { shouldDirty: true })} className="h-8 w-16 text-center text-xs" disabled={isDisabled} />
                <span>Months +</span>
                <Input aria-label="Days" type="number" value={watch("ExtraDays") ?? 0} onChange={(event) => setValue("ExtraDays", event.target.value, { shouldDirty: true })} className="h-8 w-16 text-center text-xs" disabled={isDisabled} />
                <span>Days</span>
              </div>
            </div>

            <div className={rowClass}>
              <label className="text-xs font-medium text-slate-600" htmlFor="purchase-cash-discount-offset">Cash Discount Date Offset</label>
              <Input id="purchase-cash-discount-offset" type="number" value={watch("CashDiscountDateOffset") ?? ""} onChange={(event) => setValue("CashDiscountDateOffset", event.target.value, { shouldDirty: true })} className={inputClass} disabled={isDisabled} />
            </div>
          </section>

          <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/40">
            <div className="mb-1 flex items-center gap-2 border-b border-slate-100 pb-3"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700"><FileText className="h-4 w-4" /></span><div><h4 className="text-sm font-semibold text-slate-800">Document details</h4><p className="text-xs text-slate-500">Project, tax and reference information</p></div></div>
            <div className={rowClass}>
              <label className="text-xs font-medium text-slate-600" htmlFor="purchase-bp-project">Business Partner Project</label>
              <Select value={watch("Project") ?? ""} onValueChange={(value) => setValue("Project", value, { shouldDirty: true })} disabled={isDisabled}>
                <SelectTrigger id="purchase-bp-project" className={selectClass}><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>
                  {projects.map((project) => <SelectItem key={project.Code} value={String(project.Code)}>{project.Name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className={rowClass}>
              <label htmlFor="purchase-qr-code" className="text-xs font-medium text-slate-600 sm:self-start sm:pt-2">Create QR Code From</label>
              <Textarea id="purchase-qr-code" value={watch("QRCodeFrom") ?? ""} onChange={(event) => setValue("QRCodeFrom", event.target.value, { shouldDirty: true })} className="min-h-20 resize-y text-sm" disabled={isDisabled} />
            </div>
            <div className={rowClass}>
              <label className="text-xs font-medium text-slate-600" htmlFor="purchase-cancel-date">Cancellation Date</label>
              <Input id="purchase-cancel-date" type="date" value={watch("CancelDate") ?? ""} onChange={(event) => setValue("CancelDate", event.target.value, { shouldDirty: true })} className={inputClass} disabled={isDisabled} />
            </div>
            <div className={rowClass}>
              <label className="text-xs font-medium text-slate-600" htmlFor="purchase-required-date-accounting">Required Date</label>
              <Input id="purchase-required-date-accounting" type="date" value={watch("RequiredDate") ?? ""} onChange={(event) => setValue("RequiredDate", event.target.value, { shouldDirty: true })} className={inputClass} disabled={isDisabled} />
            </div>
            <div className={rowClass}>
              <label className="text-xs font-medium text-slate-600" htmlFor="purchase-indicator">Indicator</label>
              <Select value={watch("Indicator") ?? ""} onValueChange={(value) => setValue("Indicator", value, { shouldDirty: true })} disabled={isDisabled}>
                <SelectTrigger id="purchase-indicator" className={selectClass}><SelectValue placeholder="Select indicator" /></SelectTrigger>
                <SelectContent>
                  {indicators.map((indicator) => <SelectItem key={indicator.IndicatorCode} value={String(indicator.IndicatorCode)}>{indicator.IndicatorName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className={rowClass}>
              <label className="text-xs font-medium text-slate-600" htmlFor="purchase-federal-tax-id">Federal Tax ID</label>
              <Input id="purchase-federal-tax-id" value={watch("FederalTaxID") ?? ""} onChange={(event) => setValue("FederalTaxID", event.target.value, { shouldDirty: true })} className={inputClass} disabled={isDisabled} />
            </div>
            <div className={rowClass}>
              <label className="text-xs font-medium text-slate-600" htmlFor="purchase-order-number">Order Number</label>
              <Input id="purchase-order-number" value={watch("NumAtCard") ?? ""} onChange={(event) => setValue("NumAtCard", event.target.value, { shouldDirty: true })} className={inputClass} disabled={isDisabled} />
            </div>
            <div className={rowClass}>
              <span className="text-xs font-medium text-slate-600">Referenced Document</span>
              <div>
                <Button type="button" variant="outline" size="icon" aria-label="Open reference information" disabled={isDisabled} onClick={() => setReferencesOpen(true)} className="h-9 w-9 border-slate-200 text-slate-600 hover:bg-slate-50">
                  ...
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>

      <ReferenceInformationDialog open={referencesOpen} onOpenChange={setReferencesOpen} cardCode={cardCode} />
    </>
  );
}
