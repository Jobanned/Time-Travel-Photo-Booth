import React, { useRef, useState, useEffect } from "react";
import { Camera, Upload, RotateCcw, Check, AlertCircle, FileImage } from "lucide-react";

interface CameraBoothProps {
  onPhotoSelected: (base64Image: string) => void;
  selectedPhoto: string | null;
  onClearPhoto: () => void;
}

export default function CameraBooth({
  onPhotoSelected,
  selectedPhoto,
  onClearPhoto,
}: CameraBoothProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isFlashing, setIsFlashing] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);

  // Stop camera stream upon dismount or when photo is selected
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraActive(true);
    } catch (err: any) {
      console.error("Camera access failed:", err);
      if (err.name === "NotAllowedError") {
        setCameraError("Camera access denied. Please allow camera permissions in your browser or drag-and-drop a photo instead!");
      } else {
        setCameraError("Webcam not detected or unavailable. Please upload a profile photo instead.");
      }
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (countdown !== null) return;

    // Start 3 second countdown for fun photo booth effect
    let count = 3;
    setCountdown(count);

    const timer = setInterval(() => {
      count -= 1;
      if (count <= 0) {
        clearInterval(timer);
        setCountdown(null);
        triggerSnap();
      } else {
        setCountdown(count);
      }
    }, 800);
  };

  const triggerSnap = () => {
    if (!videoRef.current || !canvasRef.current) return;

    // Flash effect
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 200);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      // Set canvas size to video aspect ratio
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw frame mirrored for selfie natural view
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to Base64 Url
      const base64Data = canvas.toDataURL("image/png");
      onPhotoSelected(base64Data);
      stopCamera();
    }
  };

  // Drag and Drop Handling
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const base64Data = event.target.result as string;
        onPhotoSelected(base64Data);
        stopCamera();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full bg-[#16161a] border border-amber-500/20 rounded-2xl overflow-hidden shadow-xl" id="camera-booth">
      {/* Booth Header */}
      <div className="bg-gradient-to-r from-amber-900/40 to-yellow-950/20 px-6 py-4 border-b border-amber-500/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          <h3 className="font-mono text-xs uppercase tracking-widest text-amber-500 font-bold">
            Portal Biometrics Capture
          </h3>
        </div>
        <span className="font-mono text-[10px] text-zinc-500 uppercase">
          Status: {selectedPhoto ? "Image Active" : cameraActive ? "Lens Stream Active" : "Standby"}
        </span>
      </div>

      <div className="p-6">
        {/* Main Display Box */}
        <div 
          className={`relative aspect-[4/3] w-full rounded-xl bg-zinc-950 flex flex-col items-center justify-center overflow-hidden border-2 transition-all ${
            dragActive ? "border-amber-500 bg-amber-950/20" : "border-zinc-800"
          }`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
        >
          {/* Snap flash overlay */}
          {isFlashing && (
            <div className="absolute inset-0 bg-white z-20 animate-fade-out" />
          )}

          {/* Countdown timer overlay */}
          {countdown !== null && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-10 select-none">
              <span className="font-sans text-8xl font-black text-amber-500 animate-ping">
                {countdown}
              </span>
              <span className="font-mono text-sm uppercase tracking-wider text-amber-200 mt-4">
                Pose for the Chrono-Lens!
              </span>
            </div>
          )}

          {/* Dotted Face Oval Mask overlay (when streaming camera, to align portrait) */}
          {cameraActive && !selectedPhoto && countdown === null && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="w-[180px] h-[240px] md:w-[220px] md:h-[290px] border-2 border-dashed border-amber-500/70 rounded-[50%] flex flex-col items-center justify-center bg-transparent shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                <span className="font-mono text-[9px] text-amber-500/80 uppercase tracking-widest bg-black/75 px-2 py-0.5 rounded-full border border-amber-500/20 translate-y-12">
                  Align Face Here
                </span>
              </div>
            </div>
          )}

          {/* Option A: Photo Render */}
          {selectedPhoto ? (
            <div className="w-full h-full relative flex items-center justify-center bg-[#0d0d0f]">
              <img 
                src={selectedPhoto} 
                alt="Temporal snapshot" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-4 left-4 right-4 py-2 px-3 bg-black/80 backdrop-blur border border-emerald-500/20 rounded-lg flex items-center justify-between text-emerald-400 font-mono text-xs">
                <span className="flex items-center gap-1.5 font-bold">
                  <span className="h-2-dot h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Bio-Pattern Locked
                </span>
                <span className="text-[10px] text-zinc-400">Standard Portrait PNG</span>
              </div>
            </div>
          ) : cameraActive ? (
            // Option B: Realtime video element
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover scale-x-[-1]" // mirror view representation
            />
          ) : (
            // Option C: Standby upload dropzone
            <div className="text-center p-8 flex flex-col items-center gap-4">
              <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-full group-hover:bg-zinc-800 text-amber-500/80 transition-all shadow-inner">
                <Camera className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <p className="text-zinc-200 font-medium text-sm">
                  Expose biometric coordinates or drop portrait
                </p>
                <p className="text-zinc-500 text-xs max-w-sm px-4">
                  Enable your device webcam to capture an instant snapshot, or drag and drop a beautiful personal portrait file.
                </p>
              </div>

              {cameraError && (
                <div className="mx-4 p-3 bg-red-950/30 border border-red-900/40 rounded-lg flex items-start gap-2.5 text-left text-red-200 text-xs">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{cameraError}</span>
                </div>
              )}

              <div className="flex gap-3 mt-2">
                <button
                  id="activate-webcam"
                  onClick={startCamera}
                  className="px-4 py-2 font-mono text-xs uppercase tracking-wider bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-amber-500/10 cursor-pointer"
                >
                  <Camera className="w-4 h-4" /> Start Webcam
                </button>
                <button
                  id="trigger-file-input"
                  onClick={triggerFileInput}
                  className="px-4 py-2 font-mono text-xs uppercase tracking-wider bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg transition-all border border-zinc-800 flex items-center gap-2 cursor-pointer"
                >
                  <Upload className="w-4 h-4" /> Upload File
                </button>
              </div>
            </div>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/*"
          />
        </div>

        {/* Action Controls for Interactive Stream */}
        {(cameraActive || selectedPhoto) && (
          <div className="flex justify-center gap-4 mt-5">
            {cameraActive && !selectedPhoto && (
              <>
                <button
                  id="snap-shutter"
                  onClick={capturePhoto}
                  disabled={countdown !== null}
                  className="px-6 py-2.5 font-mono text-xs uppercase tracking-wider bg-amber-500 hover:bg-amber-600 outline-none text-zinc-950 font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/15"
                >
                  Capture Temporal Seed ({countdown !== null ? `Counting...` : "Trigger Shutter"})
                </button>
                <button
                  id="stop-cam-stream"
                  onClick={stopCamera}
                  disabled={countdown !== null}
                  className="px-4 py-2.5 font-mono text-xs uppercase bg-zinc-900 hover:bg-zinc-850 text-zinc-400 border border-zinc-800 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </>
            )}

            {selectedPhoto && (
              <button
                id="reset-traveler-photo"
                onClick={() => {
                  onClearPhoto();
                  startCamera();
                }}
                className="px-5 py-2 w-full justify-center font-mono text-xs uppercase tracking-widest bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-amber-500 font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" /> Recalibrate Biometrics (Retake)
              </button>
            )}
          </div>
        )}
      </div>

      {/* Hidden static capture canvas */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
