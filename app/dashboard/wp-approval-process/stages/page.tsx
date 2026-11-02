"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { WpApprovalProcessShell } from "@/components/administration/wp-approval-process/WpApprovalProcessShell";
import { getApiErrorMessage } from "@/lib/approval-process/apiErrors";
import { WP_STAGES_LIST_SUBTITLE } from "@/lib/approval-process/page-copy";
import {
  createStage,
  deleteStage,
  fetchStages,
} from "@/api+/sap/approval-process/approvalProcessService";
import type { WpApprovalStage } from "@/types/approval-process/wp-approval.types";

export default function WpStagesListPage() {
  const router = useRouter();
  const [stages, setStages] = useState<WpApprovalStage[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setStages(await fetchStages());
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to load approval stages."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleNew = async () => {
    try {
      const code = await createStage({
        stageName: "New approval stage",
        maxReqr: 1,
        maxRejReqr: 1,
      });
      toast.success("Stage created.");
      router.push(`/dashboard/wp-approval-process/stages/${encodeURIComponent(code)}`);
    } catch {
      toast.error("Failed to create stage.");
    }
  };

  return (
    <WpApprovalProcessShell
      title="Approval Stages"
      subtitle={WP_STAGES_LIST_SUBTITLE}
      actions={
        <Button size="sm" onClick={handleNew} className="gap-1.5">
          <Plus className="w-4 h-4" /> New Stage
        </Button>
      }
    >
      <div className="p-6">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="rounded-xl border bg-white overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Stage name</TableHead>
                  <TableHead>Min approvals</TableHead>
                  <TableHead>Min rejects</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stages.map((s) => (
                  <TableRow key={s.code}>
                    <TableCell className="font-mono text-xs">{s.code}</TableCell>
                    <TableCell className="font-medium">{s.stageName}</TableCell>
                    <TableCell>{s.maxReqr}</TableCell>
                    <TableCell>{s.maxRejReqr}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="icon" variant="ghost" asChild>
                        <Link
                          href={`/dashboard/wp-approval-process/stages/${encodeURIComponent(s.code)}`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Link>
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-red-500"
                        onClick={async () => {
                          try {
                            await deleteStage(s.code);
                            toast.success("Stage deleted.");
                            load();
                          } catch {
                            toast.error("Failed to delete stage.");
                          }
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </WpApprovalProcessShell>
  );
}
