"use client";

import { useState, useCallback, useRef } from "react";
import { Upload } from "lucide-react";

import { useLanguage } from "./LanguageContext";
import { validatePdfFile } from "@/lib/upload-validation";

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
}

const uploadZoneBaseClass = "relative border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer";
const uploadZoneIdleClass = "border-hairline hover:border-muted-copy hover:bg-panel/75";
const uploadZoneDraggingClass = "border-accent bg-subtle-surface/75";
const uploadIconIdleClass = "bg-panel text-muted-copy";
const uploadIconDraggingClass = "bg-accent text-brand";

export default function UploadZone({ onFileSelect }: UploadZoneProps) {
  const { t } = useLanguage();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectFile = useCallback((file: File) => {
    const validation = validatePdfFile(file);

    if (validation.valid) {
      onFileSelect(file);
      return;
    }

    alert(validation.reason === "file-too-large" ? t.upload.tooLarge : t.upload.alert);
  }, [onFileSelect, t]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        selectFile(files[0]);
      } else {
        alert(t.upload.alert);
      }
    },
    [selectFile, t]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        selectFile(files[0]);
      }
      e.target.value = "";
    },
    [selectFile]
  );

  return (
    <div
      className={`${uploadZoneBaseClass} ${isDragging ? uploadZoneDraggingClass : uploadZoneIdleClass}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        id="file-upload"
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleFileInput}
        onClick={(event) => event.stopPropagation()}
      />

      <div className="flex flex-col items-center gap-4">
        <div className={`p-4 rounded-full ${isDragging ? uploadIconDraggingClass : uploadIconIdleClass}`}>
          <Upload className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <p className="text-lg font-medium text-brand">
            {isDragging ? t.upload.dropHere : t.upload.clickOrDrag}
          </p>
          <p className="text-sm text-muted-copy">{t.upload.hint}</p>
        </div>
      </div>
    </div>
  );
}
