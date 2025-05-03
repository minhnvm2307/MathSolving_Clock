// File: games/QRCodeGame.js
const generateQRProblem = (difficulty) => {
  // Since QR code scanning is hardware-dependent, we just define the problem structure
  // The actual scanning logic will be handled in the QRCodeScreen component
  
  // Different difficulties could have different verification requirements
  let problem = {
    displayType: 'qrcode', // Important for rendering the correct game component
    question: 'Scan a valid QR code to turn off the alarm',
  };
  
  switch(difficulty) {
    case 'Easy':
      // For easy, any valid QR code will work
      problem.verificationLevel = 'any';
      problem.question = 'Scan any valid QR code to turn off the alarm';
      break;
      
    case 'Medium':
      // For medium, require a QR code with text or URL
      problem.verificationLevel = 'text';
      problem.question = 'Scan a QR code containing text or a URL';
      break;
      
    case 'Hard':
      // For hard, require a QR code with a URL
      problem.verificationLevel = 'url';
      problem.question = 'Scan a QR code containing a valid URL';
      break;
      
    case 'Expert':
      // For expert, require a specific format or pattern in the QR data
      problem.verificationLevel = 'pattern';
      problem.question = 'Scan a QR code containing an email address';
      problem.pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/; // Email regex
      break;
      
    default:
      // Default to any QR code
      problem.verificationLevel = 'any';
      problem.question = 'Scan any valid QR code to turn off the alarm';
  }
  
  return problem;
};

export default generateQRProblem;