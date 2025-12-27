"use client";

import dynamic from "next/dynamic";

const PDFSplitEditor = dynamic(() => import("@/components/PDFSplitEditor"), {
  ssr: false,
  loading: () => <p className="text-center p-12">Loading Editor...</p>,
});

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <PDFSplitEditor />
    </main>
  );
}
