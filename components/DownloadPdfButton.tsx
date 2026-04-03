"use client";

import { useState } from "react";

interface DownloadPdfButtonProps {
  testId: string;
  testName?: string;
  sectionName?: string;
}

export default function DownloadPdfButton({
  testId,
  testName = "Practice Test",
  sectionName,
}: DownloadPdfButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);

      const params = new URLSearchParams({ testId });
      if (sectionName) {
        params.set("section", sectionName);
      }

      const response = await fetch(`/api/export-pdf?${params.toString()}`, {
        method: "GET",
      });

      if (!response.ok) {
        let errorMessage = "Khong the tai PDF luc nay.";

        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // Keep fallback message when the response body is not JSON.
        }

        window.alert(`Loi: ${errorMessage}`);
        return;
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const fileNameBase = [testName, sectionName].filter(Boolean).join("_");

      link.href = downloadUrl;
      link.download = `${fileNameBase.replace(/[^\w\s-]/g, "").replace(/\s+/g, "_") || "practice_test"}.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Failed to download PDF", error);
      window.alert("Da xay ra loi mang. Vui long thu lai.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={isDownloading}
    className={`text-xs font-medium transition-colors underline ${
  isDownloading
    ? "cursor-not-allowed text-gray-400"
    : "cursor-pointer text-black hover:text-blue-600 hover:no-underline"
}`}
    >
      {isDownloading ? "Downloading..." : "Download PDF"}
    </button>
  );
}