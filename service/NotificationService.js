// File: service/NotificationService.js
import { Platform, AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { stopAlarmSound, playAlarmSound, loadAlarmSound } from './SoundService';

// Notification channel ID for Android
export const ALARM_NOTIFICATION_CHANNEL_ID = 'mathAlarmChannel';

// Hàm để thiết lập trình xử lý thông báo
export const setupNotificationHandler = (navigationRef) => {
  console.log('Setting up notification handlers...');
  
  // Preload sound to ensure it's ready
  loadAlarmSound().catch(error => 
    console.error('Failed to preload alarm sound:', error)
  );

  // Cấu hình cách xử lý thông báo khi app đang mở
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      console.log('Notification received while app is foregrounded:', notification);
      const data = notification.request.content.data;

      // Nếu là báo thức và app đang mở, bắt đầu phát âm thanh
      if (data?.alarmId) {
        console.log(`Foreground: Alarm ${data.alarmId} received. Playing sound.`);
        await playAlarmSound();

        // Store active alarm in AsyncStorage
        await AsyncStorage.setItem('activeAlarm', JSON.stringify({
          id: data.alarmId,
          timestamp: new Date().getTime()
        }));

        return {
          shouldShowAlert: true,
          shouldPlaySound: false, // Đã tự phát âm thanh ở trên
          shouldSetBadge: true,
          priority: Notifications.AndroidNotificationPriority.MAX,
        };
      }

      return {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      };
    }
  });

  // Listener khi click vào notification
  const subscription = Notifications.addNotificationResponseReceivedListener(async response => {
    const data = response.notification.request.content.data;
    console.log('Notification clicked, data:', data);

    if (data?.alarmId) {
      // Play sound when notification is clicked (important for background notifications)
      console.log(`Playing alarm sound for notification click: ${data.alarmId}`);
      await playAlarmSound();
      
      // Store active alarm in AsyncStorage if not already set
      await AsyncStorage.setItem('activeAlarm', JSON.stringify({
        id: data.alarmId,
        timestamp: new Date().getTime()
      }));

      if (navigationRef && navigationRef.isReady()) {
        // Check if game type is specified
        if (data.gameType) {
          switch (data.gameType) {
            case 'math':
              navigationRef.navigate('MathProblem', { 
                mathDifficulty: data.mathDifficulty || 'Easy',
                alarmId: data.alarmId,
                onSolve: async () => {
                  await dismissCurrentAlarm(data.alarmId);
                }
              });
              break;
            case 'alphabet':
              navigationRef.navigate('AlphabetGame', { 
                difficulty: data.mathDifficulty || 'Easy',
                alarmId: data.alarmId,
                onSolve: async () => {
                  await dismissCurrentAlarm(data.alarmId);
                }
              });
              break;
            case 'qrcode':
              navigationRef.navigate('QRCodeGame', { 
                difficulty: data.mathDifficulty || 'Easy',
                alarmId: data.alarmId,
                onSolve: async () => {
                  await dismissCurrentAlarm(data.alarmId);
                }
              });
              break;
            default:
              // Default to math problem for backward compatibility
              navigationRef.navigate('MathProblem', { 
                mathDifficulty: data.mathDifficulty || 'Easy',
                alarmId: data.alarmId,
                onSolve: async () => {
                  await dismissCurrentAlarm(data.alarmId);
                }
              });
          }
        } 
        // For backward compatibility with existing alarms
        else if (data.mathDifficulty) {
          navigationRef.navigate('MathProblem', { 
            mathDifficulty: data.mathDifficulty,
            alarmId: data.alarmId,
            onSolve: async () => {
              await dismissCurrentAlarm(data.alarmId);
            }
          });
        }
      }
    }
  });

  // Return a cleanup function
  return () => {
    subscription.remove();
  };
};

// Xin quyền và thiết lập kênh thông báo
export const registerForPushNotificationsAsync = async () => {
  let granted = false;
  try {
    // 1. Yêu cầu quyền cơ bản
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      console.log('Requesting notification permissions...');
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowCriticalAlerts: true,
        },
        android: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        }
      });
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Notification permissions not granted!');
      granted = false;
    } else {
      console.log('Notification permissions granted.');
      granted = true;
    }

    // 2. Thiết lập kênh thông báo cho Android
    if (Platform.OS === 'android') {
      console.log('Setting up Android notification channel...');
      await Notifications.setNotificationChannelAsync(ALARM_NOTIFICATION_CHANNEL_ID, {
        name: 'Math Alarms',
        importance: Notifications.AndroidImportance.MAX,
        bypassDnd: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        sound: null,
        vibrationPattern: [0, 250, 250, 250],
        audioAttributes: {
          usage: Notifications.AndroidAudioUsage.ALARM,
          contentType: Notifications.AndroidAudioContentType.SONIFICATION,
        }
      });
      console.log('Android notification channel set up.');
    }

  } catch (error) {
    console.error('Error getting/setting notification permissions or channel:', error);
    granted = false;
  }
  return granted;
};

