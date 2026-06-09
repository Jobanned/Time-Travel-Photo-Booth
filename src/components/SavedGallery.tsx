import React from "react";
import { SavedJourney } from "../types";
import { Download, Trash2, History, Heart, Sparkles, Layers } from "lucide-react";

interface SavedGalleryProps {
  historyList: SavedJourney[];
  onDeleteJourney: (id: string) => void;
}

export default function SavedGallery({
  historyList,
  onDeleteJourney,
}: SavedGalleryProps) {
  
  const handleDownload = (journey: SavedJourney) => {
    try {
      const link = document.createElement("a");
      link.href = journey.imageUrl;
      link.download = `time_travel_${journey.eraId}_${journey.timestamp}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("Downloader execution failed:", e);
      alert("Failed to prompt download automatically. Try right-clicking the image and selecting 'Save Image As'.");
    }
  };

  return (
    <div className="space-y-5" id="saved-gallery">
      <div className="border-b border-zinc-900 pb-3">
        <h3 className="font-sans font-bold text-lg text-zinc-100 flex items-center gap-2">
          <History className="w-5 h-5 text-amber-500 animate-pulse" />
          Timeline Chrono-Archives
        </h3>
        <p className="text-xs text-zinc-500 mt-0.5">
          Archived prints of your historical doubles recorded across different spacetime coordinate intersections
        </p>
      </div>

      {historyList.length === 0 ? (
        <div className="py-12 px-6 bg-zinc-950/20 border border-dashed border-zinc-900 rounded-2xl text-center space-y-4">
          <div className="p-4 bg-zinc-900/30 border border-zinc-850 rounded-full inline-block text-zinc-600">
            <History className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <p className="text-zinc-400 font-medium text-sm">
              Temporal logs currently vacant
            </p>
            <p className="text-zinc-600 text-xs max-w-sm mx-auto leading-relaxed">
              Snap a biomechanic selfie, choose an epoch portal, and model your physical duplicate to record your first timeline print!
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {historyList.map((j) => {
            const formattedDate = new Date(j.timestamp).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            });

            return (
              <div
                id={`saved-journey-card-${j.id}`}
                key={j.id}
                className="group rounded-xl overflow-hidden bg-[#141416] border border-zinc-850 flex flex-col hover:border-zinc-700 transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5 duration-300"
              >
                {/* Photo canvas */}
                <div className="relative aspect-square w-full bg-zinc-900 overflow-hidden">
                  <img
                    src={j.imageUrl}
                    alt={j.caption}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-transparent to-transparent opacity-100 transition-all" />

                  {/* Generation Badge */}
                  <span className="absolute top-3 left-3 bg-zinc-950/80 backdrop-blur px-2 py-0.5 rounded flex items-center gap-1 font-mono text-[9px] uppercase tracking-widest border border-zinc-800 font-bold">
                    {j.generationType === "ai-alchemy" ? (
                      <>
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span className="text-amber-400">AI Alchemy</span>
                      </>
                    ) : (
                      <>
                        <Layers className="w-3 h-3 text-blue-500" />
                        <span className="text-blue-400">Grafted</span>
                      </>
                    )}
                  </span>

                  {/* Year watermark */}
                  <span className="absolute bottom-3 right-3 bg-amber-500/10 backdrop-blur text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded font-mono text-[10px] font-bold">
                    {j.year}
                  </span>
                </div>

                {/* Body metadata card */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-[#111112]">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">
                      Target Era: {j.eraName}
                    </span>
                    <p className="text-xs text-zinc-300 font-sans font-medium line-clamp-2 leading-relaxed">
                      {j.caption}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-zinc-900 flex items-center justify-between text-[10px] font-mono text-zinc-550">
                    <span>Logs: {formattedDate}</span>
                    <div className="flex gap-2">
                      <button
                        id={`download-journey-btn-${j.id}`}
                        onClick={() => handleDownload(j)}
                        title="Download historical PNG"
                        className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 text-zinc-300 hover:text-amber-500 rounded-lg cursor-pointer transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        id={`delete-journey-btn-${j.id}`}
                        onClick={() => onDeleteJourney(j.id)}
                        title="Delete temporal log"
                        className="p-1.5 bg-zinc-900 hover:bg-red-950/20 border border-zinc-850 hover:border-red-900/40 text-zinc-500 hover:text-red-400 rounded-lg cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
