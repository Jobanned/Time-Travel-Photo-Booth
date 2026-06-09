import React from "react";
import { Era } from "../types";
import { Sparkles, Calendar, HelpCircle, Trash2, Plus } from "lucide-react";

interface TimelineSelectorProps {
  presets: Era[];
  selectedEraId: string;
  onSelectEra: (id: string) => void;
  onCreateCustomClick?: () => void;
  onDeleteCustomEra?: (id: string) => void;
}

export default function TimelineSelector({
  presets,
  selectedEraId,
  onSelectEra,
  onCreateCustomClick,
  onDeleteCustomEra,
}: TimelineSelectorProps) {
  return (
    <div className="space-y-4" id="timeline-selector">
      <div className="flex items-center justify-between px-1">
        <div>
          <h3 className="font-sans font-bold text-lg text-zinc-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-500" />
            Determine Temporal Epoch
          </h3>
          <p className="text-xs text-zinc-500">
            Select a chronological coordinate in spacetime to construct your photo
          </p>
        </div>
        <span className="font-mono text-[10px] text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
          {presets.length} Portals Available
        </span>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {presets.map((era) => {
          const isSelected = era.id === selectedEraId;
          
          // Compute color boundaries based on the theme color metadata
          let themeBorderColor = "hover:border-zinc-700";
          let themeBgGlow = "";
          let badgeColor = "bg-zinc-800 text-zinc-400";
          let focusGlow = "border-zinc-800";

          if (isSelected) {
            if (era.themeColor === "amber") {
              themeBorderColor = "border-amber-500";
              themeBgGlow = "shadow-[0_0_15px_rgba(245,158,11,0.15)] bg-amber-500/5";
              badgeColor = "bg-amber-500/10 text-amber-400 border border-amber-500/20";
              focusGlow = "border-amber-500 ring-1 ring-amber-500/50";
            } else if (era.themeColor === "red") {
              themeBorderColor = "border-red-500";
              themeBgGlow = "shadow-[0_0_15px_rgba(239,68,68,0.15)] bg-red-500/5";
              badgeColor = "bg-red-500/10 text-red-400 border border-red-500/20";
              focusGlow = "border-red-500 ring-1 ring-red-500/50";
            } else if (era.themeColor === "blue") {
              themeBorderColor = "border-blue-500";
              themeBgGlow = "shadow-[0_0_15px_rgba(59,130,246,0.15)] bg-blue-500/5";
              badgeColor = "bg-blue-500/10 text-blue-400 border border-blue-500/20";
              focusGlow = "border-blue-500 ring-1 ring-blue-500/50";
            } else if (era.themeColor === "orange") {
              themeBorderColor = "border-orange-500";
              themeBgGlow = "shadow-[0_0_15px_rgba(249,115,22,0.15)] bg-orange-500/5";
              badgeColor = "bg-orange-500/10 text-orange-400 border border-orange-500/20";
              focusGlow = "border-orange-500 ring-1 ring-orange-500/50";
            } else if (era.themeColor === "rose") {
              themeBorderColor = "border-rose-500";
              themeBgGlow = "shadow-[0_0_15px_rgba(244,63,94,0.15)] bg-rose-500/5";
              badgeColor = "bg-rose-500/10 text-rose-400 border border-rose-500/20";
              focusGlow = "border-rose-500 ring-1 ring-rose-500/50";
            } else if (era.themeColor === "cyan") {
              themeBorderColor = "border-cyan-500";
              themeBgGlow = "shadow-[0_0_15px_rgba(6,182,212,0.15)] bg-cyan-500/5";
              badgeColor = "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20";
              focusGlow = "border-cyan-500 ring-1 ring-cyan-500/50";
            } else if (era.themeColor === "emerald") {
              themeBorderColor = "border-emerald-500";
              themeBgGlow = "shadow-[0_0_15px_rgba(16,185,129,0.15)] bg-emerald-500/5";
              badgeColor = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
              focusGlow = "border-emerald-500 ring-1 ring-emerald-500/50";
            } else if (era.themeColor === "violet") {
              themeBorderColor = "border-violet-500";
              themeBgGlow = "shadow-[0_0_15px_rgba(139,92,246,0.15)] bg-violet-500/5";
              badgeColor = "bg-violet-500/10 text-violet-400 border border-violet-500/20";
              focusGlow = "border-violet-500 ring-1 ring-violet-500/50";
            } else {
              themeBorderColor = "border-zinc-400";
              themeBgGlow = "shadow-[0_0_15px_rgba(250,250,250,0.1)] bg-zinc-400/5";
              badgeColor = "bg-zinc-800 text-zinc-300";
              focusGlow = "border-zinc-300 ring-1 ring-zinc-500/50";
            }
          }

          return (
            <div key={era.id} className="relative group">
              {era.id.startsWith("custom-") && onDeleteCustomEra && (
                <button
                  id={`delete-custom-era-btn-${era.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Do you want to delete the custom portal "${era.name}"?`)) {
                      onDeleteCustomEra(era.id);
                    }
                  }}
                  title="Remove custom portal"
                  className="absolute top-3 right-3 p-1.5 bg-zinc-950/90 hover:bg-red-950 border border-zinc-850 hover:border-red-900/40 text-zinc-500 hover:text-red-400 rounded-lg cursor-pointer transition-colors z-20 shadow-md"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                id={`era-card-${era.id}`}
                onClick={() => onSelectEra(era.id)}
                className={`w-full text-left rounded-xl overflow-hidden bg-[#141416] border transition-all duration-300 ${
                  isSelected 
                    ? `${focusGlow} ${themeBgGlow}` 
                    : "border-zinc-850 hover:border-zinc-700 cursor-pointer"
                }`}
              >
                {/* Cover thumbnail */}
                <div className="relative aspect-[16/10] w-full bg-zinc-900 overflow-hidden">
                  <img
                    src={era.backdropUrl}
                    alt={era.name}
                    className={`w-full h-full object-cover transition-transform duration-500 ${
                      isSelected ? "scale-105" : "scale-100 group-hover:scale-105"
                    }`}
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
                  
                  {/* Year tag */}
                  <span className="absolute top-3 left-3 bg-zinc-950/80 backdrop-blur px-2 py-0.5 rounded font-mono text-[10px] font-bold text-amber-500 border border-zinc-800">
                    {era.year}
                  </span>

                  {/* Role indicator in card */}
                  <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
                    <span className="font-sans font-bold text-sm text-white select-none">
                      {era.name}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-3">
                  <div className="flex flex-wrap gap-1">
                    {era.roles.slice(0, 2).map((role) => (
                      <span 
                        key={role} 
                        className="text-[9px] font-medium bg-zinc-900 border border-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded-md"
                      >
                        {role}
                      </span>
                    ))}
                  </div>

                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {era.scene}
                  </p>

                  {/* Immersion Fact */}
                  <div className="pt-2 border-t border-zinc-900/60 flex items-start gap-1.5 text-[10px] text-zinc-500 italic">
                    <HelpCircle className="w-3.5 h-3.5 text-zinc-600 shrink-0 mt-0.5" />
                    <span className="line-clamp-2 leading-snug">Fact: {era.temporalFact}</span>
                  </div>
                </div>

                {/* Bottom bar indicator */}
                <div className={`h-1.5 w-full bg-transparent ${
                  isSelected ? (
                    era.themeColor === "amber" ? "bg-amber-500" :
                    era.themeColor === "red" ? "bg-red-500" :
                    era.themeColor === "blue" ? "bg-blue-500" :
                    era.themeColor === "orange" ? "bg-orange-500" :
                    era.themeColor === "rose" ? "bg-rose-500" :
                    era.themeColor === "cyan" ? "bg-cyan-500" :
                    era.themeColor === "emerald" ? "bg-emerald-500" :
                    era.themeColor === "violet" ? "bg-violet-500" : "bg-zinc-400"
                  ) : ""
                }`} />
              </button>
            </div>
          );
        })}

        {/* Create Custom Portal Button Card */}
        {onCreateCustomClick && (
          <button
            id="create-custom-portal-card"
            onClick={onCreateCustomClick}
            type="button"
            className="text-left rounded-xl overflow-hidden bg-zinc-950/20 border-2 border-dashed border-zinc-900 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all duration-300 flex flex-col items-center justify-center p-6 h-full text-center space-y-3 cursor-pointer min-h-[200px]"
          >
            <div className="p-3 bg-zinc-900/40 border border-zinc-850 rounded-full text-emerald-500 group-hover:scale-105 transition-transform">
              <Plus className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <span className="block font-sans font-bold text-xs uppercase tracking-wider text-zinc-200">
                Custom Backdrop
              </span>
              <span className="block text-[10px] text-zinc-500 leading-normal max-w-[170px] mx-auto">
                Upload image file or choose templates to build a personalized portal
              </span>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