// Hủy báo thức (Tắt, dừng âm thanh, xóa lịch trình)
export const cancelAlarm = async (alarmId) => {
  try {
    console.log(`Cancelling alarm instance: ${alarmId}...`);

    // 1. Dừng âm thanh nếu báo thức này đang kêu
    const activeAlarmJson = await AsyncStorage.getItem('activeAlarm');
    if (activeAlarmJson) {
      const activeAlarm = JSON.parse(activeAlarmJson);
      if (activeAlarm.id === alarmId) {
        await stopAlarmSound();
        await AsyncStorage.removeItem('activeAlarm');
        console.log(`Stopped sound and removed active alarm state for ${alarmId}.`);
      }
    }

    // 2. Cập nhật trạng thái 'active: false' trong AsyncStorage
    const savedAlarmsJson = await AsyncStorage.getItem('alarms') || '[]';
    let alarms = JSON.parse(savedAlarmsJson);
    let updated = false;
    const updatedAlarms = alarms.map(alarm => {
      if (alarm.id === alarmId && alarm.active) {
        updated = true;
        return { ...alarm, active: false };
      }
      return alarm;
    });

    if (updated) {
      await AsyncStorage.setItem('alarms', JSON.stringify(updatedAlarms));
      console.log(`Set alarm ${alarmId} to inactive in AsyncStorage.`);
    }

    // 3. Hủy tất cả các thông báo đã lập lịch cho báo thức này
    await cancelAlarmNotifications(alarmId);

    // 4. Hủy các thông báo đang hiển thị nếu có
    await dismissPresentedNotifications(alarmId);

    console.log(`Alarm ${alarmId} fully cancelled.`);
    return true;
  } catch (error) {
    console.error(`Error cancelling alarm ${alarmId}:`, error);
    return false;
  }
};

// Hủy tất cả thông báo ĐÃ LẬP LỊCH liên quan đến báo thức
export const cancelAlarmNotifications = async (alarmId) => {
  try {
    console.log(`Cancelling scheduled notifications for alarm: ${alarmId}...`);
    let cancelledCount = 0;
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();

    for (const notification of scheduledNotifications) {
      if (notification.content?.data?.alarmId === alarmId) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        cancelledCount++;
        console.log(`Cancelled scheduled notification: ${notification.identifier}`);
      }
    }
    console.log(`Finished cancelling scheduled notifications for alarm ${alarmId}. Total cancelled: ${cancelledCount}`);
  } catch (error) {
    console.error(`Error cancelling scheduled notifications for alarm ${alarmId}:`, error);
  }
};

// Hủy các thông báo đang hiển thị
export const dismissPresentedNotifications = async (alarmId) => {
  try {
    const presentedNotifications = await Notifications.getPresentedNotificationsAsync();
    let dismissedCount = 0;
    for (const notification of presentedNotifications) {
      if (notification.request.content.data?.alarmId === alarmId && notification.identifier) {
        await Notifications.dismissNotificationAsync(notification.identifier);
        dismissedCount++;
        console.log(`Dismissed presented notification: ${notification.identifier}`);
      }
    }
    if (dismissedCount > 0) {
      console.log(`Dismissed ${dismissedCount} presented notifications for alarm ${alarmId}.`);
    }
  } catch(error) {
    console.error(`Error dismissing presented notifications for alarm ${alarmId}:`, error);
  }
};

// Hủy instance báo thức hiện tại (khi giải toán đúng / nhấn Dismiss)
export const dismissCurrentAlarm = async (alarmId) => {
  try {
    console.log(`Dismissing current ringing instance of alarm: ${alarmId}...`);
    // 1. Dừng âm thanh
    await stopAlarmSound();

    // 2. Xóa trạng thái báo thức đang kích hoạt
    await AsyncStorage.removeItem('activeAlarm');
    console.log(`Removed active alarm state for ${alarmId}.`);

    // 3. Hủy các thông báo đang hiển thị của báo thức này
    await dismissPresentedNotifications(alarmId);

    console.log(`Current instance of alarm ${alarmId} dismissed.`);
    return true;
  } catch (error) {
    console.error(`Error dismissing current alarm instance ${alarmId}:`, error);
    return false;
  }
};

// Hiển thị tất cả thông báo đã lên lịch (debugging)
export const logScheduledNotifications = async () => {
  try {
    console.log('Listing all scheduled notifications:');
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    
    if (scheduled.length === 0) {
      console.log('  No scheduled notifications found.');
    } else {
      scheduled.forEach((notification, index) => {
        const trigger = notification.trigger;
        let triggerInfo = 'Unknown trigger type';
        
        if (trigger.dateComponents) {
          triggerInfo = `Repeating: ${JSON.stringify(trigger.dateComponents)}`;
        } else if (trigger.date) {
          triggerInfo = `Date: ${new Date(trigger.date).toLocaleString()}`;
        }
        
        console.log(`  [${index + 1}] ID: ${notification.identifier}`);
        console.log(`      Title: ${notification.content.title}`);
        console.log(`      Data: ${JSON.stringify(notification.content.data)}`);
        console.log(`      Trigger: ${triggerInfo}`);
      });
    }
  } catch (error) {
    console.error('Error listing scheduled notifications:', error);
  }
};
