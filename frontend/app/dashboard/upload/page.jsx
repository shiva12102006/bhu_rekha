"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, Loader2, File, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import DashboardShell from "@/components/DashboardShell";
import ImageComparisonSlider from "@/components/ImageComparisonSlider";

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [documentLanguage, setDocumentLanguage] = useState("hi");
  const [originalImageURL, setOriginalImageURL] = useState(null);
  const [enhancedImageURL, setEnhancedImageURL] = useState(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState(null);
  const [extractionResult, setExtractionResult] = useState(null);
  const router = useRouter();

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setError(null);
      setEnhancedImageURL(null);
      setExtractionResult(null);

      // Create object URL for the original image
      const objectUrl = URL.createObjectURL(selectedFile);
      setOriginalImageURL(objectUrl);

      // Trigger the enhancement pipeline
      handleEnhance(selectedFile);
    }
  };

  const handleEnhance = async (selectedFile) => {
    setIsEnhancing(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      
      const res = await fetch("http://localhost:8000/api/v1/land/enhance", {
        method: "POST",
        body: formData,
      });
      
      if (!res.ok) throw new Error("Enhancement failed");
      const data = await res.json();
      
      if (data.success && data.enhanced_image_base64) {
        setEnhancedImageURL(data.enhanced_image_base64);
      } else {
        throw new Error("Invalid response from enhancement API");
      }
    } catch (err) {
      console.error(err);
      setError("Warning: Could not run AI enhancement pipeline. You can still extract data.");
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleUploadAndExtract = async () => {
    if (!file) return;

    setIsExtracting(true);
    setError(null);
    setExtractionResult(null);

    try {
      const result = await api.uploadRecord(file, documentLanguage);
      setExtractionResult(result);
    } catch (err) {
      setError(err.message || "Failed to extract data from the document.");
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <DashboardShell>
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 font-display text-2xl text-slate-900">Upload & AI Restoration</h1>
        <p className="mb-6 text-sm text-slate-500">
          Upload a scanned legacy land record. Our Computer Vision pipeline will denoise and deskew the image before passing it to the OCR engine.
        </p>

        {error && (
          <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          {!file ? (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
              <UploadCloud className="mb-4 h-12 w-12 text-slate-400" />
              <p className="mb-2 font-medium text-slate-700">
                Click to upload or drag and drop
              </p>
              <p className="text-sm text-slate-500">
                PNG, JPG, JPEG, TIFF or PDF (max. 10MB)
              </p>
              <input
                type="file"
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                onChange={handleFileChange}
                accept=".png,.jpg,.jpeg,.pdf,.tiff"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center">
              
              {isEnhancing ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="relative flex h-20 w-20 items-center justify-center">
                    <Loader2 className="absolute h-full w-full animate-spin text-forest-200" />
                    <Sparkles className="h-8 w-8 text-forest-600 animate-pulse" />
                  </div>
                  <p className="mt-4 font-medium text-slate-700">Running AI Image Restoration...</p>
                  <p className="mt-1 text-sm text-slate-500">Denoising and deskewing document</p>
                </div>
              ) : (
                <>
                  {originalImageURL && enhancedImageURL && (
                    <div className="w-full mb-8">
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                          <Sparkles size={18} className="text-forest-600" />
                          Restoration Preview
                        </h3>
                        <button
                          onClick={() => {
                            setFile(null);
                            setOriginalImageURL(null);
                            setEnhancedImageURL(null);
                            setExtractionResult(null);
                          }}
                          className="text-sm text-rose-600 font-medium hover:underline"
                        >
                          Upload different file
                        </button>
                      </div>
                      <ImageComparisonSlider
                        beforeImage={originalImageURL}
                        afterImage={enhancedImageURL}
                      />
                    </div>
                  )}

                  {!extractionResult ? (
                    <div className="w-full flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                      <div className="flex flex-col gap-1 w-1/2">
                        <label className="text-xs font-semibold text-slate-600">Document Language</label>
                        <select 
                          value={documentLanguage}
                          onChange={(e) => setDocumentLanguage(e.target.value)}
                          className="px-3 py-2 border border-slate-300 rounded-md text-sm outline-none focus:border-forest-500 focus:ring-1 focus:ring-forest-500 bg-white text-slate-700"
                          disabled={isExtracting || isEnhancing}
                        >
                          <option value="hi">Hindi (Devanagari)</option>
                          <option value="mr">Marathi (Devanagari)</option>
                          <option value="ne">Nepali (Devanagari)</option>
                          <option value="ta">Tamil</option>
                          <option value="te">Telugu</option>
                          <option value="ka">Kannada</option>
                          <option value="bn">Bengali</option>
                          <option value="gu">Gujarati</option>
                          <option value="pa">Punjabi</option>
                          <option value="en">English Only</option>
                        </select>
                      </div>

                      <button
                        onClick={handleUploadAndExtract}
                        disabled={isExtracting || isEnhancing}
                        className="flex items-center gap-2 rounded-lg bg-forest-700 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-forest-800 disabled:opacity-50"
                      >
                        {isExtracting ? (
                          <>
                            <Loader2 className="animate-spin" size={16} />
                            Running Extraction...
                          </>
                        ) : (
                          "Extract Data (OCR)"
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="w-full mt-6 rounded-xl border border-forest-100 bg-forest-50 p-6">
                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <h3 className="font-display text-lg text-forest-900">Extraction Complete</h3>
                          <p className="text-sm text-forest-700">
                            Confidence Score: <span className="font-semibold">{extractionResult.confidence_score}%</span>
                          </p>
                        </div>
                        <button
                          onClick={() => router.push(`/dashboard/verify/${extractionResult.id}`)}
                          className="rounded-lg bg-forest-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-forest-800"
                        >
                          Proceed to Verification
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm text-slate-700 mb-4">
                        <div className="bg-white p-3 rounded shadow-sm">
                          <span className="block text-xs text-slate-400">Owner Name</span>
                          <span className="font-medium">{extractionResult.owner_name || "N/A"}</span>
                        </div>
                        <div className="bg-white p-3 rounded shadow-sm">
                          <span className="block text-xs text-slate-400">Khasra No.</span>
                          <span className="font-medium">{extractionResult.khasra_no || "N/A"}</span>
                        </div>
                        <div className="bg-white p-3 rounded shadow-sm">
                          <span className="block text-xs text-slate-400">Village</span>
                          <span className="font-medium">{extractionResult.village || "N/A"}</span>
                        </div>
                        <div className="bg-white p-3 rounded shadow-sm">
                          <span className="block text-xs text-slate-400">Plot Area</span>
                          <span className="font-medium">{extractionResult.plot_area || "N/A"}</span>
                        </div>
                      </div>

                      <div className="bg-white p-4 rounded shadow-sm">
                        <span className="block text-xs text-slate-400 mb-2">Raw Extracted Text:</span>
                        <pre className="whitespace-pre-wrap text-xs text-slate-600 max-h-32 overflow-y-auto">
                          {extractionResult.extracted_text}
                        </pre>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
