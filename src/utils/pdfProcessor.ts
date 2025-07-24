import * as pdfjsLib from 'pdfjs-dist';

// Set worker source for pdfjs
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

export const extractTextFromPDF = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ');
          fullText += pageText + '\n';
        }

        resolve(fullText);
      } catch (error) {
        console.error('Error parsing PDF:', error);
        reject(new Error('Failed to extract text from PDF'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsArrayBuffer(file);
  });
};

export const parseTestQuestions = (text: string): Array<{ question: string; marks: number }> => {
  // Simple parsing logic - split by numbers and look for mark patterns
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  const questions: Array<{ question: string; marks: number }> = [];
  
  let currentQuestion = '';
  let currentMarks = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check if line starts with a number (potential question)
    const questionMatch = line.match(/^(\d+)\.?\s+(.*)/);
    if (questionMatch) {
      // Save previous question if exists
      if (currentQuestion) {
        questions.push({ question: currentQuestion, marks: currentMarks });
      }
      
      currentQuestion = questionMatch[2];
      currentMarks = 0;
      
      // Look for marks in current line or next few lines
      const marksMatch = line.match(/\[(\d+)\s*marks?\]|\((\d+)\s*marks?\)|(\d+)\s*marks?/i);
      if (marksMatch) {
        currentMarks = parseInt(marksMatch[1] || marksMatch[2] || marksMatch[3]);
      } else {
        // Check next few lines for marks
        for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
          const nextLine = lines[j];
          const nextMarksMatch = nextLine.match(/\[(\d+)\s*marks?\]|\((\d+)\s*marks?\)|(\d+)\s*marks?/i);
          if (nextMarksMatch) {
            currentMarks = parseInt(nextMarksMatch[1] || nextMarksMatch[2] || nextMarksMatch[3]);
            break;
          }
        }
        // Default to 1 mark if no marks found
        if (currentMarks === 0) currentMarks = 1;
      }
    } else if (currentQuestion) {
      // Continue building current question
      currentQuestion += ' ' + line;
    }
  }
  
  // Add last question
  if (currentQuestion) {
    questions.push({ question: currentQuestion, marks: currentMarks });
  }
  
  return questions;
};
