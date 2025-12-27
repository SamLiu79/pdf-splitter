"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Language } from '@/lib/translations';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: typeof translations['zh'];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguage] = useState<Language>('zh');

    useEffect(() => {
        // Update document title based on language
        document.title = translations[language].title;
    }, [language]);

    useEffect(() => {
        // 1. Check LocalStorage
        const savedLang = localStorage.getItem('pdf-split-lang') as Language;
        if (savedLang && translations[savedLang]) {
            setLanguage(savedLang);
            return;
        }

        // 2. Check Browser
        const browserLang = navigator.language.toLowerCase();
        let detected: Language = 'zh';

        if (browserLang.startsWith('en')) detected = 'en';
        else if (browserLang.startsWith('ja')) detected = 'ja';
        else if (browserLang.startsWith('ko')) detected = 'ko';
        else if (browserLang.startsWith('es')) detected = 'es';
        else if (browserLang.startsWith('ru')) detected = 'ru';
        else if (browserLang.startsWith('zh')) detected = 'zh';

        setLanguage(detected);
    }, []);

    const changeLanguage = (lang: Language) => {
        setLanguage(lang);
        localStorage.setItem('pdf-split-lang', lang);
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
