"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";
import { BadgeCheck, Languages, MapPin, MoreHorizontal, Truck } from "lucide-react";
import { toast } from "sonner";
import { getShippingTypes, type ShippingType } from "@/api+/sap/BusinessPartner/BPService";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { usePurchaseDocument } from "@/stores/purchase/usePurchaseDocument";

const addressFields = [
  ["Street / PO Box", "Street"],
  ["Street No.", "StreetNo"],
  ["Block", "Block"],
  ["City", "City"],
  ["Zip Code", "ZipCode"],
  ["County", "County"],
  ["State", "State"],
  ["Country/Region", "Country"],
  ["Building/Floor/Room", "BuildingFloorRoom"],
  ["Address Name 2", "Address2"],
  ["Address Name 3", "Address3"],
  ["GLN", "GLN"],
] as const;

type AddressPart = (typeof addressFields)[number][1];
type AddressDraft = Record<AddressPart, string>;
type BPAddress = Record<string, any>;

const emptyAddress = (): AddressDraft => Object.fromEntries(
  addressFields.map(([, key]) => [key, ""]),
) as AddressDraft;

const addressText = (address?: BPAddress | null) => {
  if (!address) return "";
  return [
    address.AddressName,
    address.Street,
    address.StreetNo,
    address.Block,
    address.BuildingFloorRoom,
    address.City,
    address.ZipCode,
    address.State,
    address.Country,
  ].filter(Boolean).join("\n");
};

const toDraft = (address?: BPAddress | null): AddressDraft => {
  const draft = emptyAddress();
  for (const [, key] of addressFields) draft[key] = String(address?.[key] ?? "");
  return draft;
};

const addressCode = (address: BPAddress) => String(
  address.AddressName ?? address.Code ?? address.AddressCode ?? "",
);

const addressTypeMatches = (address: BPAddress, kind: "ship" | "bill") => {
  const value = String(address.AddressType ?? address.Type ?? "").toLowerCase();
  return !value || value.includes(kind) || (kind === "bill" && value.includes("pay"));
};

