// File: App.js
import React, { useState, useEffect, useRef } from 'react';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Screens
import AlarmListScreen from './screens/AlarmListScreen';
import SettingsScreen from './screens/SettingsScreen';
import AddAlarmScreen from './screens/AddAlarmScreen';
import MathProblemScreen from './screens/MathProblemScreen';
import AlphabetGameScreen from './screens/AlphabetGameScreen';
import QRCodeGameScreen from './screens/QRCodeGameScreen';

// Import from service modules
import { initializeAlarmService } from './service/BackgroundService';
import { setupNotificationHandler } from './service/NotificationService';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Tạo Tab Navigator riêng cho màn hình chính
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Alarms') {
            iconName = focused ? 'alarm' : 'alarm-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }
          // Đảm bảo trả về component
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2196F3', // Màu icon/label khi active
        tabBarInactiveTintColor: 'gray', // Màu icon/label khi inactive
        headerStyle: { // Thêm style cho header của Tab
             backgroundColor: '#f9f9f9',
        },
        headerTitleStyle: {
             fontWeight: 'bold',
        },
      })}
    >
      {/* Đặt tên màn hình nhất quán */}
      <Tab.Screen
         name="Alarms"
         component={AlarmListScreen}
         options={{ title: 'Danh sách báo thức' }} // Tiêu đề tiếng Việt
       />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Cài đặt' }} // Tiêu đề tiếng Việt
      />
    </Tab.Navigator>
  );
}

// Component App chính
export default function App() {
  // Sử dụng hook ref cho function component
  const navigationRef = useNavigationContainerRef();
  // State để theo dõi xem navigation đã sẵn sàng chưa
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  // State không dùng đến đã được xóa: const [notification, setNotification] = useState(false);

  // useEffect để khởi tạo service và setup handler khi navigation sẵn sàng
  useEffect(() => {
    let unsubscribeNotificationHandler = () => {}; // Khởi tạo hàm cleanup rỗng

    // Hàm thực hiện setup
    const performSetup = async () => {
        try {
            // Khởi tạo các thành phần service (tải âm thanh, xin quyền, tạo kênh, đăng ký task nền)
            await initializeAlarmService();

            // Chỉ setup handler khi navigation đã thực sự sẵn sàng
            if (isNavigationReady && navigationRef.isReady()) { // Kiểm tra cả state và ref
                // Truyền thẳng navigationRef vào hàm setup
                unsubscribeNotificationHandler = setupNotificationHandler(navigationRef);
            } else {
                console.log("Navigation not ready yet, deferring handler setup.");
            }
        } catch(error) {
            console.error("Error during initial setup:", error);
        }
    }

    performSetup();


    // Cleanup function: sẽ chạy khi component unmount hoặc dependencies thay đổi
    // và unsubscribeNotificationHandler đã được gán lại bên trong performSetup
    return () => {
      console.log("Cleaning up notification handlers.");
      // Gọi hàm cleanup đã được trả về từ setupNotificationHandler
      if (typeof unsubscribeNotificationHandler === 'function') {
            unsubscribeNotificationHandler();
      }
    };
  }, [isNavigationReady]); // Phụ thuộc vào isNavigationReady để setup handler đúng lúc

  return (
    // Gắn ref và callback onReady
    <NavigationContainer
        ref={navigationRef}
        onReady={() => {
            // Set state để trigger useEffect setup handler
            setIsNavigationReady(true);
        }}
    >
      {/* Stack Navigator chính */}
      <Stack.Navigator
          screenOptions={{
              headerStyle: { backgroundColor: '#f9f9f9' }, // Style chung cho header stack
              headerTintColor: '#333',
              headerTitleStyle: { fontWeight: 'bold' },
          }}
      >
        {/* Màn hình chứa Tab Navigator (ẩn header của Stack) */}
        <Stack.Screen
          name="MainTabs" // Đổi tên để rõ ràng hơn
          component={MainTabs}
          options={{ headerShown: false }} // Ẩn header của Stack cho màn hình Tab
        />
        {/* Màn hình Thêm/Sửa Báo thức */}
        <Stack.Screen
          name="AddAlarm"
          component={AddAlarmScreen}
          options={{
              title: 'Thêm Báo Thức', // Tiêu đề tiếng Việt
              headerBackTitleVisible: false, // Ẩn chữ "Back" trên iOS
          }}
        />
        {/* Màn hình Giải Toán */}
        <Stack.Screen
          name="MathProblem"
          component={MathProblemScreen}
          options={{
            title: 'Giải Toán Để Tắt', // Tiêu đề tiếng Việt
            headerBackVisible: false, // Ẩn nút back mặc định
            gestureEnabled: false, // Chặn cử chỉ vuốt quay lại
          }}
        />
        {/* Màn hình sắp xếp bảng chữ cái */}
        <Stack.Screen
          name="AlphabetGame"
          component={AlphabetGameScreen}
          options={{
            title: 'Sắp Xếp Bảng Chữ Cái',
            headerBackVisible: false, 
            gestureEnabled: false,
          }}
        />
        {/* Màn hình quét mã QR */}
        <Stack.Screen
          name="QRCodeGame"
          component={QRCodeGameScreen}
          options={{
            title: 'Quét Mã QR',
            headerBackVisible: false,
            gestureEnabled: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}