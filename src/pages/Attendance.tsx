import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { 
  Calendar as CalendarIcon, 
  Users, 
  CheckCircle, 
  XCircle,
  Save,
  Download
} from "lucide-react";

interface Student {
  id: number;
  name: string;
  grade: string;
  isPresent: boolean;
}

interface AttendanceRecord {
  date: string;
  grade: string;
  students: Student[];
}

const Attendance = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  
  // Mock students data
  const [students, setStudents] = useState<Student[]>([
    { id: 1, name: "Alice Johnson", grade: "Grade 9", isPresent: false },
    { id: 2, name: "Bob Smith", grade: "Grade 10", isPresent: false },
    { id: 3, name: "Carol Davis", grade: "Grade 11", isPresent: false },
    { id: 4, name: "David Wilson", grade: "Grade 9", isPresent: false },
    { id: 5, name: "Emma Brown", grade: "Grade 10", isPresent: false },
    { id: 6, name: "Frank Miller", grade: "Grade 11", isPresent: false },
  ]);

  const filteredStudents = selectedGrade 
    ? students.filter(student => student.grade === selectedGrade)
    : students;

  const handleAttendanceChange = (studentId: number, isPresent: boolean) => {
    setStudents(students.map(student => 
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
    setStudents(students.map(student => 
      student.grade === selectedGrade 
        ? { ...student, isPresent: true }
        : student
    ));
    toast.success("All students marked as present");
  };

  const handleMarkAllAbsent = () => {
    if (!selectedGrade) {
      toast.error("Please select a grade first");
      return;
    }
    setStudents(students.map(student => 
      student.grade === selectedGrade 
        ? { ...student, isPresent: false }
        : student
    ));
    toast.success("All students marked as absent");
  };

  const handleSaveAttendance = () => {
    if (!selectedGrade) {
      toast.error("Please select a grade first");
      return;
    }

    const dateString = selectedDate.toISOString().split('T')[0];
    const newRecord: AttendanceRecord = {
      date: dateString,
      grade: selectedGrade,
      students: filteredStudents.map(student => ({ ...student }))
    };

    // Remove existing record for same date and grade
    const updatedRecords = attendanceRecords.filter(
      record => !(record.date === dateString && record.grade === selectedGrade)
    );
    
    setAttendanceRecords([...updatedRecords, newRecord]);
    toast.success("Attendance saved successfully!");
  };

  const getAttendanceStats = () => {
    if (filteredStudents.length === 0) return { present: 0, absent: 0, rate: 0 };
    
    const present = filteredStudents.filter(student => student.isPresent).length;
    const absent = filteredStudents.length - present;
    const rate = Math.round((present / filteredStudents.length) * 100);
    
    return { present, absent, rate };
  };

  const stats = getAttendanceStats();

  const getAttendanceHistory = () => {
    return attendanceRecords
      .filter(record => record.grade === selectedGrade)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Attendance</h1>
          <p className="text-muted-foreground">Track daily student attendance</p>
        </div>
        <Button variant="outline" className="gap-2">
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
                  <Badge variant="outline">{filteredStudents.length}</Badge>
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
              disabled={!selectedGrade}
              className="w-full bg-success hover:bg-success/90"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark All Present
            </Button>
            <Button 
              onClick={handleMarkAllAbsent}
              disabled={!selectedGrade}
              variant="destructive"
              className="w-full"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Mark All Absent
            </Button>
            <Button 
              onClick={handleSaveAttendance}
              disabled={!selectedGrade}
              variant="outline"
              className="w-full"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Attendance
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStudents.map((student) => (
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
          </CardContent>
        </Card>
      )}

      {/* Attendance History */}
      {selectedGrade && getAttendanceHistory().length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Recent Attendance - {selectedGrade}</CardTitle>
            <CardDescription>
              Last 5 attendance records for this grade
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {getAttendanceHistory().map((record, index) => {
                const present = record.students.filter(s => s.isPresent).length;
                const total = record.students.length;
                const rate = Math.round((present / total) * 100);
                
                return (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{new Date(record.date).toLocaleDateString()}</p>
                      <p className="text-sm text-muted-foreground">
                        {present}/{total} students present
                      </p>
                    </div>
                    <Badge variant={rate >= 90 ? "default" : rate >= 80 ? "secondary" : "destructive"}>
                      {rate}%
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Attendance;