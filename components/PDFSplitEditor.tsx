"use client";

import { useCallback, useRef, useState } from "react";
import UploadZone from "./UploadZone";
import PageSplitter from "./PageSplitter";
import { PageSplitConfig, PdfPasswordError, SplitMode, splitPDF } from "@/lib/pdf-processing";
import { pdfjs, Document, PasswordResponses } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";
import { Loader2 } from "lucide-react";
import { LanguageProvider, useLanguage } from "./LanguageContext";
import LanguageSelector from "./LanguageSelector";
import { getSplitOutputFilename } from "@/lib/upload-validation";
import WeChatContact from "./WeChatContact";
import PasswordDialog from "./PasswordDialog";

// Configure worker locally
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const editorShellClass = "max-w-[1400px] mx-auto p-4 sm:p-6 min-h-screen pb-20";
const floatingToolbarClass = "sticky top-4 z-40 flex flex-col sm:flex-row justify-between items-center bg-floating p-4 rounded-xl shadow-lg border border-hairline mb-8 transition-shadow";
const secondaryButtonClass = "text-sm text-muted-copy hover:text-brand font-medium px-3 py-2 rounded-lg hover:bg-panel transition-colors";
const primaryButtonClass = "bg-brand hover:bg-primary-hover text-page px-5 py-2.5 rounded-lg text-sm font-medium shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-[background-color,box-shadow,transform] active:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2";

type OnPasswordCallback = (password: string | null) => void;

type PasswordRequest = {
    key: number;
    isIncorrect: boolean;
    resolve: (password: string | null) => void;
};

function PDFSplitEditorContent() {
    const { t } = useLanguage();
    const [file, setFile] = useState<File | null>(null);
    const [numPages, setNumPages] = useState<number>(0);
    const [splitConfigs, setSplitConfigs] = useState<Record<number, PageSplitConfig>>({});
    const [isProcessing, setIsProcessing] = useState(false);
    const [passwordRequest, setPasswordRequest] = useState<PasswordRequest | null>(null);
    // The last password given for the current file. After the preview loads, this is the correct password.
    const passwordRef = useRef("");
    const passwordRequestCountRef = useRef(0);

    const selectFile = useCallback((nextFile: File | null) => {
        passwordRef.current = "";
        setPasswordRequest(null);
        setFile(nextFile);
    }, []);

    // Shows the password dialog. Resolves with the password, or with null when the user cancels.
    const requestPassword = useCallback((isIncorrect: boolean) => {
        return new Promise<string | null>((resolve) => {
            passwordRequestCountRef.current += 1;
            setPasswordRequest({ key: passwordRequestCountRef.current, isIncorrect, resolve });
        });
    }, []);

    const closePasswordDialog = useCallback((password: string | null) => {
        passwordRequest?.resolve(password);
        setPasswordRequest(null);
    }, [passwordRequest]);

    const cancelPasswordDialog = useCallback(() => closePasswordDialog(null), [closePasswordDialog]);

    // react-pdf keeps the first instance of this handler for the whole load. Use only stable values here.
    const handlePreviewPassword = useCallback((callback: OnPasswordCallback, reason: number) => {
        void requestPassword(reason === PasswordResponses.INCORRECT_PASSWORD).then((password) => {
            if (password === null) {
                // pdf.js stops the load when it gets an Error. A null value makes pdf.js ask again.
                (callback as unknown as (value: Error) => void)(new Error("Password entry cancelled."));
                selectFile(null);
                return;
            }
            passwordRef.current = password;
            callback(password);
        });
    }, [requestPassword, selectFile]);

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
            let newPdfBytes: Uint8Array;
            // The preview usually supplies the password. Ask again only if pdf-lib rejects it.
            for (;;) {
                try {
                    newPdfBytes = await splitPDF(file, splitConfigs, passwordRef.current);
                    break;
                } catch (error) {
                    if (!(error instanceof PdfPasswordError)) throw error;
                    const password = await requestPassword(passwordRef.current !== "");
                    if (password === null) return;
                    passwordRef.current = password;
                }
            }
            const pdfBytes = new Uint8Array(newPdfBytes);
            const blob = new Blob([pdfBytes.buffer], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = getSplitOutputFilename(file.name);
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error splitting PDF:", error);
            alert(t.actions.splitFailed);
        } finally {
            setIsProcessing(false);
        }
    };

    // No longer need containerRef/width state here, as PageSplitter handles its own sizing.

    return (
        <div className={editorShellClass}>
            <LanguageSelector />
            <div className="mb-8 text-center space-y-2 pt-8">
                <h1 className="text-3xl font-bold tracking-tight text-brand">{t.title}</h1>
                <p className="text-muted-copy">{t.subtitle}</p>
            </div>

            {!file ? (
                <UploadZone onFileSelect={selectFile} />
            ) : (
                <div className="space-y-6">
                    <div className={floatingToolbarClass}>
                        <div className="flex items-center gap-3 mb-3 sm:mb-0 max-w-full sm:flex-1 overflow-hidden">
                            <span className="font-semibold text-brand truncate max-w-[240px] sm:max-w-[420px] lg:max-w-[620px]">{file.name}</span>
                            <span className="text-xs px-2.5 py-1 bg-panel rounded-full text-muted-copy font-medium whitespace-nowrap">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                            </span>
                            <span className="text-xs px-2.5 py-1 text-brand font-medium whitespace-nowrap">
                                {t.meta.pageCount.replace('{n}', numPages.toString())}
                            </span>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                            <button
                                onClick={() => selectFile(null)}
                                className={secondaryButtonClass}
                                disabled={isProcessing}
                            >
                                {t.actions.cancel}
                            </button>
                            <button
                                onClick={handleDownload}
                                disabled={isProcessing}
                                className={primaryButtonClass}
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
                            onPassword={handlePreviewPassword}
                            className="flex flex-col gap-8 w-full"
                            loading={
                                <div className="p-12 text-center text-muted-copy animate-pulse">
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

            <WeChatContact />

            {passwordRequest && (
                <PasswordDialog
                    key={passwordRequest.key}
                    isIncorrect={passwordRequest.isIncorrect}
                    onSubmit={closePasswordDialog}
                    onCancel={cancelPasswordDialog}
                />
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
