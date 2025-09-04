'use client';

import { useState, useRef } from 'react';

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [fileInfo, setFileInfo] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef(null); // ✅ Ref for file input

  // Allowed file types
  const allowedTypes = [
    "text/csv",
    "application/json",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    validateAndSetFile(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files[0];
    validateAndSetFile(droppedFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const validateAndSetFile = (selectedFile) => {
    if (!selectedFile) return;

    if (!allowedTypes.includes(selectedFile.type)) {
      setMessage("❌ Only CSV, JSON, or Excel files are allowed.");
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setMessage("❌ File too large! Max size is 5 MB.");
      return;
    }

    setFile(selectedFile);
    setFileInfo({
      name: selectedFile.name,
      size: (selectedFile.size / 1024).toFixed(2) + " KB",
      type: selectedFile.type,
    });
    setMessage("");
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("⚠️ Please select a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:3001/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setMessage("✅ File uploaded successfully!");
      console.log("Upload Response:", data);
    } catch (err) {
      console.error(err);
      setMessage("❌ Error uploading file.");
    }
  };

  const handleReset = () => {
    setFile(null);
    setMessage("");
    setFileInfo(null);

    // ✅ Reset input via ref instead of getElementById
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black p-6">
      <div className="w-full max-w-xl relative border border-white/20 rounded-2xl bg-white/10 backdrop-blur-xl p-8 shadow-lg">

        <h2 className="text-2xl font-bold mb-6 text-center text-white/80 tracking-tight">
          Upload File
        </h2>

        {/* Drag and Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`w-full p-10 border-2 border-dashed rounded-xl text-center cursor-pointer transition 
            ${dragActive ? "border-cyan-400 bg-white/20" : "border-white/30 bg-white/5"}`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            id="file-input"
            type="file"
            accept=".csv, .json, .xls, .xlsx"
            onChange={handleFileChange}
            className="hidden"
          />
          {file ? (
            <p className="text-white">{file.name}</p>
          ) : (
            <p className="text-white/70">Drag & Drop or Click to Select File</p>
          )}
        </div>

        {/* File Info */}
        {fileInfo && (
          <div className="mt-4 p-4 bg-white/10 rounded-xl text-white/80 text-sm">
            <p><span className="font-semibold">Name:</span> {fileInfo.name}</p>
            <p><span className="font-semibold">Size:</span> {fileInfo.size}</p>
            <p><span className="font-semibold">Type:</span> {fileInfo.type}</p>
          </div>
        )}

        {/* Message */}
        {message && (
          <p className="mt-4 text-center text-sm text-cyan-300">{message}</p>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mt-6">
          <button
            onClick={handleUpload}
            className="px-6 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-semibold shadow-lg transition"
          >
            Upload
          </button>
          <button
            onClick={handleReset}
            className="px-6 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold shadow-lg transition"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
