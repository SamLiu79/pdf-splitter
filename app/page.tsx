"use client";

import dynamic from "next/dynamic";

const PDFSplitEditor = dynamic(() => import("@/components/PDFSplitEditor"), {
  ssr: false,
  loading: () => <p className="text-center p-12 text-muted-copy">Loading Editor...</p>,
});

export default function Home() {
  return (
    <main className="min-h-screen bg-page">
      <PDFSplitEditor />
    </main>
  );
}
