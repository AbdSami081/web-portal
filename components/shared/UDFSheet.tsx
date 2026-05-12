import { FieldValues, useFormContext, Controller } from "react-hook-form";
import { useEffect, useState } from "react";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, Settings2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { DocumentType } from "@/types/master/DocumentType";
import { getMasterTable } from "@/types/master/DocumentTables";
import { getDocumentUDFs } from "@/api+/sap/master-data";
import { useSalesDocument } from "@/stores/sales/useSalesDocument";

interface DocumentUDFList<T extends FieldValues> {
  docType: DocumentType;
}

interface UDF {
  Name: string;
  Description: string;
  DefaultValue: string | null;
  FieldID: number;
  Type: string;
  SubType: string;
  ValidValuesMD: {
    Value: string;
    Description: string;
  }[];
}

export function UDFLayout<T extends FieldValues>({
  docType,
}: DocumentUDFList<T>) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [udfs, setUdfs] = useState<UDF[]>([]);
  const { register, control, setValue, watch } = useFormContext();
  const storeUdfs = useSalesDocument((state) => state.udfs);

  useEffect(() => {
    if (udfs.length > 0 && storeUdfs) {
      udfs.forEach((udf) => {
        const fieldName = `U_${udf.Name}`;
        if (storeUdfs[fieldName] !== undefined) {
          setValue(fieldName, storeUdfs[fieldName]);
        }
      });
    }
  }, [udfs, storeUdfs, setValue]);

  const fetchUdfs = async () => {
    setLoading(true);
    try {
      const result = await getDocumentUDFs(getMasterTable(docType));
      const udfList = Array.isArray(result) 
        ? result 
        : (result as any)?.value ?? (result as any)?.[0]?.values ?? [];
      setUdfs(udfList);
    } catch (error) {
      console.error("Failed to fetch UDFs:", error);
      setUdfs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchUdfs();
    } else {
      setUdfs([]); 
    }
  }, [open, docType]); 

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "u") {
        e.preventDefault();
        e.stopPropagation();

        setOpen(true);

        if (udfs.length > 0) {
          return;
        }

        setLoading(true);

        try {
          const result = await getDocumentUDFs(
            getMasterTable(docType)
          );

          const udfList =
            (result as any)?.value ||
            (result as any)?.[0]?.values ||
            (Array.isArray(result) ? result : []);

          setUdfs(udfList);
        } catch (error) {
          console.error("Failed to fetch UDFs:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [docType, udfs]);

  const renderField = (udf: UDF) => {
    const fieldName = `U_${udf.Name}`;

    if (udf.SubType === "st_Checkbox") {
      return (
        <div className="flex items-center space-x-2 py-2">
          <Controller
            control={control}
            name={fieldName}
            render={({ field }) => (
              <Checkbox
                id={fieldName}
                checked={field.value === "Y" || field.value === "tYES" || field.value === true}
                onCheckedChange={(checked) => {
                  field.onChange(checked ? "Y" : "N");
                }}
              />
            )}
          />
          <Label htmlFor={fieldName} className="text-sm font-medium leading-none cursor-pointer">
            {udf.Description}
          </Label>
        </div>
      );
    }

    if (udf.ValidValuesMD && udf.ValidValuesMD.length > 0) {
      return (
        <div className="grid gap-2">
          <Label htmlFor={fieldName}>{udf.Description}</Label>
          <Controller
            control={control}
            name={fieldName}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value || ""}>
                <SelectTrigger id={fieldName}>
                  <SelectValue placeholder={`Select ${udf.Description}`} />
                </SelectTrigger>
                <SelectContent>
                  {udf.ValidValuesMD.map((vv) => (
                    <SelectItem key={vv.Value} value={vv.Value}>
                      {vv.Description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      );
    }

    if (udf.Type === "db_Memo") {
      return (
        <div className="grid gap-2">
          <Label htmlFor={fieldName}>{udf.Description}</Label>
          <Textarea
            id={fieldName}
            {...register(fieldName)}
            placeholder={`Enter ${udf.Description}`}
            className="min-h-[100px]"
          />
        </div>
      );
    }

    const isNumeric = udf.Type === "db_Numeric" || udf.Type === "db_Float";

    return (
      <div className="grid gap-2">
        <Label htmlFor={fieldName}>{udf.Description}</Label>
        <Input
          id={fieldName}
          type={isNumeric ? "number" : "text"}
          {...register(fieldName)}
          placeholder={`Enter ${udf.Description}`}
        />
      </div>
    );
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto p-0 flex flex-col">
        <SheetHeader className="p-6 border-b">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Settings2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-xl">UDF Fields</SheetTitle>
              <SheetDescription>
                Manage document user-defined fields.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground animate-pulse">Fetching field definitions...</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {udfs.length > 0 ? (
                udfs.map((udf) => (
                  <div key={udf.FieldID} className="py-2">
                    {renderField(udf)}
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-2xl gap-4">
                  <div className="p-4 bg-muted rounded-full">
                    <Settings2 className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium">No UDFs loaded</p>
                    <p className="text-sm text-muted-foreground">Press <kbd className="px-1.5 py-0.5 rounded border bg-background text-xs font-sans">Ctrl + Shift + U</kbd> to load fields</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <SheetFooter className="p-6 border-t bg-muted/50">
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}