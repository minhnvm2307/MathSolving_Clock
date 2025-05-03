// File: screens/QRCodeGameScreen.js
import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, Alert, TouchableOpacity, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import generateQRProblem from '../games/QRCodeGame';

// Import barcode scanner in a way that handles errors
let BarCodeScanner;
try {
  BarCodeScanner = require('expo-barcode-scanner');
} catch (error) {
  console.warn('Failed to load expo-barcode-scanner:', error);
  BarCodeScanner = null;
}

const QRCodeGameScreen = ({ route, navigation }) => {
  const { difficulty, alarmId, onSolve } = route.params;
  const [problem, setProblem] = useState(null);
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60); // Default 60 seconds
  const [scannerError, setScannerError] = useState(BarCodeScanner ? null : 'Barcode scanner is not available');
  
  useEffect(() => {
    // Load timeout setting
    const loadTimeout = async () => {
      try {
        const settings = await AsyncStorage.getItem('settings');
        if (settings) {
          const parsedSettings = JSON.parse(settings);
          setTimeLeft(parsedSettings.gameTimeout || 60);
        }
      } catch (error) {
        console.error('Error loading timeout setting:', error);
      }
    };
    loadTimeout();
    
    // Generate problem
    setProblem(generateQRProblem(difficulty));
    
    // Request camera permission if scanner is available
    if (BarCodeScanner) {
      (async () => {
        try {
          const { status } = await BarCodeScanner.requestPermissionsAsync();
          setHasPermission(status === 'granted');
        } catch (error) {
          console.error('Error requesting camera permission:', error);
          setScannerError('Failed to request camera permission');
          setHasPermission(false);
        }
      })();
    }
  }, [difficulty]);
  
  useEffect(() => {
    // Timer countdown
    if (timeLeft <= 0) {
      Alert.alert(
        "Time's up!",
        "You didn't complete the task in time. The alarm will continue.",
        [{ text: "OK" }]
      );
      navigation.goBack();
      return;
    }
    
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => prevTime - 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeLeft]);
  
  const verifyScannedData = (data) => {
    if (!problem) return false;
    
    switch(problem.verificationLevel) {
      case 'any':
        // Any QR code data is valid
        return true;
        
      case 'text':
        // Ensure data has some content
        return data && data.length > 0;
        
      case 'url':
        // Simple URL validation - checks if starts with http:// or https://
        return /^https?:\/\//.test(data);
        
      case 'pattern':
        // Test against the regex pattern (e.g., email)
        return problem.pattern && problem.pattern.test(data);
        
      default:
        return true;
    }
  };

  // Emergency bypass function for when scanner doesn't work
  const emergencyBypass = () => {
    Alert.alert(
      "QR Scanner Not Available",
      "Due to technical limitations, we're allowing you to bypass this check. In a real scenario, you would need to scan a QR code.",
      [{ 
        text: "Turn Off Alarm", 
        onPress: () => {
          if (onSolve) onSolve();
          navigation.goBack();
        }
      }]
    );
  };
  
  const handleBarCodeScanned = ({ type, data }) => {
    setScanned(true);
    
    const isValid = verifyScannedData(data);
    
    if (isValid) {
      Alert.alert(
        "Success! 🎉",
        "Valid QR code scanned! Alarm will turn off now.",
        [{ text: "Great!", onPress: () => {
          if (onSolve) onSolve();
          navigation.goBack();
        }}]
      );
    } else {
      // If invalid, allow scanning again
      Alert.alert(
        "Invalid QR Code",
        `This QR code doesn't meet the requirements. ${problem?.question || ''}`,
        [{ text: "Try Again", onPress: () => setScanned(false) }]
      );
    }
  };

  // Error state when scanner is not available
  if (scannerError) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>QR Scanner Error</Text>
        <Text style={styles.errorSubtext}>{scannerError}</Text>
        <Text style={styles.errorSubtext}>This could be due to missing native modules or permissions.</Text>
        
        <TouchableOpacity 
          style={[styles.permissionButton, { marginBottom: 20 }]}
          onPress={emergencyBypass}
        >
          <Text style={styles.permissionButtonText}>Emergency Bypass</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.permissionButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.permissionButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  // State when asking for camera permission
  if (hasPermission === null) {
    return <View style={styles.container}><Text>Requesting camera permission...</Text></View>;
  }
  
  // State when permission is denied
  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No access to camera</Text>
        <Text style={styles.errorSubtext}>Camera access is required to scan QR codes</Text>
        
        <TouchableOpacity 
          style={[styles.permissionButton, { marginBottom: 20 }]}
          onPress={emergencyBypass}
        >
          <Text style={styles.permissionButtonText}>Emergency Bypass</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.permissionButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.permissionButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.timerContainer}>
        <Text style={[
          styles.timerText,
          { color: timeLeft < 10 ? 'red' : '#333' }
        ]}>
          Time Left: {timeLeft}s
        </Text>
      </View>
      
      <View style={styles.instructionContainer}>
        <Text style={styles.instructionText}>{problem?.question || 'Scan a QR code'}</Text>
      </View>
      
      <View style={styles.cameraContainer}>
        {BarCodeScanner && (
          <BarCodeScanner
            style={styles.camera}
            onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
            barCodeTypes={[BarCodeScanner.Constants?.BarCodeType?.qr].filter(Boolean)}
          />
        )}
      </View>
      
      {scanned && (
        <TouchableOpacity
          style={styles.scanAgainButton}
          onPress={() => setScanned(false)}
        >
          <Text style={styles.scanAgainText}>Tap to Scan Again</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[styles.scanAgainButton, { backgroundColor: '#FF9800', marginTop: 10 }]}
        onPress={emergencyBypass}
      >
        <Text style={styles.scanAgainText}>Emergency Bypass</Text>
      </TouchableOpacity>
      
      <View style={styles.hintContainer}>
        <Text style={styles.hintText}>
          Point your camera at a QR code to scan it.
          Find QR codes on product packages, advertisements, or create one online!
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  timerContainer: {
    position: 'absolute',
    top: 20,
    alignItems: 'center',
  },
  timerText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  instructionContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
  },
  instructionText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 15,
    borderRadius: 10,
  },
  cameraContainer: {
    width: '100%',
    aspectRatio: 1,
    overflow: 'hidden',
    borderRadius: 20,
    marginVertical: 30,
    backgroundColor: '#ddd',
  },
  camera: {
    flex: 1,
  },
  scanAgainButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    width: 200,
    alignItems: 'center',
  },
  scanAgainText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  hintContainer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
  },
  hintText: {
    color: '#555',
    textAlign: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 10,
    borderRadius: 10,
  },
  errorText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#f44336',
    marginBottom: 10,
  },
  errorSubtext: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 30,
  },
  permissionButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    width: 200,
    alignItems: 'center',
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default QRCodeGameScreen;