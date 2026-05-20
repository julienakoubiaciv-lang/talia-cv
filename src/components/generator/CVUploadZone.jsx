import React, { useRef, useState } from 'react';
import { Upload, X, FileText, Image } from 'lucide-react';

export default function CVUploadZone({ fileData, onFileData }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const processFile = (file) => {
    if (!file) return;
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';
    if (!isImage && !isPdf) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result.split(',')[1];
      onFileData({
        name: file.name,
        base64,
        mediaType: file.type,
        type: isImage ? 'image' : 'pdf',
        size: file.size,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    processFile(e.dataTransfer.files[0]);
  };

  if (fileData) {
    return (
      <div className="flex items-center gap-3 p-3 bg-secondary border border-border rounded-lg mb-3">
        <div className="flex items-center justify-center w-9 h-9 bg-primary/10 rounded-lg flex-shrink-0">
          {fileData.type === 'image'
            ? <Image className="w-4 h-4 text-primary" />
            : <FileText className="w-4 h-4 text-primary" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{fileData.name}</p>
          <p className="text-xs text-muted-foreground">{(fileData.size / 1024).toFixed(0)} Ko · {fileData.type.toUpperCase()}</p>
        </div>
        <button
          onClick={() => onFileData(null)}
          className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`flex flex-col items-center justify-center gap-2 p-6 mb-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
        dragging
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/50 hover:bg-secondary/50'
      }`}
    >
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary">
        <Upload className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">Déposer le CV ici</p>
        <p className="text-xs text-muted-foreground mt-0.5">PDF, JPG, PNG, WEBP · max 10 Mo</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => processFile(e.target.files[0])}
      />
    </div>
  );
}
