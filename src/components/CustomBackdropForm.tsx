import React, { useState, useRef } from "react";
import { Era, Prop } from "../types";
import { 
  Upload, Image as ImageIcon, Sparkles, Check, 
  X, HelpCircle, Calendar, Plus, Wand2, Trash2 
} from "lucide-react";

interface CustomBackdropFormProps {
  onAddCustomEra: (era: Era) => void;
  onCancel: () => void;
}

const COLOR_THEMES = [
  { id: "amber", label: "Amber gold", class: "bg-amber-500 border-amber-600 focus:ring-amber-500/30" },
  { id: "red", label: "Roman red", class: "bg-red-500 border-red-600 focus:ring-red-500/30" },
  { id: "blue", label: "Ocean blue", class: "bg-blue-500 border-blue-600 focus:ring-blue-500/30" },
  { id: "orange", label: "Frontier orange", class: "bg-orange-500 border-orange-600 focus:ring-orange-500/30" },
  { id: "rose", label: "Jazz rose", class: "bg-rose-500 border-rose-600 focus:ring-rose-500/30" },
  { id: "cyan", label: "Space cyan", class: "bg-cyan-500 border-cyan-600 focus:ring-cyan-500/30" },
  { id: "emerald", label: "Emerald forest", class: "bg-emerald-500 border-emerald-600 focus:ring-emerald-500/30" },
  { id: "violet", label: "Cyber violet", class: "bg-violet-500 border-violet-600 focus:ring-violet-500/30" },
];

const BACKDROP_TEMPLATES = [
  {
    name: "Cyberpunk Alleyway",
    year: "2099 AD",
    themeColor: "violet",
    scene: "a rain-slicked dark alleyway in Neo-Tokyo illuminated by towering purple and turquoise neon signs and hovering drones",
    role: "Hologram Hacker",
    backdropUrl: "https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?auto=format&fit=crop&q=80&w=800",
    fact: "Quantum computer networks in 2099 render classic passwords fully obsolete."
  },
  {
    name: "Victorian London Steam",
    year: "1888 AD",
    themeColor: "orange",
    scene: "a cobblestone street in foggy gas-lit London with brass steam carriages operating in the heavy amber twilight mist",
    role: "Clockwork Aristocrat",
    backdropUrl: "https://images.unsplash.com/photo-1510519138101-570d1dca3d66?auto=format&fit=crop&q=80&w=800",
    fact: "In Victorian London, fog was nicknamed 'pea-souper' due to its thick yellowish consistency."
  },
  {
    name: "Antarctic Research Outpost",
    year: "2026 AD",
    themeColor: "cyan",
    scene: "inside a hi-tech metallic polar dome looking out towards the shimmering green Aurora Australis over the white ice canyons",
    role: "Aurora Astrophysicist",
    backdropUrl: "https://images.unsplash.com/photo-1464802686167-b939a6910659?auto=format&fit=crop&q=80&w=800",
    fact: "The lowest natural temperature ever recorded on Earth was −128.6°F in Antarctica."
  },
  {
    name: "Lost Atlantis Temple",
    year: "9500 BC",
    themeColor: "emerald",
    scene: "a colossal underwater dome chamber of Atlantis supported by glowing teal mineral pillars with school of glowing fish floating past",
    role: "Trident Alchemist",
    backdropUrl: "https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?auto=format&fit=crop&q=80&w=800",
    fact: "Atlantis was first written about by the Greek philosopher Plato in 360 BC."
  }
];

