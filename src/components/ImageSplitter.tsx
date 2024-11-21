import React, { useState, useRef, useEffect } from 'react';
import JSZip from 'jszip';

type LayoutType = 'grid' | 'carousel' | 'custom';

interface SplitOptions {
  layout: LayoutType;
  rows: number;
  columns: number;
  format: 'png' | 'jpeg' | 'webp';
  quality: number;
}

const ImageSplitter: React.FC = () => {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [options, setOptions] = useState<SplitOptions>({
    layout: 'grid',
    rows: 3,
    columns: 3,
    format: 'png',
    quality: 0.8
  });
  const [splitPreviews, setSplitPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (image) {
      const url = URL.createObjectURL(image);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [image]);

  useEffect(() => {
    if (image) {
      generateSplitPreviews(image);
    }
  }, [options]);

  useEffect(() => {
    const fileInput = document.getElementById('imageInput') as HTMLInputElement;
    const splitterSection = document.getElementById('splitter-section');

    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        if (target.files?.[0]) {
          handleImageLoad(target.files[0]);
          if (splitterSection) {
            splitterSection.style.display = 'block';
            splitterSection.scrollIntoView({ behavior: 'smooth' });
          }
        }
      });
    }

    // Handle drag and drop on the document level
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer?.files[0];
      if (file) {
        handleImageLoad(file);
        if (splitterSection) {
          splitterSection.style.display = 'block';
          splitterSection.scrollIntoView({ behavior: 'smooth' });
        }
      }
    };

    document.addEventListener('drop', handleDrop);
    document.addEventListener('dragover', (e) => e.preventDefault());

    return () => {
      document.removeEventListener('drop', handleDrop);
      document.removeEventListener('dragover', (e) => e.preventDefault());
    };
  }, []);

  const handleImageLoad = async (file: File) => {
    if (file.type.startsWith('image/')) {
      setImage(file);
      await generateSplitPreviews(file);
    } else {
      alert('Please upload an image file');
    }
  };

  const generateSplitPreviews = async (file: File) => {
    setLoading(true);
    const img = new Image();
    img.src = URL.createObjectURL(file);
    
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let pieceWidth: number;
      let pieceHeight: number;

      switch (options.layout) {
        case 'carousel':
          pieceWidth = img.width;
          pieceHeight = img.height / options.rows;
          break;
        case 'grid':
        case 'custom':
        default:
          pieceWidth = img.width / options.columns;
          pieceHeight = img.height / options.rows;
          break;
      }

      const previews: string[] = [];

      for (let row = 0; row < options.rows; row++) {
        if (options.layout === 'carousel') {
          canvas.width = pieceWidth;
          canvas.height = pieceHeight;
          ctx.drawImage(
            img,
            0,
            row * pieceHeight,
            pieceWidth,
            pieceHeight,
            0,
            0,
            pieceWidth,
            pieceHeight
          );
          previews.push(canvas.toDataURL(`image/${options.format}`, options.quality));
        } else {
          for (let col = 0; col < options.columns; col++) {
            canvas.width = pieceWidth;
            canvas.height = pieceHeight;
            ctx.drawImage(
              img,
              col * pieceWidth,
              row * pieceHeight,
              pieceWidth,
              pieceHeight,
              0,
              0,
              pieceWidth,
              pieceHeight
            );
            previews.push(canvas.toDataURL(`image/${options.format}`, options.quality));
          }
        }
      }

      setSplitPreviews(previews);
      setLoading(false);
      URL.revokeObjectURL(img.src);
    };
  };

  const downloadSplitImages = async () => {
    if (!splitPreviews.length) return;

    const zip = new JSZip();
    const folder = zip.folder('split-images');
    
    splitPreviews.forEach((dataUrl, index) => {
      const data = dataUrl.split(',')[1];
      folder?.file(
        `piece_${index + 1}.${options.format}`,
        data,
        { base64: true }
      );
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const downloadUrl = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = 'split-images.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
  };

  const downloadSingleImage = (dataUrl: string, index: number) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `piece_${index + 1}.${options.format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      {/* Options Panel */}
      <div className="mb-8 p-6 bg-white rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">Split Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Layout Type</label>
            <select
              value={options.layout}
              onChange={(e) => setOptions({...options, layout: e.target.value as LayoutType})}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="grid">Grid Layout</option>
              <option value="carousel">Carousel Layout</option>
              <option value="custom">Custom Layout</option>
            </select>
          </div>
          
          {options.layout !== 'carousel' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Columns</label>
              <input
                type="number"
                min="1"
                max="10"
                value={options.columns}
                onChange={(e) => setOptions({...options, columns: parseInt(e.target.value)})}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {options.layout === 'carousel' ? 'Number of Slides' : 'Rows'}
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={options.rows}
              onChange={(e) => setOptions({...options, rows: parseInt(e.target.value)})}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
            <select
              value={options.format}
              onChange={(e) => setOptions({...options, format: e.target.value as 'png' | 'jpeg' | 'webp'})}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="png">PNG</option>
              <option value="jpeg">JPEG</option>
              <option value="webp">WebP</option>
            </select>
          </div>

          <div className="lg:col-span-5">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quality: {Math.round(options.quality * 100)}%
            </label>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={options.quality}
              onChange={(e) => setOptions({...options, quality: parseFloat(e.target.value)})}
              className="block w-full"
            />
          </div>
        </div>
      </div>

      {/* Preview Area */}
      {preview && (
        <div className="mb-8 p-6 bg-white rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Original Image</h3>
          <img src={preview} alt="Original" className="max-w-full h-auto rounded-lg" />
        </div>
      )}

      {/* Split Previews */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Processing image...</p>
        </div>
      ) : splitPreviews.length > 0 && (
        <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Split Preview</h3>
            <button
              onClick={downloadSplitImages}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download All as ZIP
            </button>
          </div>
          
          <div className={`grid gap-4 ${
            options.layout === 'carousel' 
              ? 'grid-cols-1' 
              : 'grid-cols-2 md:grid-cols-3'
          }`}>
            {splitPreviews.map((preview, index) => (
              <div key={index} className="relative group">
                <img
                  src={preview}
                  alt={`Split ${index + 1}`}
                  className="w-full h-auto rounded-lg shadow-sm"
                />
                <button
                  onClick={() => downloadSingleImage(preview, index)}
                  className="absolute inset-0 bg-black bg-opacity-50 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageSplitter;
