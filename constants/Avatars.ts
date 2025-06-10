import AmoebaAvatar from '../assets/svg/amoeba-avatar.svg';
import FoxAvatar from '../assets/svg/fox-avatar.svg';
import PigeonAvatar from '../assets/svg/pigeon-avatar.svg';
import RacoonAvatar from '../assets/svg/racoon-avatar.svg';

import BowAccessorySvg from '../assets/svg/bow-accessory.svg';
import FlowerAccessorySvg from '../assets/svg/flower-accessory.svg';
import GlassesAccessorySvg from '../assets/svg/glasses-accessory.svg';
import HatAccessorySvg from '../assets/svg/hat-accessory.svg';

import { Accessory } from '../types/userProfile';

export const AVATAR_SVG_PATHS = {
    //use absolute paths for SVGs
    "pigeon": '../assets/svg/pigeon-avatar.svg',
    "racoon": '../assets/svg/racoon-avatar.svg',
    "amoeba": '../assets/svg/amoeba-avatar.svg', 
    "fox": '../assets/svg/fox-avatar.svg',
};

export const AVATAR_SVG_COMPONENTS = {
    "pigeon": PigeonAvatar,
    "racoon": RacoonAvatar,
    "amoeba": AmoebaAvatar,
    "fox": FoxAvatar,
};

// avatar accessory svg filepaths
export const AVATAR_ACCESSORY_SVG_PATHS = {
    "hat": '../assets/svg/hat-accessory.svg',
    "glasses": '../assets/svg/glasses-accessory.svg',
    "bow": '../assets/svg/bow-accessory.svg',
    "flower": '../assets/svg/flower-accessory.svg',
};

export const AVATAR_ACCESSORY_SVG_COMPONENTS = {
    "hat": HatAccessorySvg,
    "glasses": GlassesAccessorySvg,
    "bow": BowAccessorySvg,
    "flower": FlowerAccessorySvg,
};

export const AVATAR_ACCESSORIES = {
    "hat": {
        svgPath: AVATAR_ACCESSORY_SVG_PATHS.hat,
        position: { x: 0, y: 0 },
    } as Accessory,
    "glasses": {
        svgPath: AVATAR_ACCESSORY_SVG_PATHS.glasses,
        position: { x: 0, y: 0 },
    } as Accessory,
    "bow": {
        svgPath: AVATAR_ACCESSORY_SVG_PATHS.bow,
        position: { x: 0, y: 0 },
    } as Accessory,
    "flower": {
        svgPath: AVATAR_ACCESSORY_SVG_PATHS.flower,
        position: { x: 0, y: 0 },
    } as Accessory,
};