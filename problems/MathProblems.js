const generateMathProblem = (difficulty) => {
  let problem = {};
  
  switch(difficulty) {
    case 'Easy':
      // Addition/subtraction with numbers between 1-20
      const num1 = Math.floor(Math.random() * 20) + 1;
      const num2 = Math.floor(Math.random() * 20) + 1;
      const isAddition = Math.random() > 0.5;
      
      if (isAddition) {
        problem = {
          question: `${num1} + ${num2} = ?`,
          answer: num1 + num2
        };
      } else {
        // Ensure positive result
        const larger = Math.max(num1, num2);
        const smaller = Math.min(num1, num2);
        problem = {
          question: `${larger} - ${smaller} = ?`,
          answer: larger - smaller
        };
      }
      break;
      
    case 'Medium':
      // Multiplication with numbers between 2-12
      const factor1 = Math.floor(Math.random() * 11) + 2;
      const factor2 = Math.floor(Math.random() * 11) + 2;
      problem = {
        question: `${factor1} × ${factor2} = ?`,
        answer: factor1 * factor2
      };
      break;
      
    case 'Hard':
      // Mixed operations
      const a = Math.floor(Math.random() * 20) + 5;
      const b = Math.floor(Math.random() * 10) + 2;
      const c = Math.floor(Math.random() * 10) + 2;
      
      const operation = Math.floor(Math.random() * 3);
      
      if (operation === 0) {
        // (a + b) × c
        problem = {
          question: `(${a} + ${b}) × ${c} = ?`,
          answer: (a + b) * c
        };
      } else if (operation === 1) {
        // a × b - c
        problem = {
          question: `${a} × ${b} - ${c} = ?`,
          answer: a * b - c
        };
      } else {
        // (a - b) × c, ensure a > b
        problem = {
          question: `(${Math.max(a,b)} - ${Math.min(a,b)}) × ${c} = ?`,
          answer: (Math.max(a,b) - Math.min(a,b)) * c
        };
      }
      break;
      
    case 'Expert':
      // Quadratic equations, divisibility, or more complex math
      const type = Math.floor(Math.random() * 3);
      
      if (type === 0) {
        // Simple quadratic: x² + bx + c, find x if x is an integer
        // We'll construct one where x has nice solutions
        const x1 = Math.floor(Math.random() * 10) - 5; // First solution between -5 and 4
        const x2 = Math.floor(Math.random() * 10) - 5; // Second solution between -5 and 4
        
        // x² - (x1 + x2)x + (x1 * x2)
        const b = -(x1 + x2);
        const c = x1 * x2;
        
        const bDisplay = b >= 0 ? `+ ${b}` : `- ${Math.abs(b)}`;
        const cDisplay = c >= 0 ? `+ ${c}` : `- ${Math.abs(c)}`;
        
        // Randomly choose which solution to ask for
        const solutionToFind = Math.random() > 0.5 ? x1 : x2;
        
        problem = {
          question: `If x² ${bDisplay}x ${cDisplay} = 0, and x is an integer, what is one possible value of x?`,
          answer: solutionToFind,
          acceptableAnswers: [x1, x2] // Both solutions are correct
        };
      } else if (type === 1) {
        // Find LCM or GCD
        const num1 = Math.floor(Math.random() * 30) + 10; 
        const num2 = Math.floor(Math.random() * 30) + 10;
        
        const findLCM = Math.random() > 0.5;
        
        if (findLCM) {
          // Find LCM
          // Calculate GCD first using Euclidean algorithm
          const gcd = (a, b) => {
            while (b !== 0) {
              let t = b;
              b = a % b;
              a = t;
            }
            return a;
          };
          
          const lcm = (a, b) => (a * b) / gcd(a, b);
          
          problem = {
            question: `What is the least common multiple (LCM) of ${num1} and ${num2}?`,
            answer: lcm(num1, num2)
          };
        } else {
          // Find GCD
          const gcd = (a, b) => {
            while (b !== 0) {
              let t = b;
              b = a % b;
              a = t;
            }
            return a;
          };
          
          problem = {
            question: `What is the greatest common divisor (GCD) of ${num1} and ${num2}?`,
            answer: gcd(num1, num2)
          };
        }
      } else {
        // Percentage problems
        const baseNumber = Math.floor(Math.random() * 100) + 50;
        const percentage = Math.floor(Math.random() * 90) + 10;
        
        problem = {
          question: `What is ${percentage}% of ${baseNumber}?`,
          answer: (baseNumber * percentage) / 100
        };
      }
      break;
      
    default:
      // Default to easy
      const defaultNum1 = Math.floor(Math.random() * 10) + 1;
      const defaultNum2 = Math.floor(Math.random() * 10) + 1;
      problem = {
        question: `${defaultNum1} + ${defaultNum2} = ?`,
        answer: defaultNum1 + defaultNum2
      };
  }
  
  return problem;
};

export default generateMathProblem;