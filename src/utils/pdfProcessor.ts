import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker with multiple fallback options
const configureWorker = () => {
  try {
    // Try jsdelivr CDN first (better CORS support)
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;
  } catch (error) {
    console.warn('Failed to configure worker, will use fallback');
  }
};

// Initialize worker configuration
configureWorker();

export const extractTextFromPDF = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;

        if (!arrayBuffer) {
          throw new Error('Failed to read file as ArrayBuffer');
        }

        const uint8Array = new Uint8Array(arrayBuffer);
        
        // Try different configurations in order of preference
        const configurations = [
          // First try: with worker and cmaps
          {
            data: uint8Array,
            cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
            cMapPacked: true,
            disableWorker: false,
            verbosity: 0
          },
          // Second try: without cmaps but with worker
          {
            data: uint8Array,
            disableWorker: false,
            verbosity: 0
          },
          // Third try: without worker (fallback)
          {
            data: uint8Array,
            disableWorker: true,
            verbosity: 0
          },
          // Last resort: minimal configuration
          {
            data: uint8Array
          }
        ];

        let pdf = null;
        let configUsed = -1;

        for (let i = 0; i < configurations.length; i++) {
          try {
            console.log(`🔄 Trying PDF configuration ${i + 1}/${configurations.length}`);
            const loadingTask = pdfjsLib.getDocument(configurations[i]);
            pdf = await loadingTask.promise;
            configUsed = i;
            console.log(`✅ PDF loaded successfully with configuration ${i + 1}`);
            break;
          } catch (configError) {
            console.warn(`⚠️ Configuration ${i + 1} failed:`, configError.message);
            if (i === configurations.length - 1) {
              throw configError;
            }
          }
        }

        if (!pdf) {
          throw new Error('Failed to load PDF with any configuration');
        }

        let fullText = '';
        console.log(`📄 Processing PDF with ${pdf.numPages} pages (using config ${configUsed + 1})`);

        for (let i = 1; i <= pdf.numPages; i++) {
          try {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            
            // Extract text with better formatting
            const pageText = textContent.items
              .filter((item: any) => item.str && item.str.trim().length > 0)
              .map((item: any) => {
                // Clean up the text
                return item.str.trim();
              })
              .join(' ')
              .replace(/\s+/g, ' ') // Normalize whitespace
              .trim();
            
            if (pageText.length > 0) {
              fullText += pageText + '\n\n';
              console.log(`📖 Page ${i}/${pdf.numPages}: ${pageText.length} characters`);
            }
          } catch (pageError) {
            console.error(`❌ Error processing page ${i}:`, pageError);
            // Continue with other pages even if one fails
          }
        }

        if (fullText.trim().length === 0) {
          console.warn('⚠️ No text content extracted from PDF');
          reject(new Error('No text content could be extracted from the PDF. The file might be image-based, corrupted, or empty.'));
          return;
        }

        console.log(`✅ Successfully extracted ${fullText.length} characters from PDF`);
        resolve(fullText.trim());
      } catch (error) {
        console.error('❌ Error parsing PDF:', error);
        
        // Provide more helpful error messages
        let errorMessage = 'Failed to extract text from PDF';
        if (error instanceof Error) {
          if (error.message.includes('CORS') || error.message.includes('worker')) {
            errorMessage = 'PDF processing failed due to browser security restrictions. This is a known issue with PDF.js in production. Please try a different PDF or contact support.';
          } else if (error.message.includes('Invalid PDF')) {
            errorMessage = 'The uploaded file is not a valid PDF document.';
          } else if (error.message.includes('Password')) {
            errorMessage = 'This PDF is password protected. Please upload an unprotected PDF.';
          } else {
            errorMessage = `PDF processing error: ${error.message}`;
          }
        }
        
        reject(new Error(errorMessage));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read the uploaded file.'));
    };

    reader.readAsArrayBuffer(file);
  });
};

