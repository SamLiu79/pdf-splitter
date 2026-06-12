"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { useLanguage } from "./LanguageContext";

const contactButtonClass = "inline-flex items-center gap-2 rounded-lg border border-hairline bg-floating px-4 py-2 text-sm font-semibold text-brand shadow-sm transition-colors hover:bg-panel";
const dialogPanelClass = "relative w-[min(92vw,360px)] rounded-xl border border-hairline bg-floating p-5 text-center shadow-2xl";
const closeButtonClass = "absolute right-3 top-3 rounded-md p-1.5 text-muted-copy transition-colors hover:bg-panel hover:text-brand";

export default function WeChatContact() {
    const { t } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!isOpen) return;

        closeButtonRef.current?.focus();

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setIsOpen(false);
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen]);

    return (
        <footer className="mt-12 flex justify-center pb-6">
            <button
                type="button"
                className={contactButtonClass}
                onClick={() => setIsOpen(true)}
                aria-haspopup="dialog"
            >
                <MessageCircle className="h-4 w-4" />
                {t.contact.wechat}
            </button>

            {isOpen && (
                <div
                    className="fixed inset-0 z-[120] flex items-center justify-center bg-black/35 p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="wechat-dialog-title"
                    onMouseDown={() => setIsOpen(false)}
                >
                    <div
                        className={dialogPanelClass}
                        onMouseDown={(event) => event.stopPropagation()}
                    >
                        <button
                            ref={closeButtonRef}
                            type="button"
                            className={closeButtonClass}
                            onClick={() => setIsOpen(false)}
                            aria-label={t.contact.close}
                        >
                            <X className="h-4 w-4" />
                        </button>

                        <h2 id="wechat-dialog-title" className="text-lg font-bold text-brand">
                            {t.contact.title}
                        </h2>
                        <p className="mt-2 text-sm text-muted-copy">
                            {t.contact.description}
                        </p>
                        <div className="mt-5 flex justify-center">
                            <Image
                                src="/wechat-qr.png"
                                alt={t.contact.qrAlt}
                                width={260}
                                height={260}
                                className="rounded-lg border border-hairline bg-white p-2"
                                unoptimized
                            />
                        </div>
                    </div>
                </div>
            )}
        </footer>
    );
}
