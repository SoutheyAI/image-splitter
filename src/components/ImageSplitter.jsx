import { useState, useRef, useEffect } from 'react';
import JSZip from 'jszip';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const ImageSplitter = () => {
  const [image, setImage] = useState(null);
  const [gridSize, setGridSize] = useState({ rows: 3, cols: 3 });
  const [preview, setPreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [splitMode, setSplitMode] = useState('equal');
  const [customLines, setCustomLines] = useState({ vertical: [], horizontal: [] });
  const [isDraggingLine, setIsDraggingLine] = useState(false);
  const [resolution, setResolution] = useState({
    keepOriginal: true,
    width: 0,
    height: 0
  });
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [previewPieces, setPreviewPieces] = useState([]);
  const [hoveredPiece, setHoveredPiece] = useState(null);
  const [outputFormat, setOutputFormat] = useState('zip');
  const [outputQuality, setOutputQuality] = useState(0.8);
  const [originalFileName, setOriginalFileName] = useState('');

  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const previewRef = useRef(null);
  const piecePreviewRef = useRef(null);
  const splitSettingsRef = useRef(null);

  const validateFile = (file) => {
    setError('');
    
    // Check file type
    if (!file.type.match('image/(jpeg|jpg|png)')) {
      setError('Only PNG, JPEG, and JPG images are supported');
      return false;
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      setError('File size cannot exceed 50MB');
      return false;
    }

    return true;
  };

  const processFile = (file) => {
    if (!validateFile(file)) return;

    // Store original file name without extension
    setOriginalFileName(file.name.replace(/\.[^/.]+$/, ''));

    const reader = new FileReader();
    
    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        const progress = (event.loaded / event.total) * 100;
        setUploadProgress(progress);
      }
    };

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setImage(img);
        updatePreview(img, gridSize);
        setUploadProgress(0);
      };
      img.src = e.target.result;
    };

    reader.readAsDataURL(file);
  };

  const getFormattedDate = () => {
    const date = new Date();
    return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  };

  const generateFileName = (row, col, format) => {
    return `${originalFileName}_${row + 1}_${col + 1}.${format}`;
  };

  const generateZipName = () => {
    return `${originalFileName}_splitted_${getFormattedDate()}.zip`;
  };

  const handleOutputFormatChange = (format) => {
    setOutputFormat(format);
  };

  const handleQualityChange = (quality) => {
    setOutputQuality(parseFloat(quality));
  };

  const downloadSinglePiece = (piece) => {
    const [row, col] = piece.id.split('-');
    const format = outputFormat === 'zip' ? 'png' : outputFormat;
    const fileName = generateFileName(parseInt(row), parseInt(col), format);
    
    const link = document.createElement('a');
    link.href = piece.dataUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      processFile(file);
    }
  };

  const updatePreview = (img, grid) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size to match image
    canvas.width = img.width;
    canvas.height = img.height;
    
    // Draw image
    ctx.drawImage(img, 0, 0);
    
    // Generate piece previews
    generatePiecePreviews();
    
    setPreview(canvas.toDataURL());

    setTimeout(() => {
      splitSettingsRef.current?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start' 
      });
    }, 800); // 增加延迟时间，让用户能看到图片加载完成
  };

  const generatePiecePreviews = () => {
    if (!image) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pieces = [];

    if (splitMode === 'equal') {
      const pieceWidth = canvas.width / gridSize.cols;
      const pieceHeight = canvas.height / gridSize.rows;

      for (let row = 0; row < gridSize.rows; row++) {
        for (let col = 0; col < gridSize.cols; col++) {
          const pieceCanvas = document.createElement('canvas');
          const pieceCtx = pieceCanvas.getContext('2d');

          // Set piece size based on resolution settings
          if (resolution.keepOriginal) {
            pieceCanvas.width = pieceWidth;
            pieceCanvas.height = pieceHeight;
          } else {
            pieceCanvas.width = resolution.width || pieceWidth;
            pieceCanvas.height = resolution.height || pieceHeight;
          }

          // Draw piece
          pieceCtx.drawImage(
            canvas,
            col * pieceWidth,
            row * pieceHeight,
            pieceWidth,
            pieceHeight,
            0,
            0,
            pieceCanvas.width,
            pieceCanvas.height
          );

          pieces.push({
            id: `${row}-${col}`,
            dataUrl: pieceCanvas.toDataURL(),
            bounds: {
              x: col * pieceWidth,
              y: row * pieceHeight,
              width: pieceWidth,
              height: pieceHeight
            }
          });
        }
      }
    } else {
      const lines = {
        horizontal: [0, ...customLines.horizontal, 1],
        vertical: [0, ...customLines.vertical, 1]
      };

      for (let row = 0; row < lines.horizontal.length - 1; row++) {
        for (let col = 0; col < lines.vertical.length - 1; col++) {
          const x = lines.vertical[col] * canvas.width;
          const y = lines.horizontal[row] * canvas.height;
          const width = (lines.vertical[col + 1] - lines.vertical[col]) * canvas.width;
          const height = (lines.horizontal[row + 1] - lines.horizontal[row]) * canvas.height;

          const pieceCanvas = document.createElement('canvas');
          const pieceCtx = pieceCanvas.getContext('2d');

          // Set piece size based on resolution settings
          if (resolution.keepOriginal) {
            pieceCanvas.width = width;
            pieceCanvas.height = height;
          } else {
            pieceCanvas.width = resolution.width || width;
            pieceCanvas.height = resolution.height || height;
          }

          // Draw piece
          pieceCtx.drawImage(
            canvas,
            x,
            y,
            width,
            height,
            0,
            0,
            pieceCanvas.width,
            pieceCanvas.height
          );

          pieces.push({
            id: `${row}-${col}`,
            dataUrl: pieceCanvas.toDataURL(),
            bounds: {
              x,
              y,
              width,
              height
            }
          });
        }
      }
    }

    setPreviewPieces(pieces);
  };

  const handlePieceClick = (piece) => {
    setSelectedPiece(piece);
  };

  const handlePieceHover = (piece) => {
    setHoveredPiece(piece);
  };

  const handleClosePreview = () => {
    setSelectedPiece(null);
  };

  // Update preview pieces when parameters change
  useEffect(() => {
    if (image) {
      generatePiecePreviews();
    }
  }, [gridSize, splitMode, customLines, resolution]);

  const handleGridChange = (type, value) => {
    const numValue = parseInt(value);
    if (numValue >= 1 && numValue <= 10) {
      setGridSize(prev => ({
        ...prev,
        [type]: numValue
      }));
      if (image) {
        updatePreview(image, { ...gridSize, [type]: numValue });
      }
    }
  };

  const handleSliderChange = (type, value) => {
    handleGridChange(type, value);
  };

  const handleModeChange = (mode) => {
    setSplitMode(mode);
    if (mode === 'equal') {
      setCustomLines({ vertical: [], horizontal: [] });
    }
    if (image) {
      updatePreview(image, gridSize);
    }
  };

  const handleResolutionChange = (keepOriginal) => {
    setResolution(prev => ({
      ...prev,
      keepOriginal,
      width: keepOriginal ? 0 : prev.width,
      height: keepOriginal ? 0 : prev.height
    }));
  };

  const handleCustomResolution = (type, value) => {
    const numValue = parseInt(value);
    if (numValue >= 0) {
      setResolution(prev => ({
        ...prev,
        [type]: numValue
      }));
    }
  };

  // Add custom line dragging functionality
  const handlePreviewClick = (e) => {
    if (splitMode === 'custom') {
      const rect = previewRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const isVertical = e.shiftKey;

      setCustomLines(prev => ({
        ...prev,
        [isVertical ? 'vertical' : 'horizontal']: [
          ...prev[isVertical ? 'vertical' : 'horizontal'],
          isVertical ? x / rect.width : y / rect.height
        ].sort()
      }));

      updatePreview(image, gridSize);
    }
  };

  const splitImage = async () => {
    if (!image) return;

    // If single piece is selected and format is not ZIP, download only that piece
    if (selectedPiece && outputFormat !== 'zip') {
      downloadSinglePiece(selectedPiece);
      return;
    }

    const zip = new JSZip();
    const format = outputFormat === 'zip' ? 'png' : outputFormat;
    const pieces = previewPieces;

    // Convert pieces to the selected format with specified quality
    const processedPieces = await Promise.all(
      pieces.map(async (piece) => {
        const [row, col] = piece.id.split('-');
        const fileName = generateFileName(parseInt(row), parseInt(col), format);

        if (format === 'jpg' || format === 'jpeg') {
          // Convert to JPEG with quality setting
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const img = new Image();
          
          return new Promise((resolve) => {
            img.onload = () => {
              canvas.width = piece.bounds.width;
              canvas.height = piece.bounds.height;
              ctx.drawImage(img, 0, 0);
              
              canvas.toBlob(
                (blob) => {
                  resolve({ fileName, blob });
                },
                `image/${format}`,
                outputQuality
              );
            };
            img.src = piece.dataUrl;
          });
        } else {
          // Keep as PNG
          const response = await fetch(piece.dataUrl);
          const blob = await response.blob();
          return { fileName, blob };
        }
      })
    );

    // Add all pieces to the zip file
    processedPieces.forEach(({ fileName, blob }) => {
      zip.file(fileName, blob);
    });

    // Generate and download zip file
    const content = await zip.generateAsync({ type: 'blob' });
    const url = window.URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = generateZipName();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <div
          className={`flex items-center justify-center w-full ${error ? 'mb-2' : ''}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <label
            className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer
              ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}
              transition-colors duration-200`}
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500">PNG, JPEG, JPG (max. 50MB)</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/png,image/jpeg,image/jpg"
              onChange={handleImageUpload}
            />
          </label>
        </div>

        {error && (
          <p className="text-sm text-red-500 text-center">{error}</p>
        )}

        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="w-full mt-4">
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block text-blue-600">
                    Upload Progress
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold inline-block text-blue-600">
                    {Math.round(uploadProgress)}%
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                <div
                  style={{ width: `${uploadProgress}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-300"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {image && (
        <>
          {/* Split Settings */}
          <div ref={splitSettingsRef} className="mb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Split Settings</h3>
            
            {/* Split Mode Selection */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Split Mode</label>
              <div className="flex gap-2">
                <button
                  onClick={() => handleModeChange('equal')}
                  className={`px-3 py-1.5 rounded-md ${
                    splitMode === 'equal'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  Equal Split
                </button>
                <button
                  onClick={() => handleModeChange('custom')}
                  className={`px-3 py-1.5 rounded-md ${
                    splitMode === 'custom'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  Custom Split
                </button>
              </div>
            </div>

            {splitMode === 'equal' && (
              <div className="grid grid-cols-2 gap-3 mb-3">
                {/* Rows Control */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rows</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={gridSize.rows}
                      onChange={(e) => handleSliderChange('rows', e.target.value)}
                      className="w-full"
                    />
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={gridSize.rows}
                      onChange={(e) => handleGridChange('rows', e.target.value)}
                      className="w-16 px-2 py-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Columns Control */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Columns</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={gridSize.cols}
                      onChange={(e) => handleSliderChange('cols', e.target.value)}
                      className="w-full"
                    />
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={gridSize.cols}
                      onChange={(e) => handleGridChange('cols', e.target.value)}
                      className="w-16 px-2 py-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {splitMode === 'custom' && (
              <div className="mb-3">
                <p className="text-sm text-gray-600 mb-1">
                  Click on the preview to add split lines. Hold Shift for vertical lines.
                </p>
                <button
                  onClick={() => setCustomLines({ vertical: [], horizontal: [] })}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Clear Custom Lines
                </button>
              </div>
            )}

            {/* Resolution Settings */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Resolution</label>
              <div className="flex gap-4">
                <div className="flex-1 p-2 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center mb-1">
                    <input
                      type="radio"
                      id="keepOriginal"
                      checked={resolution.keepOriginal}
                      onChange={() => handleResolutionChange(true)}
                      className="mr-2"
                    />
                    <label htmlFor="keepOriginal" className="text-sm">Keep Original Resolution</label>
                  </div>
                  <p className="text-xs text-gray-500">Maintain original quality</p>
                </div>
                
                <div className="flex-1 p-2 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center mb-1">
                    <input
                      type="radio"
                      id="customResolution"
                      checked={!resolution.keepOriginal}
                      onChange={() => handleResolutionChange(false)}
                      className="mr-2"
                    />
                    <label htmlFor="customResolution" className="text-sm">Custom Resolution</label>
                  </div>
                  {!resolution.keepOriginal && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center">
                        <label className="text-xs text-gray-600 w-10">Width:</label>
                        <input
                          type="number"
                          value={resolution.width}
                          onChange={(e) => handleCustomResolution('width', e.target.value)}
                          className="w-full px-1 py-0.5 text-sm rounded border-gray-300"
                        />
                      </div>
                      <div className="flex items-center">
                        <label className="text-xs text-gray-600 w-10">Height:</label>
                        <input
                          type="number"
                          value={resolution.height}
                          onChange={(e) => handleCustomResolution('height', e.target.value)}
                          className="w-full px-1 py-0.5 text-sm rounded border-gray-300"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Output Settings */}
          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Output Settings</h3>
            
            <div className="flex gap-4">
              {/* Format Selection */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOutputFormatChange('zip')}
                    className={`flex-1 px-2 py-1.5 text-sm rounded-md ${
                      outputFormat === 'zip'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    ZIP
                  </button>
                  <button
                    onClick={() => handleOutputFormatChange('png')}
                    className={`flex-1 px-2 py-1.5 text-sm rounded-md ${
                      outputFormat === 'png'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    PNG
                  </button>
                  <button
                    onClick={() => handleOutputFormatChange('jpg')}
                    className={`flex-1 px-2 py-1.5 text-sm rounded-md ${
                      outputFormat === 'jpg'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    JPG
                  </button>
                </div>
              </div>

              {/* Quality Setting (only for JPG) */}
              {outputFormat === 'jpg' && (
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quality ({Math.round(outputQuality * 100)}%)
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={outputQuality}
                    onChange={(e) => handleQualityChange(e.target.value)}
                    className="w-full"
                  />
                </div>
              )}
            </div>

            {/* Output Preview */}
            <div className="text-xs text-gray-600 mt-2">
              <p>Output will be saved as:</p>
              {outputFormat === 'zip' ? (
                <div className="font-mono mt-0.5">
                  <p>ZIP: {generateZipName()}</p>
                  <p>Files: {originalFileName}_row_column.{outputFormat === 'jpg' ? 'jpg' : 'png'}</p>
                </div>
              ) : (
                <p className="font-mono mt-0.5">
                  {selectedPiece 
                    ? generateFileName(...selectedPiece.id.split('-'), outputFormat)
                    : `${originalFileName}_row_column.${outputFormat}`}
                </p>
              )}
            </div>
          </div>

          {/* Download Button */}
          <button
            onClick={splitImage}
            disabled={!image}
            className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
              ${image ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'}
              transition-colors duration-200
            `}
          >
            {selectedPiece && outputFormat !== 'zip' ? 'Download Selected Piece' : 'Split and Download'}
          </button>

          {/* Preview Section */}
          {preview && (
            <div className="mb-6">
              <div
                className="relative overflow-hidden rounded-lg cursor-crosshair"
                ref={previewRef}
                onClick={handlePreviewClick}
              >
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full object-contain max-h-[70vh]"
                />
                
                {/* Grid Overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  {previewPieces.map((piece) => (
                    <div
                      key={piece.id}
                      className={`absolute border-2 border-dashed transition-all duration-200 ${
                        hoveredPiece?.id === piece.id
                          ? 'border-blue-500 bg-blue-100 bg-opacity-20'
                          : 'border-gray-400'
                      }`}
                      style={{
                        left: `${(piece.bounds.x / canvasRef.current?.width) * 100}%`,
                        top: `${(piece.bounds.y / canvasRef.current?.height) * 100}%`,
                        width: `${(piece.bounds.width / canvasRef.current?.width) * 100}%`,
                        height: `${(piece.bounds.height / canvasRef.current?.height) * 100}%`
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePieceClick(piece);
                      }}
                      onMouseEnter={() => handlePieceHover(piece)}
                      onMouseLeave={() => handlePieceHover(null)}
                    />
                  ))}
                  
                  {/* Custom split lines */}
                  {splitMode === 'custom' && (
                    <>
                      {customLines.vertical.map((pos, index) => (
                        <div
                          key={`v-${index}`}
                          className="absolute top-0 bottom-0 w-px bg-blue-500"
                          style={{ left: `${pos * 100}%` }}
                        />
                      ))}
                      {customLines.horizontal.map((pos, index) => (
                        <div
                          key={`h-${index}`}
                          className="absolute left-0 right-0 h-px bg-blue-500"
                          style={{ top: `${pos * 100}%` }}
                        />
                      ))}
                    </>
                  )}
                </div>
              </div>

              {/* Selected Piece Preview Modal */}
              {selectedPiece && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium">Piece Preview</h3>
                      <button
                        onClick={handleClosePreview}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="relative aspect-w-16 aspect-h-9">
                      <img
                        src={selectedPiece.dataUrl}
                        alt="Selected piece preview"
                        className="object-contain w-full h-full"
                      />
                    </div>
                    <div className="mt-4 text-sm text-gray-600">
                      <p>Size: {Math.round(selectedPiece.bounds.width)} x {Math.round(selectedPiece.bounds.height)} px</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <canvas ref={piecePreviewRef} style={{ display: 'none' }} />
    </div>
  );
};

export default ImageSplitter;
