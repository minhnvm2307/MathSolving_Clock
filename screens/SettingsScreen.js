// File: screens/SettingsScreen.js
import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';

const SettingsScreen = () => {
  const [alarmVolume, setAlarmVolume] = useState(80);
  const [snoozeTime, setSnoozeTime] = useState(5);
  const [mathTimeout, setMathTimeout] = useState(60);
  
  useEffect(() => {
    loadSettings();
  }, []);
  
  const loadSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem('settings');
      if (settings) {
        const parsedSettings = JSON.parse(settings);
        setAlarmVolume(parsedSettings.alarmVolume || 80);
        setSnoozeTime(parsedSettings.snoozeTime || 5);
        setMathTimeout(parsedSettings.mathTimeout || 60);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };
  
  const saveSettings = async () => {
    try {
      const settings = {
        alarmVolume,
        snoozeTime,
        mathTimeout,
      };
      await AsyncStorage.setItem('settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };
  
  useEffect(() => {
    saveSettings();
  }, [alarmVolume, snoozeTime, mathTimeout]);
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Audio</Text>
      <View style={styles.settingContainer}>
        <Text style={styles.settingLabel}>Alarm Volume</Text>
        <View style={styles.sliderContainer}>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={100}
            step={1}
            value={alarmVolume}
            onValueChange={setAlarmVolume}
            minimumTrackTintColor="#2196F3"
            maximumTrackTintColor="#ccc"
          />
          <Text style={styles.sliderValue}>{alarmVolume}%</Text>
        </View>
      </View>
      
      <Text style={styles.sectionTitle}>Alarm Behavior</Text>
      <View style={styles.settingContainer}>
        <Text style={styles.settingLabel}>Snooze Time (minutes)</Text>
        <View style={styles.sliderContainer}>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={30}
            step={1}
            value={snoozeTime}
            onValueChange={setSnoozeTime}
            minimumTrackTintColor="#2196F3"
            maximumTrackTintColor="#ccc"
          />
          <Text style={styles.sliderValue}>{snoozeTime} min</Text>
        </View>
      </View>
      
      <View style={styles.settingContainer}>
        <Text style={styles.settingLabel}>Math Problem Timeout (seconds)</Text>
        <View style={styles.sliderContainer}>
          <Slider
            style={styles.slider}
            minimumValue={15}
            maximumValue={180}
            step={15}
            value={mathTimeout}
            onValueChange={setMathTimeout}
            minimumTrackTintColor="#2196F3"
            maximumTrackTintColor="#ccc"
          />
          <Text style={styles.sliderValue}>{mathTimeout} sec</Text>
        </View>
      </View>
      
      <Text style={styles.sectionTitle}>Appearance</Text>
      
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Restore Defaults</Text>
      </TouchableOpacity>
      
      <Text style={styles.versionText}>MathSolving Alarm v1.0.0</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 12,
    color: '#333',
  },
  settingContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  settingLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  sliderContainer: {
    alignItems: 'center',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderValue: {
    fontSize: 16,
    color: '#2196F3',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#666',
    fontSize: 16,
  },
  versionText: {
    textAlign: 'center',
    marginTop: 32,
    marginBottom: 16,
    color: '#999',
  },
});

export default SettingsScreen;