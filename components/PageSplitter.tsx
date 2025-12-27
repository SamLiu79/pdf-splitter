"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Page } from "react-pdf";
import { GripVertical } from "lucide-react";

import { useLanguage } from "./LanguageContext";

interface PageSplitterProps {
    pageNumber: number;
    width?: number;
    splitPosition: number; // 0 to 100 percentage
    onSplitChange: (newPos: number) => void;
}

export default function PageSplitter({
    pageNumber,
    width,
    splitPosition,
    onSplitChange,
}: PageSplitterProps) {
    const { t } = useLanguage();
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        e.preventDefault(); // Prevent scrolling while dragging
        setIsDragging(true);
    };

    const handleMove = useCallback(
        (clientX: number) => {
            if (!isDragging || !containerRef.current) return;

            const rect = containerRef.current.getBoundingClientRect();
            const x = clientX - rect.left;
            const percentage = Math.max(10, Math.min(90, (x / rect.width) * 100));
            onSplitChange(percentage);
        },
        [isDragging, onSplitChange]
    );

    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            handleMove(e.clientX);
        },
        [handleMove]
    );

    const handleTouchMove = useCallback(
        (e: TouchEvent) => {
            handleMove(e.touches[0].clientX);
        },
        [handleMove]
    );

    const handleEnd = useCallback(() => {
        setIsDragging(false);
    }, []);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleEnd);
            window.addEventListener("touchmove", handleTouchMove, { passive: false });
            window.addEventListener("touchend", handleEnd);
        }

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleEnd);
            window.removeEventListener("touchmove", handleTouchMove);
            window.removeEventListener("touchend", handleEnd);
        };
    }, [isDragging, handleMouseMove, handleTouchMove, handleEnd]);

    const [pageDimensions, setPageDimensions] = useState<{ width: number; height: number } | null>(null);

    const onPageLoadSuccess = (page: any) => {
        // page.originalWidth/originalHeight are in PDF points (72dpi usually)
        setPageDimensions({ width: page.originalWidth, height: page.originalHeight });
    };

    return (
        <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center px-4 py-2 bg-gray-50 rounded-t-lg border-x border-t border-gray-200">
                <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-gray-700">{t.items.page.replace('{n}', pageNumber.toString())}</span>
                    {pageDimensions && (
                        <span className="text-xs text-mono text-gray-400">
                            {t.items.orig}: {pageDimensions.width.toFixed(1)} x {pageDimensions.height.toFixed(1)} pt
                        </span>
                    )}
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-xs font-medium text-blue-600">
                        {t.items.splitAt.replace('{n}', splitPosition.toFixed(1))}
                    </span>
                    {pageDimensions && (
                        <span className="text-xs text-mono text-gray-400">
                            {t.items.left}: {(pageDimensions.width * splitPosition / 100).toFixed(1)} pt |
                            {t.items.right}: {(pageDimensions.width * (100 - splitPosition) / 100).toFixed(1)} pt
                        </span>
                    )}
                </div>
            </div>

            <div
                ref={containerRef}
                className="relative bg-gray-100 border rounded-b-lg overflow-hidden shadow-sm select-none touch-none mx-auto"
                style={{ width: width ? `${width}px` : '100%', minHeight: "200px" }}
            >
                <Page
                    pageNumber={pageNumber}
                    width={width}
                    onLoadSuccess={onPageLoadSuccess}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    className="mx-auto"
                    loading={
                        <div className="flex items-center justify-center h-[300px] text-gray-400">
                            {t.items.loading} {pageNumber}...
                        </div>
                    }
                />

                {/* Overlay split line */}
                <div
                    className="absolute top-0 bottom-0 w-1 bg-blue-500 hover:bg-blue-600 cursor-col-resize z-10 group transition-colors"
                    style={{ left: `${splitPosition}%` }}
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleTouchStart}
                >
                    {/* Handle */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-8 bg-white border border-gray-200 rounded shadow-md flex items-center justify-center group-hover:border-blue-500 transition-colors">
                        <GripVertical className="w-3 h-3 text-gray-400 group-hover:text-blue-500" />
                    </div>

                    {/* Guide Line Shadow/Glow */}
                    <div className="absolute inset-y-0 -left-px w-full border-l border-blue-500/0 group-hover:border-blue-500/50" />
                </div>

                {/* Visual Tint (Optional: Tint right side slightly to indicate split) */}
                <div
                    className="absolute inset-0 bg-blue-500/5 pointer-events-none"
                    style={{ left: `${splitPosition}%` }}
                />
            </div>
        </div>
    );
}
