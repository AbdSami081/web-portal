"use client";
import { useRouter } from 'next/navigation'; 
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button'; 

export default function QuotationSearchPage() {
  const [docNum, setDocNum] = useState('');
  const router = useRouter();

  const handleFind = async () => {
    if (!docNum) return;
    const res = await fetch(`/sap/Quotations?filter=DocNum eq ${docNum}`);
    const data = await res.json();
    const match = data.value?.[0];
    if (match?.DocEntry) {
      router.push(`/dashboard/sales/quotation/${match.DocEntry}`);
    // console.log(`Navigate to /dashboard/sales/quotation/${match.DocEntry}`);
    } else {
      alert('Quotation not found');
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6 mt-10">
      <h1 className="text-xl font-semibold">Find Quotation</h1>
      <div className="flex gap-2">
        <Input
          placeholder="Enter DocNum..."
          className='w-80'
          value={docNum}
          onChange={(e) => setDocNum(e.target.value)}
        />
        <Button onClick={handleFind}>Find</Button>
      </div>

      <Button variant="outline" onClick={() => router.push('/dashboard/sales/quotation/new')}>
        + Add New Quotation
      </Button>
    </div>
  );
}