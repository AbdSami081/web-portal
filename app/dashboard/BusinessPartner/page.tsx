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
import { Search, List, ChevronDown, Loader2 } from "lucide-react";
import React, { useCallback, useState, useEffect } from "react";
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
import { getDocumentsList } from "@/api+/sap/common/documentService";

export default function BPMasterDataPage() {
  const [documentsList, setDocumentsList] = useState<BusinessPartner[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 20;
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
    Indicator: "",
    Project: "",
    ShippingType: "",
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
    async (isLoadMore = false) => {
      const resourceName = getResourceName(DocumentType.BusinessPartner);

      if (!resourceName) return;

      const currentSkip = isLoadMore ? skip + PAGE_SIZE : 0;

      setIsLoadingList(true);
      try {
        const data = await getDocumentsList(
          resourceName,
          currentSkip,
          PAGE_SIZE
        );

        if (isLoadMore) {
          setDocumentsList((prev) => [...prev, ...data]);
          setSkip(currentSkip);
        } else {
          setDocumentsList(data);
          setSkip(0);
        }

        setHasMore(data.length === PAGE_SIZE); 
      } catch {
        toast.error("Failed to fetch documents list.");
      } finally {
        setIsLoadingList(false);
      }
    },
    [skip]
  );

  const openBPModal = useCallback(() => {
    setOpen(true);
  }, []);

  useEffect(() => {
    if (open) {
      fetchDocumentsList(false);
    }
  }, [open]);

  useEffect(() => {
    const loadCardTypes = async () => {
      try {
        const data = await getBusinessPartnerCategories();
        setCardTypes(data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load Card Types");
      }
    };

    loadCardTypes();
  }, []);

  useEffect(() => {
    const loadGroups = async () => {
      try {
        const data = await getBusinessPartnerGroups();
        setGroups(data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load Groups");
      }
    };

    loadGroups();
  }, []);

  useEffect(() => {
    const loadCurrencies = async () => {
      try {
        const data = await getCurrencies();
        setCurrencies(data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load Currencies");
      }
    };

    loadCurrencies();
  }, []);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const data = await getBusinessPartnerProjects();
        setProjects(data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load Projects");
      }
    };

    loadProjects();
  }, []);

  useEffect(() => {
    const loadIndustries = async () => {
      try {
        const data = await getIndustries();
        setIndustries(data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load Industries");
      }
    };

    loadIndustries();
  }, []);

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const data = await getBusinessPartnerTypes();
        setCompanies(data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load Companies");
      }
    };

    loadCompanies();
  }, []);

  useEffect(() => {
    const loadShippingTypes = async () => {
      try {
        const data = await getShippingTypes();
        setShippingTypes(data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load Shipping Types");
      }
    };

    loadShippingTypes();
  }, []);

  useEffect(() => {
    const loadFactoringIndicators = async () => {
      try {
        const data = await getFactoringIndicators();
        setFactoringIndicators(data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load Factoring Indicators");
      }
    };

    loadFactoringIndicators();
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
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openBPModal]);

  const handleSubmit = async () => {
    const payload = {
      CardCode: formData.CardCode.trim(),
      CardName: formData.CardName.trim(),
      CardType: formData.CardType,
      GroupCode: Number(formData.Group),
      Phone1: formData.Phone1,
      Phone2: formData.Phone2,
      Website: formData.Website,
      Cellular: formData.Cellular,
      Fax: formData.Fax,
      ShippingType: Number(formData.ShippingType),
      Indicator: formData.Indicator
        ? formData.Indicator.split(" - ")[0]
        : "",
      CompanyPrivate: formData.Company
        ? formData.Company.split(" - ")[0]
        : "",
      Industry: formData.Industry
        ? formData.Industry.split(" - ")[0]
        : "",
      //Status: formData.Status,
      ProjectCode: formData.Project
        ? formData.Project.split(" - ")[0]
        : "",
      U_NTNRegistered: "Registered",
      Notes: formData.Remarks,
      FreeText: formData.FreeText,
    };

    setIsSaving(true);
    try {
      const response = await saveBusinessPartner(payload);
      toast.success("Business Partner Saved Successfully");
    } catch (error: any) {
      console.error("Save Business Partner Error:", error);
      toast.error("Failed to Save Business Partner");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleRowDoubleClick = (item: any) => {
    setFormData({
      CardCode: item.CardCode ?? "",
      CardName: item.CardName ?? "",
      CardType: item.CardType ?? "",
      Group: item.GroupCode?.toString() ?? "",
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
      Indicator: item.Indicator ?? "",
      Project: item.Project ?? "",
      ShippingType: item.ShippingType ?? "",
      Company: item.CompanyPrivate ?? "",
      Status: item.Status ?? "active",
    });

    setOpen(false);
  };

  const handleSearch = () => {
    if (!searchValue.trim()) return;
    const found = documentsList.find(
      (item) =>
        item.CardCode.toLowerCase() === searchValue.trim().toLowerCase() ||
        item.CardName.toLowerCase().includes(searchValue.trim().toLowerCase())
    );
    if (found) {
      handleRowDoubleClick(found);
      toast.success(`Business Partner ${found.CardCode} loaded successfully.`);
    } else {
      toast.error(`Business Partner "${searchValue}" not found.`);
    }
  };

  const isFormValid =
    formData.CardCode.trim() !== "" &&
    formData.CardType.trim() !== "";
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="mx-auto max-w-[1500px] bg-white shadow-sm">
        <div className="flex justify-between items-center px-6 py-3 border-b bg-muted shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold">Business Partner Master Data</h1>
          </div>
        </div>

      <GenericModal
        title="Select Business Partner"
        open={open}
        onClose={() => setOpen(false)}
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
        onLoadMore={() => fetchDocumentsList(true)}
        hasMore={hasMore}
    />

        <GenericModal
          title="Select Shipping Type"
          open={openShipping}
          onClose={() => setOpenShipping(false)}
          data={shippingTypes}
          getSelectValue={(item) => item.Code.toString()}
          onSelect={(value) => {
          const selected = shippingTypes.find(
          (item) => item.Code.toString() === value
          );

         if (selected) {
         handleChange("ShippingType", selected.Code.toString());
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
          isLoading={isLoadingList}
          data={factoringIndicators}
          getSelectValue={(item: any) => item.IndicatorCode}
          onSelect={(value) => {
          const selected = factoringIndicators.find(
         (item) => item.IndicatorCode === value
         );

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
          isLoading={isLoadingList}
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
         isLoading={isLoadingList}
         data={industries}
         getSelectValue={(item) => item.IndustryCode.toString()}
         onSelect={(value) => {
         const selected = industries.find(
         (item) => item.IndustryCode.toString() === value
         );

        if (selected) {
        handleChange("Industry", selected.IndustryCode.toString());
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
         isLoading={isLoadingList}
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
        <div className="bg-white px-6 py-6">
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-0">
                <label className="w-20 shrink-0 text-sm">Code</label>
                <div className="flex items-center">
                  <Input
                    value={formData.CardCode}
                    onChange={(e) => handleChange("CardCode", e.target.value)}
                    placeholder="Enter Code"
                    className="h-7 w-45"
                    
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  placeholder="Search document..."
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
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 cursor-pointer"
                  onClick={handleSearch}
                >
                  <Search className="h-5 w-5" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 cursor-pointer"
                  onClick={openBPModal}
                  title="List Business Partners"
                >
                  <List className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-1 w-full lg:w-1/2">
              <div className="flex items-center gap-0">
                <label className="w-20 shrink-0 text-sm">Group</label>
                <Select value={formData.Group} onValueChange={(value) => handleChange("Group", value)}>
                  <SelectTrigger className="w-40 h-7">
                    <SelectValue placeholder="Select Group" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((item) => (
                    <SelectItem
                    key={item.Code}
                    value={item.Code.toString()}
                    >
                    {item.Name}
                   </SelectItem>
                    ))}
                 </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-0">
                <label className="w-20 shrink-0 text-sm">Name</label>
                <Input
                  value={formData.CardName}
                  onChange={(e) => handleChange("CardName", e.target.value)}
                  placeholder="Enter Name"
                  className="h-8 w-45"
                />
              </div>

              <div className="flex items-center gap-0">
                <label className="w-20 shrink-0 text-sm">Card Type</label>
                <Select value={formData.CardType} onValueChange={(value) => handleChange("CardType", value)}>
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

              <div className="flex items-center gap-0">
                <label className="w-20 text-sm font-medium text-gray-700">Currency</label>
               <Select
                 value={formData.Currency}
                 onValueChange={(value) => handleChange("Currency", value)}
                >
                  <SelectTrigger className="w-45">
                  <SelectValue placeholder="Select Currency" />
                  </SelectTrigger>

                 <SelectContent>
                    {currencies.map((currency) => (
                    <SelectItem
                    key={currency.Code}
                    value={currency.Code}
                    >
                   {currency.Code} - {currency.Name}
                   </SelectItem>
                    ))}
                </SelectContent>
               </Select>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="general" className="mt-6 bg-white px-6 pb-6">
          <TabsList className="h-11 w-[300px] rounded-xl bg-[#1f1f1f] p-1">
            <TabsTrigger
              value="general"
              className="flex-1 rounded-lg font-semibold camelCase text-gray-300 data-[state=active]:bg-[#2d2d2d] data-[state=active]:text-white data-[state=active]:shadow-none"
            >
              General
            </TabsTrigger>
            <TabsTrigger
              value="remarks"
              className="flex-1 rounded-lg font-semibold camelCase text-gray-300 data-[state=active]:bg-[#2d2d2d] data-[state=active]:text-white data-[state=active]:shadow-none"
            >
              Remarks
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <div className="rounded-md border bg-white p-6">
              <div className="flex flex-col gap-1">
                <div>
                  <label className="mb-2 block text-sm font-medium">Tel 1</label>
                  <Input
                    value={formData.Phone1}
                    onChange={(e) => handleChange("Phone1", e.target.value)}
                    placeholder="Tel 1"
                    className="h-7 w-45"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Tel 2</label>
                  <Input
                    value={formData.Phone2}
                    onChange={(e) => handleChange("Phone2", e.target.value)}
                    placeholder="Tel 2"
                    className="h-7 w-45"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Mobile Phone</label>
                  <Input
                    value={formData.Cellular}
                    onChange={(e) => handleChange("Cellular", e.target.value)}
                    placeholder="Mobile Phone"
                    className="h-7 w-45"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Fax</label>
                  <Input
                    value={formData.Fax}
                    onChange={(e) => handleChange("Fax", e.target.value)}
                    placeholder="Fax"
                    className="h-7 w-45"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">E-Mail</label>
                  <Input
                    value={formData.EmailAddress}
                    onChange={(e) => handleChange("EmailAddress", e.target.value)}
                    className="h-7 w-45"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Web Site</label>
                  <Input
                    value={formData.Website}
                    onChange={(e) => handleChange("Website", e.target.value)}
                    className="h-7 w-45"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Shipping Type</label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={formData.ShippingType}
                      readOnly
                      placeholder="Select Shipping Type"
                      className="h-7 w-45"
                    />
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

                <div>
                  <label className="mb-2 block text-sm font-medium">Password</label>
                  <Input type="password" placeholder="Password" className="h-7 w-45" />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Factoring Indicator</label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={formData.Indicator}
                      readOnly
                      placeholder="Select Indicator"
                      className="h-7 w-45"
                    />
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

                <div>
                  <label className="mb-2 block text-sm font-medium">Business Partner Project</label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={formData.Project}
                      readOnly
                      placeholder="Select Project"
                      className="h-7 w-100"
                    />
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

                <div>
                  <label className="mb-2 block text-sm font-medium">Industry</label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={formData.Industry}
                      readOnly
                      placeholder="Select Industry"
                      className="h-7 w-45"
                    />
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

                <div>
                  <label className="mb-2 block text-sm font-medium">Type of Business</label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={formData.Company}
                      readOnly
                      placeholder="Select Company"
                      className="h-7 w-45"
                    />
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

                <div className="col-span-3 mt-4">
                  <label className="mb-2 block text-sm font-medium">Remarks</label>
                  <Textarea
                    value={formData.Remarks}
                    onChange={(e) => handleChange("Remarks", e.target.value)}
                    placeholder="Enter Remarks..."
                    className="h-24 max-w-96 resize-none"
                  />
                </div>

                <div className="col-span-3 mt-6 flex items-center">
                  <RadioGroup defaultValue="active" className="flex gap-6">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="active" id="active" />
                      <label htmlFor="active" className="text-sm">
                        Active
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="inactive" id="inactive" />
                      <label htmlFor="inactive" className="text-sm">
                        Inactive
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="advanced" id="advanced" />
                      <label htmlFor="advanced" className="text-sm">
                        Advanced
                      </label>
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
             className="h-9 min-w-[92px] rounded-md px-6 font-medium disabled:opacity-50"
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