export const parseTestQuestions = (text: string): Array<{ question: string; marks: number }> => {
  console.log('📄 Parsing PDF text for questions:', text.substring(0, 500) + '...');
  
  if (!text || text.trim().length === 0) {
    console.warn('⚠️ No text content found in PDF');
    return [];
  }
  
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  const questions: Array<{ question: string; marks: number }> = [];
  
  console.log(`📝 Processing ${lines.length} lines from PDF`);
  
  let currentQuestion = '';
  let currentMarks = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Multiple question number patterns to catch different formats
    const questionPatterns = [
      /^(\d+)\.?\s+(.*)/,           // 1. Question text or 1) Question text
      /^Question\s+(\d+):?\s+(.*)/i, // Question 1: Text
      /^Q\.?\s*(\d+):?\s+(.*)/i,    // Q1: Text or Q.1 Text
      /^\((\d+)\)\s+(.*)/,          // (1) Question text
      /^(\d+)\)\s+(.*)/             // 1) Question text
    ];
    
    let questionMatch = null;
    for (const pattern of questionPatterns) {
      questionMatch = line.match(pattern);
      if (questionMatch) break;
    }
    
    if (questionMatch) {
      // Save previous question if exists
      if (currentQuestion && currentQuestion.trim().length > 0) {
        questions.push({ 
          question: currentQuestion.trim(), 
          marks: currentMarks || 1 
        });
        console.log(`✅ Found question ${questions.length}: "${currentQuestion.substring(0, 50)}..." (${currentMarks || 1} marks)`);
      }
      
      const questionNumber = questionMatch[1];
      currentQuestion = questionMatch[2] || '';
      currentMarks = 0;
      
      // Multiple marks patterns to catch different formats
      const marksPatterns = [
        /\[(\d+)\s*marks?\]/i,        // [5 marks]
        /\((\d+)\s*marks?\)/i,        // (5 marks)
        /(\d+)\s*marks?/i,            // 5 marks
        /\[(\d+)\s*pts?\]/i,          // [5 pts]
        /\((\d+)\s*pts?\)/i,          // (5 pts)
        /(\d+)\s*pts?/i,              // 5 pts
        /\[(\d+)\]/,                  // [5]
        /\((\d+)\)/                   // (5)
      ];
      
      // Check current line for marks
      let marksFound = false;
      for (const pattern of marksPatterns) {
        const marksMatch = line.match(pattern);
        if (marksMatch) {
          currentMarks = parseInt(marksMatch[1]);
          marksFound = true;
          break;
        }
      }
      
      // If no marks found in current line, check next few lines
      if (!marksFound) {
        for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
          const nextLine = lines[j].trim();
          
          // Stop if we hit another question
          let isNextQuestion = false;
          for (const pattern of questionPatterns) {
            if (pattern.test(nextLine)) {
              isNextQuestion = true;
              break;
            }
          }
          if (isNextQuestion) break;
          
          // Check for marks in this line
          for (const pattern of marksPatterns) {
            const nextMarksMatch = nextLine.match(pattern);
            if (nextMarksMatch) {
              currentMarks = parseInt(nextMarksMatch[1]);
              marksFound = true;
              break;
            }
          }
          if (marksFound) break;
        }
      }
      
      // Default to 1 mark if no marks found
      if (!marksFound) {
        currentMarks = 1;
        console.log(`⚠️ No marks found for question ${questionNumber}, defaulting to 1 mark`);
      }
      
    } else if (currentQuestion) {
      // Continue building current question (handle multi-line questions)
      // But avoid adding lines that look like options or other formatting
      if (!line.match(/^[a-d][\.\)]/i) && // Skip option lines like "a) option"
          !line.match(/^[ivx]+[\.\)]/i) && // Skip roman numeral options
          !line.match(/^\s*$/)) {          // Skip empty lines
        currentQuestion += ' ' + line;
      }
    }
  }
  
  // Add last question
  if (currentQuestion && currentQuestion.trim().length > 0) {
    questions.push({ 
      question: currentQuestion.trim(), 
      marks: currentMarks || 1 
    });
    console.log(`✅ Found final question ${questions.length}: "${currentQuestion.substring(0, 50)}..." (${currentMarks || 1} marks)`);
  }
  
  console.log(`🎯 Total questions parsed: ${questions.length}`);
  
  // If no questions found with numbered patterns, try to extract any text blocks as potential questions
  if (questions.length === 0) {
    console.log('🔍 No numbered questions found, trying to extract text blocks...');
    
    // Group lines into potential questions based on paragraph breaks
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 10);
    
    paragraphs.forEach((paragraph, index) => {
      const cleanText = paragraph.trim().replace(/\s+/g, ' ');
      if (cleanText.length > 10) {
        // Look for marks in the paragraph
        let marks = 1;
        const marksMatch = cleanText.match(/\[(\d+)\s*marks?\]|\((\d+)\s*marks?\)|(\d+)\s*marks?/i);
        if (marksMatch) {
          marks = parseInt(marksMatch[1] || marksMatch[2] || marksMatch[3]);
        }
        
        questions.push({
          question: cleanText,
          marks: marks
        });
        console.log(`📄 Extracted text block ${index + 1}: "${cleanText.substring(0, 50)}..." (${marks} marks)`);
      }
    });
  }
  
  if (questions.length === 0) {
    console.error('❌ No questions could be parsed from the PDF content');
    console.log('Raw text sample:', text.substring(0, 1000));
  }
  
  return questions;
};

// Helper function to create sample questions when PDF parsing fails
export const createSampleQuestions = (title: string, type: 'pretest' | 'posttest'): Array<{ question: string; marks: number }> => {
  console.log(`🔧 Creating sample questions for ${type}: ${title}`);
  
  const sampleQuestions = [
    {
      question: `Sample ${type} question 1 for ${title}. Please edit this question to match your actual test content.`,
      marks: 2
    },
    {
      question: `Sample ${type} question 2 for ${title}. You can modify these questions after upload.`,
      marks: 3
    },
    {
      question: `Sample ${type} question 3 for ${title}. These are placeholder questions.`,
      marks: 1
    }
  ];
  
  return sampleQuestions;
};
