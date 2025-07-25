import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DashboardStats {
  totalStudents: number;
  totalLessons: number;
  totalTests: number;
  averageScore: number;
  attendanceRate: number;
}

export interface RecentTest {
  id: string;
  title: string;
  grade: string;
  type: 'pretest' | 'posttest';
  total_marks: number;
  created_at: string;
  avgScore?: number;
}

export interface GradePerformance {
  grade: string;
  students: number;
  avgScore: number;
  color: string;
}

export const useDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalLessons: 0,
    totalTests: 0,
    averageScore: 0,
    attendanceRate: 0
  });
  const [recentTests, setRecentTests] = useState<RecentTest[]>([]);
  const [gradePerformance, setGradePerformance] = useState<GradePerformance[]>([]);
  const [loading, setLoading] = useState(true);

  const calculateAverageScores = async () => {
    try {
      // Get all student scores with related data
      const { data: scoresData, error: scoresError } = await supabase
        .from('student_scores')
        .select(`
          scored_marks,
          students!inner (
            id,
            grade
          ),
          test_questions!inner (
            total_marks,
            tests!inner (
              id,
              type,
              grade
            )
          )
        `);

      if (scoresError) {
        console.error('Error fetching scores for dashboard:', scoresError);
        return { overall: 0, byGrade: {} };
      }

      // Group scores by student and test to calculate percentages
      const studentTestScores: Record<string, Array<{
        totalScored: number;
        totalPossible: number;
        grade: string;
      }>> = {};

      (scoresData || []).forEach(score => {
        if (!score.students || !score.test_questions) return;
        
        const studentId = score.students.id;
        const grade = score.students.grade;
        const testId = score.test_questions.tests.id;
        const key = `${studentId}-${testId}`;
        
        if (!studentTestScores[key]) {
          studentTestScores[key] = [];
        }

        studentTestScores[key].push({
          totalScored: score.scored_marks,
          totalPossible: score.test_questions.total_marks,
          grade: grade
        });
      });

      // Calculate percentages for each student-test combination
      const percentages: number[] = [];
      const gradePercentages: Record<string, number[]> = {};

      Object.values(studentTestScores).forEach(testScores => {
        const totalScored = testScores.reduce((sum, s) => sum + s.totalScored, 0);
        const totalPossible = testScores.reduce((sum, s) => sum + s.totalPossible, 0);
        
        if (totalPossible > 0) {
          const percentage = (totalScored / totalPossible) * 100;
          percentages.push(percentage);
          
          // Group by grade
          const grade = testScores[0].grade;
          if (!gradePercentages[grade]) {
            gradePercentages[grade] = [];
          }
          gradePercentages[grade].push(percentage);
        }
      });

      // Calculate overall average
      const overallAvg = percentages.length > 0 
        ? Math.round(percentages.reduce((sum, p) => sum + p, 0) / percentages.length)
        : 0;

      // Calculate grade averages
      const gradeAverages: Record<string, number> = {};
      Object.entries(gradePercentages).forEach(([grade, scores]) => {
        gradeAverages[grade] = scores.length > 0 
          ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
          : 0;
      });

      return { overall: overallAvg, byGrade: gradeAverages };
    } catch (error) {
      console.error('Error calculating average scores:', error);
      return { overall: 0, byGrade: {} };
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch basic counts and calculate scores in parallel
      const [
        studentsResult, 
        lessonsResult, 
        testsResult, 
        attendanceResult,
        averageScores
      ] = await Promise.all([
        supabase.from('students').select('id, grade'),
        supabase.from('lessons').select('id'),
        supabase.from('tests').select('id, title, grade, type, total_marks, created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('attendance').select('status'),
        calculateAverageScores()
      ]);

      // Calculate stats
      const totalStudents = studentsResult.data?.length || 0;
      const totalLessons = lessonsResult.data?.length || 0;
      const totalTests = testsResult.data?.length || 0;

      // Calculate attendance rate
      const attendanceData = attendanceResult.data || [];
      const presentCount = attendanceData.filter(a => a.status === 'present').length;
      const attendanceRate = attendanceData.length > 0 ? Math.round((presentCount / attendanceData.length) * 100) : 0;

      // Calculate grade performance with real scores
      const studentsByGrade = studentsResult.data?.reduce((acc, student) => {
        acc[student.grade] = (acc[student.grade] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const gradeColors = ['bg-success', 'bg-primary', 'bg-warning', 'bg-accent'];
      const gradePerf = Object.entries(studentsByGrade).map(([grade, count], index) => ({
        grade,
        students: count,
        avgScore: averageScores.byGrade[grade] || 0,
        color: gradeColors[index % gradeColors.length]
      }));

      setStats({
        totalStudents,
        totalLessons,
        totalTests,
        averageScore: averageScores.overall,
        attendanceRate
      });

      setRecentTests((testsResult.data || []).map(test => ({
        ...test,
        type: test.type as 'pretest' | 'posttest'
      })));
      setGradePerformance(gradePerf);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return {
    stats,
    recentTests,
    gradePerformance,
    loading,
    refetch: fetchDashboardData
  };
};