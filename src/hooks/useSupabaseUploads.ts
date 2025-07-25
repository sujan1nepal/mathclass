import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { extractTextFromPDF, parseTestQuestions, createSampleQuestions } from '@/utils/pdfProcessor';

export interface Lesson {
  id: string;
  title: string;
  grade: string;
  pdf_content: string | null;
  pdf_filename: string | null;
  upload_date: string;
  created_at: string;
}

export interface Test {
  id: string;
  title: string;
  type: 'pretest' | 'posttest';
  grade: string;
  lesson_id: string | null;
  pdf_content: string | null;
  pdf_filename: string | null;
  total_marks: number;
  created_at: string;
}

export interface TestQuestion {
  id: string;
  test_id: string;
  question_text: string;
  total_marks: number;
  question_order: number;
  created_at: string;
}

export const useSupabaseUploads = () => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [testQuestions, setTestQuestions] = useState<TestQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLessons = async () => {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching lessons:', error);
        return;
      }
      
      setLessons(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchTests = async () => {
    try {
      const { data, error } = await supabase
        .from('tests')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching tests:', error);
        return;
      }
      
      setTests((data || []) as Test[]);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchTestQuestions = async (testId?: string) => {
    try {
      let query = supabase.from('test_questions').select('*');
      
      if (testId) {
        query = query.eq('test_id', testId);
      }
      
      const { data, error } = await query.order('question_order');
      
      if (error) {
        console.error('Error fetching test questions:', error);
        return;
      }
      
      setTestQuestions(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const uploadLesson = async (file: File, title: string, grade: string) => {
    try {
      setLoading(true);
      
      // Extract text from PDF
      const pdfContent = await extractTextFromPDF(file);
      
      const { data, error } = await supabase
        .from('lessons')
        .insert([{
          title,
          grade,
          pdf_content: pdfContent,
          pdf_filename: file.name
        }])
        .select()
        .single();
      
      if (error) {
        toast.error('Failed to upload lesson');
        console.error('Error uploading lesson:', error);
        return null;
      }
      
      await fetchLessons();
      toast.success('Lesson uploaded successfully');
      return data;
    } catch (error) {
      toast.error('Failed to process PDF');
      console.error('Error:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const uploadTest = async (file: File, title: string, type: 'pretest' | 'posttest', grade: string, lessonId?: string) => {
    try {
      setLoading(true);
      
      let pdfContent = '';
      let questions: Array<{ question: string; marks: number }> = [];
      
      try {
        // Try to extract text from PDF
        console.log('📄 Attempting to extract text from PDF...');
        pdfContent = await extractTextFromPDF(file);
        console.log('✅ PDF text extraction successful');
        
        // Try to parse questions from PDF content
        console.log('🔍 Attempting to parse questions from PDF content...');
        questions = parseTestQuestions(pdfContent);
        console.log(`✅ Question parsing successful: ${questions.length} questions found`);
        
      } catch (pdfError) {
        console.warn('⚠️ PDF processing failed:', pdfError);
        
        // Show user-friendly error message but continue with fallback
        toast.error('PDF text extraction failed. Creating sample questions that you can edit.');
        
        // Use fallback: create sample questions
        pdfContent = `Failed to extract content from PDF: ${file.name}\nReason: ${pdfError instanceof Error ? pdfError.message : 'Unknown error'}`;
        questions = createSampleQuestions(title, type);
        console.log(`🔧 Created ${questions.length} sample questions as fallback`);
      }
      
      // If still no questions, create minimal fallback
      if (questions.length === 0) {
        console.log('🆘 No questions found, creating minimal fallback...');
        questions = [
          {
            question: `Question 1 for ${title}. Please edit this to match your actual test content.`,
            marks: 1
          }
        ];
        toast.warning('No questions could be parsed from the PDF. Please edit the questions manually.');
      }
      
      const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
      
      // Insert test
      const { data: testData, error: testError } = await supabase
        .from('tests')
        .insert([{
          title,
          type,
          grade,
          lesson_id: lessonId || null,
          pdf_content: pdfContent,
          pdf_filename: file.name,
          total_marks: totalMarks
        }])
        .select()
        .single();
      
      if (testError) {
        toast.error('Failed to upload test');
        console.error('Error uploading test:', testError);
        return null;
      }
      
      // Insert questions
      if (questions.length > 0) {
        const questionsData = questions.map((q, index) => ({
          test_id: testData.id,
          question_text: q.question,
          total_marks: q.marks,
          question_order: index + 1
        }));
        
        const { error: questionsError } = await supabase
          .from('test_questions')
          .insert(questionsData);
        
        if (questionsError) {
          console.error('Error inserting questions:', questionsError);
          toast.error('Test uploaded but failed to save questions. You can add them manually.');
        } else {
          console.log('✅ Questions saved successfully');
        }
      }
      
      await fetchTests();
      await fetchTestQuestions(testData.id);
      
      // Show appropriate success message
      if (pdfContent.includes('Failed to extract content')) {
        toast.success(`${type} uploaded with ${questions.length} sample questions. Please edit them to match your test.`);
      } else {
        toast.success(`${type} uploaded successfully with ${questions.length} questions`);
      }
      
      return testData;
    } catch (error) {
      toast.error('Failed to process upload');
      console.error('Error in uploadTest:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteLesson = async (id: string) => {
    try {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', id);
      
      if (error) {
        toast.error('Failed to delete lesson');
        console.error('Error deleting lesson:', error);
        return false;
      }
      
      await fetchLessons();
      toast.success('Lesson deleted successfully');
      return true;
    } catch (error) {
      toast.error('Failed to delete lesson');
      console.error('Error:', error);
      return false;
    }
  };

  const deleteTest = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tests')
        .delete()
        .eq('id', id);
      
      if (error) {
        toast.error('Failed to delete test');
        console.error('Error deleting test:', error);
        return false;
      }
      
      await fetchTests();
      toast.success('Test deleted successfully');
      return true;
    } catch (error) {
      toast.error('Failed to delete test');
      console.error('Error:', error);
      return false;
    }
  };

  const reparseTestQuestions = async (testId: string) => {
    try {
      console.log('🔄 Re-parsing questions for test:', testId);
      
      // Get the test data
      const { data: testData, error: testError } = await supabase
        .from('tests')
        .select('*')
        .eq('id', testId)
        .single();
      
      if (testError || !testData) {
        console.error('Error fetching test:', testError);
        toast.error('Failed to fetch test data');
        return false;
      }
      
      if (!testData.pdf_content) {
        toast.error('No PDF content found for this test');
        return false;
      }
      
      // Delete existing questions
      const { error: deleteError } = await supabase
        .from('test_questions')
        .delete()
        .eq('test_id', testId);
      
      if (deleteError) {
        console.error('Error deleting existing questions:', deleteError);
      }
      
      let questions: Array<{ question: string; marks: number }> = [];
      
      try {
        // Try to re-parse questions
        console.log('🔍 Re-parsing questions from existing PDF content...');
        questions = parseTestQuestions(testData.pdf_content);
        console.log(`✅ Re-parsing successful: ${questions.length} questions found`);
        
        if (questions.length === 0) {
          throw new Error('No questions could be parsed from the content');
        }
      } catch (parseError) {
        console.warn('⚠️ Re-parsing failed:', parseError);
        
        // Use fallback: create sample questions
        questions = createSampleQuestions(testData.title, testData.type);
        console.log(`🔧 Created ${questions.length} sample questions as fallback`);
        toast.warning('Could not parse questions from PDF. Created sample questions for editing.');
      }
      
      const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
      
      // Update test with new total marks
      const { error: updateError } = await supabase
        .from('tests')
        .update({ total_marks: totalMarks })
        .eq('id', testId);
      
      if (updateError) {
        console.error('Error updating test marks:', updateError);
      }
      
      // Insert new questions
      if (questions.length > 0) {
        const questionsData = questions.map((q, index) => ({
          test_id: testId,
          question_text: q.question,
          total_marks: q.marks,
          question_order: index + 1
        }));
        
        const { error: questionsError } = await supabase
          .from('test_questions')
          .insert(questionsData);
        
        if (questionsError) {
          console.error('Error inserting questions:', questionsError);
          toast.error('Failed to save parsed questions');
          return false;
        }
      }
      
      await fetchTests();
      await fetchTestQuestions(testId);
      
      if (questions.some(q => q.question.includes('Sample'))) {
        toast.success(`Re-parsed with ${questions.length} sample questions. Please edit them to match your test.`);
      } else {
        toast.success(`Re-parsed ${questions.length} questions successfully`);
      }
      
      return true;
    } catch (error) {
      console.error('Error re-parsing questions:', error);
      toast.error('Failed to re-parse questions');
      return false;
    }
  };

  const saveManualQuestions = async (testId: string, questions: Array<{ question_text: string; total_marks: number; question_order: number }>) => {
    try {
      console.log('💾 Saving manual questions for test:', testId);
      
      // Delete existing questions
      const { error: deleteError } = await supabase
        .from('test_questions')
        .delete()
        .eq('test_id', testId);
      
      if (deleteError) {
        console.error('Error deleting existing questions:', deleteError);
        toast.error('Failed to delete existing questions');
        return false;
      }
      
      // Calculate total marks
      const totalMarks = questions.reduce((sum, q) => sum + q.total_marks, 0);
      
      // Update test with new total marks
      const { error: updateError } = await supabase
        .from('tests')
        .update({ total_marks: totalMarks })
        .eq('id', testId);
      
      if (updateError) {
        console.error('Error updating test marks:', updateError);
      }
      
      // Insert new questions
      const questionsData = questions.map(q => ({
        test_id: testId,
        question_text: q.question_text,
        total_marks: q.total_marks,
        question_order: q.question_order
      }));
      
      const { error: questionsError } = await supabase
        .from('test_questions')
        .insert(questionsData);
      
      if (questionsError) {
        console.error('Error inserting questions:', questionsError);
        toast.error('Failed to save questions');
        return false;
      }
      
      await fetchTests();
      await fetchTestQuestions(testId);
      
      console.log(`✅ Saved ${questions.length} manual questions successfully`);
      return true;
    } catch (error) {
      console.error('Error saving manual questions:', error);
      toast.error('Failed to save questions');
      return false;
    }
  };

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      await Promise.all([fetchLessons(), fetchTests(), fetchTestQuestions()]);
      setLoading(false);
    };
    
    fetchAll();
  }, []);

  return {
    lessons,
    tests,
    testQuestions,
    loading,
    uploadLesson,
    uploadTest,
    deleteLesson,
    deleteTest,
    fetchTestQuestions,
    refetch: () => Promise.all([fetchLessons(), fetchTests(), fetchTestQuestions()]),
    reparseTestQuestions,
    saveManualQuestions
  };
};