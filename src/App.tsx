import React, { useState, useEffect } from "react";
import { Era, SavedJourney } from "./types";
import CameraBooth from "./components/CameraBooth";
import TimelineSelector from "./components/TimelineSelector";
import PhysicalSwapper from "./components/PhysicalSwapper";
import AIPortraitEngine from "./components/AIPortraitEngine";
import SavedGallery from "./components/SavedGallery";
import CustomBackdropForm from "./components/CustomBackdropForm";
import { 
  Compass, HelpCircle, RefreshCw, LayoutTemplate, 
  Sparkles, History, Scroll, Clock, AlertTriangle, FileImage,
  ArrowLeft, ArrowRight
} from "lucide-react";

const FALLBACK_PRESETS: Era[] = [
  {
    id: "egypt",
    name: "Ancient Egypt",
    year: "1330 BC",
    themeColor: "amber",
    scene: "the golden chamber of a towering pharaoh tomb with towering hieroglyph columns and an ambient warm candlelight glow",
    roles: ["Pharaoh", "High Priestess of Isis", "Elite Royal Guardian"],
    defaultRole: "Pharaoh",
    backdropUrl: "https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&q=80&w=800",
    suggestedProps: [
      { char: "👑", name: "Royal Crown", type: "head" },
      { char: "💎", name: "Ankh Amulet", type: "chest" },
      { char: "🪶", name: "Sacred Feather", type: "accessory" }
    ],
    defaultFilter: "sepia",
    temporalFact: "The Pyramids of Giza were already ancient history by King Tutankhamun's reign!"
  },
  {
    id: "rome",
    name: "Roman Empire",
    year: "80 AD",
    themeColor: "red",
    scene: "the high balconies of the Colosseum in Rome during a major festival, under a brilliant radiant warm sun",
    roles: ["Centurion General", "Livia Augusta (Noble Vestal)", "Laurel Wreathed Emperor"],
    defaultRole: "Centurion General",
    backdropUrl: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&q=80&w=800",
    suggestedProps: [
      { char: "🌿", name: "Laurel Wreath", type: "head" },
      { char: "🛡️", name: "Gladiator Shield", type: "accessory" },
      { char: "⚔️", name: "Bronze Gladius", type: "accessory" }
    ],
    defaultFilter: "warm",
    temporalFact: "The Roman Colosseum's grand opening featured games that lasted for over 100 days straight."
  },
  {
    id: "viking",
    name: "Viking Voyage",
    year: "890 AD",
    themeColor: "blue",
    scene: "the wooden deck of a majestic Viking longship riding a heavy ocean mist, heading towards Scandinavian fjords",
    roles: ["Berserker Chieftain", "Valiant Shieldmaiden", "Nordic Seer Guide"],
    defaultRole: "Berserker Chieftain",
    backdropUrl: "https://images.unsplash.com/photo-1578426218704-5162fa900135?auto=format&fit=crop&q=80&w=800",
    suggestedProps: [
      { char: "🪖", name: "Iron Helmet", type: "head" },
      { char: "🛡️", name: "Nordic Roundshield", type: "accessory" },
      { char: "🔥", name: "Odin's Torch", type: "accessory" }
    ],
    defaultFilter: "cool-mist",
    temporalFact: "Viking longships were completely symmetrical, allowing them to reverse direction without turning around!"
  },
  {
    id: "medieval",
    name: "High Medieval",
    year: "1215 AD",
    themeColor: "slate",
    scene: "inside a magnificent Gothic royal court banqueting hall with gorgeous stained-glass windows",
    roles: ["Gilded Armor Knight", "Regal Monarch", "Mystical Hermit Alchemist"],
    defaultRole: "Gilded Armor Knight",
    backdropUrl: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&q=80&w=800",
    suggestedProps: [
      { char: "👑", name: "Monarch Guard", type: "head" },
      { char: "🛡️", name: "Lion Crest", type: "accessory" },
      { char: "🪄", name: "Magical Scepter", type: "accessory" }
    ],
    defaultFilter: "vintage",
    temporalFact: "Authentic medieval longbowmen developed highly reinforced arm bones due to drawing 150 lbs of tension repeatedly!"
  },
  {
    id: "renaissance",
    name: "Italics Renaissance",
    year: "1505 AD",
    themeColor: "amber",
    scene: "the airy candlelit studio of an Italian master artist filled with rich drapes, sculptres, and classical paintings",
    roles: ["Florentine Patron", "Eminent Artist Guild Scholar", "Mona Lisa-style Aristocrat"],
    defaultRole: "Florentine Patron",
    backdropUrl: "https://images.unsplash.com/photo-1580136579312-94651dfd596d?auto=format&fit=crop&q=80&w=800",
    suggestedProps: [
      { char: "🎨", name: "Artist Palette", type: "accessory" },
      { char: "🎓", name: "Renaissance Cap", type: "head" },
      { char: "📜", name: "Drafting Scroll", type: "accessory" }
    ],
    defaultFilter: "golden-classic",
    temporalFact: "Leonardo da Vinci wrote his journals in reverse mirror writing to keep his futuristic designs secret!"
  },
  {
    id: "cowboy",
    name: "Wild West Frontier",
    year: "1878 AD",
    themeColor: "orange",
    scene: "the sun-baked dusty main road of a Nevada frontier town, standing outside a wooden saloon entrance right as the orange sun begins to dip",
    roles: ["Desert Cowboy Marshall", "Frontier Pioneer Explorer", "Saloon Cardsharp Bandit"],
    defaultRole: "Desert Cowboy Marshall",
    backdropUrl: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&q=80&w=800",
    suggestedProps: [
      { char: "🤠", name: "Cowboy Hat", type: "head" },
      { char: "⭐", name: "Marshall Badge", type: "chest" },
      { char: "🎸", name: "Frontier Guitar", type: "accessory" }
    ],
    defaultFilter: "sepia-grain",
    temporalFact: "Cowboy hats were originally rarely worn by cattle drivers; most preferred simple bowler hats!"
  },
  {
    id: "jazz",
    name: "The Jazz Age",
    year: "1925 AD",
    themeColor: "rose",
    scene: "a bustling underground New York speakeasy bar filled with glowing warm lamps, vintage brass horns, and Art Deco mirror patterns",
    roles: ["Speakeasy Flapper Vocalist", "Dapper Jazz Saxophone Legend", "Art Deco Salon Socialite"],
    defaultRole: "Dapper Jazz Saxophone Legend",
    backdropUrl: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=800",
    suggestedProps: [
      { char: "🎷", name: "Brass Saxophone", type: "accessory" },
      { char: "🎩", name: "Dapper Fedora", type: "head" },
      { char: "💍", name: "Gatsby Pearls", type: "chest" }
    ],
    defaultFilter: "mono-vintage",
    temporalFact: "Radio transformed pop music in the 1920s, growing from almost no homes to over 12 million listeners by 1930."
  },
  {
    id: "space",
    name: "1950s Atomic Space",
    year: "1958 AD",
    themeColor: "cyan",
    scene: "a beautiful retro-futuristic atomic age space colony observatory, looking out towards a red neon planet",
    roles: ["Ray-Gun Rocket Pilot", "Atomic Astro-Navigator", "Glow-Visor Cadet Officer"],
    defaultRole: "Ray-Gun Rocket Pilot",
    backdropUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800",
    suggestedProps: [
      { char: "🛸", name: "Mini Cruiser", type: "accessory" },
      { char: "🕶️", name: "Sci-Fi Goggles", type: "head" },
      { char: "🪐", name: "Gravity Ring", type: "accessory" }
    ],
    defaultFilter: "cyber-cinematic",
    temporalFact: "The 195s 'Space Age' design philosophy was strongly influenced by the real-world satellite launch of Sputnik in 1957."
  }
];

