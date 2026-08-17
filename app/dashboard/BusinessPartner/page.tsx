"use client";

import {
  BusinessPartnerCategory,
  BusinessPartnerGroup,
  Currency,
  BusinessPartnerProject,
  Industry,
  BusinessPartnerType,
  ShippingType,
  FactoringIndicator,
  getBusinessPartnerCategories,
  getBusinessPartnerGroups,
  getCurrencies,
  getBusinessPartnerProjects,
  getIndustries,
  getBusinessPartnerTypes,
  getShippingTypes,
  getFactoringIndicators,
  saveBusinessPartner,
} from "@/api+/sap/BusinessPartner/BPService";

import { getDocumentsList } from "@/api+/sap/common/documentService";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";

import { Search, List, Loader2 } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { GenericModal } from "@/modals/GenericModal";
import { DocumentType } from "@/types/master/DocumentType";
import { BusinessPartner } from "@/types/sales/businessPartner.type";

export default function BPMasterDataPage() {
  const [documentsList, setDocumentsList] = useState<BusinessPartner[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [listSearch, setListSearch] = useState("");
  const PAGE_SIZE = 20;

  const searchRequestIdRef = useRef(0);

  const [cardTypes, setCardTypes] = useState<BusinessPartnerCategory[]>([]);
  const [groups, setGroups] = useState<BusinessPartnerGroup[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [projects, setProjects] = useState<BusinessPartnerProject[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [companies, setCompanies] = useState<BusinessPartnerType[]>([]);
  const [shippingTypes, setShippingTypes] = useState<ShippingType[]>([]);
  const [factoringIndicators, setFactoringIndicators] = useState<FactoringIndicator[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const [openShipping, setOpenShipping] = useState(false);
  const [openIndicator, setOpenIndicator] = useState(false);
  const [openProject, setOpenProject] = useState(false);
  const [openIndustry, setOpenIndustry] = useState(false);
  const [openCompany, setOpenCompany] = useState(false);

  const [formData, setFormData] = useState({
    CardCode: "",
    CardName: "",
    CardType: "",
    Phone1: "",
    Phone2: "",
    Cellular: "",
    Fax: "",
    EmailAddress: "",
    Website: "",
    Currency: "",
    Group: "",
    ForeignName: "",
    Remarks: "",
    FreeText: "",
    Industry: "",
    IndustryCode: "",
    Indicator: "",
    Project: "",
    ShippingType: "",
    ShippingTypeCode: "",
    Company: "",
    Status: "active",
  });

  const getResourceName = (type: number) => {
    switch (type) {
      case DocumentType.Quotation:
        return "Quotations";
      case DocumentType.Order:
        return "Orders";
      case DocumentType.Delivery:
        return "DeliveryNotes";
      case DocumentType.ARInvoice:
        return "Invoices";
      case DocumentType.SalesReturn:
        return "Returns";
      case DocumentType.BusinessPartner:
        return "BusinessPartners";
      default:
        return "";
    }
  };

  const fetchDocumentsList = useCallback(
    async (isLoadMore = false, searchText?: string) => {
      const resourceName = getResourceName(DocumentType.BusinessPartner);

      if (!resourceName) {
        console.error("Resource name not found");
        return;
      }

      const requestId = ++searchRequestIdRef.current;
      const currentSkip = isLoadMore ? skip + PAGE_SIZE : 0;

      setIsLoadingList(true);

      try {
        const data = await getDocumentsList(resourceName, currentSkip, PAGE_SIZE, searchText);

        if (requestId !== searchRequestIdRef.current) return;

        if (isLoadMore) {
          setDocumentsList((prev) => [...prev, ...data]);
          setSkip(currentSkip);
        } else {
          setDocumentsList(data);
          setSkip(0);
        }

        setHasMore(data.length === PAGE_SIZE);
      } catch (error) {
        if (requestId === searchRequestIdRef.current) {
          console.error("Get Business Partners Error:", error);
          toast.error("Failed to fetch Business Partners.");
        }
      } finally {
        if (requestId === searchRequestIdRef.current) {
          setIsLoadingList(false);
        }
      }
    },
    [skip]
  );

  const debouncedFetchDocumentsList = useDebouncedCallback((val: string) => {
    fetchDocumentsList(false, val);
  }, 400);

  const openBPModal = useCallback(() => {
    setOpen(true);
  }, []);

  useEffect(() => {
    if (open) {
      fetchDocumentsList(false);
    }
  }, [open, fetchDocumentsList]);

  useEffect(() => {
    (async () => {
      try {
        setCardTypes(await getBusinessPartnerCategories());
      } catch (error) {
        console.error(error);
        toast.error("Failed to load Card Types");
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setGroups(await getBusinessPartnerGroups());
      } catch (error) {
        console.error(error);
        toast.error("Failed to load Groups");
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setCurrencies(await getCurrencies());
      } catch (error) {
        console.error(error);
        toast.error("Failed to load Currencies");
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setProjects(await getBusinessPartnerProjects());
      } catch (error) {
        console.error(error);
        toast.error("Failed to load Projects");
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setIndustries(await getIndustries());
      } catch (error) {
        console.error(error);
        toast.error("Failed to load Industries");
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setCompanies(await getBusinessPartnerTypes());
      } catch (error) {
        console.error(error);
        toast.error("Failed to load Companies");
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setShippingTypes(await getShippingTypes());
      } catch (error) {
        console.error(error);
        toast.error("Failed to load Shipping Types");
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setFactoringIndicators(await getFactoringIndicators());
      } catch (error) {
        console.error(error);
        toast.error("Failed to load Factoring Indicators");
      }
    })();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        e.stopPropagation();
        openBPModal();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [openBPModal]);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.CardCode.trim()) {
      toast.error("Please enter Card Code");
      return;
    }
    if (!formData.CardName.trim()) {
      toast.error("Please enter Card Name");
      return;
    }
    if (!formData.CardType.trim()) {
      toast.error("Please select Card Type");
      return;
    }
    if (!formData.Group) {
      toast.error("Please select Group");
      return;
    }
    if (!formData.ShippingTypeCode) {
      toast.error("Please select Shipping Type");
      return;
    }

    const payload = {
      CardCode: formData.CardCode.trim(),
      CardName: formData.CardName.trim(),
      CardType: formData.CardType,
      Valid: formData.Status === "active" ? "tYES" : "tNO",
      GroupCode: Number(formData.Group),
      Phone1: formData.Phone1,
      Phone2: formData.Phone2,
      Cellular: formData.Cellular,
      Fax: formData.Fax,
      EmailAddress: formData.EmailAddress,
      Website: formData.Website,
      Currency: formData.Currency,
      ShippingType: Number(formData.ShippingTypeCode),
      Indicator: formData.Indicator ? formData.Indicator.split(" - ")[0] : "",
      CompanyPrivate: formData.Company ? formData.Company.split(" - ")[0] : "",
      Industry: formData.Industry || "",
      ProjectCode: formData.Project ? formData.Project.split(" - ")[0] : "",
      U_NTNRegistered: "Registered",
      Notes: formData.Remarks,
      FreeText: formData.FreeText,
    };

    setIsSaving(true);

    try {
      const response = await saveBusinessPartner(payload);
      console.log("Save Response:", response);

      toast.success("Business Partner Saved Successfully");

      setFormData({
        CardCode: "",
        CardName: "",
        CardType: "",
        Phone1: "",
        Phone2: "",
        Cellular: "",
        Fax: "",
        EmailAddress: "",
        Website: "",
        Currency: "",
        Group: "",
        ForeignName: "",
        Remarks: "",
        FreeText: "",
        Industry: "",
        IndustryCode: "",
        Indicator: "",
        Project: "",
        ShippingType: "",
        ShippingTypeCode: "",
        Company: "",
        Status: "active",
      });

      setSearchValue("");
    } catch (error: any) {
      console.error("Save Business Partner Error:", error);
      console.error("Status:", error?.response?.status);
      console.error("Response:", error?.response?.data);
      console.error("Validation Errors:", error?.response?.data?.errors);

      const validationErrors = error?.response?.data?.errors;

      if (validationErrors) {
        console.error(JSON.stringify(validationErrors, null, 2));
      }

      if (validationErrors?.document) {
        toast.error("Document data is required by the API.");
      } else if (validationErrors?.["$.Industry"]) {
        toast.error("Invalid Industry value.");
      } else {
        toast.error("Failed to Save Business Partner");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleRowDoubleClick = (item: any) => {
    setFormData({
      CardCode: item.CardCode ?? "",
      CardName: item.CardName ?? "",
      CardType: item.CardType ?? "",
      Group: item.GroupCode != null ? item.GroupCode.toString() : "",
      Phone1: item.Phone1 ?? "",
      Phone2: item.Phone2 ?? "",
      Cellular: item.Cellular ?? "",
      Fax: item.Fax ?? "",
      EmailAddress: item.EmailAddress ?? "",
      Website: item.Website ?? "",
      Currency: item.Currency ?? "",
      ForeignName: item.ForeignName ?? "",
      Remarks: item.Remarks ?? "",
      FreeText: item.FreeText ?? "",
      Industry: item.Industry ?? "",
      IndustryCode: item.IndustryCode != null ? item.IndustryCode.toString() : "",
      ShippingType: item.ShippingTypeName ?? "",
      ShippingTypeCode: item.ShippingType != null ? item.ShippingType.toString() : "",
      Indicator: item.Indicator ?? "",
      Project: item.Project ?? "",
      Company: item.CompanyPrivate ?? "",
      Status: item.Status ?? "active",
    });

    setOpen(false);
  };

  const handleSearch = () => {
    const val = searchValue.trim();

    if (!val) {
      setDocumentsList([]);
      setSkip(0);
      setListSearch("");
      setOpen(true);
      fetchDocumentsList(false);
      return;
    }

    setListSearch(val);
    setDocumentsList([]);
    setSkip(0);
    setOpen(true);
    fetchDocumentsList(false, val);
  };

  const isFormValid = formData.CardCode.trim() !== "" && formData.CardType.trim() !== "";

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="mx-auto max-w-[1500px] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b bg-muted px-6 py-3">
          <h1 className="text-xl font-semibold">Business Partner Master Data</h1>
        </div>

        <GenericModal
          title="Select Business Partner"
          open={open}
          onClose={() => {
            setOpen(false);
            setListSearch("");
          }}
          data={documentsList}
          isLoading={isLoadingList}
          getSelectValue={(item) => item.CardCode}
          onSelect={(value) => {
            const selected = documentsList.find((item) => item.CardCode === value);
            if (selected) {
              handleRowDoubleClick(selected);
            }
            setOpen(false);
          }}
          columns={[
            { key: "CardCode", label: "Card Code" },
            { key: "CardName", label: "Card Name" },
            { key: "CardType", label: "Card Type" },
          ]}
          onLoadMore={() => fetchDocumentsList(true, listSearch)}
          hasMore={hasMore}
          onSearch={(value) => {
            setListSearch(value);
            setDocumentsList([]);
            setSkip(0);
            setIsLoadingList(true);
            debouncedFetchDocumentsList(value);
          }}
          searchValue={listSearch}
        />

        <GenericModal
          title="Select Shipping Type"
          open={openShipping}
          onClose={() => setOpenShipping(false)}
          data={shippingTypes}
          getSelectValue={(item) => item.Code.toString()}
          onSelect={(value) => {
            const selected = shippingTypes.find((item) => item.Code.toString() === value);
            if (selected) {
              handleChange("ShippingType", selected.Name);
              handleChange("ShippingTypeCode", selected.Code.toString());
            }
            setOpenShipping(false);
          }}
          columns={[
            { key: "Code", label: "Code" },
            { key: "Name", label: "Name" },
            { key: "Website", label: "Website" },
          ]}
        />

        <GenericModal
          title="Select Indicator"
          open={openIndicator}
          onClose={() => setOpenIndicator(false)}
          data={factoringIndicators}
          getSelectValue={(item: any) => item.IndicatorCode}
          onSelect={(value) => {
            const selected = factoringIndicators.find((item) => item.IndicatorCode === value);
            if (selected) {
              handleChange("Indicator", selected.IndicatorCode);
            }
            setOpenIndicator(false);
          }}
          columns={[
            { key: "IndicatorCode", label: "Code" },
            { key: "IndicatorName", label: "Name" },
          ]}
        />

        <GenericModal
          title="Select Project"
          open={openProject}
          onClose={() => setOpenProject(false)}
          data={projects}
          getSelectValue={(item: any) => item.Code}
          onSelect={(value) => {
            const selected = projects.find((item) => item.Code === value);
            if (selected) {
              handleChange("Project", selected.Code);
            }
            setOpenProject(false);
          }}
          columns={[
            { key: "Code", label: "Code" },
            { key: "Name", label: "Name" },
            { key: "ValidFrom", label: "Valid From" },
            { key: "ValidTo", label: "Valid To" },
            { key: "Active", label: "Active" },
          ]}
        />

        <GenericModal
          title="Select Industry"
          open={openIndustry}
          onClose={() => setOpenIndustry(false)}
          data={industries}
          getSelectValue={(item) => item.IndustryCode.toString()}
          onSelect={(value) => {
            const selected = industries.find((item) => item.IndustryCode.toString() === value);
            if (selected) {
              handleChange("Industry", selected.IndustryName);
              handleChange("IndustryCode", selected.IndustryCode.toString());
            }
            setOpenIndustry(false);
          }}
          columns={[
            { key: "IndustryCode", label: "Code" },
            { key: "IndustryName", label: "Name" },
            { key: "IndustryDescription", label: "Description" },
          ]}
        />

        <GenericModal
          title="Select Company"
          open={openCompany}
          onClose={() => setOpenCompany(false)}
          data={companies}
          getSelectValue={(item: BusinessPartnerType) => item.Code}
          onSelect={(value) => {
            const selected = companies.find((item) => item.Code === value);
            if (selected) {
              handleChange("Company", selected.Code);
            }
            setOpenCompany(false);
          }}
          columns={[
            { key: "Code", label: "Code" },
            { key: "Name", label: "Name" },
          ]}
        />

        <div className="bg-white px-6 py-5">
          <div className="space-y-3">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <label className="w-20 shrink-0 text-sm">Code</label>
                <Input
                  value={formData.CardCode}
                  onChange={(e) => handleChange("CardCode", e.target.value)}
                  placeholder="Enter Code"
                  disabled={formData.CardCode.trim() !== ""}
                  className="h-7 w-45"
                />
              </div>

              <div className="flex items-center gap-2">
                <Select
                  value={formData.CardType}
                  onValueChange={(value) => handleChange("CardType", value)}
                  disabled={formData.CardType.trim() !== ""}
                >
                  <SelectTrigger className="h-7 w-45">
                    <SelectValue placeholder="Select Card Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {cardTypes.map((item) => (
                      <SelectItem key={item.Code} value={item.Code}>
                        {item.Name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="ml-auto flex items-center gap-2">
                <Input
                  type="text"
                  placeholder="Search By Code"
                  className="h-8 w-38"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSearch();
                    }
                  }}
                />

                <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={handleSearch}>
                  <Search className="h-5 w-5" />
                </Button>

                <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={openBPModal}>
                  <List className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="w-20 shrink-0 text-sm">Name</label>
              <Input
                value={formData.CardName}
                onChange={(e) => handleChange("CardName", e.target.value)}
                placeholder="Enter Name"
                className="h-7 w-45"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="w-20 shrink-0 text-sm">Group</label>
              <Select value={formData.Group} onValueChange={(value) => handleChange("Group", value)}>
                <SelectTrigger className="h-7 w-45">
                  <SelectValue placeholder="Select Group" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((item) => (
                    <SelectItem key={item.Code} value={item.Code.toString()}>
                      {item.Name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="w-20 shrink-0 text-sm">Currency</label>
              <Select value={formData.Currency} onValueChange={(value) => handleChange("Currency", value)}>
                <SelectTrigger className="h-7 w-45">
                  <SelectValue placeholder="Select Currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.Code} value={currency.Code}>
                      {currency.Code} - {currency.Name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Tabs defaultValue="general" className="mt-6 bg-white px-6 pb-6">
          <TabsList className="h-11 w-[300px] rounded-xl bg-[#1f1f1f] p-1">
            <TabsTrigger
              value="general"
              className="flex-1 rounded-lg font-semibold text-gray-300 data-[state=active]:bg-[#2d2d2d] data-[state=active]:text-white"
            >
              General
            </TabsTrigger>
            <TabsTrigger
              value="remarks"
              className="flex-1 rounded-lg font-semibold text-gray-300 data-[state=active]:bg-[#2d2d2d] data-[state=active]:text-white"
            >
              Remarks
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <div className="rounded-md border bg-white p-5">
              <div className="grid grid-cols-3 gap-x-5 gap-y-3">
                <div className="flex items-center gap-2">
                  <label className="w-28 shrink-0 text-sm font-medium">Tel 1</label>
                  <Input
                    value={formData.Phone1}
                    onChange={(e) => handleChange("Phone1", e.target.value)}
                    className="h-7 flex-1 min-w-0"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <label className="w-28 shrink-0 text-sm font-medium">Tel 2</label>
                  <Input
                    value={formData.Phone2}
                    onChange={(e) => handleChange("Phone2", e.target.value)}
                    className="h-7 flex-1 min-w-0"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <label className="w-28 shrink-0 text-sm font-medium">Mobile Phone</label>
                  <Input
                    value={formData.Cellular}
                    onChange={(e) => handleChange("Cellular", e.target.value)}
                    className="h-7 flex-1 min-w-0"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <label className="w-28 shrink-0 text-sm font-medium">Fax</label>
                  <Input
                    value={formData.Fax}
                    onChange={(e) => handleChange("Fax", e.target.value)}
                    className="h-7 flex-1 min-w-0"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <label className="w-28 shrink-0 text-sm font-medium">E-Mail</label>
                  <Input
                    value={formData.EmailAddress}
                    onChange={(e) => handleChange("EmailAddress", e.target.value)}
                    className="h-7 flex-1 min-w-0"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <label className="w-28 shrink-0 text-sm font-medium">Web Site</label>
                  <Input
                    value={formData.Website}
                    onChange={(e) => handleChange("Website", e.target.value)}
                    className="h-7 flex-1 min-w-0"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <label className="w-28 shrink-0 text-sm font-medium">Shipping Type</label>
                  <div className="flex flex-1 min-w-0 items-center gap-1">
                    <Input value={formData.ShippingType} readOnly className="h-7 flex-1 min-w-0" />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setOpenShipping(true)}
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="w-28 shrink-0 text-sm font-medium">Password</label>
                  <Input type="password" className="h-7 flex-1 min-w-0" />
                </div>

                <div className="flex items-center gap-2">
                  <label className="w-28 shrink-0 text-sm font-medium">Factoring</label>
                  <div className="flex flex-1 min-w-0 items-center gap-1">
                    <Input value={formData.Indicator} readOnly className="h-7 flex-1 min-w-0" />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setOpenIndicator(true)}
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="w-28 shrink-0 text-sm font-medium">Project</label>
                  <div className="flex flex-1 min-w-0 items-center gap-1">
                    <Input value={formData.Project} readOnly className="h-7 flex-1 min-w-0" />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setOpenProject(true)}
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="w-28 shrink-0 text-sm font-medium">Industry</label>
                  <div className="flex flex-1 min-w-0 items-center gap-1">
                    <Input value={formData.Industry} readOnly className="h-7 flex-1 min-w-0" />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setOpenIndustry(true)}
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="w-28 shrink-0 text-sm font-medium">Business Type</label>
                  <div className="flex flex-1 min-w-0 items-center gap-1">
                    <Input value={formData.Company} readOnly className="h-7 flex-1 min-w-0" />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setOpenCompany(true)}
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="col-span-3 mt-1 flex items-start gap-2">
                  <label className="w-28 shrink-0 pt-2 text-sm font-medium">Remarks</label>
                  <Textarea
                    value={formData.Remarks}
                    onChange={(e) => handleChange("Remarks", e.target.value)}
                    className="h-20 max-w-[500px] resize-none"
                  />
                </div>

                <div className="col-span-3 mt-1 flex items-center gap-2">
                  <label className="w-28 shrink-0 text-sm font-medium">Status</label>
                  <RadioGroup
                    value={formData.Status}
                    onValueChange={(value) => handleChange("Status", value)}
                    className="flex items-center gap-5"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="active" id="active" />
                      <label htmlFor="active" className="text-sm">Active</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="inactive" id="inactive" />
                      <label htmlFor="inactive" className="text-sm">Inactive</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="advanced" id="advanced" />
                      <label htmlFor="advanced" className="text-sm">Advanced</label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="remarks">
            <div className="mt-6 rounded-md border p-5">
              <label className="mb-2 block text-sm font-medium">Remarks</label>
              <Textarea
                value={formData.FreeText}
                onChange={(e) => handleChange("FreeText", e.target.value)}
                placeholder="Enter Remarks..."
                rows={6}
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-4 flex items-center justify-end border-t bg-white px-4 py-3">
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!isFormValid || isSaving}
            className="h-9 min-w-[92px] rounded-md px-6 font-medium"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Submit"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}