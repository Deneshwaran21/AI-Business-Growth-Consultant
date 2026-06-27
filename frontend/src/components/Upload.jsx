import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadFile } from '../api';

const Upload = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const onDrop = useCallback((acceptedFiles) => {
    const f = acceptedFiles[0];
    if (f) setFile(f);
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setMessage('');
    try {
      const res = await uploadFile(file);
      const { path, filename } = res.data;
      setMessage(`✅ Uploaded: ${filename}`);
      if (onUploadSuccess) onUploadSuccess(path);
    } catch (err) {
      setMessage(`❌ Error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div 
        {...getRootProps()} 
        className="border-2 border-dashed border-indigo-200 rounded-lg p-8 text-center hover:border-indigo-400 transition-colors cursor-pointer bg-indigo-50/50"
      >
        <input {...getInputProps()} />
        <div className="text-4xl mb-2">📤</div>
        {file ? (
          <p className="text-sm font-medium text-indigo-600">{file.name} ({(file.size/1024).toFixed(1)} KB)</p>
        ) : (
          <>
            <p className="text-sm text-slate-600">Drag & drop a CSV file here</p>
            <p className="text-xs text-slate-400 mt-1">or click to browse</p>
          </>
        )}
      </div>
      <button 
        onClick={handleUpload} 
        disabled={!file || uploading}
        className={`mt-3 w-full rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${
          !file || uploading ? 'bg-slate-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
        }`}
      >
        {uploading ? 'Uploading...' : 'Upload CSV'}
      </button>
      {message && <p className="mt-2 text-sm text-slate-600">{message}</p>}
    </div>
  );
};

export default Upload;