export default function App() {
  const [presets, setPresets] = useState<Era[]>(FALLBACK_PRESETS);
  const [selectedEraId, setSelectedEraId] = useState<string>("egypt");
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<"graft" | "ai">("graft");
  const [fusedResult, setFusedResult] = useState<string | null>(null);
  const [historyList, setHistoryList] = useState<SavedJourney[]>([]);

  const [savingCaption, setSavingCaption] = useState<string>("");
  const [isLoadingPresets, setIsLoadingPresets] = useState<boolean>(true);
  const [isCreatingCustom, setIsCreatingCustom] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Load Presets and Archive History upon Mount
  useEffect(() => {
    const loadTemporalData = async () => {
      const customSaved = localStorage.getItem("chrono_custom_presets");
      let parsedCustom: Era[] = [];
      if (customSaved) {
        try {
          parsedCustom = JSON.parse(customSaved);
        } catch (err) {
          console.error("Custom presets loading corrupted:", err);
        }
      }

      try {
        const response = await fetch("/api/temporal/presets");
        if (response.ok) {
          const data = await response.json();
          if (data.presets && data.presets.length > 0) {
            setPresets([...data.presets, ...parsedCustom]);
          } else {
            setPresets([...FALLBACK_PRESETS, ...parsedCustom]);
          }
        } else {
          setPresets([...FALLBACK_PRESETS, ...parsedCustom]);
        }
      } catch (e) {
        console.warn("Rest presets unavailable, deploying fallbacks:", e);
        setPresets([...FALLBACK_PRESETS, ...parsedCustom]);
      } finally {
        setIsLoadingPresets(false);
      }
    };

    loadTemporalData();

    // Hydrate saved travel archive history
    const saved = localStorage.getItem("chrono_history");
    if (saved) {
      try {
        setHistoryList(JSON.parse(saved));
      } catch (err) {
        console.error("Archive corruption detected:", err);
      }
    }
  }, []);

  // Sync state mutations to local vaults
  const updateHistoryStorage = (updated: SavedJourney[]) => {
    setHistoryList(updated);
    localStorage.setItem("chrono_history", JSON.stringify(updated));
  };

  const handleSaveToGallery = () => {
    if (!fusedResult) return;
    
    const selectedEra = presets.find(e => e.id === selectedEraId) || presets[0];
    const newJourney: SavedJourney = {
      id: `journey-${Date.now()}`,
      eraId: selectedEra.id,
      eraName: selectedEra.name,
      year: selectedEra.year,
      timestamp: Date.now(),
      imageUrl: fusedResult,
      caption: savingCaption.trim() || `Temporal coordinate: traveling as a ${selectedEra.defaultRole} in Giza or arena`,
      generationType: activeTab === "ai" ? "ai-alchemy" : "hybrid-graft"
    };

    const nextHistory = [newJourney, ...historyList];
    updateHistoryStorage(nextHistory);

    // Clear active layout to enable fresh travel snaps
    setFusedResult(null);
    setSavingCaption("");
    alert(`Self-duplicate archived successfully! Check it out in the archives at the bottom of standard deck.`);
  };

  const handleDeleteJourney = (id: string) => {
    if (confirm("Are you sure you want to scrub this timeline snapshot from the history records?")) {
      const next = historyList.filter(j => j.id !== id);
      updateHistoryStorage(next);
    }
  };

  const handleAddCustomEra = (newEra: Era) => {
    const updatedPresets = [...presets, newEra];
    setPresets(updatedPresets);

    const customSaved = localStorage.getItem("chrono_custom_presets");
    let parsedCustom: Era[] = [];
    if (customSaved) {
      try {
        parsedCustom = JSON.parse(customSaved);
      } catch (err) {
        console.error("Custom presets loading corrupted:", err);
      }
    }
    const updatedCustom = [...parsedCustom, newEra];
    localStorage.setItem("chrono_custom_presets", JSON.stringify(updatedCustom));

    setSelectedEraId(newEra.id);
    setIsCreatingCustom(false);
    setFusedResult(null);
  };

  const handleDeleteCustomEra = (eraId: string) => {
    const updatedPresets = presets.filter(e => e.id !== eraId);
    setPresets(updatedPresets);

    const customSaved = localStorage.getItem("chrono_custom_presets");
    if (customSaved) {
      try {
        const parsedCustom: Era[] = JSON.parse(customSaved);
        const updatedCustom = parsedCustom.filter(e => e.id !== eraId);
        localStorage.setItem("chrono_custom_presets", JSON.stringify(updatedCustom));
      } catch (err) {
        console.error("Custom presets delete failed:", err);
      }
    }

    if (selectedEraId === eraId) {
      const remainingPresets = updatedPresets.length > 0 ? updatedPresets : FALLBACK_PRESETS;
      setSelectedEraId(remainingPresets[0].id);
    }
    setFusedResult(null);
  };

  const selectedEra = presets.find((e) => e.id === selectedEraId) || presets[0];

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100 flex flex-col font-sans selection:bg-amber-500/20 selection:text-amber-500">
      
      {/* 1. Header Frame - Steampunk/Digital Chrono Deck Aesthetics */}
      <header className="border-b border-amber-500/10 bg-zinc-950/60 backdrop-blur-md sticky top-0 z-30">
        <div id="deck-header" className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-700/30 rounded-xl text-amber-500">
              <Compass className="w-6 h-6 animate-spin" style={{ animationDuration: "25s" }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-sans font-black text-lg text-white tracking-widest uppercase">
                  Time-Travel Photo Booth
                </h1>
                <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-500 font-bold border border-amber-500/20">
                  CHRONOS v3.2
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5 font-sans leading-tight">
                Align biometric coordinates, designate temporal epochs, and recreate your historical doubles.
              </p>
            </div>
          </div>

          {/* Telemetry Status bar */}
          <div className="hidden lg:flex items-center gap-4 text-xs font-mono border border-zinc-850 px-4 py-2 rounded-xl bg-zinc-900/10">
            <div className="flex items-center gap-1.5 border-r border-zinc-850 pr-4">
              <Clock className="w-4 h-4 text-zinc-500" />
              <span className="text-zinc-400 uppercase text-[10px]">Portal State:</span>
              <span className="text-emerald-400 uppercase font-bold animate-pulse">Sync</span>
            </div>
            <div>
              <span className="text-zinc-500 uppercase text-[10px] block font-medium">Temporal Balance Index</span>
              <span className="text-zinc-300 font-bold block text-right">99.87% stability</span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Main Deck Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 space-y-8">
        
        {/* Minimalist Progress Indicator */}
        <div id="chrono-stepper-progress" className="max-w-xs sm:max-w-sm mx-auto bg-zinc-950/40 border border-zinc-900 px-5 py-2.5 rounded-full flex items-center justify-between shadow-xl">
          {[
            { num: 1, label: "Calibrate Portrait" },
            { num: 2, label: "Designate Epoch" },
            { num: 3, label: "Dimension Grafting" },
          ].map((step, idx, arr) => {
            const isActive = currentPage === step.num;
            const isCompleted = step.num < currentPage;
            const isSelectable = step.num === 1 || (step.num === 2 && userPhoto) || (step.num === 3 && userPhoto && selectedEra);
            
            return (
              <React.Fragment key={step.num}>
                {/* Circular Stepper Button */}
                <button
                  id={`stepper-btn-page-${step.num}`}
                  disabled={!isSelectable}
                  onClick={() => {
                    setCurrentPage(step.num);
                    setFusedResult(null);
                  }}
                  title={step.label}
                  className={`relative flex items-center justify-center h-8 w-8 rounded-full font-mono text-xs font-bold border transition-all ${
                    isActive 
                      ? "bg-amber-500 text-zinc-950 border-amber-500 shadow-md shadow-amber-500/20" 
                      : isCompleted
                        ? "bg-zinc-900 border-amber-500/40 text-amber-500 hover:border-amber-400 cursor-pointer"
                        : "bg-zinc-950/80 border-zinc-850 text-zinc-650 cursor-not-allowed"
                  } ${isSelectable && !isActive ? "cursor-pointer" : ""}`}
                >
                  {step.num}
                </button>

                {/* Connecting Line between bubbles */}
                {idx < arr.length - 1 && (
                  <div className="flex-1 mx-3 h-[2px] bg-zinc-850 rounded-full relative overflow-hidden">
                    <div 
                      className="absolute left-0 top-0 h-full bg-amber-500 transition-all duration-300"
                      style={{ width: isCompleted ? "100%" : "0%" }}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Dynamic Page Views */}
        <div className="space-y-6">
          
          {/* PAGE 1: CALIBRATE PORTRAIT SEED */}
          {currentPage === 1 && (
            <div id="page-calibrate-portrait" className="max-w-3xl mx-auto space-y-6">
              <div className="flex items-center gap-3 border-b border-zinc-900 pb-3">
                <div className="h-6 w-6 bg-amber-500/10 text-amber-500 flex items-center justify-center font-mono font-bold text-xs rounded border border-amber-500/20">
                  1
                </div>
                <div>
                  <h3 className="font-sans font-bold text-base uppercase tracking-wider text-zinc-200 block">
                    Calibrate Portrait Seed
                  </h3>
                  <p className="text-xs text-zinc-400 block mt-0.5">
                    Take a live camera snap or upload an existing image to serve as your biological duplicate template.
                  </p>
                </div>
              </div>

              <div className="bg-zinc-950/40 border border-zinc-850 p-6 rounded-2xl shadow-xl">
                <CameraBooth
                  onPhotoSelected={(base64) => {
                    setUserPhoto(base64);
                    setFusedResult(null);
                  }}
                  selectedPhoto={userPhoto}
                  onClearPhoto={() => {
                    setUserPhoto(null);
                    setFusedResult(null);
                  }}
                />
              </div>

              {userPhoto ? (
                <div className="p-5 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-amber-500 flex items-center gap-1.5 uppercase font-sans">
                      <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Biometric Seed Acquired!
                    </span>
                    <p className="text-[11px] text-zinc-400">
                      Your visual template is locked in. Select the "Choose Epoch Destiny" button to proceed.
                    </p>
                  </div>
                  <button
                    id="page-1-proceed-to-2"
                    onClick={() => setCurrentPage(2)}
                    className="py-3 px-5 w-full sm:w-auto bg-amber-500 hover:bg-amber-600 font-sans font-bold text-xs uppercase tracking-wider text-zinc-950 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/15"
                  >
                    Choose Epoch Destiny <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-zinc-900/30 border border-zinc-850 rounded-2xl text-center text-xs text-zinc-500 font-sans">
                  💡 Take a high quality front-facing snapshot with balanced lighting for pristine temporal fusion overlays.
                </div>
              )}
            </div>
          )}

          {/* PAGE 2: DESIGNATE EPOCH TARGET */}
          {currentPage === 2 && (
            <div id="page-designate-epoch" className="space-y-6">
              <div className="flex items-center gap-3 border-b border-zinc-900 pb-3">
                <div className="h-6 w-6 bg-amber-500/10 text-amber-500 flex items-center justify-center font-mono font-bold text-xs rounded border border-amber-500/20">
                  2
                </div>
                <div>
                  <h3 className="font-sans font-bold text-base uppercase tracking-wider text-zinc-200 block">
                    Designate Epoch Target
                  </h3>
                  <p className="text-xs text-zinc-400 block mt-0.5">
                    Set your coordinates for the temporal teleport. Select a pre-calibrated era or inject high quality custom backdrops.
                  </p>
                </div>
              </div>

              {isLoadingPresets ? (
                <div className="py-24 flex flex-col items-center justify-center text-center space-y-4 bg-zinc-950/30 border border-zinc-850 rounded-2xl">
                  <div className="h-8 w-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
                  <p className="font-mono text-xs text-zinc-400 uppercase tracking-widest">
                    Calibrating portal presets...
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <TimelineSelector
                    presets={presets}
                    selectedEraId={selectedEraId}
                    onSelectEra={(id) => {
                      setSelectedEraId(id);
                      setFusedResult(null);
                    }}
                    onCreateCustomClick={() => {
                      setIsCreatingCustom(prev => !prev);
                    }}
                    onDeleteCustomEra={handleDeleteCustomEra}
                  />

                  {isCreatingCustom && (
                    <CustomBackdropForm
                      onAddCustomEra={handleAddCustomEra}
                      onCancel={() => setIsCreatingCustom(false)}
                    />
                  )}

                  {/* Accessible back / next action path */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 pb-2 border-t border-zinc-900">
                    <button
                      id="page-2-back-to-1"
                      onClick={() => setCurrentPage(1)}
                      className="w-full sm:w-auto py-3 px-5 font-mono text-xs uppercase tracking-wider bg-zinc-900 border border-zinc-805 hover:bg-zinc-800 text-zinc-450 hover:text-zinc-300 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <ArrowLeft className="w-4 h-4" /> Return to Page 1 (Biometrics)
                    </button>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                      <div className="text-center sm:text-right hidden md:block">
                        <span className="block text-[9px] text-zinc-500 font-bold uppercase font-mono tracking-wider">Active Coordinate</span>
                        <span className="block text-xs font-bold text-amber-500">{selectedEra.name} ({selectedEra.year})</span>
                      </div>

                      <button
                        id="page-2-proceed-to-3"
                        onClick={() => {
                          if (!userPhoto) {
                            alert("Please calibrate your portrait photo first on Page 1!");
                            setCurrentPage(1);
                          } else {
                            setCurrentPage(3);
                          }
                        }}
                        className="w-full sm:w-auto py-3.5 px-6 bg-amber-500 hover:bg-amber-600 font-sans font-bold text-xs uppercase tracking-wider text-zinc-950 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/15"
                      >
                        Proceed to editing deck <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PAGE 3: DIMENSION GRAFTING DECK */}
          {currentPage === 3 && (
            <div id="page-grafting-editing" className="space-y-6">
              {!userPhoto ? (
                <div className="py-16 px-4 text-center bg-zinc-950 border border-zinc-850 rounded-2xl max-w-xl mx-auto space-y-4 shadow-2xl">
                  <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto animate-bounce" />
                  <h3 className="font-sans font-bold text-lg text-white">Portrait Seed Missing</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    We require your portrait snapshot to align physical layers in the dimensions grafting deck. Please return to Page 1 first.
                  </p>
                  <button
                    onClick={() => setCurrentPage(1)}
                    className="py-2.5 px-5 bg-amber-500 hover:bg-amber-600 text-zinc-950 hover:bg-amber-500/10 font-sans font-bold text-xs uppercase rounded-xl cursor-pointer"
                  >
                    Go to Portrait Capture
                  </button>
                </div>
              ) : (
                <section id="temporal-shifting-terminal" className="bg-[#121214] border border-amber-500/10 rounded-2xl p-6 space-y-6 shadow-xl relative">
                  <div className="absolute top-0 right-10 -translate-y-1/2 bg-amber-500 text-zinc-950 font-mono font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full border border-amber-500/20 shadow-lg">
                    Temporal Fuse Core Active
                  </div>

                  <div className="border-b border-zinc-900 pb-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="font-sans font-black text-xl text-zinc-100 flex items-center gap-2 uppercase tracking-wide">
                        <Scroll className="w-5 h-5 text-amber-500" />
                        Dimensional Grafting Deck
                      </h2>
                      <p className="text-xs text-zinc-500 mt-1 flex flex-wrap items-center gap-2">
                        <span>Merge your portrait with</span>
                        <span className="text-amber-400 font-bold bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/15 italic">
                          {selectedEra.name} ({selectedEra.year})
                        </span>
                      </p>
                    </div>

                    <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-900">
                      <button
                        id="tab-graft-manual"
                        onClick={() => {
                          setActiveTab("graft");
                          setFusedResult(null);
                        }}
                        className={`px-4 py-2 font-sans font-bold text-xs uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                          activeTab === "graft"
                            ? "bg-amber-500 text-zinc-950"
                            : "text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        <LayoutTemplate className="w-3.5 h-3.5" /> Instant Swapper (Canvas)
                      </button>
                      <button
                        id="tab-alchemy-ai"
                        onClick={() => {
                          setActiveTab("ai");
                          setFusedResult(null);
                        }}
                        className={`px-4 py-2 font-sans font-bold text-xs uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                          activeTab === "ai"
                            ? "bg-amber-500 text-zinc-950"
                            : "text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5 animate-pulse" /> AI Portal (Generative)
                      </button>
                    </div>
                  </div>

                  {fusedResult ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center p-6 bg-zinc-950 rounded-2xl border border-amber-500/10">
                      <div className="aspect-square bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl relative flex items-center justify-center">
                        <img 
                          src={fusedResult} 
                          alt="Forged Chrono duplicate" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 border-2 border-amber-500/20 rounded-xl pointer-events-none" />
                      </div>

                      <div className="space-y-5">
                        <div className="space-y-1">
                          <span className="font-mono text-[9px] text-[#22c55e] bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded uppercase font-bold">
                            Reconstruction Crystallized
                          </span>
                          <h3 className="font-sans font-bold text-lg text-zinc-100">
                            Print Captured: {selectedEra.name} double
                          </h3>
                          <p className="text-xs text-zinc-500 leading-relaxed">
                            Your historical duplicate with optimized lighting blends is now fully compiled. Enter a brief caption to permanently document this travel step!
                          </p>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest block font-bold">
                            Log Book Entry (Caption/Memo)
                          </label>
                          <input
                            id="save-landscape-title"
                            type="text"
                            value={savingCaption}
                            onChange={(e) => setSavingCaption(e.target.value)}
                            placeholder={`e.g. My travel selfie to Ancient Egypt as a ${selectedEra.defaultRole}`}
                            className="w-full text-xs p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 placeholder-zinc-550 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30"
                          />
                        </div>

                        <div className="pt-2 flex flex-col sm:flex-row gap-3">
                          <button
                            id="commit-to-chrono-archives"
                            onClick={handleSaveToGallery}
                            className="flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-600 font-sans font-bold text-xs uppercase tracking-wider text-zinc-950 rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/10"
                          >
                            <History className="w-4 h-4 shrink-0" /> Commit to Chrono-Archives
                          </button>
                          <button
                            id="reforge-another-btn"
                            onClick={() => setFusedResult(null)}
                            className="py-3 px-4 font-mono text-xs uppercase tracking-wider bg-zinc-900 border border-zinc-800 hover:bg-zinc-805 text-zinc-400 hover:text-zinc-300 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <RefreshCw className="w-4 h-4" /> Shift Axis (Reforge)
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {activeTab === "graft" ? (
                        <PhysicalSwapper
                          era={selectedEra}
                          userImage={userPhoto}
                          onSaveResult={(res) => setFusedResult(res)}
                        />
                      ) : (
                        <AIPortraitEngine
                          era={selectedEra}
                          userImage={userPhoto}
                          onSaveResult={(res) => setFusedResult(res)}
                          onSwitchToManual={() => {
                            setActiveTab("graft");
                            setFusedResult(null);
                          }}
                        />
                      )}
                    </div>
                  )}

                  {/* Return paths */}
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-zinc-900">
                    <button
                      id="page-3-back-to-2"
                      onClick={() => {
                        setFusedResult(null);
                        setCurrentPage(2);
                      }}
                      className="py-2.5 px-4 font-mono text-xs uppercase tracking-wider bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <ArrowLeft className="w-4 h-4" /> Return to Step 2 (Select Epoch)
                    </button>
                    <span className="text-[10px] text-zinc-550 uppercase font-mono tracking-wider">
                      Biometrics fully loaded and linked client-side
                    </span>
                  </div>
                </section>
              )}
            </div>
          )}

        </div>

        {/* 3. Saved historical print gallery list (Stored in LocalStorage) */}
        <section className="bg-zinc-950/20 border border-zinc-900 rounded-2xl p-6" id="temporal-gallery-panel">
          <SavedGallery
            historyList={historyList}
            onDeleteJourney={handleDeleteJourney}
          />
        </section>

      </main>

      {/* 4. Footer Deck */}
      <footer className="border-t border-zinc-900 bg-zinc-950/40 py-6 mt-12 text-center text-xs text-zinc-600 font-mono tracking-wider">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-[10px] uppercase font-bold">
            Portal Engine Balance: 🟢 STABLE COHERENCY
          </span>
          <span className="text-[10px]">
            © 2026 spacetime flight logistics. All biological profiles handled securely client-side.
          </span>
        </div>
      </footer>

    </div>
  );
}
