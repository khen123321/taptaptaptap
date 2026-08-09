"use client";

import { ImagePlus, RotateCcw, Trash2, UploadCloud } from "lucide-react";
import { useId, useRef, useState } from "react";
import type { UploadedDesign } from "@/types/customize";

const acceptedTypes = ["image/png", "image/jpeg", "image/webp"];
const maxFileSize = 10 * 1024 * 1024;

type DesignUploaderProps = {
  uploadedImage: UploadedDesign | null;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => void;
};

export function DesignUploader({
  uploadedImage,
  onUpload,
  onRemove,
}: DesignUploaderProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  const handleFile = async (file?: File) => {
    if (!file) return;

    if (!acceptedTypes.includes(file.type)) {
      setError("Upload a PNG, JPG, JPEG, or WEBP image.");
      return;
    }

    if (file.size > maxFileSize) {
      setError("File must be 10 MB or smaller.");
      return;
    }

    setError("");
    await onUpload(file);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="rounded-lg border border-white/10 bg-[#0A0D0F] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white">Upload your design</h2>
          <p className="mt-2 text-sm leading-6 text-[#9CA6AD]">
            PNG, JPG, JPEG, or WEBP. Maximum file size 10 MB.
          </p>
        </div>
        <ImagePlus className="h-5 w-5 shrink-0 text-[#00A8C0]" aria-hidden />
      </div>

      <label
        htmlFor={inputId}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void handleFile(event.dataTransfer.files[0]);
        }}
        className={`mt-5 flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center transition focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#00A8C0] ${
          dragging
            ? "border-[#00A8C0] bg-[#00A8C0]/10"
            : "border-white/15 bg-black/30 hover:border-[#00A8C0]/60"
        }`}
      >
        <UploadCloud className="h-8 w-8 text-[#00A8C0]" aria-hidden />
        <span className="mt-3 text-sm font-bold text-white">Upload Design</span>
        <span className="mt-1 text-xs leading-5 text-[#9CA6AD]">
          Drag and drop artwork here, or browse files.
        </span>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          onChange={(event) => void handleFile(event.target.files?.[0])}
        />
      </label>

      <p className="mt-4 text-xs leading-5 text-[#9CA6AD]">
        Suggested artwork: portrait orientation, high resolution, PNG preferred.
      </p>

      {error ? (
        <p className="mt-3 rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      {uploadedImage ? (
        <div className="mt-5 rounded-md border border-white/10 bg-black/35 p-4">
          <p className="break-all text-sm font-semibold text-white">
            {uploadedImage.fileName}
          </p>
          <p className="mt-1 text-xs text-[#9CA6AD]">
            {uploadedImage.width && uploadedImage.height
              ? `${uploadedImage.width} x ${uploadedImage.height}px`
              : "Image dimensions unavailable"}
          </p>
          <div className="mt-4 grid gap-3 min-[390px]:grid-cols-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-white/10 px-3 text-sm font-semibold text-white transition hover:border-[#00A8C0]/60 hover:bg-[#00A8C0]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00A8C0]"
            >
              <RotateCcw className="h-4 w-4" aria-hidden />
              Replace Design
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-white/10 px-3 text-sm font-semibold text-white transition hover:border-red-400/60 hover:bg-red-500/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              Remove
            </button>
          </div>
        </div>
      ) : null}

      <p className="mt-4 text-xs leading-5 text-[#9CA6AD]">
        By uploading artwork, you confirm that you have permission to use the
        design.
      </p>
    </div>
  );
}
