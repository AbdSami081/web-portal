// // import { useNavigate } 
// "use client";
// import { useRouter } from 'next/navigation'; 
// import { useState } from 'react';
// import { Input } from '@/components/ui/input';
// import { Button } from '@/components/ui/button'; 

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge, MoreHorizontal } from "lucide-react";

// export default function QuotationSearchPage() {
//   const [docNum, setDocNum] = useState('');
//   const router = useRouter();

//   const handleFind = async () => {
//     if (!docNum) return;
//     const res = await fetch(`/sap/Quotations?filter=DocNum eq ${docNum}`);
//     const data = await res.json();
//     const match = data.value?.[0];
//     if (match?.DocEntry) {
//       router.push(`/dashboard/sales/quotation/${match.DocEntry}`);
//     // console.log(`Navigate to /dashboard/sales/quotation/${match.DocEntry}`);
//     } else {
//       alert('Quotation not found');
//     }
//   };

//   return (
//     <div className="max-w-lg mx-auto space-y-6 mt-10">
//       <h1 className="text-xl font-semibold">Find Quotation</h1>
//       <div className="flex gap-2">
//         <Input
//           placeholder="Enter DocNum..."
//           className='w-80'
//           value={docNum}
//           onChange={(e) => setDocNum(e.target.value)}
//         />
//         <Button onClick={handleFind}>Find</Button>
//       </div>

//       <Button variant="outline" onClick={() => router.push('/dashboard/sales/quotation/new')}>
//         + Add New Quotation
//       </Button>
//     </div>
//   );
// }




const QuotationSearchPage = () => {
  return (
    <>
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
     
      <DCard title={'Total Sales Amount'} amount={355.10} badge={66}></DCard>
      
      <DCard title={'Total Purchase Amount'} amount={618.10} badge={213}></DCard>


      <DCard title={'Total Receivable Amount'} amount={0} badge={20}></DCard>

      <DCard title={'Total Payable Amount'} amount={543.10} badge={856}></DCard>


    </div>
    <div className="w-full p-4">
        <Table className="w-full border border-gray-200 rounded-lg overflow-hidden">
        <TableHeader>
          <TableRow className="bg-gray-900 text-white">
            <TableHead className="w-[120px] text-white">DocNum</TableHead>
            <TableHead className="text-white">Customer</TableHead>
            <TableHead className="text-white">Total</TableHead>
            <TableHead className="text-white">Status</TableHead>
            <TableHead className="text-white text-right w-[80px]">Action</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>

          {/* Row 1 */}
          <TableRow className="hover:bg-gray-50 transition">
            <TableCell className="font-medium">1001</TableCell>
            <TableCell>ABC Traders</TableCell>
            <TableCell>AUD 355.10</TableCell>
            <TableCell>Open</TableCell>
            <TableCell className="text-right">
              <RowActions />
            </TableCell>
          </TableRow>

          {/* Row 2 */}
          <TableRow className="border-t border-gray-200 hover:bg-gray-50 transition">
            <TableCell className="font-medium">1002</TableCell>
            <TableCell>BlueTech Pty</TableCell>
            <TableCell>AUD 618.10</TableCell>
            <TableCell>Closed</TableCell>
            <TableCell className="text-right">
              <RowActions />
            </TableCell>
          </TableRow>

          {/* Row 3 */}
          <TableRow className="border-t border-gray-200 hover:bg-gray-50 transition">
            <TableCell className="font-medium">1003</TableCell>
            <TableCell>Nova Retail</TableCell>
            <TableCell>AUD 122.50</TableCell>
            <TableCell>Draft</TableCell>
            <TableCell className="text-right">
              <RowActions />
            </TableCell>
          </TableRow>

          {/* Row 4 */}
          <TableRow className="border-t border-gray-200 hover:bg-gray-50 transition">
            <TableCell className="font-medium">1004</TableCell>
            <TableCell>Horizon Logistics</TableCell>
            <TableCell>AUD 543.10</TableCell>
            <TableCell>Open</TableCell>
            <TableCell className="text-right">
              <RowActions />
            </TableCell>
          </TableRow>

        </TableBody>
      </Table>
    </div>
    </>
  )
}
export default QuotationSearchPage;



const DCard = ({title,amount , badge}:any) => {
  return (
    <Card className="@container/card bg-gray-900 text-white">
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          AUD {amount}
        </CardTitle>
        <CardAction>
          <Badge >
            +{badge}%
          </Badge>
        </CardAction>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        <div className="line-clamp-1 flex gap-2 font-medium">
          Trending up this month
        </div>
        <div className="text-muted-foreground">
          Visitors for the last 6 months
        </div>
      </CardFooter>
    </Card>
  )
}

const RowActions = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-32">
        <DropdownMenuItem>View</DropdownMenuItem>
        <DropdownMenuItem>Edit</DropdownMenuItem>
        <DropdownMenuItem className="text-red-600">
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}