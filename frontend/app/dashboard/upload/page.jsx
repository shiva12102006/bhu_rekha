"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, Loader2, File } from "lucide-react";
import { api } from "@/lib/api";
import DashboardShell from "@/components/DashboardShell";

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      await api.uploadRecord(file);
      router.push("/dashboard?tab=queue");
    } catch (err) {
      setError(err.message || "Failed to upload and process the document.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <DashboardShell>
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 font-display text-2xl text-slate-900">Upload Land Record</h1>
        <p className="mb-6 text-sm text-slate-500">
          Upload a scanned image or PDF of a legacy land record. The AI OCR engine will automatically extract the fields for your review.
        </p>

        {error && (
          <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <div
            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center"
          >
            {file ? (
              <div className="flex flex-col items-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-forest-100 text-forest-700">
                  <File size={24} />
                </div>
                <p className="font-medium text-slate-700">{file.name}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <button
                  onClick={() => setFile(null)}
                  className="mt-4 text-sm font-medium text-rose-600 hover:underline"
                >
                  Remove file
                </button>
              </div>
            ) : (
              <>
                <UploadCloud className="mb-4 h-10 w-10 text-slate-400" />
                <p className="mb-2 text-sm font-medium text-slate-700">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-slate-500">
                  PNG, JPG, JPEG, TIFF or PDF (max. 10MB)
                </p>
                <input
                  type="file"
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  onChange={handleFileChange}
                  accept=".png,.jpg,.jpeg,.pdf,.tiff"
                />
              </>
            )}
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="flex items-center gap-2 rounded-lg bg-forest-700 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-forest-800 disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Processing...
                </>
              ) : (
                "Run AI Extraction"
              )}
            </button>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
