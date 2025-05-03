// File: service/soundOptions.js

// Sound options available in the app
export const SOUND_OPTIONS = [
  {
    id: 'alarm-clock-short',
    name: 'Alarm Clock Short',
    path: require('../assets/audio/alarm-clock-short-6402.mp3')
  },
  {
    id: 'funny-alarm',
    name: 'Funny Alarm',
    path: require('../assets/audio/funny-alarm-317531.mp3')
  },
  {
    id: 'oversimplified-alarm',
    name: 'Oversimplified Alarm',
    path: require('../assets/audio/oversimplified-alarm-clock-113180.mp3')
  },
  {
    id: 'star-dust-alarm',
    name: 'Star Dust Alarm',
    path: require('../assets/audio/star-dust-alarm-clock-114194.mp3')
  },
];

// Default sound
export const DEFAULT_SOUND_ID = 'alarm-clock-short';

// Get sound by ID
export const getSoundById = (id) => {
  return SOUND_OPTIONS.find(sound => sound.id === id) || SOUND_OPTIONS[0];
};