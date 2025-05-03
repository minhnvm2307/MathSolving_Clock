// File: screens/AlphabetGameScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import generateAlphabetProblem from '../games/AlphabetGame';

const AlphabetGameScreen = ({ route, navigation }) => {
  const { difficulty, alarmId, onSolve } = route.params;
  const [problem, setProblem] = useState(null);
  const [userAnswer, setUserAnswer] = useState([]);
  const [timeLeft, setTimeLeft] = useState(60); // Default 60 seconds
  const [attempts, setAttempts] = useState(0);
  
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
    setProblem(generateAlphabetProblem(difficulty));
  }, [difficulty]);
  
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
  
  const handleLetterPress = (letter) => {
    // Add letter to user answer
    setUserAnswer([...userAnswer, letter]);
  };
  
  const resetAnswer = () => {
    setUserAnswer([]);
  };
  
  const checkAnswer = () => {
    if (!problem) return;
    
    // Join the array of selected letters
    const userString = userAnswer.join('');
    
    // Check if answer is correct
    const isCorrect = userString === problem.answer;
    
    if (isCorrect) {
      Alert.alert(
        "Great job! 🙌",
        "Your alphabet arrangement is correct! You can go back to sleep now.",
        [{ text: "Great!", onPress: () => {
          if (onSolve) onSolve();
          navigation.goBack();
        }}]
      );
    } else {
      setAttempts(attempts + 1);
      Alert.alert(
        "Incorrect",
        `That's not the right order. Try again! Attempts: ${attempts + 1}`,
        [{ text: "OK", onPress: () => resetAnswer() }]
      );
    }
  };
  
  // Render remaining letter options (ones not yet selected)
  const renderLetterOptions = () => {
    if (!problem || !problem.options) return null;
    
    // Filter out letters already selected
    const remainingOptions = problem.options.filter(
      letter => !userAnswer.includes(letter)
    );
    
    return (
      <View style={styles.optionsContainer}>
        {remainingOptions.map((letter, index) => (
          <TouchableOpacity
            key={`${letter}-${index}`}
            style={styles.letterOption}
            onPress={() => handleLetterPress(letter)}
          >
            <Text style={styles.letterText}>{letter}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
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
      
      <View style={styles.answerContainer}>
        <Text style={styles.answerLabel}>Your arrangement:</Text>
        <View style={styles.answerLetters}>
          {userAnswer.map((letter, index) => (
            <View key={`answer-${index}`} style={styles.answerLetter}>
              <Text style={styles.answerLetterText}>{letter}</Text>
            </View>
          ))}
        </View>
        
        {userAnswer.length > 0 && (
          <TouchableOpacity style={styles.resetButton} onPress={resetAnswer}>
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {renderLetterOptions()}
      
      <TouchableOpacity 
        style={[
          styles.submitButton,
          userAnswer.length !== problem.options.length && styles.submitButtonDisabled
        ]} 
        disabled={userAnswer.length !== problem.options.length}
        onPress={checkAnswer}
      >
        <Text style={styles.submitButtonText}>Submit</Text>
      </TouchableOpacity>
      
      <View style={styles.hintContainer}>
        <Text style={styles.hintText}>
          Arrange the letters in the correct order to turn off the alarm!
          {attempts > 1 && " Keep trying!"}
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
    marginBottom: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  problemText: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  answerContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  answerLabel: {
    fontSize: 16,
    marginBottom: 10,
    color: '#555',
  },
  answerLetters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    minHeight: 50,
  },
  answerLetter: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e1f5fe',
    borderRadius: 20,
    margin: 5,
    borderWidth: 1,
    borderColor: '#81d4fa',
  },
  answerLetterText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0277bd',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 24,
  },
  letterOption: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    borderRadius: 25,
    margin: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  letterText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  resetButton: {
    backgroundColor: '#ff9800',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 10,
  },
  resetButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#bbdefb',
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

export default AlphabetGameScreen;