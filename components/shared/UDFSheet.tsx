import { FieldValues, useFormContext, Controller } from "react-hook-form";
import { useEffect, useState } from "react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose
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
import { useUDFStore } from "@/stores/useUDFStore";

interface DocumentUDFList<T extends FieldValues> {
  docType: DocumentType;
  values?: Record<string, any>;
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
  values,
}: DocumentUDFList<T>) {
  const [open, setOpen] = useState(false);
  const { control, setValue, register } = useFormContext<T>();
  
  const definitions = useUDFStore(state => state.definitions[docType]);
  const isLoading = useUDFStore(state => state.isLoading[docType]);

  useEffect(() => {
    if (values && Object.keys(values).length > 0) {
      Object.entries(values).forEach(([key, value]) => {
        setValue(key as any, value);
      });
    }
  }, [values, setValue]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "u") {
        e.preventDefault();
        e.stopPropagation();
        setOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const renderField = (udf: UDF) => {
    const fieldName = `U_${udf.Name}`;

    if (udf.SubType === "st_Checkbox") {
      return (
        <div className="flex items-center space-x-2 py-2">
          <Controller
            control={control}
            name={fieldName as any}
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
            name={fieldName as any}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={(field.value as string) || ""}>
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
            {...register(fieldName as any)}
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
          {...register(fieldName as any)}
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
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground animate-pulse">Fetching field definitions...</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {definitions && definitions.length > 0 ? (
                definitions.map((udf) => (
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
                    <p className="font-medium">No UDFs defined for this document</p>
                    <p className="text-sm text-muted-foreground">User defined fields will appear here once loaded.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <SheetFooter className="p-6 border-t bg-muted/50">
          <SheetClose asChild>
            <Button type="button" className="w-full">
              Done
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}