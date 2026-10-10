import React, { useState, useRef } from 'react';
import { Upload, Camera, Image as ImageIcon, AlertTriangle, ArrowRight, CheckCircle2, RefreshCw } from 'lucide-react';
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
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 mb-8">
      <div className="max-w-3xl mx-auto text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Turn any messy whiteboard into study-ready notes
        </h2>
        <p className="mt-2 text-sm sm:text-base text-slate-600">
          Clean perspective & glare &rarr; Detect handwriting & flowcharts &rarr; Generate notes, editable diagrams & quiz.
        </p>
      </div>

      {/* Camera Capture Modal / Overlay */}
      {cameraActive && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl overflow-hidden max-w-2xl w-full border border-slate-700 shadow-2xl">
            <div className="p-4 bg-slate-800 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-emerald-400" />
                <span className="font-semibold text-sm">Align Whiteboard in Frame</span>
              </div>
              <button onClick={stopCamera} className="text-xs px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600">
                Cancel
              </button>
            </div>
            
            <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              {/* Whiteboard alignment guide reticle */}
              <div className="absolute inset-8 border-2 border-dashed border-emerald-400/60 rounded-xl pointer-events-none flex items-center justify-center">
                <span className="text-xs text-emerald-300/80 bg-black/60 px-3 py-1 rounded-full">
                  Keep edges of board within bounds
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-900 flex justify-center gap-4">
              <button
                onClick={captureSnapshot}
                className="px-6 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/30 flex items-center gap-2"
              >
                <Camera className="w-4 h-4" /> Snap Photo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Upload Dropzone & Sample Row */}
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
                ? 'border-emerald-500 bg-emerald-50/50' 
                : 'border-slate-300 hover:border-emerald-400 hover:bg-slate-50/50'
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
                <div className="relative w-40 h-24 rounded-lg overflow-hidden border border-slate-200 shadow-sm mb-3">
                  <img src={capturedImage} alt="Preview" className="w-full h-full object-cover" />
                  <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
                    Selected
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-800">
                  {selectedFile ? selectedFile.name : selectedSample?.name}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">Click or drag another image to replace</p>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-800">
                  Drag & drop your whiteboard photo here
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Supports JPG, PNG, WebP up to 25MB
                </p>
              </>
            )}
          </div>

          {/* Camera Trigger */}
          <div className="mt-3 flex items-center justify-between gap-3">
            <button
              onClick={(e) => { e.stopPropagation(); startCamera(); }}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition"
            >
              <Camera className="w-4 h-4 text-emerald-600" />
              <span>Use Camera / Webcam</span>
            </button>

            {/* Run Pipeline Button */}
            <button
              disabled={(!selectedFile && !selectedSample) || isProcessing}
              onClick={handleStartProcessing}
              className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-md ${
                (!selectedFile && !selectedSample) || isProcessing
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25'
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

        {/* Right: Quick Sample Boards from Benchmark */}
        <div className="lg:col-span-5 bg-slate-50/70 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Or pick from test benchmark
              </span>
              <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                40 boards
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mb-3">
              One-click test sample boards gathered by Ammar, Muavia, Moyeon, and Awais:
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
                    className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all flex items-start gap-2.5 ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/80 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-12 h-10 rounded overflow-hidden shrink-0 bg-slate-200 border border-slate-300">
                      <img src={sample.rawImageUrl} alt={sample.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800 truncate">{sample.name}</span>
                        {sample.isQualityPass ? (
                          <span className="text-[10px] text-emerald-700 font-medium bg-emerald-100/80 px-1.5 py-0.2 rounded shrink-0">
                            {(sample.quality * 100).toFixed(0)}% Q
                          </span>
                        ) : (
                          <span className="text-[10px] text-rose-700 font-medium bg-rose-100/80 px-1.5 py-0.2 rounded shrink-0 flex items-center gap-0.5">
                            <AlertTriangle className="w-2.5 h-2.5" /> Fail Case
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">{sample.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
            <span>Tip: Try the "Glare/Fail" sample to see the Quality Gate retake flow!</span>
          </div>
        </div>

      </div>
    </div>
  );
}
