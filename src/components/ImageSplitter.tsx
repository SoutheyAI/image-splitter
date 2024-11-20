import React, { useState, useRef, useEffect } from 'react';
import JSZip from 'jszip';

interface SplitOptions {
  rows: number;
  columns: number;
  format: 'png' | 'jpeg' | 'webp';
  quality: number;
}

const ImageSplitter: React.FC = () => {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [options, setOptions] = useState<SplitOptions>({
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
    const fileInput = document.getElementById('imageInput') as HTMLInputElement;
    const splitterSection = document.getElementById('splitter-section');

    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        if (target.files?.[0]) {
          handleImageLoad(target.files[0]);
          if (splitterSection) {
            splitterSection.style.display = 'block';
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

      const pieceWidth = img.width / options.columns;
      const pieceHeight = img.height / options.rows;
      const previews: string[] = [];

      for (let row = 0; row < options.rows; row++) {
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

  return (
    <div className="w-full max-w-4xl mx-auto">
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      {/* Options Panel */}
      <div className="mb-8 p-4 bg-white rounded-lg shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Rows</label>
            <input
              type="number"
              min="1"
              max="10"
              value={options.rows}
              onChange={(e) => setOptions({...options, rows: parseInt(e.target.value)})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Columns</label>
            <input
              type="number"
              min="1"
              max="10"
              value={options.columns}
              onChange={(e) => setOptions({...options, columns: parseInt(e.target.value)})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Format</label>
            <select
              value={options.format}
              onChange={(e) => setOptions({...options, format: e.target.value as 'png' | 'jpeg' | 'webp'})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="png">PNG</option>
              <option value="jpeg">JPEG</option>
              <option value="webp">WebP</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Quality</label>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={options.quality}
              onChange={(e) => setOptions({...options, quality: parseFloat(e.target.value)})}
              className="mt-1 block w-full"
            />
          </div>
        </div>
      </div>

      {/* Preview Area */}
      {preview && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Original Image</h3>
          <img src={preview} alt="Original" className="max-w-full h-auto rounded-lg shadow-sm" />
        </div>
      )}

      {/* Split Previews */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Processing image...</p>
        </div>
      ) : splitPreviews.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Split Preview</h3>
          <div className="grid grid-cols-3 gap-4 mb-8">
            {splitPreviews.map((preview, index) => (
              <img
                key={index}
                src={preview}
                alt={`Split ${index + 1}`}
                className="w-full h-auto rounded-lg shadow-sm"
              />
            ))}
          </div>
          <button
            onClick={downloadSplitImages}
            className="w-full bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Download All Pieces
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageSplitter;
