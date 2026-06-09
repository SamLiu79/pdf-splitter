"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Language } from '@/lib/translations';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: typeof translations['zh'];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const defaultLanguage: Language = 'zh';

function isLanguage(value: string | null): value is Language {
    return value !== null && value in translations;
}

function detectInitialLanguage(): Language {
    if (typeof window === 'undefined') {
        return defaultLanguage;
    }

    let savedLang: string | null = null;
    try {
        savedLang = window.localStorage.getItem('pdf-split-lang');
    } catch {
        savedLang = null;
    }

    if (isLanguage(savedLang)) {
        return savedLang;
    }

    const browserLang = window.navigator.language.toLowerCase();
    if (browserLang.startsWith('en')) return 'en';
    if (browserLang.startsWith('ja')) return 'ja';
    if (browserLang.startsWith('ko')) return 'ko';
    if (browserLang.startsWith('es')) return 'es';
    if (browserLang.startsWith('ru')) return 'ru';
    if (browserLang.startsWith('zh')) return 'zh';

    return defaultLanguage;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguage] = useState<Language>(detectInitialLanguage);

    useEffect(() => {
        document.title = translations[language].title;
    }, [language]);

    useEffect(() => {
        try {
            localStorage.setItem('pdf-split-lang', language);
        } catch {
            // Storage can be unavailable in restricted browser contexts.
        }
    }, [language]);

    const changeLanguage = (lang: Language) => {
        setLanguage(lang);
    };

    const value = {
        language,
        setLanguage: changeLanguage,
        t: translations[language],
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
