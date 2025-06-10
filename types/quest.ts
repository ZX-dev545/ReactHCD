import PottedPlantQuestIcon from '../assets/svg/potted-plant-quest-icon.svg';
import SeagullQuestIcon from '../assets/svg/seagull-quest-icon.svg';
import VirusQuestIcon from '../assets/svg/virus-quest-icon.svg';

export interface Location {
  name: string;
  latitude: number;
  longitude: number;
}

export interface Quest {
  name: string;
  description: string;
  questColour: string;
  questIconSvgPath: string;
  progress: number;
  locations: Location[];   // changed to array of objects
}

export const QUEST_SVG_COMPONENTS: Record<string, any> = {
  'potted-plant-quest-icon.svg': PottedPlantQuestIcon,
  'seagull-quest-icon.svg':      SeagullQuestIcon,
  'virus-quest-icon.svg':        VirusQuestIcon,
};