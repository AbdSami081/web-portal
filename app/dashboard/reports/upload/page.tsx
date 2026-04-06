"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/authContext";
import { uploadReport, getReports, ReportData } from "@/api+/sap/reporting/reportingService";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function ReportsUploadPage() {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedReports, setUploadedReports] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (user?.empId) {
      fetchReports();
    }
  }, [user]);

  const fetchReports = async () => {
    if (!user?.empId) return;
    setFetching(true);
    try {
      const data = await getReports(user.empId);
      setUploadedReports(data);
    } catch (error) {
      toast.error("Failed to fetch reports");
    } finally {
      setFetching(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      toast.error("Please select a .rpt file to upload.");
      return;
    }

    if (!user) {
      toast.error("User session not found. Please log in again.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("File", selectedFile);
      // Map metadata with U_ prefix for dynamic backend mapping
      formData.append("U_EmployeeId", user.empId);
      formData.append("U_EmployeeName", user.userName);

      await uploadReport(formData);
      toast.success("Report uploaded successfully");

      // Reset form
      setSelectedFile(null);
      const fileInput = document.getElementById("rpt-upload") as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      // Refresh list
      await fetchReports();
    } catch (error: any) {
      toast.error(error?.response?.data || "Failed to upload report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload Report (.rpt)</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
            <div className="space-y-2">
              <Label htmlFor="rpt-upload">Select .rpt File</Label>
              <Input
                id="rpt-upload"
                type="file"
                accept=".rpt"
                onChange={handleFileChange}
                disabled={loading}
              />
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Submit"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Uploaded Reports List</CardTitle>
        </CardHeader>
        <CardContent>
          {fetching ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : uploadedReports.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Actual File Name</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Path</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {uploadedReports.map((report, idx) => (
                  <TableRow key={report.Code || idx}>
                    <TableCell className="font-medium">
                      {report.U_ActualFileName}
                    </TableCell>
                    <TableCell>{report.U_EmployeeName}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{report.U_FilePath}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              No reports uploaded yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
