"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Page } from "react-pdf";
import type { PageSplitConfig, SplitMode } from "@/lib/pdf-processing";

import { GripVertical } from "lucide-react";

import { useLanguage } from "./LanguageContext";

const MIN_SEGMENT_PERCENT = 10;

type LoadedPage = {
    originalWidth: number;
    originalHeight: number;
};

interface PageSplitterProps {
    pageNumber: number;
    width?: number;
    splitConfig: PageSplitConfig;
    onSplitPointsChange: (splitPoints: number[]) => void;
    onSplitModeChange: (mode: SplitMode) => void;
}

export default function PageSplitter({
    pageNumber,
    width: initialWidth,
    splitConfig,
    onSplitPointsChange,
    onSplitModeChange,
}: PageSplitterProps) {
    const { t } = useLanguage();
    const containerRef = useRef<HTMLDivElement>(null);
    const pageContentRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState<number | null>(initialWidth ?? null);
    const [isDragging, setIsDragging] = useState(false);
    const [activeSplitIndex, setActiveSplitIndex] = useState<number | null>(null);

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

    const handlePointerStart = (e: React.MouseEvent | React.TouchEvent, splitIndex: number) => {
        e.preventDefault();
        setActiveSplitIndex(splitIndex);
        setIsDragging(true);
    };

    const handleMove = useCallback(
        (clientX: number) => {
            if (!isDragging || activeSplitIndex === null || !pageContentRef.current) return;

            const rect = pageContentRef.current.getBoundingClientRect();
            const x = clientX - rect.left;
            const percentage = (x / rect.width) * 100;
            const nextPoints = [...splitConfig.splitPoints];
            const lowerBound = activeSplitIndex === 0
                ? MIN_SEGMENT_PERCENT
                : nextPoints[activeSplitIndex - 1] + MIN_SEGMENT_PERCENT;
            const upperBound = activeSplitIndex === nextPoints.length - 1
                ? 100 - MIN_SEGMENT_PERCENT
                : nextPoints[activeSplitIndex + 1] - MIN_SEGMENT_PERCENT;

            nextPoints[activeSplitIndex] = Math.max(lowerBound, Math.min(upperBound, percentage));
            onSplitPointsChange(nextPoints);
        },
        [activeSplitIndex, isDragging, onSplitPointsChange, splitConfig.splitPoints]
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
        setActiveSplitIndex(null);
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

    const onPageLoadSuccess = (page: LoadedPage) => {
        // page.originalWidth/originalHeight are in PDF points (72dpi usually)
        setPageDimensions({ width: page.originalWidth, height: page.originalHeight });
    };

    return (
        <div className="flex flex-col">
            <div className="flex justify-between items-center px-4 py-3 bg-gray-50 rounded-t-lg border-x border-t border-gray-200 flex-wrap gap-2">
                <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm font-bold text-gray-800">{t.items.page.replace('{n}', pageNumber.toString())}</span>

                    <div className="flex items-center gap-1.5 rounded-md border border-blue-100 bg-blue-50 px-1.5 py-1">
                        <span className="text-xs font-semibold text-blue-700 whitespace-nowrap">
                            {t.items.splitInto}
                        </span>
                        <div className="flex items-center bg-white border border-blue-200 rounded-md shadow-sm p-0.5" onClick={(e) => e.stopPropagation()}>
                            {([2, 3] as SplitMode[]).map((mode) => (
                                <button
                                    key={mode}
                                    type="button"
                                    onClick={() => onSplitModeChange(mode)}
                                    className={`h-7 px-2.5 rounded text-xs font-bold transition-colors ${
                                        splitConfig.mode === mode
                                            ? "bg-blue-600 text-white shadow-sm"
                                            : "text-blue-700 hover:bg-blue-50"
                                    }`}
                                    title={mode === 2 ? t.items.twoWaySplit : t.items.threeWaySplit}
                                    aria-pressed={splitConfig.mode === mode}
                                >
                                    {mode} {t.items.pageUnit}
                                </button>
                            ))}
                        </div>
                    </div>

                </div>

                <div className="flex items-center gap-3">
                    {pageDimensions && (
                        <span className="text-[10px] sm:text-xs text-gray-400 font-mono hidden sm:inline-block">
                            {pageDimensions.width.toFixed(0)} x {pageDimensions.height.toFixed(0)} pt
                        </span>
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
                            width: containerWidth ? `${containerWidth}px` : '100%',
                            minHeight: "200px"
                        }}
                    >
                        <Page
                            pageNumber={pageNumber}
                            width={containerWidth ?? undefined}
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

                        {splitConfig.splitPoints.map((point, splitIndex) => (
                            <div
                                key={splitIndex}
                                className={`absolute top-0 bottom-0 w-0.5 bg-blue-500 hover:bg-blue-600 cursor-col-resize z-10 group transition-colors ${
                                    activeSplitIndex === splitIndex ? "bg-blue-700" : ""
                                }`}
                                style={{ left: `${point}%` }}
                                onMouseDown={(event) => handlePointerStart(event, splitIndex)}
                                onTouchStart={(event) => handlePointerStart(event, splitIndex)}
                            >
                                {/* Handle */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-8 bg-white border border-gray-200 rounded shadow-md flex items-center justify-center group-hover:border-blue-500 transition-colors">
                                    <GripVertical className="w-3 h-3 text-gray-400 group-hover:text-blue-500" />
                                </div>

                                {/* Guide Line Shadow/Glow */}
                                <div className="absolute inset-y-0 -left-px w-full border-l border-blue-500/0 group-hover:border-blue-500/50" />
                            </div>
                        ))}

                        {/* Visual Tint (Optional: Tint right side slightly to indicate split) */}
                        {splitConfig.splitPoints.map((point, index) => {
                            const nextPoint = splitConfig.splitPoints[index + 1] ?? 100;

                            return (
                                <div
                                    key={index}
                                    className="absolute inset-y-0 bg-blue-500/5 pointer-events-none"
                                    style={{ left: `${point}%`, width: `${nextPoint - point}%` }}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
