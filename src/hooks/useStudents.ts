import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Student {
  id: string;
  name: string;
  grade: string;
  gender: string;
  date_of_birth?: string;
  contact_info?: any;
  created_at: string;
  updated_at: string;
}

export const useStudents = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('name');
      
      if (error) {
        toast.error('Failed to fetch students');
        console.error('Error fetching students:', error);
        return;
      }
      
      setStudents(data || []);
    } catch (error) {
      toast.error('Failed to fetch students');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const addStudent = async (studentData: Omit<Student, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('students')
        .insert([studentData])
        .select()
        .single();
      
      if (error) {
        toast.error('Failed to add student');
        console.error('Error adding student:', error);
        return null;
      }
      
      await fetchStudents();
      toast.success('Student added successfully');
      return data;
    } catch (error) {
      toast.error('Failed to add student');
      console.error('Error:', error);
      return null;
    }
  };

  const updateStudent = async (id: string, updates: Partial<Student>) => {
    try {
      const { error } = await supabase
        .from('students')
        .update(updates)
        .eq('id', id);
      
      if (error) {
        toast.error('Failed to update student');
        console.error('Error updating student:', error);
        return false;
      }
      
      await fetchStudents();
      toast.success('Student updated successfully');
      return true;
    } catch (error) {
      toast.error('Failed to update student');
      console.error('Error:', error);
      return false;
    }
  };

  const deleteStudent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id);
      
      if (error) {
        toast.error('Failed to delete student');
        console.error('Error deleting student:', error);
        return false;
      }
      
      await fetchStudents();
      toast.success('Student deleted successfully');
      return true;
    } catch (error) {
      toast.error('Failed to delete student');
      console.error('Error:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  return {
    students,
    loading,
    addStudent,
    updateStudent,
    deleteStudent,
    refetch: fetchStudents
  };
};