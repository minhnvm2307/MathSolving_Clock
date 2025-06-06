// File: screens/MathProblemScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import generateMathProblem from '../problems/MathProblems';

const MathProblemScreen = ({ route, navigation }) => {
  const { mathDifficulty, alarmId, onSolve } = route.params;
  const [problem, setProblem] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(60); // Default 60 seconds
  const [attempts, setAttempts] = useState(0);
  
  
  useEffect(() => {
    // Load timeout setting
    const loadTimeout = async () => {
      try {
        const settings = await AsyncStorage.getItem('settings');
        if (settings) {
          const parsedSettings = JSON.parse(settings);
          setTimeLeft(parsedSettings.mathTimeout || 60);
        }
      } catch (error) {
        console.error('Error loading timeout setting:', error);
      }
    };
    loadTimeout();
    
    // Generate problem
    setProblem(generateMathProblem(mathDifficulty));
  }, [mathDifficulty]);
  
  useEffect(() => {
    // Timer countdown
    if (timeLeft <= 0) {
      Alert.alert(
        "Time's up!",
        "You didn't solve the problem in time. The alarm will continue.",
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
  
  const checkAnswer = () => {
    if (!problem) return;
    
    const userNum = parseFloat(userAnswer);
    
    if (isNaN(userNum)) {
      Alert.alert("Invalid Input", "Please enter a valid number.");
      return;
    }
    
    // Check if answer is correct, allow for floating point imprecision
    const isCorrect = 
      Math.abs(userNum - problem.answer) < 0.001 || 
      (problem.acceptableAnswers && problem.acceptableAnswers.some(ans => Math.abs(userNum - ans) < 0.001));
    
    if (isCorrect) {
      Alert.alert(
        "Amazing good job em 🙌!",
        "Câu trả lời chính xác! Giờ thì em có thể ngủ tiếp rồi.👌😁",
        [{ text: "Great!", onPress: () => {
          if (onSolve) onSolve();
          navigation.goBack();
        }}]
      );
    } else {
      setAttempts(attempts + 1);
      Alert.alert(
        "Eeeeerrr",
        `Nonnn quá, hỏi chatGPT xem😒! Attempts: ${attempts + 1}`,
        [{ text: "OK", onPress: () => setUserAnswer('') }]
      );
    }
  };
  
  if (!problem) {
    return (
      <View style={styles.container}>
        <Text>Loading problem...</Text>
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
      
      <View style={styles.problemContainer}>
        <Text style={styles.problemText}>{problem.question}</Text>
      </View>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Đáp án"
          keyboardType="numeric"
          value={userAnswer}
          onChangeText={setUserAnswer}
          autoFocus
        />
      </View>
      
      <TouchableOpacity style={styles.submitButton} onPress={checkAnswer}>
        <Text style={styles.submitButtonText}>Submit</Text>
      </TouchableOpacity>
      
      <View style={styles.hintContainer}>
        <Text style={styles.hintText}>
          Giải toán để tắt 😈!
          {attempts > 1 && " Cố lên em!"}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  timerText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  problemContainer: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 32,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  problemText: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 24,
  },
  input: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    fontSize: 20,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  submitButton: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  hintContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  hintText: {
    color: '#666',
    textAlign: 'center',
  },
});

export default MathProblemScreen;