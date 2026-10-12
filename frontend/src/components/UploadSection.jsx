import React, { useState, useRef } from 'react';
import { Upload, Camera, Image as ImageIcon, AlertTriangle, ArrowRight, CheckCircle2, RefreshCw, Sparkles } from 'lucide-react';
import { sampleBoards } from '../data/sampleBoards';

export function UploadSection({ onProcessBoard, isProcessing }) {
  const [dragActive, setDragActive] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedSample, setSelectedSample] = useState(null);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);

  // Start Camera
  const startCamera = async () => {
    try {
      setCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      alert("Could not access camera. Please allow camera permissions or upload an image file instead.");
      setCameraActive(false);
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
    }
    setCameraActive(false);
  };

  // Capture Snapshot from Camera
  const captureSnapshot = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob((blob) => {
      const file = new File([blob], `whiteboard_snap_${Date.now()}.jpg`, { type: 'image/jpeg' });
      setSelectedFile(file);
      setCapturedImage(canvas.toDataURL('image/jpeg'));
      stopCamera();
    }, 'image/jpeg', 0.95);
  };

  // Handle Drag & Drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelected = (file) => {
    setSelectedFile(file);
    setSelectedSample(null);
    setCapturedImage(URL.createObjectURL(file));
  };

  // Submit for processing
  const handleStartProcessing = () => {
    if (selectedSample) {
      onProcessBoard(selectedSample.id);
    } else if (selectedFile) {
      onProcessBoard(selectedFile);
    }
  };

  return (
    <div className="retro-card p-6 mb-8 bg-white">
      {/* Hero Header */}
      <div className="max-w-3xl mx-auto text-center mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-banana-300 border-[1.5px] border-ink shadow-retro-sm text-xs font-mono font-bold text-ink uppercase mb-3">
          <span>🍌 Banana Hacks '26 Image AI Project</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-ink tracking-tight">
          Turn any messy whiteboard into study notes.
        </h2>
        <p className="mt-2 text-sm sm:text-base text-ink-muted font-medium">
          Fix perspective & glare &bull; Detect shapes & handwriting &bull; Redraw clean diagrams & quiz.
        </p>
      </div>

      {/* Camera Capture Modal */}
      {cameraActive && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl overflow-hidden max-w-2xl w-full border-2 border-ink shadow-retro-lg">
            <div className="p-4 bg-banana-300 border-b-2 border-ink flex items-center justify-between text-ink">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-ink" />
                <span className="font-bold text-sm font-mono">Camera: Align Whiteboard</span>
              </div>
              <button onClick={stopCamera} className="retro-btn text-xs px-2.5 py-1 rounded-md bg-white font-bold">
                Cancel
              </button>
            </div>
            
            <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <div className="absolute inset-8 border-2 border-dashed border-banana-400 rounded-xl pointer-events-none flex items-center justify-center">
                <span className="text-xs text-ink bg-banana-300 px-3 py-1 rounded-md font-mono font-bold border border-ink shadow-retro-sm">
                  Keep board edges in frame
                </span>
              </div>
            </div>

            <div className="p-4 bg-cream-100 border-t-2 border-ink flex justify-center gap-4">
              <button
                onClick={captureSnapshot}
                className="retro-btn px-6 py-2.5 rounded-xl bg-banana-400 hover:bg-banana-500 text-ink font-extrabold text-sm flex items-center gap-2"
              >
                <Camera className="w-4 h-4 text-ink" /> Snap Photo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Upload Dropzone & Sample Picker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left: Drag Drop Area */}
        <div className="lg:col-span-7 flex flex-col">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 min-h-[220px] ${
              dragActive 
                ? 'border-ink bg-banana-200' 
                : 'border-ink/60 bg-cream-50 hover:bg-banana-100/60 hover:border-ink'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileSelected(e.target.files[0])}
            />

            {capturedImage ? (
              <div className="flex flex-col items-center">
                <div className="relative w-44 h-28 rounded-lg overflow-hidden border-2 border-ink shadow-retro-sm mb-3">
                  <img src={capturedImage} alt="Preview" className="w-full h-full object-cover" />
                  <span className="absolute bottom-1 right-1 bg-banana-400 text-ink font-mono font-bold text-[10px] px-1.5 py-0.5 rounded border border-ink">
                    SELECTED
                  </span>
                </div>
                <p className="text-xs font-bold text-ink font-mono">
                  {selectedFile ? selectedFile.name : selectedSample?.name}
                </p>
                <p className="text-[11px] text-ink-muted mt-0.5">Click or drag another image to replace</p>
              </div>
            ) : (
              <>
                <div className="w-14 h-14 rounded-xl bg-banana-300 border-2 border-ink shadow-retro-sm text-ink flex items-center justify-center mb-3">
                  <Upload className="w-6 h-6 stroke-[2.2]" />
                </div>
                <p className="text-sm font-extrabold text-ink font-mono">
                  Drop your whiteboard photo here
                </p>
                <p className="text-xs text-ink-muted mt-1 font-medium">
                  Supports JPG, PNG, WebP up to 10MB
                </p>
              </>
            )}
          </div>

          {/* Action Row */}
          <div className="mt-3 flex items-center justify-between gap-3">
            <button
              onClick={(e) => { e.stopPropagation(); startCamera(); }}
              className="retro-btn flex-1 py-2.5 px-4 rounded-xl bg-white hover:bg-cream-100 text-ink font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Camera className="w-4 h-4 text-ink" />
              <span>Use Camera / Phone</span>
            </button>

            {/* Run Pipeline Button */}
            <button
              disabled={(!selectedFile && !selectedSample) || isProcessing}
              onClick={handleStartProcessing}
              className={`retro-btn flex-1 py-2.5 px-4 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                (!selectedFile && !selectedSample) || isProcessing
                  ? 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed shadow-none'
                  : 'bg-banana-400 hover:bg-banana-500 text-ink'
              }`}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Process Whiteboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: Quick Benchmark Sample Cards */}
        <div className="lg:col-span-5 bg-cream-200 border-2 border-ink rounded-xl p-4 flex flex-col justify-between shadow-retro-sm">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold text-ink uppercase tracking-wider">
                Or explore demo boards
              </span>
              <span className="text-[10px] font-mono font-bold bg-white text-ink px-1.5 py-0.5 rounded border border-ink shadow-retro-sm">
                Demo examples
              </span>
            </div>
            <p className="text-[11px] text-ink-muted mb-3 font-medium">
              These illustrative examples show the interface; they are not benchmark results.
            </p>

            <div className="space-y-2">
              {sampleBoards.map((sample) => {
                const isSelected = selectedSample?.id === sample.id;
                return (
                  <button
                    key={sample.id}
                    onClick={() => {
                      setSelectedSample(sample);
                      setSelectedFile(null);
                      setCapturedImage(sample.rawImageUrl);
                    }}
                    className={`w-full text-left p-2.5 rounded-lg border-2 text-xs transition-all flex items-start gap-2.5 cursor-pointer ${
                      isSelected
                        ? 'border-ink bg-banana-300 shadow-retro-sm'
                        : 'border-ink/40 bg-white hover:border-ink hover:bg-banana-50'
                    }`}
                  >
                    <div className="w-12 h-10 rounded overflow-hidden shrink-0 bg-slate-200 border border-ink">
                      <img src={sample.rawImageUrl} alt={sample.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-ink truncate">{sample.name}</span>
                        {sample.isQualityPass ? (
                          <span className="text-[10px] text-vine-600 font-mono font-bold bg-vine-100 px-1.5 py-0.2 rounded border border-ink shrink-0">
                            {(sample.quality * 100).toFixed(0)}% PASS
                          </span>
                        ) : (
                          <span className="text-[10px] text-white font-mono font-bold bg-ripe px-1.5 py-0.2 rounded border border-ink shrink-0 flex items-center gap-0.5">
                            <AlertTriangle className="w-2.5 h-2.5" /> REJECT TEST
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-ink-muted truncate mt-0.5 font-medium">{sample.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-ink/20 text-[11px] font-mono text-ink-muted">
            <span>💡 Try the "Reject Test" to see our quality gate retake alert!</span>
          </div>
        </div>

      </div>
    </div>
  );
}
