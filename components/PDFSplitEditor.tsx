"use client";

import { useState } from "react";
import UploadZone from "./UploadZone";
import PageSplitter from "./PageSplitter";
import { PageSplitConfig, SplitMode, splitPDF } from "@/lib/pdf-processing";
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
    const [splitConfigs, setSplitConfigs] = useState<Record<number, PageSplitConfig>>({});
    const [isProcessing, setIsProcessing] = useState(false);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
        const initialSplits: Record<number, PageSplitConfig> = {};
        for (let i = 1; i <= numPages; i++) {
            initialSplits[i] = { mode: 2, splitPoints: [50] };
        }
        setSplitConfigs(initialSplits);
    }

    const handleSplitPointsChange = (page: number, splitPoints: number[]) => {
        setSplitConfigs(prev => ({
            ...prev,
            [page]: {
                mode: splitPoints.length === 2 ? 3 : 2,
                splitPoints,
            },
        }));
    };

    const handleSplitModeChange = (page: number, mode: SplitMode) => {
        setSplitConfigs(prev => {
            const current = prev[page] ?? { mode: 2, splitPoints: [50] };
            const splitPoints = mode === 3
                ? [33.3, 66.7]
                : [
                    current.splitPoints.length === 2
                        ? (current.splitPoints[0] + current.splitPoints[1]) / 2
                        : current.splitPoints[0] ?? 50
                ];

            return {
                ...prev,
                [page]: { mode, splitPoints },
            };
        });
    };

    const handleDownload = async () => {
        if (!file) return;
        setIsProcessing(true);
        try {
            const newPdfBytes = await splitPDF(file, splitConfigs);
            const blob = new Blob([newPdfBytes], { type: "application/pdf" });
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

    // No longer need containerRef/width state here, as PageSplitter handles its own sizing.

    return (
        <div className="max-w-[1400px] mx-auto p-4 sm:p-6 min-h-screen pb-20">
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
                        <div className="flex items-center gap-3 mb-3 sm:mb-0 max-w-full overflow-hidden">
                            <span className="font-semibold text-gray-800 truncate max-w-[150px] sm:max-w-[200px]">{file.name}</span>
                            <span className="text-xs px-2.5 py-1 bg-gray-100 rounded-full text-gray-500 font-medium whitespace-nowrap">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                            </span>
                            <span className="text-xs px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full font-medium whitespace-nowrap">
                                {t.meta.pageCount.replace('{n}', numPages.toString())}
                            </span>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
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

                    {/* Remove ref={containerRef} as we don't need to measure this outer container anymore */}
                    <div className="flex justify-center w-full">
                        <Document
                            file={file}
                            onLoadSuccess={onDocumentLoadSuccess}
                            className="flex flex-col gap-8 w-full"
                            loading={
                                <div className="p-12 text-center text-gray-400 animate-pulse">
                                    {t.items.loading}
                                </div>
                            }
                        >
                            {Array.from(new Array(numPages), (el, index) => {
                                const pageNumber = index + 1;
                                const pageConfig = splitConfigs[pageNumber] ?? { mode: 2, splitPoints: [50] };

                                return (
                                    <PageSplitter
                                        key={`page_${pageNumber}`}
                                        pageNumber={pageNumber}
                                        width={undefined} // PageSplitter measures itself
                                        splitConfig={pageConfig}
                                        onSplitPointsChange={(points) => handleSplitPointsChange(pageNumber, points)}
                                        onSplitModeChange={(mode) => handleSplitModeChange(pageNumber, mode)}
                                    />
                                );
                            })}
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
