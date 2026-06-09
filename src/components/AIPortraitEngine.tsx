import React, { useState, useEffect } from "react";
import { Era } from "../types";
import { Sparkles, ArrowRight, CornerDownRight, AlertCircle, RefreshCw, Eye } from "lucide-react";

interface AIPortraitEngineProps {
  era: Era;
  userImage: string;
  onSaveResult: (finalImageUrl: string) => void;
  onSwitchToManual: () => void;
}

export default function AIPortraitEngine({
  era,
  userImage,
  onSaveResult,
  onSwitchToManual,
}: AIPortraitEngineProps) {
  // Styles of AI Portraits
  const STYLES = [
    { id: "painting", label: "Masterful Oil Painting", desc: "Rich velvet oil brushstrokes and historical craquelure texture" },
    { id: "photo", label: "Daguerreotype Vintage Photo", desc: "Sepia tone, silver plate reflection, authentic 19th-century feel" },
    { id: "film", label: "Vintage Autochrome Film", desc: "Rich warm lighting, grainy 1910s chemical color plate texture" },
    { id: "charcoal", label: "Classical Charcoal Sketch", desc: "Finely shaded black & white chalk with high-contrast rough paper" },
    { id: "comic", label: "Retro Space Ink Comic", desc: "Atomic age bold outlines, half-tone dots, and vibrant pop colors" },
  ];

  const [selectedStyle, setSelectedStyle] = useState<string>("painting");
  const [genderHint, setGenderHint] = useState<string>("neutral");
  const [customPrompt, setCustomPrompt] = useState<string>("");

  const tickerRef = React.useRef<any>(null);

  useEffect(() => {
    return () => {
      if (tickerRef.current) {
        clearInterval(tickerRef.current);
      }
    };
  }, []);

  const [step, setStep] = useState<"setup" | "analyzing" | "generating" | "failed">("setup");
  const [loadingText, setLoadingText] = useState<string>("");
  const [faceDescription, setFaceDescription] = useState<string>("");
  const [errorDetails, setErrorDetails] = useState<{ msg: string; code?: string } | null>(null);

  // Sequences of loading messages for immersive temporal feedback
  const ANALYZING_TICKERS = [
    "Opening temporal biometrics pipeline...",
    "Scanning face structure and skeletal symmetry...",
    "Extracting hairstyle, eye profile, and age coordinates...",
    "Locking biometric markers into local memory...",
    "Deconstructing features into description matrices..."
  ];

  const GENERATING_TICKERS = [
    "Securing quantum timeline synchronization...",
    "Fabricating period-accurate fabrics and costume designs...",
    "Blending face structural description with temporal scene...",
    "Igniting Gemini image reconstruction cores...",
    "Resolving optical focus, lighting shadows, and vintage color grading...",
    "Coring high-res PNG image pixels..."
  ];

  const triggerTicker = (tickers: string[], callback: () => void) => {
    if (tickerRef.current) {
      clearInterval(tickerRef.current);
    }
    let index = 0;
    setLoadingText(tickers[0]);
    const interval = setInterval(() => {
      index += 1;
      if (index < tickers.length) {
        setLoadingText(tickers[index]);
      } else {
        clearInterval(interval);
        tickerRef.current = null;
        callback();
      }
    }, 1800);
    tickerRef.current = interval;
    return interval;
  };

  const startReconstruction = async () => {
    setErrorDetails(null);
    setStep("analyzing");
    
    let tickerInterval = triggerTicker(ANALYZING_TICKERS, async () => {
      try {
        // Step 1: Call analyze endpoint to get descriptions
        const analyzeRes = await fetch("/api/temporal/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageParts: userImage })
        });
        
        if (!analyzeRes.ok) {
          throw new Error("Temporary failure analyzing portrait data.");
        }

        const analyzeData = await analyzeRes.json();
        const detectedDesc = analyzeData.description || "An expressive traveler with focused eyes and a pleasant look.";
        setFaceDescription(detectedDesc);

        // Transition immediately into generative mode
        setStep("generating");
        
        // Setup generation ticker
        let generateTicker = triggerTicker(GENERATING_TICKERS, async () => {
          try {
            // Include optional gender modifiers or other customized prompts
            let finalDesc = detectedDesc;
            if (genderHint === "feminine") {
              finalDesc += " Rendered with soft feminine elegance and features.";
            } else if (genderHint === "masculine") {
              finalDesc += " Rendered with strong masculine features and presentation.";
            }
            if (customPrompt.trim()) {
              finalDesc += ` Additional details: ${customPrompt.trim()}.`;
            }

            const chosenStyleObj = STYLES.find(s => s.id === selectedStyle) || STYLES[0];

            // Call image generation endpoint
            const generateRes = await fetch("/api/temporal/generate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                portraitPrompt: finalDesc,
                eraId: era.id,
                customEra: era.id.startsWith("custom-") ? era : undefined,
                styleType: chosenStyleObj.label
              })
            });

            const generateData = await generateRes.json();

            if (!generateRes.ok) {
              if (generateData.code === "NO_SECRET_KEY") {
                setErrorDetails({
                  msg: "AI Generator core is currently offline. GEMINI_API_KEY environment variable is not defined or configured.",
                  code: "NO_SECRET_KEY"
                });
                setStep("failed");
              } else {
                throw new Error(generateData.error || "Generation timed out or was discarded by API rules.");
              }
              return;
            }

            if (generateData.success && generateData.imageUrl) {
              // Lock results
              onSaveResult(generateData.imageUrl);
              setStep("setup"); // reset standby
            } else {
              throw new Error("No image data parsed back from engine.");
            }

          } catch (genErr: any) {
            console.error("AI Generation error:", genErr);
            setErrorDetails({ msg: genErr.message || "An issue occurred fabricating the temporal body." });
            setStep("failed");
          }
        });

      } catch (analErr: any) {
        console.error("Analysis failure:", analErr);
        setErrorDetails({ msg: analErr.message || "Spacetime pipeline failure during biometric mapping." });
        setStep("failed");
      }
    });
  };

  return (
    <div className="bg-[#16161a] border border-amber-500/10 rounded-2xl p-6 shadow-xl" id="ai-portrait-engine">
      
      {step === "setup" && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="font-sans font-bold text-base text-zinc-100">
              AI Portrait Synthesizer
            </h3>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Unleash our advanced Gemini generative portal. It will meticulously analyze your face 
            and synthesize a complete, highly-detailed portrait of yourself as an authentic inhabitant of the <span className="text-amber-500 font-bold">{era.name} ({era.year})</span>.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Style selector */}
            <div className="space-y-3">
              <label className="text-xs text-zinc-400 font-mono uppercase tracking-widest block">
                Artistic Painting & Render Style
              </label>
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                {STYLES.map((s) => (
                  <button
                    id={`ai-style-${s.id}`}
                    key={s.id}
                    onClick={() => setSelectedStyle(s.id)}
                    className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all cursor-pointer block ${
                      selectedStyle === s.id
                        ? "bg-amber-500/10 border-amber-500 text-amber-400"
                        : "bg-zinc-900/50 border-zinc-850 hover:border-zinc-805 text-zinc-400"
                    }`}
                  >
                    <span className="block font-bold">{s.label}</span>
                    <span className="block text-[10px] text-zinc-500 font-sans mt-0.5 leading-tight">{s.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom parameters */}
            <div className="space-y-4">
              {/* Gender hints */}
              <div className="space-y-2">
                <label className="text-xs text-zinc-400 font-mono uppercase tracking-widest block">
                  AI Cohesion Guidance
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "neutral", label: "Natural Blend" },
                    { id: "masculine", label: "Masculine" },
                    { id: "feminine", label: "Feminine" }
                  ].map((g) => (
                    <button
                      id={`ai-gender-guidance-${g.id}`}
                      key={g.id}
                      onClick={() => setGenderHint(g.id)}
                      className={`px-2 py-2 text-[10px] font-sans font-medium rounded-lg border transition-all text-center cursor-pointer ${
                        genderHint === g.id
                          ? "bg-amber-500/15 border-amber-500 text-amber-400 font-bold"
                          : "bg-zinc-900/50 border-zinc-850 text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom prompt details */}
              <div className="space-y-2">
                <label className="text-xs text-zinc-400 font-mono uppercase tracking-widest block">
                  Custom Portrait Modifiers (Optional)
                </label>
                <textarea
                  id="ai-custom-modifiers"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="e.g. adding silver matching glasses, wearing a subtle warrior mustache, having bright silver hair..."
                  rows={2}
                  className="w-full text-xs p-2.5 rounded-lg bg-zinc-950 border border-zinc-850 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500 filter"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-900/80 flex flex-col sm:flex-row gap-3">
            <button
              id="start-ai-generation"
              onClick={startReconstruction}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 font-sans font-bold text-sm tracking-wider uppercase text-zinc-950 rounded-xl cursor-pointer flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-amber-500/10"
            >
              <Sparkles className="w-5 h-5 text-zinc-950 shrink-0" />
              Initiate AI Time Shift
            </button>
            <button
              id="fallback-to-manual"
              onClick={onSwitchToManual}
              className="py-3 px-4 font-mono text-xs uppercase tracking-wider bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-300 border border-zinc-800 rounded-xl transition-all cursor-pointer"
            >
              Use Digital Face-Graft Swapper (Instant)
            </button>
          </div>
        </div>
      )}

      {/* Loading & Tickers State */}
      {(step === "analyzing" || step === "generating") && (
        <div className="py-12 px-4 flex flex-col items-center justify-center text-center space-y-6">
          {/* Timeline warp ring animation */}
          <div className="relative w-24 h-24 flex items-center justify-center">
            {/* Spinning space warp rings */}
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-amber-500/20 animate-spin" style={{ animationDuration: "12s" }} />
            <div className="absolute inset-1.5 rounded-full border border-double border-amber-500/40 animate-spin" style={{ animationDuration: "6s", animationDirection: "reverse" }} />
            <div className="absolute inset-4 rounded-full border border-dashed border-amber-500/75 animate-ping" style={{ animationDuration: "2s" }} />
            
            <Sparkles className="w-8 h-8 text-amber-500 animate-pulse" />
          </div>

          <div className="space-y-2 max-w-sm">
            <h4 className="font-mono text-xs uppercase tracking-widest text-amber-500 font-bold">
              {step === "analyzing" ? "Biometric Chrono-Scanning" : "Reconstructing Portrait"}
            </h4>
            
            {/* loading ticker message */}
            <p className="text-sm font-sans text-zinc-100 font-medium h-5 animate-pulse transition-all duration-300">
              {loadingText}
            </p>
            <p className="text-[11px] text-zinc-500 leading-normal pt-2">
              Please wait while the quantum portal resolves. Generative algorithms may take 10-15 seconds to calibrate.
            </p>
          </div>

          {step === "generating" && faceDescription && (
            <div className="p-4 bg-zinc-900/60 border border-zinc-850 rounded-xl text-left max-w-lg">
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#a1a1aa] flex items-center gap-1.5 mb-1">
                <Eye className="w-3.5 h-3.5 text-amber-500" /> Resolved Portrait Signature
              </span>
              <p className="text-xs text-zinc-400 italic">
                "{faceDescription}"
              </p>
            </div>
          )}
        </div>
      )}

      {/* Failed / Error State */}
      {step === "failed" && (
        <div className="p-6 bg-red-950/20 border border-red-900/30 rounded-2xl space-y-5">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg text-red-400 shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-sans font-bold text-red-200">
                Temporal Synthesizer Interruption
              </h4>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                {errorDetails?.msg || "An unexpected error occurred while communicating with the Gemini image cores."}
              </p>
            </div>
          </div>

          {errorDetails?.code === "NO_SECRET_KEY" ? (
            <div className="bg-zinc-900/80 border border-zinc-850 p-4 rounded-xl space-y-3">
              <span className="font-mono text-[9px] text-amber-500 uppercase tracking-widest block font-bold">
                Alchemist Guidance Node
              </span>
              <p className="text-[11px] text-zinc-400 leading-normal">
                To experience true AI-Generative Portrait synthesis, make sure to add your **GEMINI_API_KEY** in the **Settings &gt; Secrets** panel.
              </p>
              <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-mono">
                <CornerDownRight className="w-3.5 h-3.5 shrink-0" /> No worry! You can immediately use our high-fidelity, instant face swapper canvas which is 100% operational offline!
              </div>
            </div>
          ) : null}

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              id="switch-to-face-swapper-btn"
              onClick={onSwitchToManual}
              className="flex-1 py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold font-sans text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-colors"
            >
              Take me to the Digital Swapper
            </button>
            <button
              id="retry-ai-generation"
              onClick={() => setStep("setup")}
              className="py-2.5 px-4 font-mono text-xs uppercase bg-zinc-900 hover:bg-zinc-850 text-zinc-300 border border-zinc-800 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-4 h-4" /> Recalibrate AI Parameters
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
