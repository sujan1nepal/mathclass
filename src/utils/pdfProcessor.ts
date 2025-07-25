import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker with better fallback
let workerConfigured = false;

const configureWorker = () => {
  if (workerConfigured) return;
  
  try {
    // Try to disable worker entirely to avoid CORS issues
    pdfjsLib.GlobalWorkerOptions.workerSrc = '';
    console.log('🔧 Worker disabled to avoid CORS issues');
    workerConfigured = true;
  } catch (error) {
    console.warn('Failed to configure worker:', error);
  }
};

// Initialize worker configuration
configureWorker();

export const extractTextFromPDF = async (file: File): Promise<string> => {
  console.log('📄 Starting PDF text extraction...');
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        if (!arrayBuffer) {
          throw new Error('Failed to read file as ArrayBuffer');
        }

        const uint8Array = new Uint8Array(arrayBuffer);
        console.log(`📊 PDF file size: ${uint8Array.length} bytes`);
        
        // Single robust configuration - disable worker completely
        const config = {
          data: uint8Array,
          disableWorker: true,
          verbosity: 0, // Reduce console noise
          disableAutoFetch: true,
          disableStream: true
        };

        console.log('🔄 Loading PDF document...');
        let loadingTask;
        let pdf;

        try {
          loadingTask = pdfjsLib.getDocument(config);
          pdf = await loadingTask.promise;
          console.log(`✅ PDF loaded successfully with ${pdf.numPages} pages`);
        } catch (loadError) {
          console.error('❌ PDF loading failed:', loadError);
          throw new Error('Failed to load PDF document. The file may be corrupted or not a valid PDF.');
        }

        let fullText = '';
        const pageTexts = [];

        // Process each page
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          try {
            console.log(`📖 Processing page ${pageNum}/${pdf.numPages}...`);
            
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent({
              normalizeWhitespace: true,
              disableCombineTextItems: false
            });
            
            // Extract text with better structure preservation
            let pageText = '';
            let lastY = -1;
            
            for (const item of textContent.items) {
              if ('str' in item && item.str && item.str.trim()) {
                // Check if this is a new line (different Y position)
                if ('transform' in item && item.transform) {
                  const currentY = item.transform[5];
                  if (lastY !== -1 && Math.abs(currentY - lastY) > 5) {
                    pageText += '\n';
                  }
                  lastY = currentY;
                }
                
                pageText += item.str + ' ';
              }
            }
            
            // Clean up the page text
            pageText = pageText
              .replace(/\s+/g, ' ')
              .replace(/\n\s+/g, '\n')
              .trim();
            
            if (pageText.length > 0) {
              pageTexts.push(pageText);
              console.log(`✅ Page ${pageNum}: extracted ${pageText.length} characters`);
            } else {
              console.warn(`⚠️ Page ${pageNum}: no text content found`);
            }
            
          } catch (pageError) {
            console.error(`❌ Error processing page ${pageNum}:`, pageError);
            // Continue with other pages
          }
        }
        
        // Combine all page texts
        fullText = pageTexts.join('\n\n');
        
        if (fullText.trim().length === 0) {
          console.warn('⚠️ No text content extracted from any pages');
          throw new Error('No text content could be extracted from the PDF. This might be an image-based PDF or the text is not selectable.');
        }

        console.log(`✅ Successfully extracted ${fullText.length} characters from ${pageTexts.length} pages`);
        console.log('📝 First 200 characters:', fullText.substring(0, 200) + '...');
        
        resolve(fullText.trim());
        
      } catch (error) {
        console.error('❌ PDF processing error:', error);
        
        // More specific error messages
        let errorMessage = 'Failed to extract text from PDF';
        if (error instanceof Error) {
          if (error.message.includes('Invalid PDF')) {
            errorMessage = 'Invalid PDF file. Please ensure the file is not corrupted.';
          } else if (error.message.includes('Password')) {
            errorMessage = 'This PDF is password protected. Please provide an unprotected PDF.';
          } else if (error.message.includes('image-based')) {
            errorMessage = 'This appears to be an image-based PDF. Text extraction is not possible.';
          } else {
            errorMessage = `PDF processing failed: ${error.message}`;
          }
        }
        
        reject(new Error(errorMessage));
      }
    };

    reader.onerror = (error) => {
      console.error('❌ FileReader error:', error);
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
