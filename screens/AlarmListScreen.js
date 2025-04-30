// File: screens/AlarmListScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createStackNavigator } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import AddAlarmScreen from './AddAlarmScreen';
import { scheduleAlarm, cancelAlarm } from '../service/AlarmService';

const Stack = createStackNavigator();

function AlarmList({ navigation }) {
  const [alarms, setAlarms] = useState([]);

  // Replace useEffect with useFocusEffect to reload alarms when the screen is focused
  useFocusEffect(
    useCallback(() => {
      loadAlarms();
    }, [])
  );

  const loadAlarms = async () => {
    try {
      const savedAlarms = await AsyncStorage.getItem('alarms');
      if (savedAlarms) {
        setAlarms(JSON.parse(savedAlarms));
      }
    } catch (error) {
      console.error('Error loading alarms:', error);
    }
  };

  const toggleAlarm = async (id) => {
    const updatedAlarms = alarms.map(alarm => 
      alarm.id === id ? { ...alarm, active: !alarm.active } : alarm
    );
    const toggledAlarm = updatedAlarms.find(a => a.id === id); // Get the modified alarm
    
    setAlarms(updatedAlarms);
    try {
      await AsyncStorage.setItem('alarms', JSON.stringify(updatedAlarms));

      if (toggledAlarm) {
        if (toggledAlarm.active) {
          await scheduleAlarm(toggledAlarm);
        } else {
          await cancelAlarm(id);
        }
      }
    } catch (error) {
      console.error('Error saving alarm state:', error);
      setAlarms(alarms);
    }
  };

  const deleteAlarm = async (id) => {
    const updatedAlarms = alarms.filter(alarm => alarm.id !== id);
    setAlarms(updatedAlarms);
    try {
        // Cancel before saving deletion
        await cancelAlarm(id);
        await AsyncStorage.setItem('alarms', JSON.stringify(updatedAlarms));
    } catch (error) {
        console.error('Error deleting alarm or cancelling schedule:', error);
        // Revert state or provide feedback if needed
        setAlarms(alarms); // Revert optimistic update on error
    }
  };

  const renderItem = ({ item }) => {
    const now = new Date();
    const alarmTime = new Date();
    alarmTime.setHours(Math.floor(item.time / 60));
    alarmTime.setMinutes(item.time % 60);
    alarmTime.setSeconds(0);
    alarmTime.setMilliseconds(0);

    // Adjust for alarms set for the next day
    if (alarmTime < now) {
      alarmTime.setDate(alarmTime.getDate() + 1);
    }

    return (
      <View style={styles.alarmItem}>
      <View style={styles.alarmInfo}>
        <Text style={styles.alarmTime}>
            {alarmTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
        <Text style={styles.alarmDays}>
            {item.days.length > 0 ? item.days.join(', ') : 'Chỉ một lần'}
        </Text>
        <Text style={styles.alarmDifficulty}>
            Độ khó: {item.mathDifficulty}
        </Text>
      </View>
      <View style={styles.alarmActions}>
        <Switch
        value={item.active}
        onValueChange={() => toggleAlarm(item.id)}
        />
        <TouchableOpacity onPress={() => deleteAlarm(item.id)}>
        <Ionicons name="trash-outline" size={24} color="red" />
        </TouchableOpacity>
      </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={alarms}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        ListEmptyComponent={
          <Text style={styles.emptyMessage}>Chưa có báo thức được đặt</Text>
        }
      />
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => navigation.navigate('AddAlarm')}
      >
        <Ionicons name="add-circle" size={67} color="#2196F3" />
      </TouchableOpacity>
    </View>
  );
}

const AlarmListScreen = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="Báo thức của tôi"
        component={AlarmList}
        options={{
          headerRight: () => (
            <Ionicons 
              name="information-circle-outline" 
              size={24} 
              color="#2196F3" 
              style={{ marginRight: 16 }}
            />
          ),
        }}
      />
      <Stack.Screen name="AddAlarm" component={AddAlarmScreen} options={{ title: 'Thêm báo thức' }} />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  alarmItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: 'white',
  },
  alarmInfo: {
    flex: 1,
  },
  alarmTime: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  alarmDays: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  alarmDifficulty: {
    fontSize: 12,
    color: '#2196F3',
    marginTop: 2,
  },
  alarmActions: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80,
    justifyContent: 'space-between',
  },
  addButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
  },
  emptyMessage: {
    textAlign: 'center',
    marginTop: 48,
    color: '#666',
    fontSize: 16,
  },
});

export default AlarmListScreen;