import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Link as LinkIcon,
  Trash2,
  Star,
  Image as ImageIcon,
  Check,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Info,
} from 'lucide-react';
import { formatImageUrl, isGoogleDriveUrl, processUploadedFile } from '../../utils/imageUtils';

interface ProductImageManagerProps {
  images: Array<{
    id?: string;
    image_url: string;
    alt_text?: string;
    is_primary: boolean;
    sort_order: number;
  }>;
  onChange: (
    images: Array<{
      id?: string;
      image_url: string;
      alt_text?: string;
      is_primary: boolean;
      sort_order: number;
    }>
  ) => void;
  disabled?: boolean;
}

export const ProductImageManager: React.FC<ProductImageManagerProps> = ({
  images,
  onChange,
  disabled = false,
}) => {
  const [googleDriveUrl, setGoogleDriveUrl] = useState('');
  const [driveAltText, setDriveAltText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Method A: Direct Upload (Multiple Files)
  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setIsProcessingFiles(true);

    try {
      const newImagesList = [...images];
      const validImageFiles = Array.from(files).filter((file) =>
        file.type.startsWith('image/')
      );

      if (validImageFiles.length === 0) {
        setError('Please select valid image files (JPG, PNG, WebP, GIF).');
        setIsProcessingFiles(false);
        return;
      }

      for (let i = 0; i < validImageFiles.length; i++) {
        const file = validImageFiles[i];
        const processedUrl = await processUploadedFile(file);
        const isFirst = newImagesList.length === 0;

        newImagesList.push({
          image_url: processedUrl,
          alt_text: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
          is_primary: isFirst,
          sort_order: newImagesList.length,
        });
      }

      onChange(newImagesList);
    } catch (err: any) {
      console.error('File upload error:', err);
      setError(err?.message || 'Failed to process selected images. Please try again.');
    } finally {
      setIsProcessingFiles(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Method B: Google Drive Link (Multiple links supported)
  const handleAddGoogleDrive = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const raw = googleDriveUrl.trim();
    if (!raw) {
      setError('Please paste a Google Drive image link.');
      return;
    }

    try {
      new URL(raw);
    } catch {
      setError('Please enter a valid URL (e.g. https://drive.google.com/...)');
      return;
    }

    setError(null);
    const convertedUrl = formatImageUrl(raw);
    const isFirst = images.length === 0;

    const newImage = {
      image_url: convertedUrl,
      alt_text: driveAltText.trim() || undefined,
      is_primary: isFirst,
      sort_order: images.length,
    };

    onChange([...images, newImage]);
    setGoogleDriveUrl('');
    setDriveAltText('');
  };

  // Management: Remove
  const handleRemove = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    // If removed photo was primary, assign first remaining as primary
    if (images[index]?.is_primary && updated.length > 0) {
      updated[0].is_primary = true;
    }
    onChange(updated);
  };

  // Management: Set Primary
  const handleSetPrimary = (index: number) => {
    const updated = images.map((img, i) => ({
      ...img,
      is_primary: i === index,
    }));
    onChange(updated);
  };

  // Management: Reorder
  const handleMove = (index: number, direction: 'left' | 'right') => {
    const targetIdx = direction === 'left' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= images.length) return;

    const updated = [...images];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;

    // reassign sort_orders
    updated.forEach((img, i) => {
      img.sort_order = i;
    });

    onChange(updated);
  };

  return (
    <div className="space-y-6">
      {/* Upload Methods Grid: Method A & Method B side-by-side */}
      {!disabled && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* METHOD A: DIRECT UPLOAD */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleFilesSelected(e.dataTransfer.files);
            }}
            className={`p-5 rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center ${
              isDragging
                ? 'border-[#2D6636] bg-[#EAF4EE]'
                : 'border-[#DED6BE] bg-[#FAF7EB]/40 hover:border-[#18281B]/40 hover:bg-[#FAF7EB]'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) => handleFilesSelected(e.target.files)}
              className="hidden"
              id="file-upload-input"
            />

            <div className="w-10 h-10 rounded-full bg-white border border-[#DED6BE] flex items-center justify-center text-[#2D6636] mb-3 shadow-2xs">
              <UploadCloud className="w-5 h-5" />
            </div>

            <h4 className="font-sans font-semibold text-xs text-[#18281B]">
              Method A: Direct Upload
            </h4>
            <p className="font-sans text-[11px] text-[#6E736B] mt-1 max-w-xs">
              Select multiple photos from your computer or device. Repeated uploads are supported.
            </p>

            <button
              id="btn-upload-photos"
              type="button"
              disabled={isProcessingFiles}
              onClick={() => fileInputRef.current?.click()}
              className="mt-3 px-4 py-2 bg-[#18281B] hover:bg-[#2D6636] text-white text-xs font-sans font-medium rounded-lg transition-colors cursor-pointer shadow-2xs flex items-center gap-2"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>{isProcessingFiles ? 'Processing Photos...' : 'Upload Product Photos'}</span>
            </button>
          </div>

          {/* METHOD B: GOOGLE DRIVE IMAGE LINKS */}
          <div className="p-5 rounded-xl border border-[#DED6BE] bg-white shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-md bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB]">
                  <LinkIcon className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="font-sans font-semibold text-xs text-[#18281B]">
                    Method B: Google Drive Link
                  </h4>
                  <p className="font-sans text-[11px] text-[#6E736B]">
                    Paste public Google Drive share link for direct high-res embedding.
                  </p>
                </div>
              </div>

              <div className="space-y-2 mt-3">
                <input
                  type="url"
                  value={googleDriveUrl}
                  onChange={(e) => setGoogleDriveUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/.../view"
                  className="w-full px-3 py-2 bg-[#FAF7EB]/40 border border-[#DED6BE] rounded-lg text-xs font-sans text-[#18281B] placeholder-[#8A9288] focus:bg-white focus:outline-none focus:border-[#18281B]"
                />
                <input
                  type="text"
                  value={driveAltText}
                  onChange={(e) => setDriveAltText(e.target.value)}
                  placeholder="Photo caption or angle (optional)"
                  className="w-full px-3 py-1.5 bg-[#FAF7EB]/40 border border-[#DED6BE] rounded-lg text-[11px] font-sans text-[#18281B] placeholder-[#8A9288] focus:bg-white focus:outline-none focus:border-[#18281B]"
                />
              </div>
            </div>

            <div className="mt-3 pt-2 flex justify-end">
              <button
                id="btn-add-gdrive-image"
                type="button"
                onClick={() => handleAddGoogleDrive()}
                className="px-3.5 py-2 bg-[#FAF7EB] hover:bg-[#EDE7D4] text-[#18281B] border border-[#DED6BE] text-xs font-sans font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <LinkIcon className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>+ Add Google Drive Image</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-800 font-sans">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* COMBINED IMAGE GALLERY & MANAGEMENT */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="font-sans text-xs font-semibold text-[#18281B] flex items-center gap-2">
            <span>Product Photos ({images.length})</span>
            {images.length > 0 && (
              <span className="text-[11px] font-normal text-[#6E736B]">
                (Star indicates the Primary / Main catalog photo)
              </span>
            )}
          </label>
        </div>

        {images.length === 0 ? (
          <div className="p-8 rounded-xl border border-dashed border-[#DED6BE] bg-[#FAF7EB]/30 text-center">
            <ImageIcon className="w-8 h-8 mx-auto text-[#8A9288] mb-2" />
            <p className="font-sans text-xs font-medium text-[#18281B]">No photos added yet</p>
            <p className="font-sans text-[11px] text-[#6E736B] max-w-sm mx-auto mt-1">
              Add photos using Method A (Direct Upload) or Method B (Google Drive link) above.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
            {images.map((img, idx) => {
              const isDrive = isGoogleDriveUrl(img.image_url);

              return (
                <div
                  key={img.id || idx}
                  className={`group relative bg-white border rounded-xl overflow-hidden shadow-2xs transition-all flex flex-col justify-between ${
                    img.is_primary
                      ? 'border-[#2D6636] ring-2 ring-[#2D6636]/20 shadow-xs'
                      : 'border-[#DED6BE] hover:border-[#18281B]/40'
                  }`}
                >
                  {/* Image Aspect Box */}
                  <div className="aspect-3/4 w-full bg-[#FAF7EB] overflow-hidden relative flex items-center justify-center">
                    <img
                      src={img.image_url}
                      alt={img.alt_text || `Product photo ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-center"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://placehold.co/400x533/FAF7EB/18281B?text=Preview+Loading';
                      }}
                    />

                    {/* Primary Badge */}
                    {img.is_primary && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 bg-[#18281B] text-white text-[10px] font-sans font-semibold rounded-full flex items-center gap-1 shadow-xs">
                        <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                        <span>Primary</span>
                      </span>
                    )}

                    {/* Source tag: Direct vs Drive */}
                    <span className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-black/60 backdrop-blur-xs text-white text-[9px] font-sans rounded">
                      {isDrive ? 'Drive Link' : 'Direct Upload'}
                    </span>

                    {/* Reorder controls on hover */}
                    {!disabled && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-xs rounded-md p-0.5">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMove(idx, 'left')}
                          className="p-1 text-white hover:text-amber-300 disabled:opacity-30 cursor-pointer"
                          title="Move left"
                        >
                          <ArrowLeft className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === images.length - 1}
                          onClick={() => handleMove(idx, 'right')}
                          className="p-1 text-white hover:text-amber-300 disabled:opacity-30 cursor-pointer"
                          title="Move right"
                        >
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Caption & Controls */}
                  <div className="p-2.5 space-y-2 border-t border-[#EBE4D2] bg-white">
                    <p className="font-sans text-[11px] text-[#18281B] font-medium truncate" title={img.alt_text}>
                      {img.alt_text || `Photo ${idx + 1}`}
                    </p>

                    {!disabled && (
                      <div className="flex items-center justify-between pt-1 border-t border-[#F2ECE0]">
                        {!img.is_primary ? (
                          <button
                            type="button"
                            onClick={() => handleSetPrimary(idx)}
                            className="font-sans text-[11px] text-[#2D6636] hover:text-[#18281B] font-medium flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Star className="w-3 h-3" />
                            <span>Set Primary</span>
                          </button>
                        ) : (
                          <span className="font-sans text-[11px] text-[#18281B] font-semibold flex items-center gap-1">
                            <Check className="w-3 h-3 text-[#2D6636]" />
                            <span>Main Image</span>
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleRemove(idx)}
                          className="p-1 text-rose-700 hover:text-rose-900 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          title="Remove photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
