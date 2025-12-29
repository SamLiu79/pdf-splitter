"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Page } from "react-pdf";

import { GripVertical, ZoomIn, ZoomOut, Maximize } from "lucide-react";

import { useLanguage } from "./LanguageContext";

interface PageSplitterProps {
    pageNumber: number;
    width?: number;
    splitPosition: number; // 0 to 100 percentage
    onSplitChange: (newPos: number) => void;
}

export default function PageSplitter({
    pageNumber,
    width: initialWidth,
    splitPosition,
    onSplitChange,
}: PageSplitterProps) {
    const { t } = useLanguage();
    const containerRef = useRef<HTMLDivElement>(null);
    const pageContentRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState<number | null>(initialWidth ?? null);
    const [isDragging, setIsDragging] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(1);

    // Measure container width for self-sizing
    useEffect(() => {
        if (!containerRef.current) return;

        const observer = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (entry) {
                setContainerWidth(entry.contentRect.width);
            }
        });

        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.15, 3));
    const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.15, 0.5));
    const handleResetZoom = () => setZoomLevel(1);

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
            if (!isDragging || !pageContentRef.current) return;

            const rect = pageContentRef.current.getBoundingClientRect();
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
        <div className="flex flex-col">
            <div className="flex justify-between items-center px-4 py-3 bg-gray-50 rounded-t-lg border-x border-t border-gray-200 flex-wrap gap-2">
                <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-gray-800">{t.items.page.replace('{n}', pageNumber.toString())}</span>

                    {/* Per-Page Zoom Controls */}
                    <div className="flex items-center bg-white border border-gray-200 rounded-md shadow-sm p-0.5" onClick={(e) => e.stopPropagation()}>
                        <button onClick={handleZoomOut} className="p-1.5 hover:bg-gray-50 rounded text-gray-600 transition-colors" title="Zoom Out">
                            <ZoomOut className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[11px] font-medium w-10 text-center text-gray-600 select-none tabular-nums">{Math.round(zoomLevel * 100)}%</span>
                        <button onClick={handleZoomIn} className="p-1.5 hover:bg-gray-50 rounded text-gray-600 transition-colors" title="Zoom In">
                            <ZoomIn className="w-3.5 h-3.5" />
                        </button>
                        <div className="w-px h-3 bg-gray-200 mx-0.5" />
                        <button onClick={handleResetZoom} className="p-1.5 hover:bg-gray-50 rounded text-gray-600 transition-colors" title="Fit Width">
                            <Maximize className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-0.5">
                    <div className="flex items-center gap-3">
                        {pageDimensions && (
                            <span className="text-[10px] sm:text-xs text-gray-400 font-mono hidden sm:inline-block">
                                {pageDimensions.width.toFixed(0)} x {pageDimensions.height.toFixed(0)} pt
                            </span>
                        )}
                        <span className="text-xs sm:text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                            {t.items.splitAt.replace('{n}', splitPosition.toFixed(1))}
                        </span>
                    </div>
                    {pageDimensions && (
                        <div className="flex items-center gap-2 text-[10px] sm:text-xs text-gray-500 font-mono">
                            <span>L: {(pageDimensions.width * splitPosition / 100).toFixed(0)}</span>
                            <span className="text-gray-300">|</span>
                            <span>R: {(pageDimensions.width * (100 - splitPosition) / 100).toFixed(0)}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-gray-100 border rounded-b-lg shadow-sm w-full overflow-hidden">
                {/* Scrollable Viewport - we measure THIS width */}
                <div className="overflow-x-auto w-full" ref={containerRef}>
                    <div
                        ref={pageContentRef}
                        className="relative select-none touch-none mx-auto bg-gray-100"
                        style={{
                            width: containerWidth ? `${containerWidth * zoomLevel}px` : '100%',
                            minHeight: "200px"
                        }}
                    >
                        <Page
                            pageNumber={pageNumber}
                            width={containerWidth ? containerWidth * zoomLevel : undefined}
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
                            className="absolute top-0 bottom-0 w-0.5 bg-blue-500 hover:bg-blue-600 cursor-col-resize z-10 group transition-colors"
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
            </div>
        </div>
    );
}
