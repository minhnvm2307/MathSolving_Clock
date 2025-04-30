// File: screens/AddAlarmScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, Platform, Button } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Slider from '@react-native-community/slider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';
// Thay đổi import để chỉ lấy scheduleAlarm từ service
import { scheduleAlarm } from '../service/AlarmService'; // Chỉ cần scheduleAlarm ở đây

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const mathLevels = ['Easy', 'Medium', 'Hard', 'Expert'];

const AddAlarmScreen = ({ navigation, route }) => {
  const [time, setTime] = useState(new Date());
  const [remainingTime, setRemainingTime] = useState('');
  const [selectedDays, setSelectedDays] = useState([]);
  const [mathDifficulty, setMathDifficulty] = useState(1); // 0-3
  const [vibrate, setVibrate] = useState(true); // Giữ lại vì có thể cần cho thông báo Android
  const [snoozeEnabled, setSnoozeEnabled] = useState(true);
  const [showTimePicker, setShowTimePicker] = useState(Platform.OS === 'android');

  const toggleDay = (day) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const saveAlarm = async () => {
    try {
      // Get current alarms
      const savedAlarms = await AsyncStorage.getItem('alarms');
      const alarms = savedAlarms ? JSON.parse(savedAlarms) : [];

      // Create new alarm object
      const totalMinutes = time.getHours() * 60 + time.getMinutes();
      const newAlarm = {
        id: uuid.v4(),
        time: totalMinutes, // Lưu dưới dạng tổng số phút từ nửa đêm
        days: selectedDays.length > 0 ? selectedDays : [], // Lưu mảng rỗng nếu không chọn ngày
        mathDifficulty: mathLevels[mathDifficulty],
        vibrate: vibrate, // Lưu trạng thái vibrate
        snoozeEnabled: snoozeEnabled,
        active: true, // Mặc định là active khi tạo mới
      };

      // Add or update alarm in the list
      // (Trong trường hợp chỉnh sửa, bạn sẽ cần tìm và thay thế thay vì chỉ thêm)
      // Hiện tại chỉ xử lý thêm mới
      const updatedAlarms = [...alarms, newAlarm];
      await AsyncStorage.setItem('alarms', JSON.stringify(updatedAlarms));
      console.log('Alarm data saved to AsyncStorage:', newAlarm);
      console.log('Updated alarms list:', updatedAlarms);

      // Schedule the alarm using the service
      const scheduled = await scheduleAlarm(newAlarm); // Gọi hàm scheduleAlarm đã sửa đổi

      if (scheduled) {
        console.log('Alarm scheduling process initiated successfully.');
      } else {
        console.warn('Alarm scheduling process failed.');
        // Có thể hiển thị thông báo lỗi cho người dùng ở đây
      }

      console.log('Navigating back to Alarm List Screen');
      navigation.goBack(); // Quay lại màn hình trước đó

    } catch (error) {
      console.error('Error saving or scheduling alarm:', error);
      // Hiển thị thông báo lỗi cho người dùng
    }
  };

  const calculateRemainingTime = () => {
    const now = new Date();
    const alarmTime = new Date();
    alarmTime.setHours(time.getHours(), time.getMinutes(), 0, 0);

    let diff = alarmTime.getTime() - now.getTime(); // Sử dụng getTime() để so sánh an toàn hơn
    if (diff < 0) {
      diff += 24 * 60 * 60 * 1000; // Add 24 hours if the time is for the next day
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    setRemainingTime(`${hours}h ${minutes}m`);
  };

  useEffect(() => {
    calculateRemainingTime();
    const interval = setInterval(calculateRemainingTime, 60000); // Cập nhật mỗi phút
    return () => clearInterval(interval); // Cleanup interval
  }, [time]);

  const onTimeChange = (event, selectedTime) => {
    const currentTime = selectedTime || time;
    // On Android, hide the picker immediately after selection
    if (Platform.OS === 'android') {
        setShowTimePicker(false); // Ẩn picker sau khi chọn (nếu dùng modal/dialog)
    }
     // Chỉ cập nhật nếu thực sự có thời gian được chọn (tránh lỗi khi hủy)
     if (currentTime) {
        setTime(currentTime);
     }
  };

  const showTimePickerDialog = () => {
    setShowTimePicker(true);
  };

  const timePickerView = () => {
    const formattedTime = time.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false // Hoặc false tùy theo định dạng bạn muốn
    });

    return (
      <View style={styles.timePickerContainer}>
        {Platform.OS === 'ios' ? (
          <DateTimePicker
            value={time}
            mode="time"
            display="spinner" // Hoặc "compact", "inline"
            onChange={onTimeChange}
            style={{ width: '100%' }}
          />
        ) : (
          <>
            <TouchableOpacity onPress={showTimePickerDialog}>
              <Text style={styles.timeText}>{formattedTime}</Text>
            </TouchableOpacity>
            {showTimePicker && (
              <DateTimePicker
                value={time}
                mode="time"
                display="default" // clock or spinner depending on Android version
                onChange={onTimeChange}
              />
            )}
          </>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {timePickerView()}
      <Text style={styles.remainingTimeText}>Báo thức sau: {remainingTime}</Text>

      <Text style={styles.sectionTitle}>Lặp lại</Text>
      <View style={styles.daysContainer}>
        {days.map((day) => (
          <TouchableOpacity
            key={day}
            style={[
              styles.dayButton,
              selectedDays.includes(day) && styles.selectedDay,
            ]}
            onPress={() => toggleDay(day)}
          >
            <Text style={[
              styles.dayText,
              selectedDays.includes(day) && styles.selectedDayText,
            ]}>
              {/* Có thể dịch sang tiếng Việt nếu muốn */}
              {day}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.infoText}>
        {selectedDays.length === 0 ? "Báo thức một lần" : `Lặp lại vào ${selectedDays.join(', ')}`}
        {selectedDays.length === 7 ? " (Hàng ngày)" : ""}
      </Text>

      <Text style={styles.sectionTitle}>Độ khó bài toán</Text>
      <View style={styles.sliderContainer}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={3}
          step={1}
          value={mathDifficulty}
          onValueChange={setMathDifficulty} // Trực tiếp gán giá trị số (0-3)
          minimumTrackTintColor="#2196F3"
          maximumTrackTintColor="#ccc"
        />
        <Text style={styles.sliderValue}>{mathLevels[mathDifficulty]}</Text>
      </View>

      <View style={styles.settingRow}>
        <Text style={styles.settingText}>Rung</Text>
        <Switch value={vibrate} onValueChange={setVibrate} trackColor={{ false: "#767577", true: "#81b0ff" }} thumbColor={vibrate ? "#2196F3" : "#f4f3f4"}/>
      </View>

      <View style={styles.settingRow}>
        <Text style={styles.settingText}>Cho phép báo lại (Snooze)</Text>
        <Switch value={snoozeEnabled} onValueChange={setSnoozeEnabled} trackColor={{ false: "#767577", true: "#81b0ff" }} thumbColor={snoozeEnabled ? "#2196F3" : "#f4f3f4"}/>
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={saveAlarm}>
        <Text style={styles.saveButtonText}>Lưu Báo Thức</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9', // Màu nền nhẹ nhàng
    padding: 20, // Tăng padding
  },
  timePickerContainer: {
    backgroundColor: 'white',
    borderRadius: 12, // Bo góc nhiều hơn
    marginBottom: 25, // Tăng khoảng cách
    padding: 20,
    alignItems: 'center',
    shadowColor: "#000", // Thêm bóng đổ nhẹ
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  timeText: {
    fontSize: 48, // Tăng kích thước giờ
    fontWeight: 'bold',
    color: '#1976D2', // Màu xanh đậm hơn
    letterSpacing: 1, // Giãn cách chữ
  },
  remainingTimeText: {
      fontSize: 16,
      color: '#555', // Màu chữ đậm hơn
      textAlign: 'center',
      marginBottom: 25, // Tăng khoảng cách dưới
  },
  sectionTitle: {
    fontSize: 18, // Tăng kích thước tiêu đề
    fontWeight: '600', // Đậm vừa
    marginBottom: 15, // Tăng khoảng cách dưới
    color: '#333',
    borderLeftWidth: 4, // Thêm đường kẻ trang trí
    borderLeftColor: '#2196F3',
    paddingLeft: 8,
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around', // Phân bố đều hơn
    marginBottom: 10, // Giảm khoảng cách dưới để infoText gần hơn
  },
  dayButton: {
    width: 44, // Tăng kích thước nút ngày
    height: 44,
    borderRadius: 22, // Bo tròn hoàn hảo
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e0e0', // Màu nền xám nhạt
    borderWidth: 1,
    borderColor: '#ccc',
  },
  selectedDay: {
    backgroundColor: '#2196F3',
    borderColor: '#1976D2',
  },
  dayText: {
    color: '#444', // Màu chữ đậm hơn
    fontWeight: '500',
  },
  selectedDayText: {
    color: 'white',
    fontWeight: 'bold',
  },
  infoText: { // Style cho text thông tin ngày
      fontSize: 14,
      color: '#666',
      textAlign: 'center',
      marginBottom: 25, // Tăng khoảng cách dưới
      fontStyle: 'italic',
  },
  sliderContainer: {
    alignItems: 'stretch', // Kéo dài slider theo chiều ngang
    marginBottom: 25,
    backgroundColor: 'white', // Đặt slider trong nền trắng
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2.22,
    elevation: 2,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderValue: {
    fontSize: 16,
    marginTop: 10, // Tăng khoảng cách trên
    color: '#2196F3',
    textAlign: 'center', // Căn giữa text độ khó
    fontWeight: '500',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18, // Tăng padding dọc
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 18, // Tăng khoảng cách giữa các setting
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2.22,
    elevation: 2,
  },
  settingText: {
    fontSize: 17, // Tăng kích thước chữ setting
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 18, // Tăng padding nút lưu
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 25, // Tăng khoảng cách trên
    marginBottom: 40, // Tăng khoảng cách dưới cùng
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18, // Tăng kích thước chữ nút lưu
    fontWeight: 'bold',
  },
});

export default AddAlarmScreen;