import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useStudents } from "@/hooks/useStudents";
import { useAttendance } from "@/hooks/useAttendance";
import { toast } from "sonner";
import { 
  Calendar as CalendarIcon, 
  Users, 
  CheckCircle, 
  XCircle,
  Save,
  Download,
  Loader2
} from "lucide-react";

interface StudentAttendance {
  id: string;
  name: string;
  grade: string;
  isPresent: boolean;
}

const Attendance = () => {
  const { students, loading: studentsLoading } = useStudents();
  const { attendanceRecords, loading: attendanceLoading, saveBulkAttendance, fetchAttendance, getAttendanceStats } = useAttendance();
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [studentAttendance, setStudentAttendance] = useState<StudentAttendance[]>([]);
  const [saving, setSaving] = useState(false);

  // Update student attendance when grade or date changes
  useEffect(() => {
    if (selectedGrade && students.length > 0) {
      const gradeStudents = students.filter(student => student.grade === selectedGrade);
      const dateString = selectedDate.toISOString().split('T')[0];
      
      // Check existing attendance for this date
      const existingAttendance = attendanceRecords.filter(
        record => record.date === dateString && record.student?.grade === selectedGrade
      );
      
      const updatedStudentAttendance = gradeStudents.map(student => {
        const existingRecord = existingAttendance.find(record => record.student_id === student.id);
        return {
          id: student.id,
          name: student.name,
          grade: student.grade,
          isPresent: existingRecord?.status === 'present'
        };
      });
      
      setStudentAttendance(updatedStudentAttendance);
    } else {
      setStudentAttendance([]);
    }
  }, [selectedGrade, selectedDate, students, attendanceRecords]);

  const handleAttendanceChange = (studentId: string, isPresent: boolean) => {
    setStudentAttendance(studentAttendance.map(student => 
      student.id === studentId 
        ? { ...student, isPresent }
        : student
    ));
  };

  const handleMarkAllPresent = () => {
    if (!selectedGrade) {
      toast.error("Please select a grade first");
      return;
    }
    setStudentAttendance(studentAttendance.map(student => ({ ...student, isPresent: true })));
    toast.success("All students marked as present");
  };

  const handleMarkAllAbsent = () => {
    if (!selectedGrade) {
      toast.error("Please select a grade first");
      return;
    }
    setStudentAttendance(studentAttendance.map(student => ({ ...student, isPresent: false })));
    toast.success("All students marked as absent");
  };

  const handleSaveAttendance = async () => {
    if (!selectedGrade) {
      toast.error("Please select a grade first");
      return;
    }

    setSaving(true);
    const dateString = selectedDate.toISOString().split('T')[0];
    
    const attendanceData = studentAttendance.map(student => ({
      studentId: student.id,
      date: dateString,
      status: student.isPresent ? 'present' as const : 'absent' as const
    }));

    const success = await saveBulkAttendance(attendanceData);
    if (success) {
      await fetchAttendance();
    }
    setSaving(false);
  };

  const getAttendanceStats = () => {
    if (studentAttendance.length === 0) return { present: 0, absent: 0, rate: 0 };
    
    const present = studentAttendance.filter(student => student.isPresent).length;
    const absent = studentAttendance.length - present;
    const rate = Math.round((present / studentAttendance.length) * 100);
    
    return { present, absent, rate };
  };

  const stats = getAttendanceStats();

  const handleExportReport = () => {
    const reportData = {
      date: selectedDate.toISOString().split('T')[0],
      grade: selectedGrade,
      attendance: studentAttendance,
      stats,
      generatedAt: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance-report-${selectedGrade}-${selectedDate.toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Attendance</h1>
          <p className="text-muted-foreground">Track daily student attendance</p>
        </div>
        <Button 
          variant="outline" 
          className="gap-2"
          onClick={handleExportReport}
          disabled={!selectedGrade || studentAttendance.length === 0}
        >
          <Download className="w-4 h-4" />
          Export Report
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar and Date Selection */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CalendarIcon className="w-5 h-5" />
              <span>Select Date</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border"
            />
            <div className="mt-4">
              <p className="text-sm font-medium">Selected Date:</p>
              <p className="text-lg font-bold text-primary">
                {selectedDate.toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Grade Selection and Stats */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Grade Selection</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Grade 9">Grade 9</SelectItem>
                  <SelectItem value="Grade 10">Grade 10</SelectItem>
                  <SelectItem value="Grade 11">Grade 11</SelectItem>
                  <SelectItem value="Grade 12">Grade 12</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedGrade && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Students:</span>
                  <Badge variant="outline">{studentAttendance.length}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Present:</span>
                  <Badge variant="default" className="bg-success">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {stats.present}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Absent:</span>
                  <Badge variant="destructive">
                    <XCircle className="w-3 h-3 mr-1" />
                    {stats.absent}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Attendance Rate:</span>
                  <Badge variant={stats.rate >= 90 ? "default" : stats.rate >= 80 ? "secondary" : "destructive"}>
                    {stats.rate}%
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Bulk attendance operations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={handleMarkAllPresent}
              disabled={!selectedGrade || studentsLoading}
              className="w-full bg-success hover:bg-success/90"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark All Present
            </Button>
            <Button 
              onClick={handleMarkAllAbsent}
              disabled={!selectedGrade || studentsLoading}
              variant="destructive"
              className="w-full"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Mark All Absent
            </Button>
            <Button 
              onClick={handleSaveAttendance}
              disabled={!selectedGrade || saving || studentAttendance.length === 0}
              variant="outline"
              className="w-full"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {saving ? 'Saving...' : 'Save Attendance'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Student Attendance List */}
      {selectedGrade && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>
              Student Attendance - {selectedGrade}
            </CardTitle>
            <CardDescription>
              Mark individual student attendance for {selectedDate.toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {studentsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : studentAttendance.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {studentAttendance.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={student.isPresent}
                        onCheckedChange={(checked) => 
                          handleAttendanceChange(student.id, checked as boolean)
                        }
                      />
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-sm text-muted-foreground">{student.grade}</p>
                      </div>
                    </div>
                    <Badge 
                      variant={student.isPresent ? "default" : "destructive"}
                      className={student.isPresent ? "bg-success" : ""}
                    >
                      {student.isPresent ? "Present" : "Absent"}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                {selectedGrade ? 'No students found for this grade' : 'Please select a grade to view students'}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Attendance;