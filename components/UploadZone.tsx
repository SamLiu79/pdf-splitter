"use client";

import { useState, useCallback } from "react";
import { Upload } from "lucide-react";

import { useLanguage } from "./LanguageContext";

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
}

export default function UploadZone({ onFileSelect }: UploadZoneProps) {
  const { t } = useLanguage();
  const [isDragging, setIsDragging] = useState(false);

  // ... (drag handlers same logic)

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
      if (files.length > 0 && files[0].type === "application/pdf") {
        onFileSelect(files[0]);
      } else {
        alert(t.upload.alert);
      }
    },
    [onFileSelect, t]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0 && files[0].type === "application/pdf") {
        onFileSelect(files[0]);
      }
    },
    [onFileSelect]
  );

  return (
    <div
      className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer
        ${isDragging
          ? "border-blue-500 bg-blue-50/50"
          : "border-gray-300 hover:border-gray-400 hover:bg-gray-50/50"
        }
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => document.getElementById("file-upload")?.click()}
    >
      <input
        id="file-upload"
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleFileInput}
      />

      <div className="flex flex-col items-center gap-4">
        <div className={`p-4 rounded-full ${isDragging ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"}`}>
          <Upload className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <p className="text-lg font-medium text-gray-900">
            {isDragging ? t.upload.dropHere : t.upload.clickOrDrag}
          </p>
          <p className="text-sm text-gray-500">{t.upload.hint}</p>
        </div>
      </div>
    </div>
  );
}
