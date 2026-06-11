"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "./LanguageContext";
import type { Language } from "@/lib/translations";
import { Globe } from "lucide-react";

const languageButtonClass = "flex items-center gap-2 px-3 py-2 bg-floating border border-hairline rounded-lg shadow-sm hover:bg-panel transition-colors text-sm font-medium text-brand";
const languageMenuBaseClass = "absolute right-0 mt-1 w-32 bg-floating border border-hairline rounded-lg shadow-lg transition-opacity origin-top-right";

export default function LanguageSelector() {
    const { language, setLanguage } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const languages: ReadonlyArray<{ code: Language; label: string }> = [
        { code: 'zh', label: '中文' },
        { code: 'en', label: 'English' },
        { code: 'ja', label: '日本語' },
        { code: 'ko', label: '한국어' },
        { code: 'es', label: 'Español' },
        { code: 'ru', label: 'Русский' },
    ];

    useEffect(() => {
        if (!isOpen) return;

        const handlePointerDown = (event: PointerEvent) => {
            if (!menuRef.current?.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setIsOpen(false);
            }
        };

        document.addEventListener("pointerdown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("pointerdown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen]);

    return (
        <div className="absolute top-4 right-4 z-[100]" ref={menuRef}>
            <div className="relative">
                <button
                    className={languageButtonClass}
                    type="button"
                    aria-expanded={isOpen}
                    aria-haspopup="menu"
                    onClick={() => setIsOpen((current) => !current)}
                >
                    <Globe className="w-4 h-4" />
                    {languages.find(l => l.code === language)?.label}
                </button>

                <div className={`${languageMenuBaseClass} ${isOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}>
                    <div className="py-1">
                        {languages.map((lang) => (
                            <button
                                key={lang.code}
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                    setLanguage(lang.code);
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2 text-sm ${language === lang.code
                                        ? "bg-subtle-surface text-brand font-medium"
                                        : "text-brand hover:bg-panel"
                                    }`}
                            >
                                {lang.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
