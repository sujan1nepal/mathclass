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
          
          // Instructions
          new Paragraph({
            children: [
              new TextRun({
                text: "FORMATTING INSTRUCTIONS",
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
                text: "Please follow this exact format for questions to be parsed correctly:",
                italic: true,
                size: 22
              })
            ],
            spacing: { after: 200 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "• Start each question with a number followed by a period (1., 2., 3., etc.)",
                size: 20
              })
            ],
            spacing: { after: 100 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "• Include marks in square brackets [3 marks] or parentheses (3 marks)",
                size: 20
              })
            ],
            spacing: { after: 100 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "• Leave blank lines between questions",
                size: 20
              })
            ],
            spacing: { after: 100 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "• For multiple choice, use a), b), c), d) format",
                size: 20
              })
            ],
            spacing: { after: 400 }
          }),
          
          // Sample Questions
          new Paragraph({
            children: [
              new TextRun({
                text: "SAMPLE QUESTIONS",
                bold: true,
                size: 28,
                color: "059669"
              })
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "Replace these sample questions with your actual test content:",
                italic: true,
                size: 22
              })
            ],
            spacing: { after: 400 }
          }),
          
          // Question 1
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
          
          // Question 2
          new Paragraph({
            children: [
              new TextRun({
                text: "2. Solve for y: 3y - 7 = 14 [3 marks]",
                bold: true,
                size: 24
              })
            ],
            spacing: { after: 200 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "Show your working steps clearly.",
                italic: true,
                size: 20
              })
            ],
            spacing: { after: 400 }
          }),
          
          // Question 3
          new Paragraph({
            children: [
              new TextRun({
                text: "3. Calculate the area of a rectangle with length 8cm and width 5cm. (2 marks)",
                bold: true,
                size: 24
              })
            ],
            spacing: { after: 400 }
          }),
          
          // Question 4
          new Paragraph({
            children: [
              new TextRun({
                text: "4. If a triangle has angles of 60° and 70°, what is the third angle? [1 mark]",
                bold: true,
                size: 24
              })
            ],
            spacing: { after: 400 }
          }),
          
          // Question 5
          new Paragraph({
            children: [
              new TextRun({
                text: "5. Simplify the expression: 2(x + 3) - 4x + 1 [3 marks]",
                bold: true,
                size: 24
              })
            ],
            spacing: { after: 200 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "Express your answer in simplest form.",
                italic: true,
                size: 20
              })
            ],
            spacing: { after: 400 }
          }),
          
          // Footer Instructions
          new Paragraph({
            children: [
              new TextRun({
                text: "NEXT STEPS",
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
                text: "1. Replace the sample questions above with your actual test questions",
                size: 22
              })
            ],
            spacing: { after: 100 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "2. Follow the formatting guidelines exactly",
                size: 22
              })
            ],
            spacing: { after: 100 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "3. Save as PDF and upload to the system",
                size: 22
              })
            ],
            spacing: { after: 100 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "4. The system will automatically parse your questions for scoring",
                size: 22
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
            spacing: { after: 400 }
          }),
          
          // Sections
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
                text: "• [Add your learning objective 1]",
                size: 20
              })
            ],
            spacing: { after: 100 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "• [Add your learning objective 2]",
                size: 20
              })
            ],
            spacing: { after: 100 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "• [Add your learning objective 3]",
                size: 20
              })
            ],
            spacing: { after: 400 }
          }),
          
          // More sections would go here...
          new Paragraph({
            children: [
              new TextRun({
                text: "LESSON CONTENT",
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
                text: "[Add your lesson content here...]",
                size: 22
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