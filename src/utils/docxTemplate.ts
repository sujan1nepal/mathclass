import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';

export const generateTestTemplate = async (type: 'pretest' | 'posttest', title: string, grade: string) => {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Header
          new Paragraph({
            children: [
              new TextRun({
                text: `${type.toUpperCase()} TEMPLATE`,
                bold: true,
                size: 32,
                color: "2563EB"
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
          }),
          
          // Test Information
          new Paragraph({
            children: [
              new TextRun({
                text: `Test Title: ${title}`,
                bold: true,
                size: 24
              })
            ],
            spacing: { after: 200 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: `Grade: ${grade}`,
                bold: true,
                size: 24
              })
            ],
            spacing: { after: 200 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: `Type: ${type === 'pretest' ? 'Pre-test (Before Lesson)' : 'Post-test (After Lesson)'}`,
                bold: true,
                size: 24
              })
            ],
            spacing: { after: 400 }
          }),
          
          // Critical Formatting Instructions
          new Paragraph({
            children: [
              new TextRun({
                text: "⚠️ CRITICAL FORMATTING RULES ⚠️",
                bold: true,
                size: 28,
                color: "DC2626"
              })
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "Follow these rules EXACTLY for automatic question parsing:",
                italic: true,
                bold: true,
                size: 22,
                color: "DC2626"
              })
            ],
            spacing: { after: 300 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "✅ REQUIRED: Start each question with a number followed by a period",
                size: 20,
                bold: true,
                color: "059669"
              })
            ],
            spacing: { after: 100 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "   Examples: '1.' or '2.' or '15.' (NOT '1)' or 'Q1' or 'Question 1')",
                size: 18,
                italic: true
              })
            ],
            spacing: { after: 200 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "✅ REQUIRED: Include marks in square brackets [X marks] or parentheses (X marks)",
                size: 20,
                bold: true,
                color: "059669"
              })
            ],
            spacing: { after: 100 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "   Examples: '[3 marks]' or '(2 marks)' or '[5 pts]' or '(1 point)'",
                size: 18,
                italic: true
              })
            ],
            spacing: { after: 200 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "✅ RECOMMENDED: Leave blank lines between questions for clarity",
                size: 20,
                bold: true,
                color: "0D9488"
              })
            ],
            spacing: { after: 100 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "✅ OPTIONAL: Use a), b), c), d) for multiple choice options",
                size: 20,
                bold: true,
                color: "0D9488"
              })
            ],
            spacing: { after: 400 }
          }),
          
          // What NOT to do
          new Paragraph({
            children: [
              new TextRun({
                text: "❌ AVOID THESE FORMATS:",
                bold: true,
                size: 24,
                color: "DC2626"
              })
            ],
            spacing: { after: 200 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "• Question 1: (use '1.' instead)",
                size: 18,
                color: "DC2626"
              })
            ],
            spacing: { after: 80 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "• 1) Question text (use '1.' instead)",
                size: 18,
                color: "DC2626"
              })
            ],
            spacing: { after: 80 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "• Q1. Question text (use '1.' instead)",
                size: 18,
                color: "DC2626"
              })
            ],
            spacing: { after: 80 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "• Missing marks notation",
                size: 18,
                color: "DC2626"
              })
            ],
            spacing: { after: 400 }
          }),
          
          // Sample Questions Section
          new Paragraph({
            children: [
              new TextRun({
                text: "📝 SAMPLE QUESTIONS (REPLACE WITH YOUR CONTENT)",
                bold: true,
                size: 28,
                color: "059669"
              })
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 600, after: 200 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "Copy the format below exactly, replacing with your actual questions:",
                italic: true,
                size: 22,
                color: "059669"
              })
            ],
            spacing: { after: 400 }
          }),
          
          // Question 1 - Multiple Choice Example
          new Paragraph({
            children: [
              new TextRun({
                text: "1. What is the value of x in the equation 2x + 5 = 13? [2 marks]",
                bold: true,
                size: 24
              })
            ],
            spacing: { after: 200 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "a) x = 4",
                size: 22
              })
            ],
            spacing: { after: 100 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "b) x = 8", 
                size: 22
              })
            ],
            spacing: { after: 100 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "c) x = 6",
                size: 22
              })
            ],
            spacing: { after: 100 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "d) x = 9",
                size: 22
              })
            ],
            spacing: { after: 400 }
          }),
          
          // Question 2 - Open-ended Example
          new Paragraph({
            children: [
              new TextRun({
                text: "2. Solve for y and show all your working steps: 3y - 7 = 14 [4 marks]",
                bold: true,
                size: 24
              })
            ],
            spacing: { after: 400 }
          }),
          
          // Question 3 - Application Example
          new Paragraph({
            children: [
              new TextRun({
                text: "3. A rectangle has a length of 8cm and width of 5cm. Calculate its area and perimeter. (3 marks)",
                bold: true,
                size: 24
              })
            ],
            spacing: { after: 200 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "Show your formula and calculations clearly.",
                italic: true,
                size: 20
              })
            ],
            spacing: { after: 400 }
          }),
          
          // Question 4 - Short Answer
          new Paragraph({
            children: [
              new TextRun({
                text: "4. If a triangle has angles of 60° and 70°, what is the measure of the third angle? Explain your reasoning. [2 marks]",
                bold: true,
                size: 24
              })
            ],
            spacing: { after: 400 }
          }),
          
          // Question 5 - Complex Problem
          new Paragraph({
            children: [
              new TextRun({
                text: "5. Simplify the algebraic expression: 2(x + 3) - 4x + 1 [3 marks]",
                bold: true,
                size: 24
              })
            ],
            spacing: { after: 200 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "Express your final answer in its simplest form.",
                italic: true,
                size: 20
              })
            ],
            spacing: { after: 400 }
          }),
          
          // Question 6 - Word Problem
          new Paragraph({
            children: [
              new TextRun({
                text: "6. Sarah has 24 stickers. She gives away 1/3 of them to her friends and buys 8 more stickers. How many stickers does she have now? [4 marks]",
                bold: true,
                size: 24
              })
            ],
            spacing: { after: 400 }
          }),
          
          // Next Steps Section
          new Paragraph({
            children: [
              new TextRun({
                text: "📋 NEXT STEPS TO UPLOAD",
                bold: true,
                size: 28,
                color: "7C2D12"
              })
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 600, after: 200 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "1. Replace ALL sample questions above with your actual test questions",
                size: 22,
                bold: true
              })
            ],
            spacing: { after: 150 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "2. Follow the formatting rules exactly (number. question text [X marks])",
                size: 22,
                bold: true
              })
            ],
            spacing: { after: 150 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "3. Save this document as PDF (File → Export as PDF)",
                size: 22,
                bold: true
              })
            ],
            spacing: { after: 150 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "4. Upload the PDF through the upload form",
                size: 22,
                bold: true
              })
            ],
            spacing: { after: 150 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "5. The system will automatically parse and create scoreable questions",
                size: 22,
                bold: true,
                color: "059669"
              })
            ],
            spacing: { after: 200 }
          }),
          
          // Troubleshooting
          new Paragraph({
            children: [
              new TextRun({
                text: "🔧 TROUBLESHOOTING",
                bold: true,
                size: 24,
                color: "7C2D12"
              })
            ],
            spacing: { before: 400, after: 200 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "If questions don't parse correctly after upload:",
                size: 20
              })
            ],
            spacing: { after: 150 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "• Check that each question starts with 'number.' (e.g., '1.', '2.', '3.')",
                size: 18
              })
            ],
            spacing: { after: 100 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "• Ensure marks are in brackets [X marks] or parentheses (X marks)",
                size: 18
              })
            ],
            spacing: { after: 100 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "• Use the 'Re-parse Questions' button after upload",
                size: 18
              })
            ],
            spacing: { after: 100 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "• Or manually add questions using the manual question editor",
                size: 18
              })
            ],
            spacing: { after: 100 }
          }),
        ],
      },
    ],
  });

  try {
    const buffer = await Packer.toBuffer(doc);
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    
    const filename = `${type}_template_${title.replace(/[^a-zA-Z0-9]/g, '_')}_${grade.replace(/[^a-zA-Z0-9]/g, '_')}.docx`;
    saveAs(blob, filename);
    
    console.log(`✅ Downloaded ${type} template: ${filename}`);
    return true;
  } catch (error) {
    console.error('❌ Error generating DOCX template:', error);
    return false;
  }
};

