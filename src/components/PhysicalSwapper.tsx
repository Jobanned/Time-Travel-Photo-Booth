import React, { useRef, useState, useEffect } from "react";
import { Era, DraggedProp, UserFacePosition } from "../types";
import { 
  Sliders, Move, RotateCw, ZoomIn, Palette, 
  Sparkles, Check, Download, Layers, Shield, Trash2,
  Pipette, Scissors, Circle, Square, RefreshCw
} from "lucide-react";

interface PhysicalSwapperProps {
  era: Era;
  userImage: string;
  onSaveResult: (finalImageUrl: string) => void;
}

export default function PhysicalSwapper({
  era,
  userImage,
  onSaveResult,
}: PhysicalSwapperProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Background removal / person isolation states
  const [processedImage, setProcessedImage] = useState<string>("");
  const [cutoutShape, setCutoutShape] = useState<"circle" | "transparent" | "original">("circle");
  const [autoRemoveBg, setAutoRemoveBg] = useState<boolean>(true);
  const [customBgColor, setCustomBgColor] = useState<{ r: number; g: number; b: number } | null>(null);
  const [bgTolerance, setBgTolerance] = useState<number>(18);
  const [bgFeather, setBgFeather] = useState<number>(8);
  const [isEyedropperActive, setIsEyedropperActive] = useState<boolean>(false);

  // States for user's face position and color settings
  const [faceConfig, setFaceConfig] = useState<UserFacePosition>({
    x: 50, // percent
    y: 45, // percent
    scale: 0.8,
    rotation: 0, // degrees
    contrast: 100,
    brightness: 100,
    saturation: 100,
    feather: 20, // mask feather strength
    filterType: era.defaultFilter || "sepia",
  });

  // Dragging states for canvas layers
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragTargetRef = useRef<"face" | string | null>(null);

  const handlePointerDown = (e: React.PointerEvent, targetId: "face" | string) => {
    if (isEyedropperActive) return;
    
    // Select the clicked layer
    setActiveLayer(targetId);

    // Only respond to left clicks or direct touch contacts
    if (e.pointerType === "mouse" && e.button !== 0) return;

    e.preventDefault();
    e.stopPropagation();
    
    dragTargetRef.current = targetId;
    setIsDragging(true);

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch (err) {
      console.warn("setPointerCapture failed:", err);
    }
  };

  const handlePointerMove = (e: React.PointerEvent, targetId: "face" | string) => {
    if (!isDragging || dragTargetRef.current !== targetId || !containerRef.current) return;
    if (isEyedropperActive) return;

    const rect = containerRef.current.getBoundingClientRect();
    
    // Calculate cursor position relative to workspace container
    const relativeX = e.clientX - rect.left;
    const relativeY = e.clientY - rect.top;

    // Convert into percentage coordinate values
    let pctX = (relativeX / rect.width) * 100;
    let pctY = (relativeY / rect.height) * 100;

    // Clamp coordinates from -50% to 150% to prevent losing elements far off-screen
    pctX = Math.round(Math.max(-50, Math.min(150, pctX)));
    pctY = Math.round(Math.max(-50, Math.min(150, pctY)));

    if (targetId === "face") {
      setFaceConfig((prev) => ({ ...prev, x: pctX, y: pctY }));
    } else {
      setPropsList((prev) =>
        prev.map((p) => (p.id === targetId ? { ...p, x: pctX, y: pctY } : p))
      );
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      dragTargetRef.current = null;
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (err) {}
    }
  };

  // Real-time canvas chroma keyer / background eraser
  useEffect(() => {
    if (!userImage) return;

    const img = new Image();
    if (userImage.startsWith("http")) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => {
      const offscreen = document.createElement("canvas");
      const ctx = offscreen.getContext("2d");
      if (!ctx) return;

      offscreen.width = img.width;
      offscreen.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imgData = ctx.getImageData(0, 0, offscreen.width, offscreen.height);
      const data = imgData.data;

      // Determine background color to key out
      let targetColor = { r: 255, g: 255, b: 255 };

      if (customBgColor) {
        targetColor = customBgColor;
      } else if (autoRemoveBg) {
        // Auto-detect background: sample a grid from the 4 corners
        let totalR = 0, totalG = 0, totalB = 0;
        let count = 0;
        const corners = [
          { x: 0, y: 0 },
          { x: offscreen.width - 1, y: 0 },
          { x: 0, y: offscreen.height - 1 },
          { x: offscreen.width - 1, y: offscreen.height - 1 }
        ];

        corners.forEach(p => {
          const startX = Math.max(0, p.x - 3);
          const startY = Math.max(0, p.y - 3);
          const endX = Math.min(offscreen.width - 1, p.x + 3);
          const endY = Math.min(offscreen.height - 1, p.y + 3);

          for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
              const idx = (y * offscreen.width + x) * 4;
              totalR += data[idx];
              totalG += data[idx + 1];
              totalB += data[idx + 2];
              count++;
            }
          }
        });

        if (count > 0) {
          targetColor = {
            r: Math.round(totalR / count),
            g: Math.round(totalG / count),
            b: Math.round(totalB / count)
          };
        }
      }

      // If cutout mode is transparent, do dynamic similarity alpha keying
      if (cutoutShape === "transparent") {
        const tol = bgTolerance * 2.5; // Visual mapping
        const fth = bgFeather * 2.5;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i+1];
          const b = data[i+2];

          // Euclidean color similarity distance
          const dist = Math.sqrt(
            Math.pow(r - targetColor.r, 2) +
            Math.pow(g - targetColor.g, 2) +
            Math.pow(b - targetColor.b, 2)
          );

          if (dist < tol) {
            data[i+3] = 0; // complete transparency
          } else if (dist < tol + fth) {
            // smooth alpha feather boundaries
            const fraction = (dist - tol) / fth;
            data[i+3] = Math.round(fraction * 255);
          }
        }
        ctx.putImageData(imgData, 0, 0);
      }

      setProcessedImage(offscreen.toDataURL("image/png"));
    };
    img.src = userImage;
  }, [userImage, cutoutShape, autoRemoveBg, customBgColor, bgTolerance, bgFeather]);

  const handleEyedropperClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const img = new Image();
    if (userImage.startsWith("http")) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => {
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = rect.width;
      tempCanvas.height = rect.height;
      const tempCtx = tempCanvas.getContext("2d");
      if (!tempCtx) return;
      tempCtx.drawImage(img, 0, 0, rect.width, rect.height);
      try {
        const pixel = tempCtx.getImageData(Math.max(0, Math.min(rect.width - 1, Math.floor(clickX))), Math.max(0, Math.min(rect.height - 1, Math.floor(clickY))), 1, 1).data;
        setCustomBgColor({ r: pixel[0], g: pixel[1], b: pixel[2] });
        setAutoRemoveBg(false);
        setIsEyedropperActive(false);
      } catch (err) {
        console.error("Eyedropper sample error:", err);
      }
    };
    img.src = userImage;
  };

  // Props dragging layers list
  const [propsList, setPropsList] = useState<DraggedProp[]>([]);
  const [activeLayer, setActiveLayer] = useState<"face" | string>("face"); // 'face' or prop ID
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showGuide, setShowGuide] = useState<boolean>(true);

  // When era changes, adjust default filter behavior to match the epoch flavor
  useEffect(() => {
    setFaceConfig((prev) => ({
      ...prev,
      filterType: era.defaultFilter,
    }));
  }, [era]);

  // Handle adding an emoji prop
  const addPropEmoji = (emojiChar: string, emojiName: string) => {
    const newId = `prop-${Date.now()}`;
    const newProp: DraggedProp = {
      id: newId,
      char: emojiChar,
      name: emojiName,
      x: 50,
      y: 30,
      scale: 1.0,
      rotation: 0,
    };
    setPropsList((prev) => [...prev, newProp]);
    setActiveLayer(newId);
  };

  const removeProp = (id: string) => {
    setPropsList((prev) => prev.filter((p) => p.id !== id));
    setActiveLayer("face");
  };

  // Get filter CSS depending on selected filters
  const getFilterStyle = (type: string, br: number, co: number, sa: number) => {
    const base = `brightness(${br}%) contrast(${co}%) saturate(${sa}%)`;
    switch (type) {
      case "sepia":
        return `${base} sepia(85%) hue-rotate(-12deg)`;
      case "sepia-grain":
        return `${base} sepia(95%) saturate(75%) contrast(110%)`;
      case "grayscale":
      case "mono-vintage":
        return `${base} grayscale(100%) contrast(115%)`;
      case "warm":
      case "golden-classic":
        return `${base} sepia(30%) saturate(130%) hue-rotate(8deg)`;
      case "cool-mist":
        return `${base} saturate(80%) hue-rotate(185deg) brightness(105%)`;
      case "cyber-cinematic":
        return `${base} hue-rotate(330deg) saturate(140%) contrast(120%)`;
      default:
        return base;
    }
  };

  // Handle merging layers onto canvas to export
  const buildFinalExport = async () => {
    setIsProcessing(true);
    const canvas = canvasRef.current;
    if (!canvas) {
      setIsProcessing(false);
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setIsProcessing(false);
      return;
    }

    try {
      // 1. Prepare images loads
      const [bgImg, faceImg] = await Promise.all([
        loadImage(era.backdropUrl),
        loadImage(processedImage || userImage),
      ]);

      // Set pristine 1000px square canvas resolution
      canvas.width = 1000;
      canvas.height = 1000;

      // Draw backdrop
      ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

      // Save standard context state
      ctx.save();

      // Set target coordinates based on face configuration percent
      const faceW = faceImg.width;
      const faceH = faceImg.height;
      const faceMin = Math.min(faceW, faceH);

      const targetX = (faceConfig.x / 100) * canvas.width;
      const targetY = (faceConfig.y / 100) * canvas.height;
      
      // Calculate dynamic scale relative to backdrop dimensions
      const targetSize = 280 * faceConfig.scale;

      ctx.translate(targetX, targetY);
      ctx.rotate((faceConfig.rotation * Math.PI) / 180);

      if (cutoutShape === "circle") {
        // Create high-precision clipping mask (circular/oval) for the face
        ctx.beginPath();
        ctx.arc(0, 0, targetSize / 2, 0, Math.PI * 2);
        ctx.clip();
      }

      // Configure filter for the face context
      const filterStr = getFilterStyle(
        faceConfig.filterType,
        faceConfig.brightness,
        faceConfig.contrast,
        faceConfig.saturation
      );
      
      // Setup canvas filters (browsers safely fall-back if un-supported)
      try {
        ctx.filter = filterStr;
      } catch (err) {
        console.warn("Canvas context filters un-supported in environment:", err);
      }

      // Draw face base using the selected cutout styling
      if (cutoutShape === "circle") {
        ctx.drawImage(
          faceImg,
          (faceW - faceMin) / 2,
          (faceH - faceMin) / 2,
          faceMin,
          faceMin,
          -targetSize / 2,
          -targetSize / 2,
          targetSize,
          targetSize
        );
      } else {
        // Preserves original native image aspect ratio to avoid squishing
        const aspectRatio = faceW / faceH;
        let drawW = targetSize;
        let drawH = targetSize / aspectRatio;
        ctx.drawImage(
          faceImg,
          -drawW / 2,
          -drawH / 2,
          drawW,
          drawH
        );
      }

      // Restore clean backdrop context
      ctx.restore();

      // Draw all props on top sorted
      propsList.forEach((prop) => {
        ctx.save();
        const propX = (prop.x / 100) * canvas.width;
        const propY = (prop.y / 100) * canvas.height;
        const propSize = 120 * prop.scale;

        ctx.translate(propX, propY);
        ctx.rotate((prop.rotation * Math.PI) / 180);

        // Render emoji beautifully using Canvas text rendering
        ctx.font = `${propSize}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(prop.char, 0, 0);
        ctx.restore();
      });

      // Export base64 url
      const dataUrl = canvas.toDataURL("image/png");
      onSaveResult(dataUrl);
    } catch (error) {
      console.error("Layer fusing failed:", error);
      alert("Encountered an issue compositing layers. Please retry.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper utility to load image promise
  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      if (src.startsWith("http")) {
        img.crossOrigin = "anonymous";
      }
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load source: ${src}`));
      img.src = src;
    });
  };

  // Handle active active layer adjustment sliders
  const handleScaleChange = (val: number) => {
    if (activeLayer === "face") {
      setFaceConfig((prev) => ({ ...prev, scale: val }));
    } else {
      setPropsList((prev) =>
        prev.map((p) => (p.id === activeLayer ? { ...p, scale: val } : p))
      );
    }
  };

  const handleRotationChange = (val: number) => {
    if (activeLayer === "face") {
      setFaceConfig((prev) => ({ ...prev, rotation: val }));
    } else {
      setPropsList((prev) =>
        prev.map((p) => (p.id === activeLayer ? { ...p, rotation: val } : p))
      );
    }
  };

  const handlePositionX = (val: number) => {
    if (activeLayer === "face") {
      setFaceConfig((prev) => ({ ...prev, x: val }));
    } else {
      setPropsList((prev) =>
        prev.map((p) => (p.id === activeLayer ? { ...p, x: val } : p))
      );
    }
  };

  const handlePositionY = (val: number) => {
    if (activeLayer === "face") {
      setFaceConfig((prev) => ({ ...prev, y: val }));
    } else {
      setPropsList((prev) =>
        prev.map((p) => (p.id === activeLayer ? { ...p, y: val } : p))
      );
    }
  };

  const activePropDetails = propsList.find((p) => p.id === activeLayer);

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-6" id="physical-swapper">
      {/* 1. Left Grid Col: Live Drafting Canvas Preview */}
      <div className="md:col-span-7 space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded uppercase">
            Digital Alchemist Sandbox
          </span>
          <button 
            id="toggle-guide-swapper"
            onClick={() => setShowGuide(!showGuide)}
            className="text-xs text-zinc-400 hover:text-amber-500 underline transition-colors cursor-pointer"
          >
            {showGuide ? "Hide sandbox guidance" : "Show sandbox guidance"}
          </button>
        </div>

        {showGuide && (
          <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg text-xs leading-relaxed text-zinc-400 space-y-1">
            <span className="font-sans font-bold text-zinc-200">How to use:</span>
            <ul className="list-disc pl-4 space-y-1">
              <li className="text-amber-400">✨ Drag any layer (your portrait or active accessory items) directly within the sandbox canvas below!</li>
              <li>Use the sliders on the right for fine-grained sub-pixel adjustments, rotation, and dimensions.</li>
              <li>Toggle filters matching the historical lightning (or use custom sepia/retro styles).</li>
              <li>Click <span className="text-amber-500 font-bold font-mono text-[10px] uppercase bg-amber-500/15 py-0.5 px-1 rounded">Forge Portrait</span> to compile the layers into a seamless export!</li>
            </ul>
          </div>
        )}

        {/* Compositing Frame Container */}
        <div 
          ref={containerRef}
          className="relative aspect-square w-full rounded-2xl bg-zinc-950 border border-zinc-850 overflow-hidden shadow-2xl select-none"
        >
          {/* Draggable indicator badge */}
          <div id="direct-dragging-helper-badge" className="absolute top-3 right-3 z-30 bg-black/75 backdrop-blur-md border border-zinc-800 py-1 px-2.5 rounded-full text-[9px] font-mono uppercase tracking-wider text-amber-400 pointer-events-none flex items-center gap-1.5 shadow-lg">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
            </span>
            Drag & Drop Ready
          </div>

          {/* Layer 1: Backdrop */}
          <img 
            src={era.backdropUrl} 
            alt={era.name} 
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            referrerPolicy="no-referrer"
          />

          {/* Layer 2: User's Face Overlay with feather and custom CSS filters */}
          <div 
            style={{
              position: "absolute",
              left: `${faceConfig.x}%`,
              top: `${faceConfig.y}%`,
              width: `${28 * faceConfig.scale}%`,
              height: `${28 * faceConfig.scale}%`,
              transform: `translate(-50%, -50%) rotate(${faceConfig.rotation}deg)`,
              borderRadius: cutoutShape === "circle" ? "50%" : "0%",
              overflow: "hidden",
              border: activeLayer === "face" ? "2px solid #f59e0b" : "1px dashed rgba(250,250,250,0.3)",
              boxShadow: activeLayer === "face" ? "0 0 12px rgba(245,158,11,0.5)" : "none",
              filter: getFilterStyle(
                faceConfig.filterType,
                faceConfig.brightness,
                faceConfig.contrast,
                faceConfig.saturation
              ),
              maskImage: cutoutShape === "circle"
                ? `radial-gradient(circle, rgba(0,0,0,1) ${100 - faceConfig.feather}%, rgba(0,0,0,0) 100%)`
                : "none",
              WebkitMaskImage: cutoutShape === "circle"
                ? `radial-gradient(circle, rgba(0,0,0,1) ${100 - faceConfig.feather}%, rgba(0,0,0,0) 100%)`
                : "none",
              cursor: isEyedropperActive ? "crosshair" : "move",
              zIndex: 10,
              touchAction: "none"
            }}
            onClick={(e) => {
              if (isEyedropperActive) {
                e.stopPropagation();
                handleEyedropperClick(e);
              } else {
                setActiveLayer("face");
              }
            }}
            onPointerDown={(e) => handlePointerDown(e, "face")}
            onPointerMove={(e) => handlePointerMove(e, "face")}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            {/* Aspect-cover crop */}
            <img 
              src={processedImage || userImage} 
              alt="Face" 
              className="w-full h-full object-cover pointer-events-none"
              style={{ objectPosition: "center center" }}
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Layer 3: Props Overlays */}
          {propsList.map((prop) => {
            const isPropActive = activeLayer === prop.id;
            return (
              <div
                id={`placed-prop-${prop.id}`}
                key={prop.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveLayer(prop.id);
                }}
                style={{
                  position: "absolute",
                  left: `${prop.x}%`,
                  top: `${prop.y}%`,
                  transform: `translate(-50%, -50%) rotate(${prop.rotation}deg)`,
                  fontSize: `${12 * prop.scale}vw`, // responsive scale
                  maxWidth: "15vw",
                  cursor: "move",
                  zIndex: 20,
                  border: isPropActive ? "2px solid #3b82f6" : "none",
                  padding: isPropActive ? "4px" : "0",
                  borderRadius: "8px",
                  backgroundColor: isPropActive ? "rgba(59,130,246,0.1)" : "transparent",
                  touchAction: "none"
                }}
                className="flex items-center justify-center font-sans hover:scale-105 transition-all select-none"
                onPointerDown={(e) => handlePointerDown(e, prop.id)}
                onPointerMove={(e) => handlePointerMove(e, prop.id)}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              >
                {prop.char}
              </div>
            );
          })}

          {/* Era Title Tag Overlay */}
          <div className="absolute bottom-4 left-4 py-1 px-3 bg-black/75 backdrop-blur-md rounded-lg border border-white/5 pointer-events-none">
            <span className="font-mono text-[9px] uppercase tracking-widest text-[#a1a1aa] block">
              Timeline Index
            </span>
            <span className="font-sans font-bold text-sm text-white block">
              {era.name} — {era.year}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Right Grid Col: Layer Dashboard & Fine-Tuning Deck */}
      <div className="md:col-span-5 space-y-5 flex flex-col justify-between">
        <div className="space-y-4">
          {/* Layer Selection Hub */}
          <div className="space-y-2">
            <label className="text-xs text-zinc-500 font-mono flex items-center gap-1.5 uppercase">
              <Layers className="w-3.5 h-3.5" /> Layer Sorting Node
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                id="select-face-layer"
                onClick={() => setActiveLayer("face")}
                className={`flex items-center gap-2 p-2 rounded-lg text-xs font-medium border text-left transition-all cursor-pointer ${
                  activeLayer === "face"
                    ? "bg-amber-500/10 border-amber-500 text-amber-400 font-bold"
                    : "bg-zinc-900 border-zinc-850 hover:border-zinc-805 text-zinc-400"
                }`}
              >
                <div className="h-5 w-5 rounded-full bg-amber-500/25 flex items-center justify-center text-[10px] text-amber-400">
                  👤
                </div>
                <div>
                  <span className="block font-bold">Chronology Self</span>
                  <span className="block text-[9px] font-normal text-zinc-500">Active Portrait</span>
                </div>
              </button>

              {propsList.map((p) => {
                const isActive = activeLayer === p.id;
                return (
                  <button
                    id={`select-prop-${p.id}`}
                    key={p.id}
                    onClick={() => setActiveLayer(p.id)}
                    className={`flex items-center justify-between p-2 rounded-lg text-xs font-medium border text-left transition-all cursor-pointer ${
                      isActive
                        ? "bg-blue-500/10 border-blue-500 text-blue-400 font-bold"
                        : "bg-zinc-900 border-zinc-850 hover:border-zinc-805 text-zinc-400"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 rounded-full bg-blue-500/25 flex items-center justify-center text-xs">
                        {p.char}
                      </div>
                      <div>
                        <span className="block truncate max-w-[80px] font-bold">{p.name}</span>
                        <span className="block text-[9px] font-normal text-zinc-500">Accessory</span>
                      </div>
                    </div>
                    <button
                      id={`delete-prop-btn-${p.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeProp(p.id);
                      }}
                      className="text-zinc-650 hover:text-red-400 p-0.5 rounded cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Spatial & Position Controllers */}
          <div className="p-4 bg-zinc-900/40 border border-zinc-850 rounded-xl space-y-4">
            <h4 className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-amber-500" />
              {activeLayer === "face" ? "Self Positioning Deck" : `Props Placement: ${activePropDetails?.name || ""}`}
            </h4>

            {/* Position X Slider */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Horizontal Offset (X)</span>
                <span className="font-mono text-zinc-500">
                  {activeLayer === "face" ? `${faceConfig.x}%` : `${activePropDetails?.x || 50}%`}
                </span>
              </div>
              <input 
                type="range"
                min="0"
                max="100"
                value={activeLayer === "face" ? faceConfig.x : activePropDetails?.x || 50}
                onChange={(e) => handlePositionX(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>

            {/* Position Y Slider */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Vertical Offset (Y)</span>
                <span className="font-mono text-zinc-500">
                  {activeLayer === "face" ? `${faceConfig.y}%` : `${activePropDetails?.y || 45}%`}
                </span>
              </div>
              <input 
                type="range"
                min="0"
                max="100"
                value={activeLayer === "face" ? faceConfig.y : activePropDetails?.y || 45}
                onChange={(e) => handlePositionY(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>

            {/* Scale Slider */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Dimension Scale</span>
                <span className="font-mono text-zinc-500">
                  {activeLayer === "face" 
                    ? `${Math.round(faceConfig.scale * 100)}%` 
                    : `${Math.round((activePropDetails?.scale || 1.0) * 100)}%`}
                </span>
              </div>
              <input 
                type="range"
                min="20"
                max="300"
                value={activeLayer === "face" ? faceConfig.scale * 100 : (activePropDetails?.scale || 1.0) * 100}
                onChange={(e) => handleScaleChange(Number(e.target.value) / 100)}
                className="w-full accent-amber-500"
              />
            </div>

            {/* Rotation Slider */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Rotation Axis</span>
                <span className="font-mono text-zinc-500">
                  {activeLayer === "face" ? `${faceConfig.rotation}°` : `${activePropDetails?.rotation || 0}°`}
                </span>
              </div>
              <input 
                type="range"
                min="-180"
                max="180"
                value={activeLayer === "face" ? faceConfig.rotation : activePropDetails?.rotation || 0}
                onChange={(e) => handleRotationChange(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>
          </div>

          {/* Color filter and edge feather settings for Face Layer */}
          {activeLayer === "face" && (
            <div className="space-y-4">
              {/* Portrait Framing & Background Removal Deck */}
              <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-4 animate-fade-in">
                <h4 className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                  <Scissors className="w-3.5 h-3.5 text-amber-500" />
                  Temporal Framing & Aura Keyer
                </h4>

                {/* Sub-toggle buttons for Cutout modes */}
                <div id="framing-mode-selector" className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-950 rounded-lg border border-zinc-850">
                  <button
                    id="cutout-shape-circle"
                    type="button"
                    onClick={() => setCutoutShape("circle")}
                    className={`py-2 px-1 text-[10px] font-sans font-bold rounded flex flex-col items-center gap-1 transition-all text-center cursor-pointer ${
                      cutoutShape === "circle"
                        ? "bg-amber-500/15 border border-amber-500/30 text-amber-400"
                        : "text-zinc-500 hover:text-zinc-300 border border-transparent"
                    }`}
                  >
                    <Circle className="w-3.5 h-3.5 animate-pulse" />
                    <span>Booth Oval</span>
                  </button>

                  <button
                    id="cutout-shape-transparent"
                    type="button"
                    onClick={() => setCutoutShape("transparent")}
                    className={`py-2 px-1 text-[10px] font-sans font-bold rounded flex flex-col items-center gap-1 transition-all text-center cursor-pointer ${
                      cutoutShape === "transparent"
                        ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-extrabold"
                        : "text-zinc-500 hover:text-zinc-300 border border-transparent"
                    }`}
                  >
                    <Scissors className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Isolate Person</span>
                  </button>

                  <button
                    id="cutout-shape-original"
                    type="button"
                    onClick={() => setCutoutShape("original")}
                    className={`py-2 px-1 text-[10px] font-sans font-bold rounded flex flex-col items-center gap-1 transition-all text-center cursor-pointer ${
                      cutoutShape === "original"
                        ? "bg-amber-500/15 border border-amber-500/30 text-amber-400"
                        : "text-zinc-500 hover:text-zinc-300 border border-transparent"
                    }`}
                  >
                    <Square className="w-3.5 h-3.5" />
                    <span>Original Box</span>
                  </button>
                </div>

                {/* Detail deck if "isolated person" background remover is active */}
                {cutoutShape === "transparent" && (
                  <div className="bg-zinc-950/80 border border-zinc-850/60 p-3 rounded-xl space-y-3 text-xs leading-relaxed">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-300">Background Keying:</span>
                      <div className="flex items-center gap-2">
                        <button
                          id="auto-bg-detect-toggle"
                          type="button"
                          onClick={() => {
                            setAutoRemoveBg(true);
                            setCustomBgColor(null);
                          }}
                          className={`px-2 py-0.5 text-[10px] font-sans font-bold rounded border cursor-pointer ${
                            autoRemoveBg
                              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                              : "bg-zinc-900 border-zinc-850 text-zinc-500"
                          }`}
                        >
                          Auto Detect
                        </button>
                        <button
                          id="manual-bg-detect-toggle"
                          type="button"
                          onClick={() => setAutoRemoveBg(false)}
                          className={`px-2 py-0.5 text-[10px] font-sans font-bold rounded border cursor-pointer ${
                            !autoRemoveBg
                              ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                              : "bg-zinc-900 border-zinc-855 text-zinc-400"
                          }`}
                        >
                          Chroma Key
                        </button>
                      </div>
                    </div>

                    <p className="text-[10px] text-zinc-400 leading-normal">
                      {autoRemoveBg 
                        ? "✨ Auto-detecting face snapshot corners to cleanly erase native background." 
                        : "🎯 Click Target Erase Pen below, then click anywhere on your photo inside the sandbox to erase that custom color!"}
                    </p>

                    {/* Color Swatch & Eyedropper */}
                    <div className="flex items-center justify-between gap-3 bg-zinc-900/60 p-2 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] uppercase font-mono text-zinc-500">Key:</span>
                        <div 
                          className="h-3.5 w-8 rounded border border-zinc-700 shadow-inner"
                          style={{ 
                            backgroundColor: customBgColor 
                              ? `rgb(${customBgColor.r}, ${customBgColor.g}, ${customBgColor.b})` 
                              : "rgb(20, 20, 20)" 
                          }}
                        />
                        {customBgColor ? (
                          <button
                            id="reset-chroma-custom-color"
                            type="button"
                            onClick={() => {
                              setCustomBgColor(null);
                              setAutoRemoveBg(true);
                            }}
                            className="text-[9px] text-red-400 hover:underline cursor-pointer"
                          >
                            Reset
                          </button>
                        ) : (
                          <span className="text-[9px] text-zinc-500">Auto Corners</span>
                        )}
                      </div>

                      <button
                        id="activate-eyedropper-tool"
                        type="button"
                        onClick={() => setIsEyedropperActive(!isEyedropperActive)}
                        className={`py-1 px-2 rounded border text-[9px] font-sans font-bold flex items-center gap-1 cursor-pointer transition-all ${
                          isEyedropperActive
                            ? "bg-blue-500/20 border-blue-500 text-blue-400 animate-pulse"
                            : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700"
                        }`}
                      >
                        <Pipette className="w-3 h-3" />
                        {isEyedropperActive ? "Crosshair Active..." : "Target Erase Pen"}
                      </button>
                    </div>

                    {/* Tolerance Level Slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[10px] text-zinc-400">
                        <span>Tolerance Cutoff Range</span>
                        <span className="font-mono text-zinc-500 font-bold">{bgTolerance}%</span>
                      </div>
                      <input
                        type="range"
                        min="2"
                        max="80"
                        value={bgTolerance}
                        onChange={(e) => setBgTolerance(Number(e.target.value))}
                        className="w-full h-1 accent-amber-500 bg-zinc-900 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Outline Feather Softness */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[10px] text-zinc-400">
                        <span>Outline Transition Smoothness</span>
                        <span className="font-mono text-zinc-500 font-bold">{bgFeather}px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="40"
                        value={bgFeather}
                        onChange={(e) => setBgFeather(Number(e.target.value))}
                        className="w-full h-1 accent-emerald-500 bg-zinc-900 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Lighting adjust deck */}
              <div className="p-4 bg-zinc-900/40 border border-zinc-850 rounded-xl space-y-4">
                <h4 className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                  <Palette className="w-3.5 h-3.5 text-amber-500" />
                  Light Blending & Feather Filters
                </h4>

                {/* Edge Feathering slider only for Circle cutoff mode */}
                {cutoutShape === "circle" && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <span>Edge Feathering</span>
                      <span className="font-mono text-zinc-500">{faceConfig.feather}px</span>
                    </div>
                    <input 
                      type="range"
                      min="0"
                      max="45"
                      value={faceConfig.feather}
                      onChange={(e) => setFaceConfig((prev) => ({ ...prev, feather: Number(e.target.value) }))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>
                )}

                {/* Lighting adjust sliders */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-zinc-500 mb-1">Contrast</label>
                    <input 
                      type="range" 
                      min="50" 
                      max="150" 
                      value={faceConfig.contrast} 
                      onChange={(e) => setFaceConfig(p => ({ ...p, contrast: Number(e.target.value) }))}
                      className="w-full accent-amber-500 h-1 bg-zinc-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-500 mb-1">Bright</label>
                    <input 
                      type="range" 
                      min="50" 
                      max="150" 
                      value={faceConfig.brightness} 
                      onChange={(e) => setFaceConfig(p => ({ ...p, brightness: Number(e.target.value) }))}
                      className="w-full accent-amber-500 h-1 bg-zinc-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-500 mb-1">Saturate</label>
                    <input 
                      type="range" 
                      min="50" 
                      max="150" 
                      value={faceConfig.saturation} 
                      onChange={(e) => setFaceConfig(p => ({ ...p, saturation: Number(e.target.value) }))}
                      className="w-full accent-amber-500 h-1 bg-zinc-800"
                    />
                  </div>
                </div>

                {/* Epoch Color Grading presets */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] text-zinc-500 uppercase tracking-widest font-mono">
                    Temporal Color Grader
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: "original", label: "Pure" },
                      { id: "sepia", label: "Sepia / Old" },
                      { id: "warm", label: "Golden" },
                      { id: "cool-mist", label: "Nordic Frost" },
                      { id: "grayscale", label: "Monochrome" },
                      { id: "cyber-cinematic", label: "Neon Flare" },
                    ].map((f) => (
                      <button
                        id={`color-grader-${f.id}`}
                        key={f.id}
                        onClick={() => setFaceConfig((prev) => ({ ...prev, filterType: f.id }))}
                        className={`px-2 py-1 text-[10px] font-sans font-medium rounded border transition-all cursor-pointer ${
                          faceConfig.filterType === f.id
                            ? "bg-amber-500/15 border-amber-500 text-amber-400"
                            : "bg-zinc-950 border-zinc-850 text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Traditional Props Box */}
          <div className="p-4 bg-zinc-900/40 border border-zinc-850 rounded-xl space-y-2.5">
            <h4 className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-zinc-500" />
              Equip Period Accoutrements
            </h4>
            <div className="flex flex-wrap gap-2">
              {era.suggestedProps.map((p) => (
                <button
                  id={`equip-prop-${p.name.replace(/\s+/g, "-").toLowerCase()}`}
                  key={p.name}
                  onClick={() => addPropEmoji(p.char, p.name)}
                  className="px-2.5 py-1.5 bg-zinc-950 hover:bg-zinc-850 border border-zinc-850 hover:border-zinc-700 text-xs font-sans text-zinc-300 rounded-lg flex items-center gap-1.5 transition-all text-left cursor-pointer"
                >
                  <span className="text-sm">{p.char}</span>
                  <span className="font-medium text-[10px]">{p.name}</span>
                </button>
              ))}
              
              {/* Other standard funny props */}
              {[
                { char: "🕶️", name: "Chrono Specs" },
                { char: "👑", name: "Crown" },
                { char: "🥸", name: "Classic Disguise" },
                { char: "🍷", name: "Vintage Chalice" },
              ].map((p) => (
                <button
                  id={`equip-general-prop-${p.name.replace(/\s+/g, "-").toLowerCase()}`}
                  key={p.name}
                  onClick={() => addPropEmoji(p.char, p.name)}
                  className="px-2 py-1.5 bg-zinc-900/30 hover:bg-zinc-850 border border-zinc-800 text-xs text-zinc-400 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <span className="text-xs">{p.char}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Compile layers and finalize */}
        <div className="pt-4 border-t border-zinc-900 mt-4">
          <button
            id="fuse-layers-btn"
            onClick={buildFinalExport}
            disabled={isProcessing}
            className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 font-sans font-bold text-sm tracking-wider uppercase text-zinc-950 rounded-xl cursor-pointer flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isProcessing ? (
              <>
                <div className="h-4 w-4 rounded-full border-2 border-zinc-900 border-t-transparent animate-spin mr-1" />
                Fusing Temporal Matrices...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Forge Photo Booth Portrait
              </>
            )}
          </button>
        </div>
      </div>

      {/* Hidden static resolution builder canvas rendering */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
