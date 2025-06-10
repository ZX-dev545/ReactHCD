export interface Accessory {
  svgPath: string;          // relative path to accessory SVG
  position: {               // relative position over avatar
    x: number;              // pixels from avatar's left edge
    y: number;              // pixels from avatar's top edge
  };
}

export interface UserProfile {
  name: string;
  city: string;
  avatarSvgPath: string;    // relative path to avatar SVG
  accessories: Accessory[]; // list of accessories to overlay
  quests: string[];        // list of quest IDs (optional)
}
