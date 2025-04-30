// File: service/AlarmService.js
import { Platform, AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';

// Định nghĩa task chạy nền (vai trò giảm bớt, chủ yếu để dự phòng/khởi động lại)
const BACKGROUND_ALARM_CHECK = 'background-alarm-check-v2'; // Đổi tên để tránh xung đột task cũ


// Kênh thông báo cho Android (Quan trọng!)
const ALARM_NOTIFICATION_CHANNEL_ID = 'mathAlarmChannel';

// Biến âm thanh
let alarmSound = null;
let alarmSoundPlaying = false;

// --- Cấu hình Thông báo và Âm thanh ---
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
      // Xử lý khi nhận thông báo LÚC APP ĐANG MỞ
      console.log('Notification received while app is foregrounded:', notification);
      const data = notification.request.content.data;

      // Nếu là báo thức (scheduled hoặc snoozed) và app đang mở, bắt đầu phát âm thanh
      if (data?.alarmId) {
          console.log(`Foreground: Alarm ${data.alarmId} received. Playing sound.`);
          await playAlarmSound(); // Phát âm thanh

          // Quan trọng: Không tự động hiển thị alert nếu app đang mở,
          // mà nên dựa vào UI của app (ví dụ: hiển thị modal giải toán)
          // Tuy nhiên, để đơn giản, ta vẫn cho phép hiển thị alert
          // nhưng tắt âm thanh mặc định vì đã tự phát.
          return {
              shouldShowAlert: true, // Vẫn hiển thị alert/banner
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


// Tải và chuẩn bị âm thanh (không đổi)
export const loadAlarmSound = async () => {
  try {
    if (alarmSound === null) {
      const { sound } = await Audio.Sound.createAsync(
        require('../assets/alarm-clock-short-6402.mp3'),
        { isLooping: true }
      );
      alarmSound = sound;
      console.log('Alarm sound loaded successfully.');
    } else {
        console.log('Alarm sound already loaded.');
    }
  } catch (error) {
    console.error('Error loading alarm sound:', error);
  }
};

// Phát âm thanh báo thức (không đổi)
export const playAlarmSound = async () => {
  try {
    await loadAlarmSound(); // Đảm bảo âm thanh đã được tải

    if (alarmSound && !alarmSoundPlaying) {
        console.log('Playing alarm sound...');
        await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true,
            shouldDuckAndroid: false, // Không giảm âm lượng nhạc khác
            staysActiveInBackground: true, // QUAN TRỌNG cho cả 2 nền tảng
            playThroughEarpieceAndroid: false // Phát ra loa ngoài
        });
        await alarmSound.replayAsync(); // Sử dụng replayAsync để đảm bảo phát từ đầu và lặp lại
        await alarmSound.playAsync(); // Hoặc playAsync nếu không cần replay
        alarmSoundPlaying = true;
        console.log('Đang báo thức!!');
    } else if (alarmSoundPlaying) {
        console.log('Vẫn đang có báo thức!');
    } else {
        console.error('Cannot play sound, alarmSound object is null.');
    }
  } catch (error) {
    console.error('Error playing alarm sound:', error);
  }
};

// Dừng âm thanh báo thức (không đổi)
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

// --- Quản lý Task Nền (Vai trò giảm bớt) ---

TaskManager.defineTask(BACKGROUND_ALARM_CHECK, async () => {
  const now = new Date();
  console.log(`BACKGROUND_ALARM_CHECK task executed at: ${now.toISOString()}`);

  // *** LOGIC CŨ BỊ LOẠI BỎ ***
  // Tác vụ này không còn chịu trách nhiệm chính trong việc *kích hoạt* báo thức.
  // Việc kích hoạt dựa vào Notifications.scheduleNotificationAsync.

  // Có thể thêm logic ở đây trong tương lai để:
  // 1. Kiểm tra các báo thức đang active trong AsyncStorage.
  // 2. Gọi Notifications.getAllScheduledNotificationsAsync().
  // 3. So sánh và đảm bảo các thông báo tương ứng vẫn được lập lịch (đặc biệt sau khi reboot).
  // 4. Nếu thiếu, gọi lại hàm scheduleAlarmForPlatform() để lập lịch lại.
  // => Việc này phức tạp và cần kiểm thử kỹ lưỡng.

  try {
    // Hiện tại chỉ ghi log là nó đã chạy
    console.log('Background check finished. No direct triggering action taken.');
    return BackgroundFetch.BackgroundFetchResult.NoData; // Hoặc .NewData nếu có thực hiện kiểm tra/sửa đổi
  } catch (error) {
    console.error('Error in background alarm check task:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// Đăng ký task chạy nền (Vẫn giữ để có thể dùng sau này)
export const registerBackgroundTask = async () => {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_ALARM_CHECK);
    if (isRegistered) {
        console.log('Background task already registered.');
    }

    // Kiểm tra xem BackgroundFetch có khả dụng không
    const status = await BackgroundFetch.getStatusAsync();
     if (status !== BackgroundFetch.BackgroundFetchStatus.Available) {
         console.warn(`Background fetch status: ${status}. Task might not run reliably.`);
     }


    console.log('Registering background task:', BACKGROUND_ALARM_CHECK);
    await BackgroundFetch.registerTaskAsync(BACKGROUND_ALARM_CHECK, {
      minimumInterval: 15 * 60, // Đặt khoảng thời gian hợp lý (15 phút là tối thiểu thường được chấp nhận)
      stopOnTerminate: false, // Tiếp tục chạy nền (cố gắng)
      startOnBoot: true,     // Tự khởi động sau khi reboot (cố gắng)
    });
    console.log('Background task registration attempt finished.');

    // Xác nhận lại sau khi đăng ký (tùy chọn)
    const registered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_ALARM_CHECK);
    console.log('Is background task registered now?', registered);

  } catch (error) {
    console.error('Error registering background task:', error);
  }
};

// --- Quyền và Thiết lập Kênh Thông báo ---

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
          allowSound: true, // Yêu cầu quyền phát âm thanh
          allowCriticalAlerts: true, // QUAN TRỌNG: Yêu cầu quyền cho báo thức quan trọng trên iOS
        },
        android: { // Android không cần yêu cầu cụ thể trong hàm này, quyền được ngầm định khi có kênh
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
        }
      });
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Notification permissions not granted!');
      // Cân nhắc hiển thị thông báo cho người dùng biết họ cần cấp quyền thủ công
      Alert.alert('Permission required', 'Please grant notification permissions in settings.');
      granted = false;
    } else {
      console.log('Notification permissions granted.');
      granted = true;
    }

     // 2. Thiết lập kênh thông báo cho Android (Oreo trở lên) - Rất quan trọng!
     if (Platform.OS === 'android') {
        console.log('Setting up Android notification channel...');
        await Notifications.setNotificationChannelAsync(ALARM_NOTIFICATION_CHANNEL_ID, {
          name: 'Math Alarms', // Tên hiển thị trong cài đặt Android
          importance: Notifications.AndroidImportance.MAX, // QUAN TRỌNG: Ưu tiên cao nhất
          bypassDnd: true, // QUAN TRỌNG: Cho phép vượt qua chế độ Không làm phiền
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC, // Hiển thị trên màn hình khóa
          sound: null, // QUAN TRỌNG: Đặt là null để sử dụng âm thanh tùy chỉnh từ app
          // sound: 'default', // Hoặc dùng âm thanh mặc định nếu không tự phát
          vibrationPattern: [0, 250, 250, 250], // Kiểu rung (có thể lấy từ alarm.vibrate)
          audioAttributes: { // Đảm bảo âm thanh được xử lý như báo thức
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

// --- Lập lịch và Hủy Báo thức ---

// Hàm phụ trợ: Lấy Wekday Number (1-7, Chủ nhật = 7) từ tên viết tắt
const getWeekdayNumber = (dayShort) => {
    const mapping = { 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6, 'Sun': 7 };
    return mapping[dayShort] ?? 0; // Trả về 0 nếu không khớp
}

// Hàm phụ trợ: Tạo nội dung thông báo chung
const createNotificationContent = (alarm) => {
    return {
        title: '⏰ MathSolving Alarm!',
        body: `Đến giờ rồi! ${alarm.mathDifficulty ? `Giải toán (${alarm.mathDifficulty}) để tắt.` : 'Dậy thôi!'}`,
        data: {
          alarmId: alarm.id,
          mathDifficulty: alarm.mathDifficulty,
          snoozeEnabled: alarm.snoozeEnabled,
          vibrate: alarm.vibrate, // Truyền cả cài đặt rung
          isScheduledAlarm: true // Đánh dấu đây là báo thức được lập lịch
        },
        // Cấu hình riêng cho từng nền tảng (nếu cần)
        //ios: { sound: true /* or custom sound file */, critical: true }, // Âm thanh và báo thức quan trọng iOS
        android: {
            channelId: ALARM_NOTIFICATION_CHANNEL_ID, // QUAN TRỌNG: Chỉ định kênh
            // sound: null, // Đã cấu hình trong kênh, nhưng có thể ghi đè ở đây nếu muốn
             priority: Notifications.AndroidNotificationPriority.MAX,
             vibrationPattern: alarm.vibrate ? [0, 250, 250, 250] : undefined, // Chỉ rung nếu bật
        },
        sticky: false, // Thông báo không tự biến mất (người dùng phải tương tác)
    };
}

// Lập lịch báo thức cho iOS (Giữ nguyên logic, chỉ đảm bảo dùng content mới)
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
            triggerDate.setDate(triggerDate.getDate() + 1); // Nếu giờ đã qua, đặt cho ngày mai
        }
         console.log(`iOS one-time trigger: ${triggerDate}`);
         await Notifications.scheduleNotificationAsync({
             content: createNotificationContent(alarm),
             trigger: triggerDate, // Trigger một lần vào ngày giờ cụ thể
         });

    } else { // Báo thức lặp lại
        if (alarm.days.includes('Every day')) { // Hàng ngày không được hỗ trợ trực tiếp bằng weekday=null
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
                     weekday: weekDay, // 1-7
                     repeats: true, // Lặp lại hàng tuần vào ngày này
                 },
             });
        }
    }
    console.log(`iOS scheduling completed for alarm ${alarm.id}.`);
  } catch (error) {
    console.error(`Error scheduling iOS alarm ${alarm.id}:`, error);
  }
};

