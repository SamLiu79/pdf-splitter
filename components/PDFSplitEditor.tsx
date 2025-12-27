"use client";

import { useState, useMemo } from "react";
import UploadZone from "./UploadZone";
import PageSplitter from "./PageSplitter";
import { splitPDF } from "@/lib/pdf-processing";
import { pdfjs, Document } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";
import { Loader2 } from "lucide-react";
import { LanguageProvider, useLanguage } from "./LanguageContext";
import LanguageSelector from "./LanguageSelector";

// Configure worker locally
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

function PDFSplitEditorContent() {
    const { t } = useLanguage();
    const [file, setFile] = useState<File | null>(null);
    const [numPages, setNumPages] = useState<number>(0);
    const [splitPositions, setSplitPositions] = useState<Record<number, number>>({});
    const [isProcessing, setIsProcessing] = useState(false);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
        // Initialize standard split capability
        const initialSplits: Record<number, number> = {};
        for (let i = 1; i <= numPages; i++) {
            initialSplits[i] = 50;
        }
        setSplitPositions(initialSplits);
    }

    const handleSplitChange = (page: number, newPos: number) => {
        setSplitPositions(prev => ({
            ...prev,
            [page]: newPos
        }));
    };

    const handleDownload = async () => {
        if (!file) return;
        setIsProcessing(true);
        try {
            const newPdfBytes = await splitPDF(file, splitPositions);
            const blob = new Blob([newPdfBytes as any], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `splitted-${file.name}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error splitting PDF:", error);
            alert(t.upload.alert);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="max-w-[1400px] mx-auto p-6 min-h-screen pb-20">
            <LanguageSelector />
            <div className="mb-8 text-center space-y-2 pt-8">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">{t.title}</h1>
                <p className="text-gray-500">{t.subtitle}</p>
            </div>

            {!file ? (
                <UploadZone onFileSelect={setFile} />
            ) : (
                <div className="space-y-6">
                    <div className="sticky top-4 z-50 flex flex-col sm:flex-row justify-between items-center bg-white/80 backdrop-blur-md p-4 rounded-xl shadow-lg border border-gray-100 mb-8 transition-all">
                        <div className="flex items-center gap-3 mb-3 sm:mb-0">
                            <span className="font-semibold text-gray-800 truncate max-w-[200px]">{file.name}</span>
                            <span className="text-xs px-2.5 py-1 bg-gray-100 rounded-full text-gray-500 font-medium">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                            </span>
                            <span className="text-xs px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full font-medium">
                                {t.meta.pageCount.replace('{n}', numPages.toString())}
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setFile(null)}
                                className="text-sm text-gray-500 hover:text-gray-700 font-medium px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                                disabled={isProcessing}
                            >
                                {t.actions.cancel}
                            </button>
                            <button
                                onClick={handleDownload}
                                disabled={isProcessing}
                                className="bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-lg text-sm font-medium shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all active:translate-y-0 active:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        {t.actions.processing}
                                    </>
                                ) : (
                                    t.actions.download
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-center">
                        <Document
                            file={file}
                            onLoadSuccess={onDocumentLoadSuccess}
                            className="flex flex-col gap-8 w-full max-w-6xl"
                            loading={
                                <div className="p-12 text-center text-gray-400 animate-pulse">
                                    {t.items.loading}
                                </div>
                            }
                        >
                            {Array.from(new Array(numPages), (el, index) => (
                                <PageSplitter
                                    key={`page_${index + 1}`}
                                    pageNumber={index + 1}
                                    width={1200} // Increased width for better visibility
                                    splitPosition={splitPositions[index + 1] ?? 50}
                                    onSplitChange={(pos) => handleSplitChange(index + 1, pos)}
                                />
                            ))}
                        </Document>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function PDFSplitEditor() {
    return (
        <LanguageProvider>
            <PDFSplitEditorContent />
        </LanguageProvider>
    );
}
