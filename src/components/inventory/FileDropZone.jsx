import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, X, Loader2, ImageIcon, Video } from 'lucide-react';

export default function FileDropZone({ onFileUpload, accept, type, currentUrl }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState(currentUrl);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragOut = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await uploadFile(files[0]);
    }
  };

  const uploadFile = async (file) => {
    setIsUploading(true);
    try {
      const url = await onFileUpload(file);
      if (url) {
        setPreview(url);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInput = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadFile(file);
    }
  };

  const isVideo = type === 'video';
  const Icon = isVideo ? Video : ImageIcon;

  return (
    <div className="space-y-2">
      <div
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-sm transition-all ${
          isDragging
            ? 'border-orange-500 bg-orange-500/10'
            : 'border-zinc-700 bg-zinc-900/50'
        }`}
      >
        <input
          type="file"
          accept={accept}
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isUploading}
        />

        <div className="p-6 text-center">
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
              <p className="text-sm text-zinc-400">מעלה...</p>
            </div>
          ) : preview ? (
            <div className="relative">
              {isVideo ? (
                <video
                  src={preview}
                  className="max-h-40 mx-auto rounded"
                  controls
                />
              ) : (
                <img
                  src={preview}
                  alt="Preview"
                  className="max-h-40 mx-auto rounded"
                />
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setPreview(null);
                  onFileUpload(null);
                }}
                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Icon className="w-8 h-8 text-zinc-500" />
              <p className="text-sm text-zinc-400">
                גרור {isVideo ? 'סרטון' : 'תמונה'} לכאן או לחץ לבחירה
              </p>
              <p className="text-xs text-zinc-600">
                {accept}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}