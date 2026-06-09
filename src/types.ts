export interface Prop {
  char: string;
  name: string;
  type: string; // 'head', 'chest', 'accessory'
}

export interface Era {
  id: string;
  name: string;
  year: string;
  themeColor: string;
  scene: string;
  roles: string[];
  defaultRole: string;
  backdropUrl: string;
  suggestedProps: Prop[];
  defaultFilter: string;
  temporalFact: string;
}

export interface DraggedProp {
  id: string;
  char: string;
  name: string;
  x: number; // percentage (0-100) or pixel offset
  y: number;
  scale: number;
  rotation: number; // degrees
}

export interface UserFacePosition {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  contrast: number; // 0-200%
  brightness: number; // 0-200%
  saturation: number; // 0-200%
  feather: number; // 0-50 px
  filterType: string; // 'original', 'sepia', 'grayscale', 'warm', 'cool', 'cyber'
}

export interface SavedJourney {
  id: string;
  eraId: string;
  eraName: string;
  year: string;
  timestamp: number;
  imageUrl: string;
  caption: string;
  generationType: "hybrid-graft" | "ai-alchemy";
}