export default function CustomBackdropForm({
  onAddCustomEra,
  onCancel,
}: CustomBackdropFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [name, setName] = useState("");
  const [year, setYear] = useState("");
  const [scene, setScene] = useState("");
  const [roleInput, setRoleInput] = useState("");
  const [themeColor, setThemeColor] = useState("emerald");
  const [backdropUrl, setBackdropUrl] = useState("");
  const [defaultFilter, setDefaultFilter] = useState("original");
  const [temporalFact, setTemporalFact] = useState("");
  
  const [dragging, setDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"stub" | "success" | "error">("stub");

  const convertFileToBase64 = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const b64 = e.target?.result as string;
      setBackdropUrl(b64);
      setUploadStatus("success");
    };
    reader.onerror = () => {
      setUploadStatus("error");
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      convertFileToBase64(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      convertFileToBase64(file);
    }
  };

  const selectTemplate = (t: typeof BACKDROP_TEMPLATES[0]) => {
    setName(t.name);
    setYear(t.year);
    setScene(t.scene);
    setRoleInput(t.role);
    setThemeColor(t.themeColor);
    setBackdropUrl(t.backdropUrl);
    setTemporalFact(t.fact);
    setUploadStatus("success");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      alert("Please provide a name/title for your custom spacetime portal.");
      return;
    }
    
    if (!backdropUrl) {
      alert("Please upload an image file or choose one of our elegant design templates to build your custom background scenery.");
      return;
    }

    const cleanedRoles = roleInput
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean);

    const rolesList = cleanedRoles.length > 0 ? cleanedRoles : ["Time Traveler"];
    const defRole = rolesList[0];

    const suggestedProps: Prop[] = [
      { char: "👑", name: "Royal Crown", type: "head" },
      { char: "🕶️", name: "Chrono Specs", type: "head" },
      { char: "🌿", name: "Laurel Wreath", type: "head" }
    ];

    const newEra: Era = {
      id: `custom-${Date.now()}`,
      name: name.trim(),
      year: year.trim() || "Present Day",
      themeColor,
      scene: scene.trim() || `standing inside a beautifully customized setting of ${name}`,
      roles: rolesList,
      defaultRole: defRole,
      backdropUrl,
      suggestedProps,
      defaultFilter,
      temporalFact: temporalFact.trim() || "Handcrafted portals enable full biological recalibration across customized coordinates."
    };

    onAddCustomEra(newEra);
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      id="custom-backdrop-form" 
      className="bg-[#121214] border border-emerald-500/10 rounded-2xl p-6 space-y-6 shadow-2xl relative"
    >
      <div className="absolute top-0 right-6 -translate-y-1/2 bg-emerald-500 text-zinc-950 font-mono font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full border border-[#0d0d0f] shadow-lg">
        Custom Portal Creator
      </div>

      <div className="border-b border-zinc-900 pb-4 flex items-center justify-between">
        <div>
          <h3 className="font-sans font-black text-lg text-zinc-100 flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-emerald-500" />
            Build Your Own Portal Backdrop
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Configure a personalized spacetime entrypoint. You can upload any visual file, style it, and model your double there!
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          id="close-creator-btn"
          className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-850 rounded-lg cursor-pointer transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Grid: Templates vs Files */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left column: Template shortcuts & File Zone */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Quick template pickers */}
          <div className="space-y-3">
            <label className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest block font-bold">
              ✨ Instant Scenic Templates
            </label>
            <div className="grid grid-cols-2 gap-2">
              {BACKDROP_TEMPLATES.map((t) => (
                <button
                  key={t.name}
                  id={`backdrop-template-${t.name.toLowerCase().replace(/\s+/g, "-")}`}
                  type="button"
                  onClick={() => selectTemplate(t)}
                  className="p-2 border border-zinc-850 bg-zinc-950/40 rounded-xl text-left cursor-pointer hover:border-emerald-500/40 transition-colors group space-y-1.5 overflow-hidden"
                >
                  <div className="aspect-[16/9] bg-zinc-900 rounded overflow-hidden relative">
                    <img src={t.backdropUrl} alt={t.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" referrerPolicy="no-referrer" />
                    <span className="absolute bottom-1 right-1 text-[8px] font-mono font-black py-0.5 px-1 rounded bg-black/75 text-zinc-400">
                      {t.year}
                    </span>
                  </div>
                  <div>
                    <span className="block font-bold text-[11px] text-zinc-200 truncate">{t.name}</span>
                    <span className="block text-[8px] font-medium text-zinc-500 truncate">{t.role}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Drag & Drop File Upload */}
          <div className="space-y-2.5">
            <label className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest block font-bold">
              📁 Or Upload Device File
            </label>

            <div
              id="file-drop-zone"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                dragging 
                  ? "border-emerald-500 bg-emerald-500/5 shadow-[0_0_12px_rgba(16,185,129,0.1)]" 
                  : backdropUrl 
                  ? "border-emerald-500/30 bg-zinc-950/40" 
                  : "border-zinc-850 hover:border-zinc-700 bg-zinc-950/20"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {backdropUrl ? (
                <div className="space-y-2.5">
                  <div className="aspect-[16/10] max-w-[200px] mx-auto rounded-lg overflow-hidden border border-zinc-800 shadow relative">
                    <img 
                      src={backdropUrl} 
                      alt="Uploaded preview" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      type="button"
                      id="reset-uploaded-file"
                      onClick={(e) => {
                        e.stopPropagation();
                        setBackdropUrl("");
                        setUploadStatus("stub");
                      }}
                      className="absolute top-1 right-1 p-1 bg-black/80 hover:bg-red-950 text-zinc-400 hover:text-red-400 rounded transition-colors"
                      title="Remove background file"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[10px] text-emerald-400 font-mono font-bold flex items-center justify-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Backdrop Crystalized
                  </p>
                </div>
              ) : (
                <div className="py-4 space-y-2 text-zinc-500">
                  <div className="inline-block p-2.5 rounded-full bg-zinc-900 border border-zinc-850">
                    <Upload className="w-5 h-5 text-zinc-400" />
                  </div>
                  <p className="text-xs text-zinc-300 font-medium">
                    Drag background image here or click to select
                  </p>
                  <p className="text-[10px] text-zinc-550 leading-relaxed">
                    Loads fully offline. Supported formats: JPG, PNG, WEBP (Square or Landscape)
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right column: Configurations Form */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Metadata Pair */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-mono uppercase tracking-widest block font-bold">
                Spacetime Crossing Name
              </label>
              <input
                type="text"
                value={name}
                id="custom-era-name"
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Cyberpunk City Space, Retro Mars Dunes"
                className="w-full text-xs p-3 rounded-lg bg-zinc-950 border border-zinc-850 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-mono uppercase tracking-widest block font-bold">
                Temporal Year / Era
              </label>
              <input
                type="text"
                value={year}
                id="custom-era-year"
                onChange={(e) => setYear(e.target.value)}
                placeholder="e.g. 2099 AD, 1969 AD, 4000 BC"
                className="w-full text-xs p-3 rounded-lg bg-zinc-950 border border-zinc-850 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
              />
            </div>
          </div>

          {/* Detailed Context Scene Description */}
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400 font-mono uppercase tracking-widest block font-bold">
              Backdrop Scene Prompt Description
            </label>
            <textarea
              value={scene}
              id="custom-era-scene"
              onChange={(e) => setScene(e.target.value)}
              placeholder="Explain the background specifically: e.g. a wide glass observation deck overlooking deep red planet valleys with stars and a yellow dome..."
              rows={2}
              className="w-full text-xs p-3 rounded-lg bg-zinc-950 border border-zinc-850 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
            />
            <p className="text-[10px] text-zinc-550 leading-snug">
              ℹ️ Crucial for AI generation. Describe lights, structures, and ambiance to guide the Gemini model context perfectly.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Roles Selection */}
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-mono uppercase tracking-widest block font-bold">
                Character Roles (Comma Separated)
              </label>
              <input
                type="text"
                value={roleInput}
                id="custom-era-roles"
                onChange={(e) => setRoleInput(e.target.value)}
                placeholder="e.g. Astro-Hacker, Rebel Commander, Pilot"
                className="w-full text-xs p-3 rounded-lg bg-zinc-950 border border-zinc-850 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
              />
              <span className="block text-[9px] text-zinc-550">
                The first item becomes your default historical persona on the canvas.
              </span>
            </div>

            {/* Default blending filter */}
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-mono uppercase tracking-widest block font-bold">
                Default Color filter
              </label>
              <select
                value={defaultFilter}
                id="custom-era-filter"
                onChange={(e) => setDefaultFilter(e.target.value)}
                className="w-full text-xs p-3 rounded-lg bg-zinc-950 border border-zinc-850 text-zinc-300 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
              >
                <option value="original">Original (Pure Colour)</option>
                <option value="sepia">Sepia / Classic Tan</option>
                <option value="warm">Golden Warm Hour</option>
                <option value="cool-mist">Nordic Cool Ice</option>
                <option value="grayscale">Monochrome Noir</option>
                <option value="cyber-cinematic">Vibrant Cyber Neon</option>
              </select>
            </div>
          </div>

          {/* Solid color theme selector */}
          <div className="space-y-2">
            <label className="text-xs text-zinc-400 font-mono uppercase tracking-widest block font-bold">
              Portal Theme Color Accent
            </label>
            <div className="flex flex-wrap gap-2">
              {COLOR_THEMES.map((theme) => {
                const isActive = themeColor === theme.id;
                return (
                  <button
                    key={theme.id}
                    id={`theme-accent-${theme.id}`}
                    type="button"
                    onClick={() => setThemeColor(theme.id)}
                    className={`h-7 px-2.5 rounded-lg border text-[10px] font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                      isActive 
                        ? "border-emerald-500 bg-zinc-900 text-emerald-400 font-bold" 
                        : "border-zinc-800 bg-[#161619]/40 hover:border-zinc-700 text-zinc-400"
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${theme.class.split(" ")[0]}`} />
                    {theme.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Temporal Intrigues (Fact box) */}
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400 font-mono uppercase tracking-widest block font-bold">
              Chronological Intrigue / Informational Fact
            </label>
            <input
              type="text"
              value={temporalFact}
              id="custom-era-fact"
              onChange={(e) => setTemporalFact(e.target.value)}
              placeholder="e.g. This sector is built entirely within outer gravity corridors."
              className="w-full text-xs p-3 rounded-lg bg-zinc-950 border border-zinc-850 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
            />
          </div>

        </div>

      </div>

      {/* Footer controls */}
      <div className="pt-4 border-t border-zinc-900 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          id="cancel-custom-era-btn"
          className="py-2.5 px-5 text-xs uppercase tracking-wider font-mono text-zinc-400 hover:text-zinc-200 rounded-xl hover:bg-zinc-900/50 cursor-pointer transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          id="submit-custom-era-btn"
          className="py-2.5 px-6 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-sans font-black text-xs uppercase tracking-widest rounded-xl cursor-pointer flex items-center gap-1.5 transition-transform active:scale-95 shadow-lg shadow-emerald-500/10"
        >
          <Sparkles className="w-4 h-4 text-zinc-950 shrink-0" /> Open Custom Spacetime Portal
        </button>
      </div>

    </form>
  );
}
