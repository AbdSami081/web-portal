import { FieldValues, useFormContext, Controller } from "react-hook-form";
import { useEffect, useRef, useState } from "react";

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
import { useFmsContext } from "@/hooks/useFMS";
import { FmsFieldButton, fmsKeyDown } from "@/components/Custom/FmsFieldButton";

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

// Several pages render <UDFLayout> AND sit inside a document layout that renders
// its own — so two instances can mount. This module-level owner lets only the
// first-mounted instance stay live (own the Ctrl+Shift+U shortcut and the Sheet);
// the rest render nothing. Prevents the panel opening twice.
const udfLayoutOwner = { current: null as symbol | null };

export function UDFLayout<T extends FieldValues>({
  docType,
  values,
}: DocumentUDFList<T>) {
  const [open, setOpen] = useState(false);
  const { control, setValue, register } = useFormContext<T>();
  const { triggerFMS } = useFmsContext();

  const instanceId = useRef<symbol | null>(null);
  if (!instanceId.current) instanceId.current = Symbol("udf-layout");
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    if (udfLayoutOwner.current === null) {
      udfLayoutOwner.current = instanceId.current!;
      setIsOwner(true);
    }
    return () => {
      if (udfLayoutOwner.current === instanceId.current) {
        udfLayoutOwner.current = null;
      }
    };
  }, []);

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
    if (!isOwner) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "u") {
        e.preventDefault();
        e.stopPropagation();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOwner]);

  if (!isOwner) return null;

  const FieldLabel = ({ htmlFor, text }: { htmlFor: string; text: string }) => (
    <div className="flex items-center gap-1">
      <Label htmlFor={htmlFor}>{text}</Label>
      <FmsFieldButton field={htmlFor} />
    </div>
  );

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
          <FmsFieldButton field={fieldName} />
        </div>
      );
    }

    if (udf.ValidValuesMD && udf.ValidValuesMD.length > 0) {
      return (
        <div className="grid gap-2">
          <FieldLabel htmlFor={fieldName} text={udf.Description} />
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
          <FieldLabel htmlFor={fieldName} text={udf.Description} />
          <Textarea
            id={fieldName}
            {...register(fieldName as any)}
            onKeyDown={fmsKeyDown(fieldName, triggerFMS)}
            placeholder={`Enter ${udf.Description}`}
            className="min-h-[100px]"
          />
        </div>
      );
    }

    const isNumeric = udf.Type === "db_Numeric" || udf.Type === "db_Float";

    return (
      <div className="grid gap-2">
        <FieldLabel htmlFor={fieldName} text={udf.Description} />
        <Input
          id={fieldName}
          type={isNumeric ? "number" : "text"}
          {...register(fieldName as any)}
          onKeyDown={fmsKeyDown(fieldName, triggerFMS)}
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