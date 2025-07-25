import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface LessonWithTests {
  id: string;
  title: string;
  grade: string;
  pdf_content: string | null;
  pdf_filename: string | null;
  upload_date: string;
  created_at: string;
  pretest?: {
    id: string;
    title: string;
    total_marks: number;
    avgScore?: number;
  };
  posttest?: {
    id: string;
    title: string;
    total_marks: number;
    avgScore?: number;
  };
  studentsEnrolled: number;
  improvement: number;
}

export const useLessons = () => {
  const [lessons, setLessons] = useState<LessonWithTests[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLessons = async (grade?: string) => {
    try {
      setLoading(true);

      let query = supabase
        .from('lessons')
        .select(`
          *,
          tests!tests_lesson_id_fkey (
            id,
            title,
            type,
            total_marks
          )
        `)
        .order('created_at', { ascending: false });

      if (grade && grade !== 'all') {
        query = query.eq('grade', grade);
      }

      const { data: lessonsData, error } = await query;

      if (error) {
        console.error('Error fetching lessons:', error);
        toast.error('Failed to fetch lessons');
        return;
      }

      // Get student counts by grade
      const { data: studentsData } = await supabase
        .from('students')
        .select('grade');

      const studentsByGrade = studentsData?.reduce((acc, student) => {
        acc[student.grade] = (acc[student.grade] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Process lessons with test data
      const processedLessons = lessonsData?.map(lesson => {
        const tests = lesson.tests || [];
        const pretest = tests.find((t: any) => t.type === 'pretest');
        const posttest = tests.find((t: any) => t.type === 'posttest');
        
        // Mock improvement calculation - in real app, calculate from actual scores
        const improvement = pretest && posttest ? Math.floor(Math.random() * 20) + 10 : 0;

        return {
          ...lesson,
          pretest,
          posttest,
          studentsEnrolled: studentsByGrade[lesson.grade] || 0,
          improvement
        };
      }) || [];

      setLessons(processedLessons);

    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to fetch lessons');
    } finally {
      setLoading(false);
    }
  };

  const addLesson = async (lessonData: Omit<LessonWithTests, 'id' | 'created_at' | 'upload_date' | 'pretest' | 'posttest' | 'studentsEnrolled' | 'improvement'>) => {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .insert([{
          title: lessonData.title,
          grade: lessonData.grade,
          pdf_content: lessonData.pdf_content || null,
          pdf_filename: lessonData.pdf_filename || null
        }])
        .select()
        .single();

      if (error) {
        console.error('Error adding lesson:', error);
        toast.error('Failed to add lesson');
        return null;
      }

      await fetchLessons();
      toast.success('Lesson added successfully');
      return data;
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to add lesson');
      return null;
    }
  };

  const updateLesson = async (id: string, updates: Partial<LessonWithTests>) => {
    try {
      const { error } = await supabase
        .from('lessons')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Error updating lesson:', error);
        toast.error('Failed to update lesson');
        return false;
      }

      await fetchLessons();
      toast.success('Lesson updated successfully');
      return true;
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to update lesson');
      return false;
    }
  };

  const deleteLesson = async (id: string) => {
    try {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting lesson:', error);
        toast.error('Failed to delete lesson');
        return false;
      }

      await fetchLessons();
      toast.success('Lesson deleted successfully');
      return true;
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to delete lesson');
      return false;
    }
  };

  useEffect(() => {
    fetchLessons();
  }, []);

  return {
    lessons,
    loading,
    addLesson,
    updateLesson,
    fetchLessons,
    deleteLesson,
    refetch: fetchLessons
  };
};