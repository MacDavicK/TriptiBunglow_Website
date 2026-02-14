import { useRef, useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { uploadDocument, validateFileSize, getMaxFileSizeMB } from '@/services/upload.api';
import { cn } from '@/utils/cn';

const ACCEPT = '.jpg,.jpeg,.png,.webp,.pdf';
const ACCEPT_IMAGE = 'image/jpeg,image/png,image/webp';

export interface DocumentUploadProps {
  label: string;
  documentType: 'aadhaar' | 'pan';
  onUploadComplete: (url: string) => void;
  error?: string;
  existingUrl?: string;
}

export function DocumentUpload({
  label,
  documentType,
  onUploadComplete,
  error,
  existingUrl,
}: DocumentUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(existingUrl ?? null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const isComplete = Boolean(uploadedUrl || existingUrl);
  const displayUrl = uploadedUrl ?? existingUrl;

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setUploadError(null);
    setPreview(null);

    if (!validateFileSize(file)) {
      setUploadError(`File must be under ${getMaxFileSizeMB()}MB`);
      return;
    }

    const isImage = file.type.startsWith('image/');
    if (isImage) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview('pdf');
    }

    setUploading(true);
    try {
      const { url } = await uploadDocument(file, documentType);
      setUploadedUrl(url);
      setUploadError(null);
      onUploadComplete(url);
    } catch {
      setUploadError('Upload failed, please try again');
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const openFilePicker = () => fileInputRef.current?.click();
  const openCamera = () => cameraInputRef.current?.click();

  return (
    <div className="w-full">
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        aria-hidden
        onChange={handleFileInputChange}
        disabled={uploading}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept={ACCEPT_IMAGE}
        capture="environment"
        className="hidden"
        aria-hidden
        onChange={handleFileInputChange}
        disabled={uploading}
      />

      {!isComplete && !uploading && (
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button
            type="button"
            variant="secondary"
            onClick={openFilePicker}
            className="w-full sm:w-auto"
          >
            Upload File
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={openCamera}
            className="w-full sm:w-auto"
          >
            Use Camera
          </Button>
        </div>
      )}

      {uploading && (
        <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-50 px-3 py-4">
          <Spinner className="h-5 w-5" />
          <span className="text-sm text-gray-600">Uploading…</span>
        </div>
      )}

      {(preview || displayUrl) && !uploading && (
        <div className="flex items-start gap-3 rounded-lg border border-gray-300 bg-gray-50 p-3">
          {preview === 'pdf' ? (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded bg-gray-200 text-xs font-medium text-gray-600">
              PDF
            </div>
          ) : preview ? (
            <img
              src={preview}
              alt=""
              className="h-14 w-14 shrink-0 rounded object-cover"
              aria-hidden
            />
          ) : displayUrl ? (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded bg-green-100">
              <Check className="h-6 w-6 text-green-600" aria-hidden />
            </div>
          ) : null}
          <div className="min-w-0 flex-1">
            <p className={cn('text-sm font-medium', isComplete ? 'text-green-700' : 'text-gray-700')}>
              {isComplete ? 'Uploaded' : 'Preview'}
            </p>
            {!isComplete && (
              <Button type="button" variant="ghost" size="sm" onClick={openFilePicker} className="mt-1">
                Change file
              </Button>
            )}
          </div>
        </div>
      )}

      {(uploadError || error) && (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {uploadError ?? error}
        </p>
      )}
    </div>
  );
}
