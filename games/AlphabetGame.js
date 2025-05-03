// File: games/AlphabetGame.js
const generateAlphabetProblem = (difficulty) => {
  let problem = {};
  
  switch(difficulty) {
    case 'Easy':
      // Arrange 3-4 consecutive letters
      const startEasy = Math.floor(Math.random() * 23) + 1; // Letters a-w so we have room for 3-4 letters
      const lengthEasy = Math.random() > 0.5 ? 3 : 4;
      const lettersEasy = [];
      
      // Generate consecutive letters
      for (let i = 0; i < lengthEasy; i++) {
        lettersEasy.push(String.fromCharCode(97 + startEasy + i)); // 97 is ASCII for 'a'
      }
      
      // Shuffle letters
      const shuffledEasy = [...lettersEasy].sort(() => Math.random() - 0.5);
      
      problem = {
        question: `Arrange these letters in alphabetical order: ${shuffledEasy.join(' ')}`,
        answer: lettersEasy.join(''),
        displayType: 'alphabet',
        options: shuffledEasy
      };
      break;
    
    case 'Medium':
      // Arrange 5-6 letters, may not be consecutive
      const lengthMedium = Math.random() > 0.5 ? 5 : 6;
      let lettersMedium = [];
      
      // Generate random letters (ensuring no duplicates)
      while (lettersMedium.length < lengthMedium) {
        const letter = String.fromCharCode(97 + Math.floor(Math.random() * 26));
        if (!lettersMedium.includes(letter)) {
          lettersMedium.push(letter);
        }
      }
      
      // Sort to get the correct answer
      const answerMedium = [...lettersMedium].sort();
      
      // Shuffle for the question
      const shuffledMedium = [...lettersMedium].sort(() => Math.random() - 0.5);
      
      problem = {
        question: `Arrange these letters in alphabetical order: ${shuffledMedium.join(' ')}`,
        answer: answerMedium.join(''),
        displayType: 'alphabet',
        options: shuffledMedium
      };
      break;
    
    case 'Hard':
      // Mix uppercase and lowercase letters (5-7 letters)
      const lengthHard = 5 + Math.floor(Math.random() * 3); // 5-7 letters
      let lettersHard = [];
      
      // Generate random upper and lowercase letters
      while (lettersHard.length < lengthHard) {
        // 50% chance for uppercase, 50% for lowercase
        const isUppercase = Math.random() > 0.5;
        const baseCode = isUppercase ? 65 : 97; // 65 is 'A', 97 is 'a'
        
        const letter = String.fromCharCode(baseCode + Math.floor(Math.random() * 26));
        
        // Ensure no duplicates (case-sensitive)
        if (!lettersHard.includes(letter)) {
          lettersHard.push(letter);
        }
      }
      
      // Sort for correct answer (will sort uppercase before lowercase for same letter)
      const answerHard = [...lettersHard].sort();
      
      // Shuffle for question
      const shuffledHard = [...lettersHard].sort(() => Math.random() - 0.5);
      
      problem = {
        question: `Arrange these letters in alphabetical order (uppercase before lowercase): ${shuffledHard.join(' ')}`,
        answer: answerHard.join(''),
        displayType: 'alphabet',
        options: shuffledHard
      };
      break;
    
    case 'Expert':
      // Mix letters with special order or pattern recognition
      // For expert, we'll do reverse alphabetical order as a twist
      const lengthExpert = 6 + Math.floor(Math.random() * 3); // 6-8 letters
      let lettersExpert = [];
      
      // Generate random mixed case letters
      while (lettersExpert.length < lengthExpert) {
        const isUppercase = Math.random() > 0.7; // 30% uppercase
        const baseCode = isUppercase ? 65 : 97;
        const letter = String.fromCharCode(baseCode + Math.floor(Math.random() * 26));
        
        // Ensure no duplicates (case-sensitive)
        if (!lettersExpert.includes(letter)) {
          lettersExpert.push(letter);
        }
      }
      
      // Sort for reverse alphabetical order
      const answerExpert = [...lettersExpert].sort().reverse();
      
      // Shuffle for question
      const shuffledExpert = [...lettersExpert].sort(() => Math.random() - 0.5);
      
      problem = {
        question: `Arrange these letters in REVERSE alphabetical order (Z→A): ${shuffledExpert.join(' ')}`,
        answer: answerExpert.join(''),
        displayType: 'alphabet',
        options: shuffledExpert
      };
      break;
    
    default:
      // Default to easy
      const startDefault = Math.floor(Math.random() * 24) + 1;
      const lettersDefault = [];
      
      for (let i = 0; i < 3; i++) {
        lettersDefault.push(String.fromCharCode(97 + startDefault + i));
      }
      
      const shuffledDefault = [...lettersDefault].sort(() => Math.random() - 0.5);
      
      problem = {
        question: `Arrange these letters in alphabetical order: ${shuffledDefault.join(' ')}`,
        answer: lettersDefault.join(''),
        displayType: 'alphabet',
        options: shuffledDefault
      };
  }
  
  return problem;
};

export default generateAlphabetProblem;