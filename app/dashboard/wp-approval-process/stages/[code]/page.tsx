"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { WpApprovalProcessShell } from "@/components/administration/wp-approval-process/WpApprovalProcessShell";
import { SapUserCombobox } from "@/components/administration/wp-approval-process/SapUserCombobox";
import {
  fetchStage,
  fetchStageApprovers,
  saveStageApprovers,
  updateStage,
} from "@/api+/sap/approval-process/approvalProcessService";
import { getUsers } from "@/api+/sap/authorization/authorizationService";
import { useAuth } from "@/context/authContext";
import { WP_STAGE_EDITOR_SUBTITLE } from "@/lib/approval-process/page-copy";
import type { WpApprovalStage } from "@/types/approval-process/wp-approval.types";

type SapUserOption = { userId: number; userName: string; userCode: string };

export default function WpStageEditorPage() {
  const { user } = useAuth();
  const params = useParams();
  const code = decodeURIComponent(String(params.code ?? ""));

  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [header, setHeader] = useState<WpApprovalStage>({
    code,
    stageName: "",
    maxReqr: 1,
    maxRejReqr: 1,
  });
  const [approvers, setApprovers] = useState<Awaited<ReturnType<typeof fetchStageApprovers>>>([]);
  const [sapUsers, setSapUsers] = useState<SapUserOption[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const stage = await fetchStage(code);
      if (!stage) {
        setMissing(true);
        return;
      }
      setMissing(false);
      setHeader(stage);
      const [appr, users] = await Promise.all([
        fetchStageApprovers(code),
        getUsers(user?.companyDB ?? "SBODEMOAU"),
      ]);
      setApprovers(appr);
      setSapUsers(
        users
          .filter((u) => u.userId != null)
          .map((u) => ({
            userId: Number(u.userId),
            userCode: u.empId || String(u.userId),
            userName: u.fullName || u.firstName || u.empId || String(u.userId),
          }))
      );
    } catch {
      toast.error("Failed to load stage.");
    } finally {
      setLoading(false);
    }
  }, [code, user?.companyDB]);

  useEffect(() => {
    load();
  }, [load]);

  const saveAll = async () => {
    try {
      await updateStage(header);
      await saveStageApprovers(
        code,
        approvers.map((r) => ({ ...r, wstCode: code }))
      );
      toast.success("Stage saved.");
    } catch {
      toast.error("Failed to save stage.");
    }
  };

  if (loading) {
    return (
      <WpApprovalProcessShell title="Loading stage…" subtitle={code}>
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      </WpApprovalProcessShell>
    );
  }

  if (missing) {
    return (
      <WpApprovalProcessShell title="Stage not found" subtitle={code}>
        <div className="p-6">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/wp-approval-process/stages">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Link>
          </Button>
        </div>
      </WpApprovalProcessShell>
    );
  }

  return (
    <WpApprovalProcessShell
      title={header.stageName}
      subtitle={WP_STAGE_EDITOR_SUBTITLE(code)}
      actions={
        <Button size="sm" variant="outline" asChild>
          <Link href="/dashboard/wp-approval-process/stages">
            <ArrowLeft className="w-4 h-4 mr-1" /> List
          </Link>
        </Button>
      }
    >
      <div className="p-6">
        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="approvers">Approvers</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <div className="rounded-xl border bg-white p-6 grid gap-4 max-w-md">
              <div className="space-y-2">
                <Label>Stage name</Label>
                <Input
                  value={header.stageName}
                  onChange={(e) => setHeader({ ...header, stageName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Minimum no. of approvals required</Label>
                <Input
                  type="number"
                  min={1}
                  value={header.maxReqr}
                  onChange={(e) =>
                    setHeader({ ...header, maxReqr: Number(e.target.value) || 1 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Minimum no. of rejects required</Label>
                <Input
                  type="number"
                  min={1}
                  value={header.maxRejReqr}
                  onChange={(e) =>
                    setHeader({ ...header, maxRejReqr: Number(e.target.value) || 1 })
                  }
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="approvers" className="space-y-4">
            <p className="text-xs text-slate-500">WP_WST1 — users assigned to this stage.</p>
            <div className="rounded-xl border bg-white overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Approver</TableHead>
                    <TableHead className="w-24" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvers.map((row, idx) => (
                    <TableRow key={row.id || idx}>
                      <TableCell>
                        <SapUserCombobox
                          users={sapUsers}
                          value={row.userId}
                          onChange={(userId, userName) => {
                            const next = [...approvers];
                            next[idx] = { ...row, userId, userName };
                            setApprovers(next);
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setApprovers(approvers.filter((_, i) => i !== idx))}
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={sapUsers.length === 0}
              onClick={() =>
                setApprovers([
                  ...approvers,
                  {
                    id: `new-${Date.now()}`,
                    wstCode: code,
                    userId: sapUsers[0].userId,
                    userName: sapUsers[0].userName,
                  },
                ])
              }
            >
              Add approver
            </Button>
          </TabsContent>
        </Tabs>

        <Button size="sm" onClick={saveAll} className="gap-1.5 mt-6">
          <Save className="w-4 h-4" /> Save stage
        </Button>
      </div>
    </WpApprovalProcessShell>
  );
}
