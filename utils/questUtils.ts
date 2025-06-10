import { questColours } from '@/constants/Colors';
import { Location, Quest } from '@/types/quest';
import AsyncStorage from '@react-native-async-storage/async-storage';
import questData from '../assets/data/quests.json';

function isLocation(raw: any): raw is Location {
  return (
    raw &&
    typeof raw.name === 'string' &&
    typeof raw.latitude === 'number' &&
    typeof raw.longitude === 'number'
  );
}

export function castJSONToQuest(raw: any): Quest | null {
  if (
    raw && typeof raw.name === 'string' &&
    typeof raw.description === 'string' &&
    typeof raw.questColour === 'number' &&
    typeof raw.questIconSvgPath === 'string' &&
    typeof raw.progress === 'number' &&
    Array.isArray(raw.locations) &&
    raw.locations.every(isLocation)
  ) {
    return { 
      name: raw.name, 
      description: raw.description,
      questColour: questColours[raw.questColour], 
      questIconSvgPath: raw.questIconSvgPath, 
      progress: raw.progress,
      locations: raw.locations as Location[],
    };
  }
  return null;
}

//function to load quests from JSON file
export function loadQuestsFromJson(json: string): Quest[] {
  try {
    const rawQuests = JSON.parse(json);
    if (!Array.isArray(rawQuests)) {
      throw new Error('Invalid quest data format: ' + json);
    }
    return rawQuests.map(castJSONToQuest).filter((q): q is Quest => q !== null);
  } catch (error) {
    console.error('Error loading quests from JSON:', error);
    return [];
  }
}

//function to save async storage to quests.json
export async function updateQuests(quests: Quest[]): Promise<void> {
  try {
    let questsJson = await AsyncStorage.getItem('quests');
    if (!questsJson) {
      questsJson = '{}'; // Initialize with an empty object if no data exists
    }
    const oldQuests = loadQuestsFromJson(questsJson);
    const newQuests = [ 
      ...quests,
      ...oldQuests.filter(q => !quests.some(quest => quest.name === q.name))
    ]
    await AsyncStorage.setItem('quests', JSON.stringify(newQuests));
    console.log('Quests saved successfully');
  } catch (error) {
    console.error('Error saving quests in AsyncStorage:', error);
  }
}

export async function loadQuests(): Promise<Quest[]> {
  const loaded = loadQuestsFromJson(JSON.stringify(questData));
  updateQuests(loaded);
  return loaded;
}

export async function getQuests(): Promise<Quest[]> {
  let quests = await AsyncStorage.getItem('quests');
  if (!quests) {
    quests = JSON.stringify(questData); // Fallback to default quest data
  }
  const loaded = loadQuestsFromJson(quests);
  
  return loaded;
}