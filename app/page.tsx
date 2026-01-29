"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import LoginPage from "./auth/login/page";

export default function Home() {
  return (
    // <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
    //   <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-center">
    //          {/* <h1 className="text-4xl font-bold font-Uppercase">SAP Integration</h1>
    //      <Link href="/dashboard" className="underline text-blue-500 hover:text-blue-700 mb-4 block text-center">
    //         Get Started with SAP Integration
    //       </Link> */}

    //     </main>    
    //   </div>

    <LoginPage />


  );
}
