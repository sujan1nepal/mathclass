import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { extractTextFromPDF, parseTestQuestions } from '@/utils/pdfProcessor';

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
      
      // Extract text from PDF
      const pdfContent = await extractTextFromPDF(file);
      
      // Parse questions from PDF content
      const questions = parseTestQuestions(pdfContent);
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
        }
      }
      
      await fetchTests();
      await fetchTestQuestions(testData.id);
      toast.success(`${type} uploaded successfully with ${questions.length} questions`);
      return testData;
    } catch (error) {
      toast.error('Failed to process PDF');
      console.error('Error:', error);
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
      
      // Re-parse questions
      const questions = parseTestQuestions(testData.pdf_content);
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
      toast.success(`Re-parsed ${questions.length} questions successfully`);
      return true;
    } catch (error) {
      console.error('Error re-parsing questions:', error);
      toast.error('Failed to re-parse questions');
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
    reparseTestQuestions
  };
};