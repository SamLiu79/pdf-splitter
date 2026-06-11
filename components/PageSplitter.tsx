"use client";

import { useState, useRef, useEffect } from "react";
import { Page } from "react-pdf";
import type { PageSplitConfig, SplitMode } from "@/lib/pdf-processing";

import { GripVertical } from "lucide-react";

import { useLanguage } from "./LanguageContext";

const MIN_SEGMENT_PERCENT = 10;
const pageHeaderClass = "flex justify-between items-center px-4 py-3 bg-panel rounded-t-lg border-x border-t border-hairline flex-wrap gap-2";
const splitToolbarClass = "flex items-center gap-1.5 rounded-md bg-floating px-2 py-1.5";
const splitButtonGroupClass = "flex items-center bg-floating border border-hairline rounded-md shadow-sm p-0.5";
const pageShellClass = "bg-muted-surface border border-hairline rounded-b-lg shadow-sm w-full overflow-hidden";
const splitLineClass = "absolute top-0 bottom-0 w-0.5 -translate-x-1/2 bg-split-line cursor-col-resize z-20 group rounded-full";
const splitHandleClass = "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-9 bg-split-handle border-2 border-page rounded-md shadow-md flex items-center justify-center transition-transform group-hover:scale-105";

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
    const [localSplitPoints, setLocalSplitPoints] = useState(splitConfig.splitPoints);
    const dragPointsRef = useRef(splitConfig.splitPoints);
    const activeSplitIndexRef = useRef<number | null>(null);
    const onSplitPointsChangeRef = useRef(onSplitPointsChange);
    const displayedSplitPoints = isDragging ? localSplitPoints : splitConfig.splitPoints;

    useEffect(() => {
        onSplitPointsChangeRef.current = onSplitPointsChange;
    }, [onSplitPointsChange]);

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
        dragPointsRef.current = splitConfig.splitPoints;
        activeSplitIndexRef.current = splitIndex;
        setLocalSplitPoints(splitConfig.splitPoints);
        setIsDragging(true);
    };

    useEffect(() => {
        if (!isDragging) return;

        const handleMove = (clientX: number) => {
            const splitIndex = activeSplitIndexRef.current;
            if (splitIndex === null || !pageContentRef.current) return;

            const rect = pageContentRef.current.getBoundingClientRect();
            const x = clientX - rect.left;
            const percentage = (x / rect.width) * 100;
            const nextPoints = [...dragPointsRef.current];
            const lowerBound = splitIndex === 0
                ? MIN_SEGMENT_PERCENT
                : nextPoints[splitIndex - 1] + MIN_SEGMENT_PERCENT;
            const upperBound = splitIndex === nextPoints.length - 1
                ? 100 - MIN_SEGMENT_PERCENT
                : nextPoints[splitIndex + 1] - MIN_SEGMENT_PERCENT;

            nextPoints[splitIndex] = Math.max(lowerBound, Math.min(upperBound, percentage));
            dragPointsRef.current = nextPoints;
            setLocalSplitPoints(nextPoints);
        };

        const handleMouseMove = (e: MouseEvent) => {
            handleMove(e.clientX);
        };

        const handleTouchMove = (e: TouchEvent) => {
            e.preventDefault();
            if (e.touches.length === 0) return;
            handleMove(e.touches[0].clientX);
        };

        const handleEnd = () => {
            onSplitPointsChangeRef.current(dragPointsRef.current);
            activeSplitIndexRef.current = null;
            setIsDragging(false);
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleEnd);
        window.addEventListener("touchmove", handleTouchMove, { passive: false });
        window.addEventListener("touchend", handleEnd);
        window.addEventListener("touchcancel", handleEnd);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleEnd);
            window.removeEventListener("touchmove", handleTouchMove);
            window.removeEventListener("touchend", handleEnd);
            window.removeEventListener("touchcancel", handleEnd);
        };
    }, [isDragging]);

    const [pageDimensions, setPageDimensions] = useState<{ width: number; height: number } | null>(null);

    const onPageLoadSuccess = (page: LoadedPage) => {
        // page.originalWidth/originalHeight are in PDF points (72dpi usually)
        setPageDimensions({ width: page.originalWidth, height: page.originalHeight });
    };

    return (
        <div className="flex flex-col">
            <div className={pageHeaderClass}>
                <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm font-bold text-brand">{t.items.page.replace('{n}', pageNumber.toString())}</span>

                    <div className={splitToolbarClass}>
                        <span className="text-xs font-bold text-brand whitespace-nowrap">
                            {t.items.splitInto}
                        </span>
                        <div className={splitButtonGroupClass} onClick={(e) => e.stopPropagation()}>
                            {([2, 3] as SplitMode[]).map((mode) => (
                                <button
                                    key={mode}
                                    type="button"
                                    onClick={() => onSplitModeChange(mode)}
                                    className={`h-7 px-2.5 rounded text-xs font-bold transition-colors ${
                                        splitConfig.mode === mode
                                            ? "bg-brand text-page shadow-sm"
                                            : "text-brand hover:bg-page"
                                    }`}
                                    title={mode === 2 ? t.items.twoWaySplit : t.items.threeWaySplit}
                                    aria-pressed={splitConfig.mode === mode}
                                >
                                    {mode}
                                </button>
                            ))}
                        </div>
                        <span className="text-xs font-bold text-brand whitespace-nowrap">
                            {t.items.pageUnit}
                        </span>
                    </div>

                </div>

                <div className="flex items-center gap-3">
                    {pageDimensions && (
                        <span className="text-[10px] sm:text-xs text-muted-copy font-mono hidden sm:inline-block">
                            {pageDimensions.width.toFixed(0)} x {pageDimensions.height.toFixed(0)} pt
                        </span>
                    )}
                </div>
            </div>

            <div className={pageShellClass}>
                {/* Scrollable Viewport - we measure THIS width */}
                <div className="overflow-x-auto w-full" ref={containerRef}>
                    <div
                        ref={pageContentRef}
                        className="relative select-none touch-none mx-auto bg-muted-surface"
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
                                <div className="flex items-center justify-center h-[300px] text-muted-copy">
                                    {t.items.loading} {pageNumber}...
                                </div>
                            }
                        />

                        {displayedSplitPoints.map((point, splitIndex) => (
                            <div
                                key={splitIndex}
                                className={splitLineClass}
                                style={{ left: `${point}%` }}
                                onMouseDown={(event) => handlePointerStart(event, splitIndex)}
                                onTouchStart={(event) => handlePointerStart(event, splitIndex)}
                            >
                                {/* Handle */}
                                <div className={splitHandleClass}>
                                    <GripVertical className="w-3.5 h-3.5 text-brand" />
                                </div>

                                {/* Guide Line Shadow/Glow */}
                                <div className="absolute inset-y-0 left-1/2 -z-10 w-4 -translate-x-1/2 bg-page/70" />
                            </div>
                        ))}

                        {/* Visual Tint (Optional: Tint right side slightly to indicate split) */}
                        {displayedSplitPoints.map((point, index) => {
                            const nextPoint = displayedSplitPoints[index + 1] ?? 100;

                            return (
                                <div
                                    key={index}
                                    className="absolute inset-y-0 bg-accent/12 pointer-events-none"
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