// Lập lịch báo thức cho Android (SỬA ĐỔI HOÀN TOÀN)
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
                date: triggerDate, // Sử dụng trigger Date cho chính xác hơn
                channelId: ALARM_NOTIFICATION_CHANNEL_ID, // Nhắc lại channelId
            },
        });
    } else { // Báo thức lặp lại
         if (alarm.days.includes('Every day')) {
             triggerWeekDays = [1, 2, 3, 4, 5, 6, 7];
         } else {
             triggerWeekDays = alarm.days.map(getWeekdayNumber).filter(d => d > 0);
         }

        console.log(`Android repeating trigger for weekdays: ${triggerWeekDays}`);
        // Sử dụng trigger lặp lại theo weekday - CẢNH BÁO VỀ ĐỘ TIN CẬY
        for (const weekDay of triggerWeekDays) {
            await Notifications.scheduleNotificationAsync({
                content: createNotificationContent(alarm),
                trigger: {
                    hour: hour,
                    minute: minute,
                    weekday: weekDay, // 1-7
                    repeats: true,
                    channelId: ALARM_NOTIFICATION_CHANNEL_ID, // Chỉ định kênh
                },
            });
        }
        console.warn(`Android repeating alarm scheduled for ${alarm.id}. NOTE: Repeating triggers on Android might be less reliable due to OS optimizations. Consider re-scheduling logic if issues arise.`);
    }

    console.log(`Android scheduling completed for alarm ${alarm.id}.`);
  } catch (error) {
    console.error(`Error scheduling Android alarm ${alarm.id}:`, error);
  }
};

