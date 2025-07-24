import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AttendanceRecord {
  id: string;
  student_id: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  created_at: string;
  student?: {
    name: string;
    grade: string;
  };
}

export const useAttendance = () => {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAttendance = async (date?: string, grade?: string) => {
    try {
      let query = supabase
        .from('attendance')
        .select(`
          *,
          students:student_id (
            name,
            grade
          )
        `)
        .order('date', { ascending: false });

      if (date) {
        query = query.eq('date', date);
      }

      if (grade) {
        query = query.eq('students.grade', grade);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching attendance:', error);
        toast.error('Failed to fetch attendance records');
        return;
      }

      setAttendanceRecords(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to fetch attendance records');
    } finally {
      setLoading(false);
    }
  };

  const saveAttendance = async (studentId: string, date: string, status: 'present' | 'absent' | 'late') => {
    try {
      const { error } = await supabase
        .from('attendance')
        .upsert({
          student_id: studentId,
          date,
          status
        }, {
          onConflict: 'student_id,date'
        });

      if (error) {
        console.error('Error saving attendance:', error);
        toast.error('Failed to save attendance');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to save attendance');
      return false;
    }
  };

  const saveBulkAttendance = async (attendanceData: Array<{ studentId: string; date: string; status: 'present' | 'absent' | 'late' }>) => {
    try {
      const records = attendanceData.map(item => ({
        student_id: item.studentId,
        date: item.date,
        status: item.status
      }));

      const { error } = await supabase
        .from('attendance')
        .upsert(records, {
          onConflict: 'student_id,date'
        });

      if (error) {
        console.error('Error saving bulk attendance:', error);
        toast.error('Failed to save attendance');
        return false;
      }

      await fetchAttendance();
      toast.success('Attendance saved successfully');
      return true;
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to save attendance');
      return false;
    }
  };

  const getAttendanceStats = (records: AttendanceRecord[]) => {
    const total = records.length;
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const late = records.filter(r => r.status === 'late').length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;

    return { total, present, absent, late, rate };
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  return {
    attendanceRecords,
    loading,
    saveAttendance,
    saveBulkAttendance,
    fetchAttendance,
    getAttendanceStats,
    refetch: fetchAttendance
  };
};