export const generateLessonTemplate = async (title: string, grade: string) => {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Header
          new Paragraph({
            children: [
              new TextRun({
                text: "LESSON PLAN TEMPLATE",
                bold: true,
                size: 32,
                color: "2563EB"
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
          }),
          
          // Lesson Information
          new Paragraph({
            children: [
              new TextRun({
                text: `Lesson Title: ${title}`,
                bold: true,
                size: 24
              })
            ],
            spacing: { after: 200 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: `Grade: ${grade}`,
                bold: true,
                size: 24
              })
            ],
            spacing: { after: 200 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: `Subject: Mathematics`,
                bold: true,
                size: 24
              })
            ],
            spacing: { after: 200 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: `Duration: [Enter lesson duration]`,
                bold: true,
                size: 24
              })
            ],
            spacing: { after: 400 }
          }),
          
          // Learning Objectives
          new Paragraph({
            children: [
              new TextRun({
                text: "LEARNING OBJECTIVES",
                bold: true,
                size: 24,
                color: "DC2626"
              })
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "By the end of this lesson, students will be able to:",
                size: 22
              })
            ],
            spacing: { after: 200 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "• [Replace with specific learning objective 1]",
                size: 20
              })
            ],
            spacing: { after: 100 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "• [Replace with specific learning objective 2]",
                size: 20
              })
            ],
            spacing: { after: 100 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "• [Replace with specific learning objective 3]",
                size: 20
              })
            ],
            spacing: { after: 400 }
          }),
          
          // Materials
          new Paragraph({
            children: [
              new TextRun({
                text: "MATERIALS",
                bold: true,
                size: 24,
                color: "DC2626"
              })
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "• Whiteboard and markers",
                size: 20
              })
            ],
            spacing: { after: 100 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "• [Add additional materials needed]",
                size: 20
              })
            ],
            spacing: { after: 100 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "• [Add technology requirements if any]",
                size: 20
              })
            ],
            spacing: { after: 400 }
          }),
          
          // Lesson Activities
          new Paragraph({
            children: [
              new TextRun({
                text: "LESSON ACTIVITIES",
                bold: true,
                size: 24,
                color: "DC2626"
              })
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "INTRODUCTION (10 minutes)",
                bold: true,
                size: 22,
                color: "059669"
              })
            ],
            spacing: { after: 200 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "[Describe how you will introduce the topic and engage students]",
                size: 20
              })
            ],
            spacing: { after: 400 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "MAIN ACTIVITY (25 minutes)",
                bold: true,
                size: 22,
                color: "059669"
              })
            ],
            spacing: { after: 200 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "[Describe the main teaching activities and content delivery]",
                size: 20
              })
            ],
            spacing: { after: 400 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "PRACTICE (10 minutes)",
                bold: true,
                size: 22,
                color: "059669"
              })
            ],
            spacing: { after: 200 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "[Describe guided and independent practice activities]",
                size: 20
              })
            ],
            spacing: { after: 400 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "CONCLUSION (5 minutes)",
                bold: true,
                size: 22,
                color: "059669"
              })
            ],
            spacing: { after: 200 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "[Describe how you will wrap up and summarize key points]",
                size: 20
              })
            ],
            spacing: { after: 400 }
          }),
          
          // Assessment
          new Paragraph({
            children: [
              new TextRun({
                text: "ASSESSMENT",
                bold: true,
                size: 24,
                color: "DC2626"
              })
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "[Describe how you will assess student understanding during and after the lesson]",
                size: 20
              })
            ],
            spacing: { after: 400 }
          }),
          
          // Homework
          new Paragraph({
            children: [
              new TextRun({
                text: "HOMEWORK/FOLLOW-UP",
                bold: true,
                size: 24,
                color: "DC2626"
              })
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "[Assign homework or follow-up activities to reinforce learning]",
                size: 20
              })
            ],
            spacing: { after: 400 }
          }),
        ],
      },
    ],
  });

  try {
    const buffer = await Packer.toBuffer(doc);
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    
    const filename = `lesson_template_${title.replace(/[^a-zA-Z0-9]/g, '_')}_${grade.replace(/[^a-zA-Z0-9]/g, '_')}.docx`;
    saveAs(blob, filename);
    
    console.log(`✅ Downloaded lesson template: ${filename}`);
    return true;
  } catch (error) {
    console.error('❌ Error generating lesson template:', error);
    return false;
  }
};

