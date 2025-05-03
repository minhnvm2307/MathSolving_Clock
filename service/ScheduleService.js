// File: service/ScheduleService.js
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync, ALARM_NOTIFICATION_CHANNEL_ID, logScheduledNotifications } from './NotificationService';

// Helper function: Get weekday number (1-7, Sunday=7) from abbreviation
const getWeekdayNumber = (dayShort) => {
    const mapping = { 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6, 'Sun': 7 };
    return mapping[dayShort] ?? 0; // Trả về 0 nếu không khớp
};

// Hàm phụ trợ: Tạo nội dung thông báo chung
const createNotificationContent = (alarm) => {
    // Get appropriate game title based on game type
    let gameTypeText = 'Solve math';
    if (alarm.gameType === 'alphabet') {
        gameTypeText = 'Arrange letters';
    } else if (alarm.gameType === 'qrcode') {
        gameTypeText = 'Scan QR code';
    }
    
    return {
        title: '⏰ MathSolving Alarm!',
        body: `Đến giờ rồi! ${alarm.mathDifficulty ? `${gameTypeText} (${alarm.mathDifficulty}) để tắt.` : 'Dậy thôi!'}`,
        data: {
          alarmId: alarm.id,
          mathDifficulty: alarm.mathDifficulty,
          gameType: alarm.gameType || 'math', // Default to 'math' for backward compatibility
          snoozeEnabled: alarm.snoozeEnabled,
          vibrate: alarm.vibrate,
          isScheduledAlarm: true
        },
        android: {
            channelId: ALARM_NOTIFICATION_CHANNEL_ID,
            priority: Notifications.AndroidNotificationPriority.MAX,
            vibrationPattern: alarm.vibrate ? [0, 250, 250, 250] : undefined,
        },
        sticky: false,
    };
};

// Lập lịch báo thức cho iOS
const scheduleAlarmForIOS = async (alarm) => {
  try {
    console.log(`Scheduling alarm ${alarm.id} for iOS...`);
    const hour = Math.floor(alarm.time / 60);
    const minute = alarm.time % 60;

    // Xác định các ngày sẽ báo thức (1-7, Sunday=7)
    let triggerWeekDays = [];
    if (alarm.days.length === 0) { // Báo thức 1 lần
        // Lập lịch cho lần tiếp theo xảy ra
        const now = new Date();
        const triggerDate = new Date();
        triggerDate.setHours(hour, minute, 0, 0);
        if (triggerDate.getTime() <= now.getTime()) {
            triggerDate.setDate(triggerDate.getDate() + 1);
        }
         console.log(`iOS one-time trigger: ${triggerDate}`);
         await Notifications.scheduleNotificationAsync({
             content: createNotificationContent(alarm),
             trigger: triggerDate,
         });

    } else { // Báo thức lặp lại
        if (alarm.days.includes('Every day')) {
             triggerWeekDays = [1, 2, 3, 4, 5, 6, 7];
        } else {
             triggerWeekDays = alarm.days.map(getWeekdayNumber).filter(d => d > 0);
        }

        console.log(`iOS repeating trigger for weekdays: ${triggerWeekDays}`);
        for (const weekDay of triggerWeekDays) {
             await Notifications.scheduleNotificationAsync({
                 content: createNotificationContent(alarm),
                 trigger: {
                     hour: hour,
                     minute: minute,
                     weekday: weekDay,
                     repeats: true,
                 },
             });
        }
    }
    console.log(`iOS scheduling completed for alarm ${alarm.id}.`);
    return true;
  } catch (error) {
    console.error(`Error scheduling iOS alarm ${alarm.id}:`, error);
    return false;
  }
};

// Lập lịch báo thức cho Android
const scheduleAlarmForAndroid = async (alarm) => {
  try {
    console.log(`Scheduling alarm ${alarm.id} for Android...`);
    const hour = Math.floor(alarm.time / 60);
    const minute = alarm.time % 60;

    // Xác định các ngày sẽ báo thức (1-7, Sunday=7)
    let triggerWeekDays = [];
    if (alarm.days.length === 0) { // Báo thức 1 lần
        const now = new Date();
        const triggerDate = new Date();
        triggerDate.setHours(hour, minute, 0, 0);

        if (triggerDate.getTime() <= now.getTime()) {
            triggerDate.setDate(triggerDate.getDate() + 1);
        }
        
        console.log(`Android one-time trigger: ${triggerDate}`);
        await Notifications.scheduleNotificationAsync({
            content: createNotificationContent(alarm),
            trigger: {
                date: triggerDate,
                channelId: ALARM_NOTIFICATION_CHANNEL_ID,
            },
        });
    } else { // Báo thức lặp lại
         if (alarm.days.includes('Every day')) {
             triggerWeekDays = [1, 2, 3, 4, 5, 6, 7];
         } else {
             triggerWeekDays = alarm.days.map(getWeekdayNumber).filter(d => d > 0);
         }

        console.log(`Android repeating trigger for weekdays: ${triggerWeekDays}`);
        for (const weekDay of triggerWeekDays) {
            await Notifications.scheduleNotificationAsync({
                content: createNotificationContent(alarm),
                trigger: {
                    hour: hour,
                    minute: minute,
                    weekday: weekDay,
                    repeats: true,
                    channelId: ALARM_NOTIFICATION_CHANNEL_ID,
                },
            });
        }
    }

    console.log(`Android scheduling completed for alarm ${alarm.id}.`);
    return true;
  } catch (error) {
    console.error(`Error scheduling Android alarm ${alarm.id}:`, error);
    return false;
  }
};

// Hàm lập lịch chính
export const scheduleAlarm = async (alarm) => {
  try {
    console.log(`Initiating scheduling for alarm: ${alarm.id}`);

    // 1. Đảm bảo có quyền và kênh đã được thiết lập
    const permissionsGranted = await registerForPushNotificationsAsync();
    if (!permissionsGranted) {
        console.error(`Cannot schedule alarm ${alarm.id}, notification permissions not granted.`);
        return false;
    }

    // 2. Hủy các thông báo cũ của báo thức này trước khi lập lịch mới
    await cancelAlarmNotifications(alarm.id);

    // 3. Lập lịch dựa trên Platform và trạng thái active
    let success = false;
    if (alarm.active) {
        if (Platform.OS === 'ios') {
            success = await scheduleAlarmForIOS(alarm);
        } else {
            success = await scheduleAlarmForAndroid(alarm);
        }
    } else {
        console.log(`Alarm ${alarm.id} is inactive, skipping scheduling.`);
        success = true;
    }

    // Log all scheduled notifications for debugging
    await logScheduledNotifications();

    console.log(`Scheduling process finished for alarm ${alarm.id}. Active: ${alarm.active}`);
    return success;

  } catch (error) {
    console.error(`Error in main scheduleAlarm function for alarm ${alarm.id}:`, error);
    return false;
  }
};

// Hủy tất cả thông báo đã lập lịch liên quan đến báo thức
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
    return true;
  } catch (error) {
    console.error(`Error cancelling scheduled notifications for alarm ${alarmId}:`, error);
    return false;
  }
};