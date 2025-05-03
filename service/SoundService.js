// File: service/SoundService.js
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSoundById, DEFAULT_SOUND_ID } from './soundOptions';

// Biến âm thanh
let alarmSound = null;
let alarmSoundPlaying = false;
let currentSoundId = DEFAULT_SOUND_ID;
let audioInitialized = false;

// Initialize audio system with safe values that work on both platforms
const initializeAudio = async () => {
  if (!audioInitialized) {
    try {
      console.log('Initializing audio system...');
      // Using only safe properties that work on both platforms
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: false,
        staysActiveInBackground: true,
        playThroughEarpieceAndroid: false
      });
      audioInitialized = true;
      console.log('Audio system initialized successfully');
    } catch (error) {
      console.error('Error initializing audio:', error);
      audioInitialized = false;
    }
  }
  return audioInitialized;
};

// Lấy ID âm thanh đã lưu
export const getCurrentSoundId = async () => {
  try {
    const settings = await AsyncStorage.getItem('settings');
    if (settings) {
      const parsedSettings = JSON.parse(settings);
      return parsedSettings.soundId || DEFAULT_SOUND_ID;
    }
    return DEFAULT_SOUND_ID;
  } catch (error) {
    console.error('Error getting sound ID:', error);
    return DEFAULT_SOUND_ID;
  }
};

// Tải và chuẩn bị âm thanh
export const loadAlarmSound = async () => {
  try {
    // Ensure audio is initialized
    await initializeAudio();
    
    // Unload any existing sound
    await unloadSound();
    
    // Get the current selected sound ID
    currentSoundId = await getCurrentSoundId();
    const soundOption = getSoundById(currentSoundId);
    
    console.log(`Loading sound: ${soundOption.name} with ID ${currentSoundId}`);
    
    // Use a fixed asset path instead of the dynamic one
    // This ensures we always have a valid sound to play
    const soundAsset = soundOption.path;
    
    const { sound } = await Audio.Sound.createAsync(
      soundAsset,
      { isLooping: true, shouldPlay: false },
      onPlaybackStatusUpdate
    );
    
    alarmSound = sound;
    console.log(`Alarm sound '${soundOption.name}' loaded successfully.`);
    return sound;
  } catch (error) {
    console.error('Error loading alarm sound:', error);
    console.error('Error details:', error.message);
    
    // Fallback to default sound if selected sound fails
    try {
      console.log('Trying to load default sound as fallback...');
      const defaultSound = getSoundById(DEFAULT_SOUND_ID);
      const { sound } = await Audio.Sound.createAsync(
        defaultSound.path,
        { isLooping: true, shouldPlay: false }
      );
      alarmSound = sound;
      console.log('Default sound loaded as fallback');
      return sound;
    } catch (fallbackError) {
      console.error('Even fallback sound failed to load:', fallbackError);
      return null;
    }
  }
};

// Function to handle playback status updates
const onPlaybackStatusUpdate = (status) => {
  if (status.isLoaded) {
    // Update the playing status based on actual playback
    alarmSoundPlaying = status.isPlaying;
    
    if (status.didJustFinish && !status.isLooping) {
      console.log('Sound playback finished');
    }
  } else if (status.error) {
    console.error(`Sound playback error: ${status.error}`);
  }
};

// Unload sound resources
const unloadSound = async () => {
  try {
    if (alarmSound !== null) {
      if (alarmSoundPlaying) {
        try {
          await alarmSound.stopAsync();
        } catch (stopError) {
          console.log('Error stopping sound:', stopError);
        }
        alarmSoundPlaying = false;
      }
      
      try {
        await alarmSound.unloadAsync();
      } catch (unloadError) {
        console.log('Error unloading sound:', unloadError);
      }
      
      alarmSound = null;
    }
  } catch (error) {
    console.error('Error in unloadSound:', error);
  }
};

// Phát âm thanh báo thức
export const playAlarmSound = async () => {
  try {
    console.log('Attempting to play alarm sound...');
    
    // Ensure audio is initialized
    await initializeAudio();
    
    // Make sure we have a sound loaded
    if (alarmSound === null) {
      console.log('No alarm sound loaded, loading now...');
      await loadAlarmSound();
    }
    
    // Double check that loading succeeded
    if (alarmSound) {
      // Check if sound is already playing
      if (!alarmSoundPlaying) {
        console.log('Playing alarm sound...');
        
        // Set volume before playing
        try {
          const settings = await AsyncStorage.getItem('settings');
          if (settings) {
            const parsedSettings = JSON.parse(settings);
            const volume = Math.min(Math.max((parsedSettings.alarmVolume || 80) / 100, 0), 1);
            await alarmSound.setVolumeAsync(volume);
          }
        } catch (volError) {
          console.log('Using default volume due to error:', volError);
          await alarmSound.setVolumeAsync(0.8); // Default to 80%
        }
        
        // Play sound with max volume to ensure it's audible
        await alarmSound.setStatusAsync({
          shouldPlay: true,
          volume: 1.0,
          isLooping: true,
          isMuted: false
        });
        
        alarmSoundPlaying = true;
        console.log('Alarm sound playing now.');
        
        return true;
      } else {
        console.log('Alarm sound is already playing.');
        return true;
      }
    } else {
      console.error('Failed to load alarm sound for playback');
      return false;
    }
  } catch (error) {
    console.error('Error playing alarm sound:', error);
    return false;
  }
};

// Dừng âm thanh báo thức
export const stopAlarmSound = async () => {
  try {
    if (alarmSound && alarmSoundPlaying) {
      await alarmSound.stopAsync();
      alarmSoundPlaying = false;
      console.log('Alarm sound stopped.');
      // Có thể cần unload âm thanh để giải phóng bộ nhớ nếu không dùng ngay
      await alarmSound.unloadAsync();
      alarmSound = null;
    }
  } catch (error) {
    console.error('Error stopping alarm sound:', error);
  }
};

// Điều chỉnh âm lượng báo thức (0-100)
export const setAlarmVolume = async (volumePercent) => {
  try {
    if (alarmSound) {
      // expo-av volume range is 0-1
      const volume = Math.min(Math.max(volumePercent / 100, 0), 1);
      await alarmSound.setVolumeAsync(volume);
      console.log(`Alarm volume set to ${volumePercent}%`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error setting alarm volume:', error);
    return false;
  }
};