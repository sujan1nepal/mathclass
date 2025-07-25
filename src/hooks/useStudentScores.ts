import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface StudentScore {
  id: string;
  student_id: string;
  test_question_id: string;
  scored_marks: number;
  created_at: string;
  student?: {
    name: string;
    grade: string;
  };
  test_question?: {
    question_text: string;
    total_marks: number;
    question_order: number;
  };
}

export interface StudentTestScore {
  student_id: string;
  student_name: string;
  total_scored: number;
  total_possible: number;
  percentage: number;
  scores: Array<{
    question_id: string;
    question_order: number;
    question_text: string;
    scored_marks: number;
    total_marks: number;
  }>;
}

export const useStudentScores = () => {
  const [scores, setScores] = useState<StudentScore[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchScores = async (testId?: string) => {
    try {
      let query = supabase
        .from('student_scores')
        .select(`
          *,
          students:student_id (
            name,
            grade
          ),
          test_questions:test_question_id (
            question_text,
            total_marks,
            question_order,
            test_id
          )
        `)
        .order('created_at', { ascending: false });

      if (testId) {
        query = query.eq('test_questions.test_id', testId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching scores:', error);
        toast.error('Failed to fetch scores');
        return;
      }

      setScores(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to fetch scores');
    } finally {
      setLoading(false);
    }
  };

  const saveScore = async (studentId: string, testQuestionId: string, scoredMarks: number) => {
    try {
      const { error } = await supabase
        .from('student_scores')
        .upsert({
          student_id: studentId,
          test_question_id: testQuestionId,
          scored_marks: scoredMarks
        }, {
          onConflict: 'student_id,test_question_id'
        });

      if (error) {
        console.error('Error saving score:', error);
        toast.error('Failed to save score');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to save score');
      return false;
    }
  };

  const saveBulkScores = async (scores: Array<{ studentId: string; testQuestionId: string; scoredMarks: number }>) => {
    try {
      const records = scores.map(score => ({
        student_id: score.studentId,
        test_question_id: score.testQuestionId,
        scored_marks: score.scoredMarks
      }));

      const { error } = await supabase
        .from('student_scores')
        .upsert(records, {
          onConflict: 'student_id,test_question_id'
        });

      if (error) {
        console.error('Error saving bulk scores:', error);
        toast.error('Failed to save scores');
        return false;
      }

      await fetchScores();
      toast.success('Scores saved successfully');
      return true;
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to save scores');
      return false;
    }
  };

  const getStudentTestScores = async (testId: string): Promise<StudentTestScore[]> => {
    try {
      // Get test questions
      const { data: questionsData } = await supabase
        .from('test_questions')
        .select('*')
        .eq('test_id', testId)
        .order('question_order');

      // Get students for the test's grade
      const { data: testData } = await supabase
        .from('tests')
        .select('grade')
        .eq('id', testId)
        .single();

      const { data: studentsData } = await supabase
        .from('students')
        .select('*')
        .eq('grade', testData?.grade || '')
        .order('name');

      // Get all scores for this test
      const { data: scoresData } = await supabase
        .from('student_scores')
        .select(`
          *,
          test_questions!inner (
            test_id,
            question_order,
            question_text,
            total_marks
          )
        `)
        .eq('test_questions.test_id', testId);

      const questions = questionsData || [];
      const students = studentsData || [];
      const scores = scoresData || [];

      // Group scores by student
      const studentScores: StudentTestScore[] = students.map(student => {
        const studentScoreRecords = scores.filter(score => score.student_id === student.id);
        
        const questionScores = questions.map(question => {
          const scoreRecord = studentScoreRecords.find(s => s.test_question_id === question.id);
          return {
            question_id: question.id,
            question_order: question.question_order,
            question_text: question.question_text,
            scored_marks: scoreRecord?.scored_marks || 0,
            total_marks: question.total_marks
          };
        });

        const totalScored = questionScores.reduce((sum, q) => sum + q.scored_marks, 0);
        const totalPossible = questionScores.reduce((sum, q) => sum + q.total_marks, 0);
        const percentage = totalPossible > 0 ? Math.round((totalScored / totalPossible) * 100) : 0;

        return {
          student_id: student.id,
          student_name: student.name,
          total_scored: totalScored,
          total_possible: totalPossible,
          percentage,
          scores: questionScores
        };
      });

      return studentScores;
    } catch (error) {
      console.error('Error fetching student test scores:', error);
      return [];
    }
  };

  useEffect(() => {
    fetchScores();
  }, []);

  return {
    scores,
    loading,
    saveScore,
    saveBulkScores,
    fetchScores,
    getStudentTestScores,
    refetch: fetchScores
  };
};