import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useStudents } from "@/hooks/useStudents";
import { useStudentScores } from "@/hooks/useStudentScores";
import { useSupabaseUploads } from "@/hooks/useSupabaseUploads";
import { StudentDetailView } from "@/components/StudentProfile/StudentDetailView";
import { 
  Plus, 
  Search, 
  Users, 
  Eye,
  Edit,
  Trash2,
  UserPlus,
  Loader2,
  TrendingUp,
  Award,
  BookOpen,
  BarChart3
} from "lucide-react";

interface StudentPerformance {
  studentId: string;
  averageScore: number;
  testsCompleted: number;
  lessonsStarted: number;
  improvement: number;
}

const Students = () => {
  const { students, loading, addStudent, updateStudent, deleteStudent } = useStudents();
  const { getStudentTestScores } = useStudentScores();
  const { tests, lessons } = useSupabaseUploads();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGrade, setSelectedGrade] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);
  const [studentPerformances, setStudentPerformances] = useState<Record<string, StudentPerformance>>({});
  const [performanceLoading, setPerformanceLoading] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: "",
    grade: "",
    gender: "",
    date_of_birth: "",
    contact_info: ""
  });

  useEffect(() => {
    if (students.length > 0 && tests.length > 0) {
      loadStudentPerformances();
    }
  }, [students, tests]);

  const loadStudentPerformances = async () => {
    setPerformanceLoading(true);
    try {
      const performances: Record<string, StudentPerformance> = {};
      
      for (const student of students) {
        const studentTests = tests.filter(test => test.grade === student.grade);
        const studentLessons = lessons.filter(lesson => lesson.grade === student.grade);
        
        let totalScore = 0;
        let totalPossible = 0;
        let testsCompleted = 0;
        let pretestAvg = 0;
        let posttestAvg = 0;
        let pretestCount = 0;
        let posttestCount = 0;

        for (const test of studentTests) {
          try {
            const testScores = await getStudentTestScores(test.id);
            const studentScore = testScores.find(score => score.student_id === student.id);
            
            if (studentScore && studentScore.total_possible > 0) {
              totalScore += studentScore.total_scored;
              totalPossible += studentScore.total_possible;
              testsCompleted++;

              if (test.type === 'pretest') {
                pretestAvg += studentScore.percentage;
                pretestCount++;
              } else if (test.type === 'posttest') {
                posttestAvg += studentScore.percentage;
                posttestCount++;
              }
            }
          } catch (error) {
            console.error(`Error loading scores for test ${test.id}:`, error);
          }
        }

        const averageScore = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;
        const improvement = pretestCount > 0 && posttestCount > 0 
          ? Math.round((posttestAvg / posttestCount) - (pretestAvg / pretestCount))
          : 0;

        performances[student.id] = {
          studentId: student.id,
          averageScore,
          testsCompleted,
          lessonsStarted: studentLessons.length,
          improvement
        };
      }

      setStudentPerformances(performances);
    } catch (error) {
      console.error('Error loading student performances:', error);
    } finally {
      setPerformanceLoading(false);
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = selectedGrade === "all" || student.grade === selectedGrade;
    return matchesSearch && matchesGrade;
  });

  const handleAddStudent = async () => {
    if (!newStudent.name || !newStudent.grade || !newStudent.gender) {
      toast.error("Please fill in all required fields");
      return;
    }

    const studentData = {
      name: newStudent.name,
      grade: newStudent.grade,
      gender: newStudent.gender,
      date_of_birth: newStudent.date_of_birth || null,
      contact_info: newStudent.contact_info ? { contact: newStudent.contact_info } : null
    };

    const result = await addStudent(studentData);
    if (result) {
      setNewStudent({
        name: "",
        grade: "",
        gender: "",
        date_of_birth: "",
        contact_info: ""
      });
      setIsAddDialogOpen(false);
      // Reload performances for the new student
      setTimeout(() => loadStudentPerformances(), 1000);
    }
  };

  const handleDeleteStudent = async (id: string) => {
    await deleteStudent(id);
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return "default";
    if (score >= 70) return "secondary";
    return "destructive";
  };

  const getAttendanceBadgeVariant = (rate: number) => {
    if (rate >= 90) return "default";
    if (rate >= 80) return "secondary";
    return "destructive";
  };

  const handleViewStudent = (student: any) => {
    setSelectedStudent(student);
    setIsDetailViewOpen(true);
  };

  const handleEditStudent = (student: any) => {
    // TODO: Implement student editing
    toast.info(`Editing ${student.name} - Feature coming soon!`);
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return "text-green-700";
    if (score >= 60) return "text-yellow-700";
    return "text-red-700";
  };

  const getPerformanceBg = (score: number) => {
    if (score >= 80) return "bg-green-50 border-green-200";
    if (score >= 60) return "bg-yellow-50 border-yellow-200";
    return "bg-red-50 border-red-200";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Students</h1>
          <p className="text-muted-foreground">Manage student profiles and track their academic progress</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-secondary text-white shadow-lg hover:shadow-xl transition-all">
              <UserPlus className="w-4 h-4 mr-2" />
              Add Student
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Student</DialogTitle>
              <DialogDescription>
                Enter the student's information to add them to the system.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name *</Label>
                <Input
                  id="name"
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                  className="col-span-3"
                  placeholder="Student's full name"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="grade" className="text-right">Grade *</Label>
                <Select value={newStudent.grade} onValueChange={(value) => setNewStudent({...newStudent, grade: value})}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Grade 9">Grade 9</SelectItem>
                    <SelectItem value="Grade 10">Grade 10</SelectItem>
                    <SelectItem value="Grade 11">Grade 11</SelectItem>
                    <SelectItem value="Grade 12">Grade 12</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="gender" className="text-right">Gender *</Label>
                <Select value={newStudent.gender} onValueChange={(value) => setNewStudent({...newStudent, gender: value})}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date_of_birth" className="text-right">Date of Birth</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={newStudent.date_of_birth}
                  onChange={(e) => setNewStudent({...newStudent, date_of_birth: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="contact_info" className="text-right">Contact Info</Label>
                <Input
                  id="contact_info"
                  value={newStudent.contact_info}
                  onChange={(e) => setNewStudent({...newStudent, contact_info: e.target.value})}
                  className="col-span-3"
                  placeholder="Phone, email, etc."
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddStudent}>Add Student</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="w-5 h-5" />
            <span>Search & Filter</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search students by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="w-full sm:w-48">
              <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  <SelectItem value="Grade 9">Grade 9</SelectItem>
                  <SelectItem value="Grade 10">Grade 10</SelectItem>
                  <SelectItem value="Grade 11">Grade 11</SelectItem>
                  <SelectItem value="Grade 12">Grade 12</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              variant="outline" 
              onClick={loadStudentPerformances}
              disabled={performanceLoading}
              className="w-full sm:w-auto"
            >
              {performanceLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <BarChart3 className="w-4 h-4 mr-2" />
              )}
              Refresh Performance
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Students List */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Students ({filteredStudents.length})</span>
          </CardTitle>
          <CardDescription>
            Click on a student's name to view detailed progress and lesson scores
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredStudents.map((student) => {
                  const performance = studentPerformances[student.id];
                  return (
                    <Card 
                      key={student.id} 
                      className={`border transition-all duration-200 hover:shadow-lg cursor-pointer ${
                        performance ? getPerformanceBg(performance.averageScore) : 'border-border hover:shadow-md'
                      }`}
                      onClick={() => handleViewStudent(student)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle 
                            className={`text-lg hover:text-primary transition-colors ${
                              performance ? getPerformanceColor(performance.averageScore) : ''
                            }`}
                          >
                            {student.name}
                          </CardTitle>
                          <div className="flex space-x-1" onClick={(e) => e.stopPropagation()}>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleViewStudent(student)}
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditStudent(student)}
                              title="Edit Student"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteStudent(student.id)}
                              className="text-destructive hover:text-destructive"
                              title="Delete Student"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{student.grade}</Badge>
                          <Badge variant="outline">{student.gender}</Badge>
                          {performance && (
                            <Badge 
                              variant={getScoreBadgeVariant(performance.averageScore)}
                              className="font-semibold"
                            >
                              {performance.averageScore}% avg
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        {performance && (
                          <div className="space-y-3 mb-4">
                            {/* Performance Metrics */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div className="flex items-center space-x-2">
                                <Award className="w-4 h-4 text-primary" />
                                <span className="text-muted-foreground">Tests:</span>
                                <span className="font-medium">{performance.testsCompleted}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <BookOpen className="w-4 h-4 text-secondary" />
                                <span className="text-muted-foreground">Lessons:</span>
                                <span className="font-medium">{performance.lessonsStarted}</span>
                              </div>
                            </div>
                            
                            {/* Progress Bar */}
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Overall Progress</span>
                                <span className="font-medium">{performance.averageScore}%</span>
                              </div>
                              <Progress value={performance.averageScore} className="h-2" />
                            </div>
                            
                            {/* Improvement Indicator */}
                            {performance.improvement !== 0 && (
                              <div className="flex items-center justify-center">
                                <Badge 
                                  variant={performance.improvement > 0 ? "default" : "destructive"}
                                  className={`text-xs ${performance.improvement > 0 ? "bg-green-100 text-green-700 border-green-200" : ""}`}
                                >
                                  <TrendingUp className="w-3 h-3 mr-1" />
                                  {performance.improvement > 0 ? '+' : ''}{performance.improvement}% improvement
                                </Badge>
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div className="space-y-2 text-sm border-t border-border/50 pt-3">
                          {student.date_of_birth && (
                            <p><span className="font-medium">DOB:</span> {new Date(student.date_of_birth).toLocaleDateString()}</p>
                          )}
                          {student.contact_info && (
                            <p><span className="font-medium">Contact:</span> {
                              typeof student.contact_info === 'object' 
                                ? student.contact_info.contact || 'N/A'
                                : student.contact_info
                            }</p>
                          )}
                          <p><span className="font-medium">Added:</span> {new Date(student.created_at).toLocaleDateString()}</p>
                        </div>
                        
                        {!performance && !performanceLoading && (
                          <div className="text-center py-4 text-muted-foreground">
                            <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Click to view progress</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              {filteredStudents.length === 0 && !loading && (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {searchTerm || selectedGrade !== "all" 
                      ? "No students found matching your criteria." 
                      : "No students added yet. Click 'Add Student' to get started!"
                    }
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Student Detail View Dialog */}
      {selectedStudent && (
        <StudentDetailView
          student={selectedStudent}
          isOpen={isDetailViewOpen}
          onClose={() => {
            setIsDetailViewOpen(false);
            setSelectedStudent(null);
          }}
        />
      )}
    </div>
  );
};

export default Students;
