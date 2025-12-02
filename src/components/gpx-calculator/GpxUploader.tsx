"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, FileText, X, AlertCircle } from "lucide-react";

interface GpxUploaderProps {
  onFileUpload: (content: string, fileName: string) => void;
  fileName?: string;
  onClear?: () => void;
  isLoading?: boolean;
  error?: string;
}

export function GpxUploader({
  onFileUpload,
  fileName,
  onClear,
  isLoading = false,
  error,
}: GpxUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith(".gpx")) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      onFileUpload(content, file.name);
    };
    reader.readAsText(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-2">
      <Label>GPX Route File</Label>
      {fileName ? (
        <div className="flex items-center gap-2 rounded-md border p-3">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="flex-1 truncate text-sm">{fileName}</span>
          {onClear && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ) : (
        <div
          className={`relative rounded-md border-2 border-dashed p-6 text-center transition-colors ${
            dragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            Drag and drop a GPX file, or
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => inputRef.current?.click()}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Browse Files"}
          </Button>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept=".gpx"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
