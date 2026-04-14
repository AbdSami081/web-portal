import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export interface ReportFolderItem {
  name: string;
  path: string;
  type: "folder" | "file";
  children?: ReportFolderItem[];
}

export async function GET() {
  const rootPath = 'E:\\web_portal_upload_files\\CrystalReports';

  try {
    if (!fs.existsSync(rootPath)) {
      console.warn("Folder does not exist, returning mock");
      return NextResponse.json([{ name: "Sales (Mock)", path: "Sales", type: "folder", children: [{ name: "SalesQuotation.rpt", path: "Sales/SalesQuotation.rpt", type: "file" }] }]);
    }

    const traverseDirectory = (currentPath: string, basePath: string): ReportFolderItem[] => {
      const result: ReportFolderItem[] = [];
      const items = fs.readdirSync(currentPath, { withFileTypes: true });

      for (const item of items) {
        const fullPath = path.join(currentPath, item.name);
        const relativePath = fullPath.replace(basePath, '').replace(/^\\+/, '').replace(/\\/g, '/');

        if (item.isDirectory()) {
          const children = traverseDirectory(fullPath, basePath);
          if (children.length > 0) {
            result.push({
              name: item.name,
              path: relativePath,
              type: 'folder',
              children,
            });
          }
        } else if (item.isFile() && item.name.toLowerCase().endsWith('.rpt')) {
          result.push({
            name: item.name,
            path: relativePath,
            type: 'file',
          });
        }
      }
      return result;
    };

    const folders = traverseDirectory(rootPath, rootPath);
    console.log("Found folders:", folders.length);
    return NextResponse.json(folders);
  } catch (error: any) {
    console.error('Error reading reporting directories:', error.message);
    return NextResponse.json([{ name: "Financials (Mock - Path Read Error)", path: "Financials", type: "folder" }], { status: 200 }); 
  }
}