// Function to generate a format guide document
export const generateFormatGuide = async () => {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Header
          new Paragraph({
            children: [
              new TextRun({
                text: "QUESTION FORMATTING GUIDE",
                bold: true,
                size: 32,
                color: "2563EB"
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "This guide shows you exactly how to format questions for automatic parsing",
                italic: true,
                size: 24,
                color: "374151"
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 600 }
          }),
          
          // Correct Format Examples
          new Paragraph({
            children: [
              new TextRun({
                text: "✅ CORRECT FORMATS",
                bold: true,
                size: 28,
                color: "059669"
              })
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 300 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "1. What is 5 + 3? [2 marks]",
                size: 22,
                bold: true
              })
            ],
            spacing: { after: 100 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "2. Calculate the area of a square with side length 4cm. (3 marks)",
                size: 22,
                bold: true
              })
            ],
            spacing: { after: 100 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "3. Solve for x: 2x + 5 = 11 [4 marks]",
                size: 22,
                bold: true
              })
            ],
            spacing: { after: 400 }
          }),
          
          // Wrong Format Examples
          new Paragraph({
            children: [
              new TextRun({
                text: "❌ WRONG FORMATS",
                bold: true,
                size: 28,
                color: "DC2626"
              })
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 300 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "Question 1: What is 5 + 3? (Missing number format)",
                size: 22,
                color: "DC2626"
              })
            ],
            spacing: { after: 100 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "1) What is 5 + 3? [2 marks] (Use period, not parenthesis)",
                size: 22,
                color: "DC2626"
              })
            ],
            spacing: { after: 100 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "1. What is 5 + 3? (Missing marks notation)",
                size: 22,
                color: "DC2626"
              })
            ],
            spacing: { after: 400 }
          }),
        ],
      },
    ],
  });

  try {
    const buffer = await Packer.toBuffer(doc);
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    
    saveAs(blob, "Question_Formatting_Guide.docx");
    console.log(`✅ Downloaded formatting guide`);
    return true;
  } catch (error) {
    console.error('❌ Error generating format guide:', error);
    return false;
  }
};