export function PurchaseQuotationLogisticsTab() {
  const { watch, setValue } = useFormContext<any>();
  const vendor = usePurchaseDocument((state) => state.requester) as (Record<string, any> | null);
  const cardCode = watch("CardCode");
  const shipToCode = watch("ShipToCode");
  const payToCode = watch("PayToCode");
  const addressExtension = watch("AddressExtension") ?? {};
  const [shippingTypes, setShippingTypes] = useState<ShippingType[]>([]);
  const [addressDialog, setAddressDialog] = useState<"ship" | "pay" | null>(null);
  const [addressDraft, setAddressDraft] = useState<AddressDraft>(emptyAddress);

  useEffect(() => {
    getShippingTypes()
      .then(setShippingTypes)
      .catch((error) => {
        console.error("Failed to load purchase quotation shipping types:", error);
        toast.error("Failed to load Shipping Types");
      });
  }, []);

  const partnerAddresses = useMemo(() => {
    const value = vendor?.BPAddresses ?? vendor?.Addresses ?? [];
    return Array.isArray(value) ? value as BPAddress[] : [];
  }, [vendor]);
  const shipAddresses = useMemo(
    () => partnerAddresses.filter((address) => addressTypeMatches(address, "ship")),
    [partnerAddresses],
  );
  const payAddresses = useMemo(
    () => partnerAddresses.filter((address) => addressTypeMatches(address, "bill")),
    [partnerAddresses],
  );

  useEffect(() => {
    if (!cardCode || !vendor || vendor.CardCode !== cardCode) return;
    const fallback = [vendor.Address, vendor.City, vendor.State, vendor.ZipCode, vendor.Country]
      .filter(Boolean).join("\n");
    const defaultShip = shipAddresses.find((address) => address.AddressName === vendor.ShipToDefault) ?? shipAddresses[0];
    const defaultPay = payAddresses.find((address) => address.AddressName === vendor.BilltoDefault) ?? payAddresses[0];

    if (!watch("ShipToCode")) {
      setValue("ShipToCode", addressCode(defaultShip ?? {}) || "default", { shouldDirty: false });
    }
    if (!watch("ShipToAddress")) {
      setValue("ShipToAddress", addressText(defaultShip) || fallback, { shouldDirty: false });
    }
    if (!watch("PayToCode")) {
      setValue("PayToCode", addressCode(defaultPay ?? {}) || "default", { shouldDirty: false });
    }
    if (!watch("BillToAddress")) {
      setValue("BillToAddress", addressText(defaultPay) || fallback, { shouldDirty: false });
    }
  }, [cardCode, vendor, shipAddresses, payAddresses, setValue, watch]);

  const openAddressEditor = (kind: "ship" | "pay") => {
    const prefix = kind === "ship" ? "ShipTo" : "BillTo";
    const fromExtension = Object.fromEntries(addressFields.map(([, key]) => [
      key,
      String(addressExtension[`${prefix}${key}`] ?? ""),
    ])) as AddressDraft;
    const currentText = String(watch(kind === "ship" ? "ShipToAddress" : "BillToAddress") ?? "");
    const lines = currentText.split("\n");
    addressFields.forEach(([, key], index) => {
      if (!fromExtension[key] && lines[index]) fromExtension[key] = lines[index];
    });
    setAddressDraft(fromExtension);
    setAddressDialog(kind);
  };

  const selectAddress = (kind: "ship" | "pay", value: string) => {
    const addresses = kind === "ship" ? shipAddresses : payAddresses;
    const selected = addresses.find((address) => addressCode(address) === value);
    const codeField = kind === "ship" ? "ShipToCode" : "PayToCode";
    const textField = kind === "ship" ? "ShipToAddress" : "BillToAddress";
    setValue(codeField, value, { shouldDirty: true });
    if (selected) {
      setValue(textField, addressText(selected), { shouldDirty: true });
      const prefix = kind === "ship" ? "ShipTo" : "BillTo";
      setValue("AddressExtension", {
        ...addressExtension,
        ...Object.fromEntries(addressFields.map(([, key]) => [
          `${prefix}${key}`,
          selected[key] ?? "",
        ])),
      }, { shouldDirty: true });
    }
  };

  const renderAddressOptions = (kind: "ship" | "bill", values: BPAddress[], currentValue: string) => {
    const seen = new Set<string>();
    const options = values.map((address) => ({
      code: addressCode(address),
      label: String(address.AddressName ?? address.AddressCode ?? address.Code ?? "Address"),
    })).filter((option) => option.code && !seen.has(option.code) && !!seen.add(option.code));
    if (!options.length) options.push({ code: "default", label: "Default" });
    if (currentValue && currentValue !== "default" && !options.some((option) => option.code === currentValue)) {
      options.push({ code: currentValue, label: currentValue });
    }
    return options.map((option) => (
      <SelectItem key={`${kind}-${option.code}`} value={option.code}>{option.label}</SelectItem>
    ));
  };

  const addressLabel = (kind: "ship" | "pay") => kind === "ship" ? "Ship To" : "Pay To";
  const codeField = (kind: "ship" | "pay") => kind === "ship" ? "ShipToCode" : "PayToCode";
  const addressField = (kind: "ship" | "pay") => kind === "ship" ? "ShipToAddress" : "BillToAddress";
  const optionsKind = (kind: "ship" | "pay") => kind === "ship" ? "ship" : "bill";
  const addressList = (kind: "ship" | "pay") => kind === "ship" ? shipAddresses : payAddresses;

  return (
    <>
      <div className="min-h-[230px] rounded-xl border border-slate-200 bg-slate-50/70 p-5">
        <div className="mb-5 flex items-center gap-3 border-b border-slate-200 pb-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><Truck className="h-5 w-5" /></span>
          <div><h3 className="text-sm font-semibold text-slate-900">Shipping &amp; delivery</h3><p className="mt-0.5 text-xs text-slate-500">Manage delivery addresses and quotation preferences</p></div>
        </div>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="grid grid-cols-1 gap-4 2xl:grid-cols-2">
            {(["ship", "pay"] as const).map((kind) => {
              const selectedCode = String(watch(codeField(kind)) ?? "");
              const selectedValue = selectedCode || (addressList(kind).length ? "" : "default");
              return (
                <div key={kind} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/40">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800"><MapPin className="h-4 w-4 text-blue-600" />{addressLabel(kind)}</div>
                  <div className="mb-2 flex gap-2">
                    <Select value={selectedValue} onValueChange={(value) => selectAddress(kind, value)}>
                      <SelectTrigger className="h-9 flex-1 text-sm"><SelectValue placeholder="Select address" /></SelectTrigger>
                      <SelectContent>{renderAddressOptions(optionsKind(kind), addressList(kind), selectedValue)}</SelectContent>
                    </Select>
                    <Button type="button" variant="outline" size="icon" aria-label={`Edit ${addressLabel(kind)} address`} className="h-9 w-9 shrink-0 text-slate-600" onClick={() => openAddressEditor(kind)}><MoreHorizontal className="h-4 w-4" /></Button>
                  </div>
                  <Textarea aria-label={`${addressLabel(kind)} address`} className="min-h-[88px] resize-none border-slate-200 bg-slate-50/60 text-sm leading-5" value={String(watch(addressField(kind)) ?? "")} onChange={(event) => setValue(addressField(kind), event.target.value, { shouldDirty: true })} />
                </div>
              );
            })}

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/40">
              <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500"><Truck className="h-4 w-4 text-blue-600" />Shipping Type</label>
              <Select
                value={watch("TransportationCode") == null || watch("TransportationCode") === "" ? "" : String(watch("TransportationCode"))}
                onValueChange={(value) => setValue("TransportationCode", value, { shouldDirty: true })}
              >
                <SelectTrigger className="h-9 w-full text-sm"><SelectValue placeholder="Select shipping type" /></SelectTrigger>
                <SelectContent>
                  {shippingTypes.map((shippingType) => (
                    <SelectItem key={shippingType.Code} value={String(shippingType.Code)}>{shippingType.Name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/40">
            <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800"><Languages className="h-4 w-4 text-blue-600" />Preferences</h4>
            <div className="mb-5">
              <label className="mb-2 block text-xs font-medium text-slate-600">Language</label>
              <Select value={watch("LanguageCode") == null ? "" : String(watch("LanguageCode"))} onValueChange={(value) => setValue("LanguageCode", value, { shouldDirty: true })}>
              <SelectTrigger className="h-9 w-full text-sm"><SelectValue placeholder="Select language" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ur">Urdu</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3 border-t border-slate-100 pt-4">
              <label className="flex cursor-pointer items-center gap-3 rounded-lg p-2 text-sm text-slate-700 hover:bg-slate-50">
                <Checkbox checked={Boolean(watch("CreateOnlineQuotation"))} onCheckedChange={(checked) => setValue("CreateOnlineQuotation", checked === true, { shouldDirty: true })} />
                Create Online Quotation
              </label>
              <label className="flex cursor-pointer items-center gap-3 rounded-lg p-2 text-sm text-slate-700 hover:bg-slate-50">
                <Checkbox checked={Boolean(watch("Confirmed"))} onCheckedChange={(checked) => setValue("Confirmed", checked === true, { shouldDirty: true })} />
                <BadgeCheck className="h-4 w-4 text-emerald-600" />Confirmed
              </label>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={addressDialog !== null} onOpenChange={(open) => !open && setAddressDialog(null)}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-hidden">
          <DialogHeader><DialogTitle>{addressDialog ? `${addressLabel(addressDialog)} Address` : "Address"}</DialogTitle></DialogHeader>
          <div className="max-h-[65vh] overflow-y-auto rounded border">
            {addressFields.map(([label, key]) => (
              <div key={key} className="grid grid-cols-[150px_1fr] border-b last:border-b-0">
                <label className="flex items-center border-r px-2 py-1.5 text-xs">{label}</label>
                <Input value={addressDraft[key]} onChange={(event) => setAddressDraft((current) => ({ ...current, [key]: event.target.value }))} className="h-8 rounded-none border-0 text-xs shadow-none" />
              </div>
            ))}
          </div>
          <DialogFooter className="justify-start sm:justify-start">
            <Button type="button" size="sm" onClick={() => {
              if (!addressDialog) return;
              const kind = addressDialog;
              const prefix = kind === "ship" ? "ShipTo" : "BillTo";
              const textField = kind === "ship" ? "ShipToAddress" : "BillToAddress";
              const text = [
                addressDraft.Address2,
                addressDraft.Address3,
                addressDraft.Street,
                addressDraft.StreetNo,
                addressDraft.Block,
                addressDraft.BuildingFloorRoom,
                addressDraft.City,
                addressDraft.ZipCode,
                addressDraft.State,
                addressDraft.Country,
              ].filter(Boolean).join("\n");
              setValue(textField, text, { shouldDirty: true });
              setValue("AddressExtension", {
                ...addressExtension,
                ...Object.fromEntries(addressFields.map(([, key]) => [`${prefix}${key}`, addressDraft[key]])),
              }, { shouldDirty: true });
              setAddressDialog(null);
            }}>OK</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setAddressDialog(null)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
