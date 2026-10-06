"use client";

import { useEffect, useRef, useState } from "react";
import { Lock } from "lucide-react";
import { useLanguage } from "./LanguageContext";

const dialogPanelClass = "relative w-[min(92vw,380px)] rounded-xl border border-hairline bg-floating p-5 shadow-2xl";
const inputClass = "mt-1 w-full rounded-lg border border-hairline bg-page px-3 py-2 text-sm text-brand outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";
const secondaryButtonClass = "text-sm text-muted-copy hover:text-brand font-medium px-3 py-2 rounded-lg hover:bg-panel transition-colors";
const primaryButtonClass = "bg-brand hover:bg-primary-hover text-page px-4 py-2 rounded-lg text-sm font-medium shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

type PasswordDialogProps = {
    isIncorrect: boolean;
    onSubmit: (password: string) => void;
    onCancel: () => void;
};

export default function PasswordDialog({ isIncorrect, onSubmit, onCancel }: PasswordDialogProps) {
    const { t } = useLanguage();
    const [password, setPassword] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onCancel();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [onCancel]);

    return (
        <div
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/35 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="password-dialog-title"
        >
            <form
                className={dialogPanelClass}
                onSubmit={(event) => {
                    event.preventDefault();
                    onSubmit(password);
                }}
            >
                <h2 id="password-dialog-title" className="flex items-center gap-2 text-lg font-bold text-brand">
                    <Lock className="h-4 w-4" />
                    {t.password.title}
                </h2>
                <p className="mt-2 text-sm text-muted-copy">{t.password.description}</p>

                <label className="mt-4 block text-sm font-medium text-brand">
                    {t.password.label}
                    <input
                        ref={inputRef}
                        type="password"
                        autoComplete="off"
                        className={inputClass}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        aria-invalid={isIncorrect}
                        aria-describedby={isIncorrect ? "password-dialog-error" : undefined}
                    />
                </label>
                {isIncorrect && (
                    <p id="password-dialog-error" role="alert" className="mt-2 text-sm text-red-600">
                        {t.password.incorrect}
                    </p>
                )}

                <div className="mt-5 flex justify-end gap-2">
                    <button type="button" className={secondaryButtonClass} onClick={onCancel}>
                        {t.password.cancel}
                    </button>
                    <button type="submit" className={primaryButtonClass} disabled={password === ""}>
                        {t.password.submit}
                    </button>
                </div>
            </form>
        </div>
    );
}
