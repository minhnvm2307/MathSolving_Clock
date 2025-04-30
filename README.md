# Hướng dẫn cài đặt và sử dụng ứng dụng "Báo thức - MathSolving"

## Cài đặt môi trường phát triển

### Bước 1: Cài đặt Node.js và npm
- Tải và cài đặt Node.js từ trang chủ: https://nodejs.org/ (nên dùng phiên bản LTS)
- Việc cài đặt Node.js sẽ tự động bao gồm npm (Node Package Manager)

### Bước 2: Cài đặt Expo CLI
```bash
npm install -g expo-cli
```

### Bước 3: Tạo dự án và cài đặt các thư viện cần thiết
```bash
# Tạo dự án mới
expo init MathSolvingAlarm
cd MathSolvingAlarm

# Cài đặt các thư viện cần thiết từ package.json
npm install @react-native-async-storage/async-storage
npm install @react-native-community/datetimepicker
npm install @react-native-community/slider
npm install @react-navigation/bottom-tabs @react-navigation/native @react-navigation/stack
npm install expo-notifications
npm install firebase
npm install react-native-gesture-handler
npm install react-native-safe-area-context
npm install react-native-screens
npm install react-native-uuid
```

### Bước 4: Thiết lập Firebase
1. Truy cập [Firebase Console](https://console.firebase.google.com/)
2. Tạo dự án mới
3. Thêm ứng dụng Web vào dự án Firebase
4. Lấy thông tin cấu hình Firebase và cập nhật vào tệp `firebase/config.js`

### Bước 5: Cập nhật mã nguồn
- Tạo cấu trúc thư mục và tệp như đã mô tả trong code
- Sao chép mã nguồn từ các tệp đã cung cấp vào các tệp tương ứng trong dự án

### Bước 6: Khởi chạy ứng dụng
```bash
expo start
```

## Cấu trúc dự án

```
MathSolvingAlarm/
├── assets/
├── screens/
│   ├── AlarmListScreen.js
│   ├── AddAlarmScreen.js
│   ├── SettingsScreen.js
│   ├── MathProblemScreen.js
├── service/
│   ├── AlarmService.js
├── firebase/
│   ├── config.js
├── App.js
├── package.json
```

## Hướng dẫn sử dụng ứng dụng

### Thiết lập báo thức
1. Khởi động ứng dụng MathSolving Alarm
2. Trong tab "Alarms", nhấn vào nút "+" ở góc phải dưới để thêm báo thức mới
3. Chọn thời gian báo thức bằng bộ chọn thời gian
4. Chọn các ngày lặp lại (Mon, Tue, Wed,...)
5. Chọn độ khó của bài toán cần giải để tắt báo thức:
   - Easy: Phép cộng/trừ đơn giản
   - Medium: Phép nhân đơn giản
   - Hard: Phép tính hỗn hợp
   - Expert: Phương trình, ước chung/bội chung, phần trăm
6. Tùy chỉnh các lựa chọn khác (Vibrate, Allow Snooze)
7. Nhấn "Save Alarm" để lưu báo thức

### Quản lý báo thức
1. Xem danh sách báo thức trong tab "Alarms"
2. Bật/tắt báo thức bằng cách sử dụng công tắc bên cạnh mỗi báo thức
3. Xóa báo thức bằng cách nhấn vào biểu tượng thùng rác

### Tùy chỉnh cài đặt
1. Mở tab "Settings"
2. Điều chỉnh âm lượng báo thức
3. Đặt thời gian báo lại (Snooze)
4. Thiết lập thời gian giải bài toán tối đa (Math Problem Timeout)
5. Bật/tắt chế độ tối (Dark Mode)

### Khi báo thức kêu
1. Báo thức sẽ kêu tại thời điểm đã đặt
2. Mở thông báo báo thức để chuyển đến màn hình giải toán
3. Giải bài toán được hiển thị trong thời gian quy định
4. Nếu giải đúng, báo thức sẽ tắt
5. Nếu giải sai, bạn sẽ được yêu cầu thử lại
6. Nếu hết thời gian giải toán, báo thức sẽ tiếp tục kêu

## Tính năng nâng cao có thể phát triển thêm

1. **Hệ thống đăng nhập**: Cho phép người dùng đăng nhập/đăng ký tài khoản để lưu báo thức trên cloud
2. **Tùy chỉnh âm báo thức**: Cho phép người dùng chọn âm báo theo sở thích
3. **Thống kê hiệu suất**: Theo dõi tốc độ giải toán và độ chính xác
4. **Chế độ thách thức**: Chỉ cho phép tắt báo thức sau khi giải được nhiều bài toán
5. **Chia sẻ thành tích**: Cho phép chia sẻ kết quả giải toán lên mạng xã hội
6. **Widget màn hình chính**: Hiển thị báo thức sắp tới trên màn hình chính
7. **Báo thức thông minh**: Tự động điều chỉnh độ khó bài toán dựa trên khả năng của người dùng