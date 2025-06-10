import { AVATAR_SVG_PATHS } from '@/constants/Avatars';
import { Accessory, UserProfile } from '@/types/userProfile';

export function toProfileMap(profile: UserProfile): Record<string, Omit<UserProfile, 'name'>> {
  const { name, ...rest } = profile;
  return { [name]: rest };
}

/**
 * Safely parse any JSON-like value into an Accessory.
 * Returns undefined if the shape is invalid.
 */
export function fromJsonToAccessory(data: unknown): Accessory | undefined {
    //console.log('fromJsonToAccessory called with:', data);
  if (typeof data !== 'object' || data === null) return undefined;
  const blob = data as Record<string, unknown>;
    //console.log('fromJsonToAccessory blob:', blob);
  const svgPath = blob.svgPath;
    const position = blob.position;
    if (
      typeof svgPath !== 'string' ||
      typeof position !== 'object' || position === null ||
      typeof (position as Record<string, unknown>).x !== 'number' ||
      typeof (position as Record<string, unknown>).y !== 'number'
    ) {
      return undefined;
    }
    return {
        svgPath,
        position: {
            x: (position as Record<string, unknown>).x as number,
            y: (position as Record<string, unknown>).y as number
        }
        };
}

/**
 * Expects JSON dictionary with a single key-value pair.
 * The key is the user's name, and the value is an object with properties:
 * Returns undefined if the shape is invalid.
 */
export function fromJsonToUserProfile(data: unknown): UserProfile | undefined {
    //console.log('fromJsonToUserProfile called with:', data);
    if (typeof data !== 'object' || data === null) return undefined;
    //data is in the format {"default": {"accessories": [], "avatar": "pigeon", "location": "Unknown", "name": "Default User"}
    const blob = data as Record<string, unknown>;
    //console.log('fromJsonToUserProfile blob:', blob);
    //name is the key of the dictionary, and the dictionary is 1 element long
    if (Object.keys(blob).length !== 1) return undefined; // must be a single key-value pair
    // extract the single key-value pair
    const name = Object.keys(blob)[0];
    if (typeof name !== 'string' || name.trim() === '') return undefined; // name must be a non-empty string
    //console.log('fromJsonToUserProfile extracted name:', name);
    
    // now we can safely access the properties of the value
    const value = blob[name] as Record<string, unknown>;
    if (typeof value !== 'object' || value === null) return undefined; // value must be an object
    //console.log('fromJsonToUserProfile value:', value);
    const blobval = value as Record<string, unknown>;
    if (!blobval) return undefined; // value must not be null
    //console.log('fromJsonToUserProfile blobval:', blobval);
    
    if (!('city' in blobval) || !('avatar' in blobval) || !('accessories' in blobval)) {
        return undefined; // must have city, avatarSvgPath, and accessories
    }
    // extract the properties
    const city = blobval.city;
    const avatar = blobval.avatar;
    if (typeof avatar !== 'string') { return undefined; }
    const avatarSvgPath = AVATAR_SVG_PATHS[avatar];
    if (!Array.isArray(blobval.accessories)) return undefined;
    const accessories = blobval.accessories.map(fromJsonToAccessory).filter(a => a !== undefined) as Accessory[];

    // --- Add quests field support ---
    let quests: string[] = [];
    if ('quests' in blobval && Array.isArray(blobval.quests)) {
        quests = (blobval.quests as unknown[]).filter(q => typeof q === 'string') as string[];
    }

    if (
    typeof name !== 'string' ||
    typeof city !== 'string' ||
    typeof avatarSvgPath !== 'string' ||
    !Array.isArray(accessories)
    ) {
        return undefined;
    }
    // Add quests to returned object
    return { name, city, avatarSvgPath, accessories, quests };
}

/** Expects JSON dictionary where the keys are the properties of UserProfile */
export function castJSONToUserProfile(data: unknown): UserProfile {
    //data is expected to be a JSON dictionary where the keys are the properties of UserProfile
    if (typeof data !== 'object' || data === null) {
        throw new Error('Invalid UserProfile JSON data');
    }
    console.log('PROFILEUTILS castJSONToUserProfile called with:', data);
    const blobval = data as Record<string, unknown>;
    console.log('castJsonToUserProfile blobval:', blobval);
    if (!blobval) throw new Error('Invalid UserProfile JSON data'); // value must not be null

    console.log('castJsonToUserProfile blobval keys:', Object.keys(blobval));
    if (!('city' in blobval) || !('avatarSvgPath' in blobval) || !('accessories' in blobval) || !('name' in blobval)) {
        throw new Error('Invalid UserProfile JSON data'); // must have city, avatarSvgPath, and accessories
    }
    // extract the properties
    const name = blobval.name;
    const city = blobval.city;
    const avatarSvgPath = blobval.avatarSvgPath;
    // accessories must be an array of accessory objects
    if (!Array.isArray(blobval.accessories)) throw new Error('Invalid UserProfile JSON data');
    const accessories = blobval.accessories.map(fromJsonToAccessory).filter(a => a !== undefined) as Accessory[];

    // --- Add quests field support ---
    let quests: string[] = [];
    if ('quests' in blobval && Array.isArray(blobval.quests)) {
        quests = (blobval.quests as unknown[]).filter(q => typeof q === 'string') as string[];
    }

    if (
    typeof name !== 'string' ||
    typeof city !== 'string' ||
    typeof avatarSvgPath !== 'string' ||
    !Array.isArray(accessories)
    ) {
        throw new Error('Invalid UserProfile JSON data');
    }
    console.log('castJSON final profile:', { name, city, avatarSvgPath, accessories, quests });
    return { name, city, avatarSvgPath, accessories, quests };
}

//function to save user profile to json
export function saveUserProfileToJson(profile: UserProfile): string {
    const profileMap = toProfileMap(profile);
    return JSON.stringify(profileMap, null, 2);
}