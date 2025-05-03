// File: service/BackgroundService.js
import { Platform, AppState } from 'react-native';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { loadAlarmSound } from './SoundService';
import { registerForPushNotificationsAsync } from './NotificationService';

// Background task name - uses v2 to avoid conflicts with old task name
export const BACKGROUND_ALARM_CHECK = 'background-alarm-check-v2';

// --- Khởi tạo ban đầu ---
// Gọi các hàm cần thiết khi service được import lần đầu (ví dụ trong App.js)
export const initializeAlarmService = async () => {
    console.log('Initializing Alarm Service...');
    await loadAlarmSound(); // Tải sẵn âm thanh
    await registerForPushNotificationsAsync(); // Xin quyền và tạo kênh
    await registerBackgroundTask(); // Đăng ký task nền (dự phòng)
    console.log('Alarm Service initialized.');
}

/**
 * Background task definition - checks for alarms that should be active
 * Note: This task has a limited role since most alarm scheduling is handled 
 * by expo-notifications, but provides a backup reliability mechanism
 */
TaskManager.defineTask(BACKGROUND_ALARM_CHECK, async () => {
  const now = new Date();
  console.log(`BACKGROUND_ALARM_CHECK task executed at: ${now.toISOString()}`);

  try {
    // Currently just logs execution, but could be extended to:
    // 1. Check active alarms in AsyncStorage
    // 2. Compare with scheduled notifications
    // 3. Re-schedule any missing alarms

    console.log('Background check finished. No direct action taken.');
    return BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error) {
    console.error('Error in background alarm check task:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

/**
 * Register the background task that periodically checks for alarms
 * @returns {Promise<void>}
 */
export const registerBackgroundTask = async () => {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_ALARM_CHECK);
    if (isRegistered) {
      console.log('Background task already registered.');
      return;
    }

    // Check if BackgroundFetch is available
    const status = await BackgroundFetch.getStatusAsync();
    if (status !== BackgroundFetch.BackgroundFetchStatus.Available) {
      console.warn(`Background fetch status: ${status}. Task might not run reliably.`);
    }

    console.log('Registering background task:', BACKGROUND_ALARM_CHECK);
    await BackgroundFetch.registerTaskAsync(BACKGROUND_ALARM_CHECK, {
      minimumInterval: 15 * 60, // 15 minutes minimum interval
      stopOnTerminate: false,
      startOnBoot: true,
    });
    console.log('Background task registration attempt finished.');

    // Confirm registration
    const registered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_ALARM_CHECK);
    console.log('Is background task registered now?', registered);

  } catch (error) {
    console.error('Error registering background task:', error);
  }
};


