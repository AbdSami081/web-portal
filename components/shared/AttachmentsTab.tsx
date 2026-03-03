import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Trash2, ExternalLink, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { getAttachment } from "@/api+/sap/quotation/salesService";

interface Attachment {
    LineNum: number;
    SourcePath: string;
    FileName: string;
    AttachmentDate: string;
    FreeText: string;
    CopyToTarget: boolean;
    File?: File;
}

interface AttachmentsTabProps {
    attachments: Attachment[];
    addAttachment: (file: File) => void;
    removeAttachment: (lineNum: number) => void;
    updateAttachment: (lineNum: number, updated: Partial<Attachment>) => void;
    isTableDisabled: boolean;
}

export function AttachmentsTab({
    attachments,
    addAttachment,
    removeAttachment,
    updateAttachment,
    isTableDisabled,
}: AttachmentsTabProps) {
    const [selectedLineNum, setSelectedLineNum] = useState<number | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) addAttachment(file);
    };

    const handleDisplay = async () => {
        if (selectedLineNum === null) {
            toast.info("Please select an attachment row first.");
            return;
        }
        const att = attachments.find((a) => a.LineNum === selectedLineNum);
        if (!att) return;

        const fullPath = att.SourcePath
            ? att.SourcePath.replace(/\\$/, "") + "\\" + att.FileName
            : att.FileName;

        try {
            const blob = await getAttachment(fullPath);
            if (blob) {
                const url = window.URL.createObjectURL(blob);

                let iframe = document.getElementById("attachment-download-frame") as HTMLIFrameElement;
                if (!iframe) {
                    iframe = document.createElement("iframe");
                    iframe.id = "attachment-download-frame";
                    iframe.style.display = "none";
                    document.body.appendChild(iframe);
                }
                iframe.src = url;
            } else {
                toast.error("Failed to fetch attachment.");
            }
        } catch (err) {
            toast.error("Error loading attachment.");
        }
    };

    return (
        <div className={`space-y-4 pt-4 ${isTableDisabled ? "opacity-80 pointer-events-none" : ""}`}>
            <div className="relative border rounded-xl overflow-hidden bg-white shadow-sm border-zinc-100">
                <div className="overflow-x-auto min-h-[300px]">
                    <Table className="text-[11px] min-w-[1000px]">
                        <TableHeader className="bg-zinc-50 border-b border-zinc-100">
                            <TableRow className="hover:bg-transparent border-none">
                                <TableHead className="w-12 text-center font-bold text-zinc-600 uppercase tracking-tighter">#</TableHead>
                                <TableHead className="font-bold text-zinc-600 uppercase tracking-tighter">Target Path</TableHead>
                                <TableHead className="font-bold text-zinc-600 uppercase tracking-tighter">File Name</TableHead>
                                <TableHead className="font-bold text-zinc-600 uppercase tracking-tighter">Attachment Date</TableHead>
                                <TableHead className="font-bold text-zinc-600 uppercase tracking-tighter">Free Text</TableHead>
                                <TableHead className="w-32 text-center font-bold text-zinc-600 uppercase tracking-tighter">Copy to Target</TableHead>
                                <TableHead className="w-10"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {attachments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center text-zinc-400 space-y-3">
                                            <div className="p-4 bg-zinc-50 rounded-full">
                                                <FolderOpen className="w-8 h-8 opacity-20" />
                                            </div>
                                            <p className="text-xs font-medium uppercase tracking-widest opacity-60">No attachments found</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                attachments.map((att, idx) => {
                                    const isSelected = selectedLineNum === att.LineNum;
                                    return (
                                        <TableRow
                                            key={att.LineNum}
                                            onClick={() => setSelectedLineNum(isSelected ? null : att.LineNum)}
                                            className={`group cursor-pointer transition-colors border-b border-zinc-50 ${isSelected
                                                ? "bg-blue-50 hover:bg-blue-100 ring-1 ring-inset ring-blue-300"
                                                : "hover:bg-zinc-50"
                                                }`}
                                        >
                                            <TableCell className="text-center font-mono text-zinc-400">{idx + 1}</TableCell>
                                            <TableCell className="text-zinc-500 italic max-w-xs truncate">{att.SourcePath || process.env.NEXT_PUBLIC_ATTACHMENT_SOURCE_PATH || "N/A"}</TableCell>
                                            <TableCell className={`font-semibold ${isSelected ? "text-blue-700" : "text-zinc-900"}`}>{att.FileName}</TableCell>
                                            <TableCell className="text-zinc-600">{att.AttachmentDate}</TableCell>
                                            <TableCell className="p-1" onClick={(e) => e.stopPropagation()}>
                                                <Input
                                                    className="h-8 text-[11px] border-transparent bg-transparent hover:bg-white hover:border-zinc-200 focus:bg-white focus:border-primary transition-all rounded-md"
                                                    value={att.FreeText}
                                                    onChange={(e) => updateAttachment(att.LineNum, { FreeText: e.target.value })}
                                                    placeholder="Add comments..."
                                                />
                                            </TableCell>
                                            <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                                                <Checkbox
                                                    checked={att.CopyToTarget}
                                                    onCheckedChange={(checked) => updateAttachment(att.LineNum, { CopyToTarget: !!checked })}
                                                    className="mx-auto"
                                                />
                                            </TableCell>
                                            <TableCell className="p-1 text-right" onClick={(e) => e.stopPropagation()}>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all opacity-0 group-hover:opacity-100"
                                                    onClick={() => removeAttachment(att.LineNum)}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <div className="flex gap-2 justify-end">
                <div className="relative">
                    <input
                        type="file"
                        className="hidden"
                        id="attachment-browse"
                        onChange={handleFileChange}
                    />
                    <Button
                        variant="outline"
                        className="bg-white border-zinc-200 hover:bg-zinc-50 transition-all text-xs font-bold gap-2 rounded-xl h-10 px-5 shadow-sm"
                        asChild
                    >
                        <label htmlFor="attachment-browse" className="cursor-pointer">
                            <FolderOpen className="w-4 h-4 text-amber-500" />
                            Browse
                        </label>
                    </Button>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    className={`transition-all text-xs font-bold gap-2 rounded-xl h-10 px-5 shadow-sm ${selectedLineNum !== null
                        ? "bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100"
                        : "bg-white border-zinc-200 hover:bg-zinc-50"
                        }`}
                    disabled={attachments.length === 0}
                    onClick={handleDisplay}
                >
                    <ExternalLink className="w-4 h-4 text-blue-500" />
                    Display
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    className="bg-white border-zinc-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-all text-xs font-bold gap-2 rounded-xl h-10 px-5 shadow-sm"
                    disabled={attachments.length === 0}
                    onClick={() => {
                        if (selectedLineNum !== null) {
                            removeAttachment(selectedLineNum);
                            setSelectedLineNum(null);
                        } else {
                            toast.info("Please select an attachment row first.");
                        }
                    }}
                >
                    <Trash2 className="w-4 h-4 text-red-500" />
                    Delete
                </Button>
            </div>
        </div>
    );
}
