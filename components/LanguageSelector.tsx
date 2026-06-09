"use client";

import { useLanguage } from "./LanguageContext";
import type { Language } from "@/lib/translations";
import { Globe } from "lucide-react";

export default function LanguageSelector() {
    const { language, setLanguage } = useLanguage();

    const languages: ReadonlyArray<{ code: Language; label: string }> = [
        { code: 'zh', label: '中文' },
        { code: 'en', label: 'English' },
        { code: 'ja', label: '日本語' },
        { code: 'ko', label: '한국어' },
        { code: 'es', label: 'Español' },
        { code: 'ru', label: 'Русский' },
    ];

    return (
        <div className="absolute top-4 right-4 z-50">
            <div className="relative group">
                <button className="flex items-center gap-2 px-3 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700">
                    <Globe className="w-4 h-4" />
                    {languages.find(l => l.code === language)?.label}
                </button>

                <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-100 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-right">
                    <div className="py-1">
                        {languages.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => setLanguage(lang.code)}
                                className={`w-full text-left px-4 py-2 text-sm ${language === lang.code
                                        ? "bg-blue-50 text-blue-600 font-medium"
                                        : "text-gray-700 hover:bg-gray-50"
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
