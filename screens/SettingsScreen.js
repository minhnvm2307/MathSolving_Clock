// File: screens/SettingsScreen.js
import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, Switch, TouchableOpacity, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import { SOUND_OPTIONS, DEFAULT_SOUND_ID, getSoundById } from '../service/soundOptions';
import { previewSound } from '../service/SoundService';

const SettingsScreen = () => {
  const [alarmVolume, setAlarmVolume] = useState(80);
  const [snoozeTime, setSnoozeTime] = useState(5);
  const [mathTimeout, setMathTimeout] = useState(60);
  const [soundId, setSoundId] = useState(DEFAULT_SOUND_ID);
  const [modalVisible, setModalVisible] = useState(false);
  
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
        setSoundId(parsedSettings.soundId || DEFAULT_SOUND_ID);
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
        soundId,
      };
      await AsyncStorage.setItem('settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };
  
  useEffect(() => {
    saveSettings();
  }, [alarmVolume, snoozeTime, mathTimeout, soundId]);
  
  const handleSelectSound = (id) => {
    setSoundId(id);
    setModalVisible(false);
  };
  
  const handlePreviewSound = (id) => {
    previewSound(id);
  };
  
  const getCurrentSoundName = () => {
    const sound = getSoundById(soundId);
    return sound ? sound.name : 'Default Alarm Sound';
  };
  
  const renderSoundSelectionModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Alarm Sound</Text>
          
          {SOUND_OPTIONS.map((option) => (
            <View key={option.id} style={styles.soundOption}>
              <TouchableOpacity 
                style={[
                  styles.soundOptionButton,
                  soundId === option.id && styles.selectedSoundOption
                ]}
                onPress={() => handleSelectSound(option.id)}
              >
                <Text style={styles.soundOptionText}>{option.name}</Text>
                {soundId === option.id && (
                  <Text style={styles.selectedIndicator}>✓</Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.previewButton}
                onPress={() => handlePreviewSound(option.id)}
              >
                <Text style={styles.previewButtonText}>Preview</Text>
              </TouchableOpacity>
            </View>
          ))}
          
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setModalVisible(false)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
  
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
      
      <TouchableOpacity 
        style={styles.settingContainer}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.settingLabel}>Alarm Sound</Text>
        <View style={styles.soundSelection}>
          <Text style={styles.soundName}>{getCurrentSoundName()}</Text>
          <Text style={styles.changeText}>Change ▸</Text>
        </View>
      </TouchableOpacity>
      
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
      
      <TouchableOpacity 
        style={styles.button}
        onPress={() => {
          setAlarmVolume(80);
          setSnoozeTime(5);
          setMathTimeout(60);
          setSoundId(DEFAULT_SOUND_ID);
        }}
      >
        <Text style={styles.buttonText}>Restore Defaults</Text>
      </TouchableOpacity>
      
      <Text style={styles.versionText}>MathSolving Alarm v1.0.0</Text>
      
      {renderSoundSelectionModal()}
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
  soundSelection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  soundName: {
    fontSize: 16,
    color: '#333',
  },
  changeText: {
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  soundOption: {
    flexDirection: 'row',
    width: '100%',
    marginVertical: 5,
    alignItems: 'center',
  },
  soundOptionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  selectedSoundOption: {
    backgroundColor: '#e6f7ff',
  },
  soundOptionText: {
    fontSize: 16,
  },
  selectedIndicator: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  previewButton: {
    marginLeft: 10,
    backgroundColor: '#2196F3',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  previewButtonText: {
    color: 'white',
    fontSize: 14,
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  closeButtonText: {
    fontSize: 16,
  },
});

export default SettingsScreen;