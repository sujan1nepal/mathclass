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

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch basic counts
      const [studentsResult, lessonsResult, testsResult, attendanceResult] = await Promise.all([
        supabase.from('students').select('id, grade'),
        supabase.from('lessons').select('id'),
        supabase.from('tests').select('id, title, grade, type, total_marks, created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('attendance').select('status')
      ]);

      // Calculate stats
      const totalStudents = studentsResult.data?.length || 0;
      const totalLessons = lessonsResult.data?.length || 0;
      const totalTests = testsResult.data?.length || 0;

      // Calculate attendance rate
      const attendanceData = attendanceResult.data || [];
      const presentCount = attendanceData.filter(a => a.status === 'present').length;
      const attendanceRate = attendanceData.length > 0 ? Math.round((presentCount / attendanceData.length) * 100) : 0;

      // Calculate grade performance
      const studentsByGrade = studentsResult.data?.reduce((acc, student) => {
        acc[student.grade] = (acc[student.grade] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const gradeColors = ['bg-success', 'bg-primary', 'bg-warning', 'bg-accent'];
      const gradePerf = Object.entries(studentsByGrade).map(([grade, count], index) => ({
        grade,
        students: count,
        avgScore: Math.floor(Math.random() * 20) + 70, // TODO: Calculate actual scores when student_scores are available
        color: gradeColors[index % gradeColors.length]
      }));

      setStats({
        totalStudents,
        totalLessons,
        totalTests,
        averageScore: 78, // TODO: Calculate from actual student scores
        attendanceRate
      });

      setRecentTests(testsResult.data || []);
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