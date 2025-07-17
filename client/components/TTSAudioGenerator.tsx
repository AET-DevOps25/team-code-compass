import React, { useRef, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadCloud } from "lucide-react";

const getTTSApiUrl = () => {
  if (typeof window !== "undefined") {
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return "http://localhost:8001/tts";
    } else {
      return "http://tts-service:8000/tts";
    }
  }
  return "http://localhost:8001/tts";
};

const TTSAudioGenerator = () => {
  const [file, setFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
    setAudioUrl(null);
    setError(null);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleGenerate = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setAudioUrl(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(getTTSApiUrl(), {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Audio generation failed");
      }

      const blob = await response.blob();
      setAudioUrl(URL.createObjectURL(blob));
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto mt-6 shadow-lg">
      <CardHeader>
        <CardTitle>Workout Program voice-over</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label className="mb-1 block">Select Markdown File</Label>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".md"
                onChange={handleFileChange}
                className="hidden"
                disabled={loading}
              />
              <Button
                type="button"
                onClick={handleButtonClick}
                variant="outline"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 px-4 py-2"
                disabled={loading}
              >
                <UploadCloud className="w-4 h-4 mr-2" />
                {file ? "Change File" : "Select File"}
              </Button>
              <span className="text-sm text-gray-700 truncate max-w-[140px]">
                {file ? file.name : "No file selected"}
              </span>
            </div>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={!file || loading}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 w-full"
          >
            {loading ? "Generating..." : "Generate Audio"}
          </Button>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          {audioUrl && (
            <div className="mt-4">
              <audio controls src={audioUrl} className="w-full"></audio>
              <a href={audioUrl} download="tts-output.mp3" className="ml-2 text-blue-600 underline block mt-2">
                Download
              </a>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TTSAudioGenerator; 