// Hàm lập lịch chính (Sửa đổi để gọi hàm cho từng platform)
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

    // 3. Đăng ký background task (vẫn đăng ký, dù vai trò giảm)
     await registerBackgroundTask(); // Đăng ký hoặc xác nhận đã đăng ký

    // 4. Lập lịch dựa trên Platform và trạng thái active
    if (alarm.active) {
        if (Platform.OS === 'ios') {
            await scheduleAlarmForIOS(alarm);
        } else {
            await scheduleAlarmForAndroid(alarm);
        }
    } else {
        console.log(`Alarm ${alarm.id} is inactive, skipping scheduling.`);
        // Đảm bảo không còn lịch trình nào sót lại
        await cancelAlarmNotifications(alarm.id);
    }

    // Log all scheduled notifications for debugging
    await logScheduledNotifications();

    console.log(`Scheduling process finished for alarm ${alarm.id}. Active: ${alarm.active}`);
    return true; // Trả về true nếu quá trình hoàn tất (không có lỗi nghiêm trọng)

  } catch (error) {
    console.error(`Error in main scheduleAlarm function for alarm ${alarm.id}:`, error);
    return false; // Trả về false nếu có lỗi
  }
};


// Hủy tất cả thông báo ĐÃ LẬP LỊCH liên quan đến báo thức
export const cancelAlarmNotifications = async (alarmId) => {
  try {
    console.log(`Cancelling scheduled notifications for alarm: ${alarmId}...`);
    let cancelledCount = 0;
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();

    for (const notification of scheduledNotifications) {
      // Kiểm tra data.alarmId một cách an toàn
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

    // 4. Hủy các thông báo đang hiển thị (presented) nếu có
     await dismissPresentedNotifications(alarmId);


    console.log(`Alarm ${alarmId} fully cancelled.`);
    return true;
  } catch (error) {
    console.error(`Error cancelling alarm ${alarmId}:`, error);
    return false;
  }
};

// Hủy các thông báo đang hiển thị (trên notification shade)
export const dismissPresentedNotifications = async (alarmId) => {
    try {
        const presentedNotifications = await Notifications.getPresentedNotificationsAsync();
        let dismissedCount = 0;
        for (const notification of presentedNotifications) {
            if (notification.request.content.data?.alarmId === alarmId && notification.identifier) {
                await Notifications.dismissNotificationAsync(notification.identifier);
                dismissedCount++;
                console.log(`Dismissed presented notification: ${notification.identifier}`);
            } else {
                console.warn(`Invalid notification identifier or no match for alarmId: ${alarmId}`);
            }
        }
         if (dismissedCount > 0) {
            console.log(`Dismissed ${dismissedCount} presented notifications for alarm ${alarmId}.`);
         }
    } catch(error) {
        console.error(`Error dismissing presented notifications for alarm ${alarmId}:`, error);
    }
}


// Hủy instance báo thức hiện tại (khi giải toán đúng / nhấn Dismiss)
export const dismissCurrentAlarm = async (alarmId) => {
  try {
    console.log(`Dismissing current ringing instance of alarm: ${alarmId}...`);
    // 1. Dừng âm thanh
    await stopAlarmSound();

    // 2. Xóa trạng thái báo thức đang kích hoạt
    await AsyncStorage.removeItem('activeAlarm');
    console.log(`Removed active alarm state for ${alarmId}.`);

    // 3. Hủy các thông báo đang hiển thị (presented) của báo thức này
     await dismissPresentedNotifications(alarmId);

    // QUAN TRỌNG: Nếu báo thức là loại lặp lại, chúng ta KHÔNG hủy lịch trình tương lai ở đây.
    // Việc hủy lịch trình tương lai chỉ xảy ra khi người dùng TẮT báo thức hoàn toàn (cancelAlarm).
    // Nếu là báo thức một lần, lịch trình của nó đã tự động bị xóa sau khi trigger (nếu dùng trigger Date).

    console.log(`Current instance of alarm ${alarmId} dismissed.`);
    return true;
  } catch (error) {
    console.error(`Error dismissing current alarm instance ${alarmId}:`, error);
    return false;
  }
};

// Báo lại (Snooze)
export const snoozeAlarm = async (alarmId, snoozeMinutes = 5) => {
  try {
    console.log(`Snoozing alarm ${alarmId} for ${snoozeMinutes} minutes...`);

    // 1. Dừng âm thanh hiện tại
    await stopAlarmSound();

    // 2. Xóa trạng thái báo thức đang kích hoạt
    // Lấy thông tin cần thiết trước khi xóa
    const activeAlarmJson = await AsyncStorage.getItem('activeAlarm');
    await AsyncStorage.removeItem('activeAlarm');

    if (!activeAlarmJson) {
        console.warn(`Could not snooze alarm ${alarmId}: No active alarm state found.`);
        return false;
    }
    const activeAlarmData = JSON.parse(activeAlarmJson); // Dùng data này để lập lịch snooze

    // 3. Hủy các thông báo đang hiển thị (presented)
    await dismissPresentedNotifications(alarmId);


    // 4. Lập lịch thông báo snooze
    const now = new Date();
    const snoozeTriggerDate = new Date(now.getTime() + snoozeMinutes * 60 * 1000);
    console.log(`Scheduling snooze notification for ${alarmId} at ${snoozeTriggerDate}`);

    await Notifications.scheduleNotificationAsync({
      content: { // Nội dung tương tự nhưng có thể ghi chú là (Snoozed)
        title: '⏰ MathSolving Alarm (Snoozed)',
        body: `Báo thức báo lại! ${activeAlarmData.mathDifficulty ? `Giải toán (${activeAlarmData.mathDifficulty}) để tắt.` : 'Dậy thôi!'}`,
        data: {
          alarmId: activeAlarmData.id,
          mathDifficulty: activeAlarmData.mathDifficulty,
          snoozeEnabled: activeAlarmData.snoozeEnabled, // Vẫn cho phép snooze tiếp?
          vibrate: activeAlarmData.vibrate,
          isSnooze: true // Đánh dấu đây là thông báo snooze
        },
       // ios: { sound: true, critical: true },
        android: {
            channelId: ALARM_NOTIFICATION_CHANNEL_ID,
            priority: Notifications.AndroidNotificationPriority.MAX,
             vibrationPattern: activeAlarmData.vibrate ? [0, 250, 250, 250] : undefined,
        },
      },
      trigger: {
          date: snoozeTriggerDate, // Trigger một lần vào thời gian snooze
          channelId: ALARM_NOTIFICATION_CHANNEL_ID, // Nhắc lại channel ID cho Android
      }
    });

    console.log(`Alarm ${alarmId} snoozed successfully.`);
    return true;
  } catch (error) {
    console.error(`Error snoozing alarm ${alarmId}:`, error);
    return false;
  }
};


// --- Thiết lập Bộ xử lý Thông báo và Trạng thái App ---

export const setupNotificationHandler = (navigation) => {
  console.log('Setting up notification handlers...');

  // 1. Xử lý khi nhận được thông báo LÚC APP ĐANG CHẠY (Foreground)
  // Đã được chuyển vào Notifications.setNotificationHandler() ở đầu file.

  // 2. Xử lý khi người dùng TƯƠNG TÁC (nhấn) với thông báo
  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('Notification response received:', response);
    const data = response.notification.request.content.data;
    const actionIdentifier = response.actionIdentifier; // Check for custom actions later

    // Nếu người dùng nhấn vào thông báo báo thức (scheduled hoặc snoozed)
    if (data?.alarmId) {
        console.log(`User interacted with notification for alarm ${data.alarmId}. Action: ${actionIdentifier}`);

        // Luôn điều hướng đến màn hình giải toán khi nhấn vào thông báo chính
        // (Nếu có action 'snooze' hoặc 'dismiss' trực tiếp trên thông báo thì xử lý khác ở đây)
        if (actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
            console.log(`Navigating to MathProblem for alarm ${data.alarmId}`);
            playAlarmSound(); // Có thể cần gọi lại ở đây hoặc trong màn hình MathProblem

            // Lưu lại trạng thái activeAlarm nếu chưa có (ví dụ: app bị kill hoàn toàn)
             AsyncStorage.setItem('activeAlarm', JSON.stringify({
                id: data.alarmId,
                mathDifficulty: data.mathDifficulty,
                snoozeEnabled: data.snoozeEnabled,
                vibrate: data.vibrate,
                timestamp: Date.now() // Cập nhật timestamp
            })).catch(err => console.error("Error saving activeAlarm on notification response:", err));


            navigation.navigate('MathProblem', {
                alarmId: data.alarmId,
                mathDifficulty: data.mathDifficulty,
                snoozeEnabled: data.snoozeEnabled,
                 vibrate: data.vibrate,
                // Truyền các hàm callback để màn hình MathProblem gọi lại service
                onSolve: async () => {
                    await dismissCurrentAlarm(data.alarmId);
                    if (navigation.canGoBack()) navigation.goBack();
                 },
                 onSnooze: async (snoozeTime) => {
                     await snoozeAlarm(data.alarmId, snoozeTime);
                      if (navigation.canGoBack()) navigation.goBack(); // Thoát màn hình giải toán sau khi snooze
                 }
            });
        } else {
            // Xử lý các action khác nếu bạn thêm nút vào thông báo (ví dụ: snooze trực tiếp)
            console.log(`Handling custom action: ${actionIdentifier}`);
        }
    }
  });

  // 3. Xử lý khi
  const checkActiveAlarmOnResume = async () => {
      try {
          const activeAlarmJson = await AsyncStorage.getItem('activeAlarm');
          if (activeAlarmJson) {
              const activeAlarm = JSON.parse(activeAlarmJson);
              console.log(`App resumed. Found active alarm state for ${activeAlarm.id}. Ensuring sound is playing and navigating.`);
              // Đảm bảo âm thanh đang phát
              await playAlarmSound();

              // Hiển thị màn hình giải toán nếu chưa ở đó
              // Cần kiểm tra màn hình hiện tại để tránh navigate lặp lại
              const currentRoute = navigation.getCurrentRoute();
              if (currentRoute?.name !== 'MathProblem') {
                navigation.navigate('MathProblem', {
                     alarmId: activeAlarm.id,
                     mathDifficulty: activeAlarm.mathDifficulty,
                     snoozeEnabled: activeAlarm.snoozeEnabled,
                     vibrate: activeAlarm.vibrate,
                     onSolve: async () => {
                         await dismissCurrentAlarm(activeAlarm.id);
                          if (navigation.canGoBack()) navigation.goBack();
                     },
                     onSnooze: async (snoozeTime) => {
                         await snoozeAlarm(activeAlarm.id, snoozeTime);
                          if (navigation.canGoBack()) navigation.goBack();
                     }
                 });
              } else {
                 console.log("Already on MathProblem screen.");
              }
          } else {
              console.log("App resumed. No active alarm found in state.");
              // Có thể dừng âm thanh nếu nó đang phát mà không có trạng thái active? (đề phòng)
               await stopAlarmSound();
          }
      } catch (error) {
          console.error('Error checking active alarm on resume:', error);
      }
  };

  const appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
    console.log('AppState changed to:', nextAppState);
    if (nextAppState === 'active') {
        // Khi app quay lại foreground, kiểm tra xem có báo thức nào đang active không
        checkActiveAlarmOnResume();
    } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        // Khi app vào background, không cần làm gì đặc biệt ở đây
        // Âm thanh nên tiếp tục phát nhờ 'staysActiveInBackground: true'
    }
  });

  // Kiểm tra ngay khi setup (cho lần đầu mở app)
  checkActiveAlarmOnResume();

  // Hàm cleanup khi component unmount
  return () => {
    console.log('Removing notification handlers and AppState subscription.');
    Notifications.removeNotificationSubscription(responseListener);
    appStateSubscription.remove();
  };
};

// --- Khởi tạo ban đầu ---
// Gọi các hàm cần thiết khi service được import lần đầu (ví dụ trong App.js)
export const initializeAlarmService = async () => {
    console.log('Initializing Alarm Service...');
    await loadAlarmSound(); // Tải sẵn âm thanh
    await registerForPushNotificationsAsync(); // Xin quyền và tạo kênh
    await registerBackgroundTask(); // Đăng ký task nền (dự phòng)
    console.log('Alarm Service initialized.');
}

// Function to log all scheduled notifications for debugging
const logScheduledNotifications = async () => {
  try {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    console.log('Currently scheduled notifications:', scheduledNotifications);
  } catch (error) {
    console.error('Error fetching scheduled notifications:', error);
  }
};