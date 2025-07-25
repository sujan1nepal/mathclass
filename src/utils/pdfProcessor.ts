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
  console.log('📄 Enhanced parsing of PDF text for questions...');
  
  if (!text || text.trim().length === 0) {
    console.warn('⚠️ No text content found in PDF');
    return [];
  }
  
  // Normalize text - handle different line endings and spacing
  const normalizedText = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s+/g, ' ')
    .trim();
  
  const lines = normalizedText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const questions: Array<{ question: string; marks: number }> = [];
  
  console.log(`📝 Processing ${lines.length} lines from PDF`);
  
  // Enhanced question number patterns - more comprehensive
  const questionPatterns = [
    /^(\d+)\.?\s+(.*)/,                    // 1. Question text or 1) Question text
    /^Question\s+(\d+)[:.]?\s*(.*)/i,      // Question 1: Text or Question 1. Text
    /^Q\.?\s*(\d+)[:.]?\s*(.*)/i,         // Q1: Text or Q.1 Text or Q1. Text
    /^\((\d+)\)\s+(.*)/,                   // (1) Question text
    /^(\d+)\)\s+(.*)/,                     // 1) Question text
    /^(\d+)[-–]\s+(.*)/,                   // 1- Question text (dash variations)
    /^No\.?\s*(\d+)[:.]?\s*(.*)/i,        // No. 1: Text or No.1 Text
    /^Item\s+(\d+)[:.]?\s*(.*)/i,         // Item 1: Text
    /^Problem\s+(\d+)[:.]?\s*(.*)/i,      // Problem 1: Text
  ];
  
  // Enhanced marks patterns - more comprehensive
  const marksPatterns = [
    /\[\s*(\d+)\s*marks?\s*\]/i,          // [5 marks] or [5 mark]
    /\(\s*(\d+)\s*marks?\s*\)/i,          // (5 marks) or (5 mark)
    /\[\s*(\d+)\s*pts?\s*\]/i,            // [5 pts] or [5 pt]
    /\(\s*(\d+)\s*pts?\s*\)/i,            // (5 pts) or (5 pt)
    /\[\s*(\d+)\s*points?\s*\]/i,         // [5 points] or [5 point]
    /\(\s*(\d+)\s*points?\s*\)/i,         // (5 points) or (5 point)
    /\[\s*(\d+)\s*\]/,                     // [5]
    /\(\s*(\d+)\s*\)/,                     // (5) - but only if isolated
    /(\d+)\s*marks?\s*$/i,                 // 5 marks at end of line
    /(\d+)\s*pts?\s*$/i,                   // 5 pts at end of line
    /(\d+)\s*points?\s*$/i,                // 5 points at end of line
    /marks?\s*[:=]\s*(\d+)/i,             // marks: 5 or marks = 5
    /points?\s*[:=]\s*(\d+)/i,            // points: 5 or points = 5
    /\b(\d+)\s*m\b/i,                     // 5m (short for marks)
  ];
  
  let currentQuestion = '';
  let currentMarks = 0;
  let currentQuestionNumber = 0;
  
  // First pass: identify all potential question starts
  const questionStarts: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const pattern of questionPatterns) {
      const match = line.match(pattern);
      if (match) {
        const questionNum = parseInt(match[1]);
        // Only accept if it's a reasonable sequence
        if (questionNum === currentQuestionNumber + 1 || questionStarts.length === 0) {
          questionStarts.push(i);
          currentQuestionNumber = questionNum;
          break;
        }
      }
    }
  }
  
  console.log(`🔍 Found ${questionStarts.length} potential question starts`);
  
  // Second pass: extract questions and marks
  for (let i = 0; i < questionStarts.length; i++) {
    const startLine = questionStarts[i];
    const endLine = i < questionStarts.length - 1 ? questionStarts[i + 1] : lines.length;
    
    const questionLines = lines.slice(startLine, endLine);
    let questionText = '';
    let marks = 1; // Default to 1 mark
    let questionFound = false;
    
    // Extract question text and marks from this section
    for (let j = 0; j < questionLines.length; j++) {
      const line = questionLines[j];
      
      if (j === 0) {
        // First line - extract question number and initial text
        for (const pattern of questionPatterns) {
          const match = line.match(pattern);
          if (match) {
            questionText = match[2] || '';
            questionFound = true;
            break;
          }
        }
      } else {
        // Subsequent lines - check if they're part of the question or options/answers
        if (!line.match(/^[a-e][\.\)]\s/i) &&          // Not option lines (a), b), etc.)
            !line.match(/^[ivx]+[\.\)]\s/i) &&         // Not roman numeral options
            !line.match(/^answer\s*[:=]/i) &&          // Not answer lines
            !line.match(/^solution\s*[:=]/i) &&        // Not solution lines
            !line.match(/^explanation\s*[:=]/i) &&     // Not explanation lines
            !line.match(/^\s*[_\-=]{3,}\s*$/) &&       // Not separator lines
            line.length > 2) {                         // Not too short
          questionText += ' ' + line;
        }
      }
      
      // Check for marks in any line of this question
      for (const pattern of marksPatterns) {
        const marksMatch = line.match(pattern);
        if (marksMatch) {
          const foundMarks = parseInt(marksMatch[1]);
          if (foundMarks > 0 && foundMarks <= 20) { // Reasonable range for marks
            marks = foundMarks;
            break;
          }
        }
      }
    }
    
    if (questionFound && questionText.trim().length > 5) {
      const cleanQuestion = questionText
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/^\d+[\.\)]\s*/, ''); // Remove question number prefix if still present
      
      questions.push({
        question: cleanQuestion,
        marks: marks
      });
      
      console.log(`✅ Parsed question ${questions.length}: "${cleanQuestion.substring(0, 60)}..." (${marks} marks)`);
    }
  }
  
  // If we found very few questions with the numbered approach, try paragraph-based parsing
  if (questions.length < 2) {
    console.log('🔍 Few numbered questions found, trying paragraph-based parsing...');
    
    // Split by double line breaks or large gaps
    const paragraphs = normalizedText
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(p => p.length > 20); // Only meaningful paragraphs
    
    for (let i = 0; i < paragraphs.length && questions.length < 10; i++) {
      const paragraph = paragraphs[i];
      
      // Skip if it looks like a header, instruction, or title
      if (paragraph.match(/^(instructions?|directions?|answer\s+key|test\s+\d+|page\s+\d+)/i) ||
          paragraph.length < 10 ||
          paragraph.split(' ').length < 3) {
        continue;
      }
      
      // Check if this paragraph might be a question
      const questionIndicators = [
        /what\s+is/i, /calculate/i, /find/i, /solve/i, /determine/i,
        /how\s+many/i, /which\s+of/i, /if\s+/i, /given\s+that/i,
        /\?\s*$/, /:\s*$/, /equals?\s*$/
      ];
      
      const hasQuestionIndicator = questionIndicators.some(pattern => pattern.test(paragraph));
      
      if (hasQuestionIndicator) {
        let marks = 1;
        
        // Look for marks in this paragraph
        for (const pattern of marksPatterns) {
          const marksMatch = paragraph.match(pattern);
          if (marksMatch) {
            marks = parseInt(marksMatch[1]);
            break;
          }
        }
        
        questions.push({
          question: paragraph,
          marks: marks
        });
        
        console.log(`📄 Extracted paragraph-based question ${questions.length}: "${paragraph.substring(0, 60)}..." (${marks} marks)`);
      }
    }
  }
  
  console.log(`🎯 Total questions parsed: ${questions.length}`);
  
  if (questions.length === 0) {
    console.error('❌ No questions could be parsed from the PDF content');
    console.log('📄 Raw text sample for debugging:', normalizedText.substring(0, 1000));
  }
  
  return questions;
};

// Helper function to create sample questions when PDF parsing fails
export const createSampleQuestions = (title: string, type: 'pretest' | 'posttest'): Array<{ question: string; marks: number }> => {
  console.log(`🔧 Creating sample questions for ${type}: ${title}`);
  
  const sampleQuestions = [
    {
      question: `Sample ${type} question 1 for ${title}. Please edit this question to match your actual test content. This question tests basic understanding of the lesson topic.`,
      marks: 2
    },
    {
      question: `Sample ${type} question 2 for ${title}. You can modify these questions after upload. This question requires application of concepts learned.`,
      marks: 3
    },
    {
      question: `Sample ${type} question 3 for ${title}. These are placeholder questions that should be replaced with your actual test questions. This tests problem-solving skills.`,
      marks: 5
    },
    {
      question: `Sample ${type} question 4 for ${title}. Remember to follow the formatting guidelines when creating your own questions: use numbered questions (1., 2., etc.) and include marks in brackets [X marks].`,
      marks: 2
    },
    {
      question: `Sample ${type} question 5 for ${title}. This final sample question demonstrates how to structure longer questions that may require detailed explanations or calculations.`,
      marks: 3
    }
  ];
  
  return sampleQuestions;
};
