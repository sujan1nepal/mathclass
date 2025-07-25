import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDashboard } from "@/hooks/useDashboard";
import { useStudents } from "@/hooks/useStudents";
import { useStudentScores } from "@/hooks/useStudentScores";
import { useSupabaseUploads } from "@/hooks/useSupabaseUploads";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import { 
  Users, 
  BookOpen, 
  TrendingUp, 
  Calendar,
  Award,
  BarChart3,
  Filter
} from "lucide-react";

interface StudentPerformance {
  studentId: string;
  studentName: string;
  grade: string;
  averageScore: number;
  testsCompleted: number;
  improvement: number;
}

const Dashboard = () => {
  const { stats, recentTests, gradePerformance, loading } = useDashboard();
  const { students } = useStudents();
  const { getStudentTestScores } = useStudentScores();
  const { tests } = useSupabaseUploads();
  
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>("all");
  const [studentPerformances, setStudentPerformances] = useState<StudentPerformance[]>([]);
  const [performanceLoading, setPerformanceLoading] = useState(false);

  useEffect(() => {
    loadStudentPerformances();
  }, [students, tests, selectedGradeFilter]);

  const loadStudentPerformances = async () => {
    if (students.length === 0 || tests.length === 0) return;
    
    setPerformanceLoading(true);
    try {
      const performances: StudentPerformance[] = [];
      
      const filteredStudents = selectedGradeFilter === "all" 
        ? students 
        : students.filter(s => s.grade === selectedGradeFilter);

      for (const student of filteredStudents) {
        const studentTests = tests.filter(test => test.grade === student.grade);
        let totalScore = 0;
        let totalPossible = 0;
        let testsCompleted = 0;
        let pretestAvg = 0;
        let posttestAvg = 0;
        let pretestCount = 0;
        let posttestCount = 0;

        for (const test of studentTests) {
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
        }

        const averageScore = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;
        const improvement = pretestCount > 0 && posttestCount > 0 
          ? Math.round((posttestAvg / posttestCount) - (pretestAvg / pretestCount))
          : 0;

        performances.push({
          studentId: student.id,
          studentName: student.name,
          grade: student.grade,
          averageScore,
          testsCompleted,
          improvement
        });
      }

      // Sort by average score descending
      performances.sort((a, b) => b.averageScore - a.averageScore);
      setStudentPerformances(performances);
    } catch (error) {
      console.error('Error loading student performances:', error);
    } finally {
      setPerformanceLoading(false);
    }
  };

  const handleGenerateReport = () => {
    const reportData = {
      stats,
      recentTests,
      gradePerformance,
      studentPerformances,
      generatedAt: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dashboard-report-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Mathematics Progress Tracking</p>
        </div>
        <Button 
          onClick={handleGenerateReport}
          className="bg-gradient-to-r from-primary to-secondary text-white"
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          Generate Report
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-primary/10 to-primary/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-primary">{stats.totalStudents}</div>
            )}
            <p className="text-xs text-muted-foreground">Active students</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-secondary/10 to-secondary/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Lessons</CardTitle>
            <BookOpen className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-secondary">{stats.totalLessons}</div>
            )}
            <p className="text-xs text-muted-foreground">Available lessons</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-accent/10 to-accent/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Award className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-accent">{stats.averageScore}%</div>
            )}
            <p className="text-xs text-muted-foreground">Overall performance</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-success/10 to-success/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <Calendar className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-success">{stats.attendanceRate}%</div>
            )}
            <p className="text-xs text-muted-foreground">
              {stats.attendanceRate >= 90 ? 'Excellent' : stats.attendanceRate >= 80 ? 'Good' : 'Needs improvement'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grade Performance */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span>Grade Performance</span>
            </CardTitle>
            <CardDescription>
              Average scores by grade level
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                ))}
              </div>
            ) : gradePerformance.length > 0 ? (
              gradePerformance.map((grade) => (
                <div key={grade.grade} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${grade.color}`} />
                      <span className="font-medium">{grade.grade}</span>
                      <Badge variant="secondary">{grade.students} students</Badge>
                    </div>
                    <span className="font-bold">{grade.avgScore}%</span>
                  </div>
                  <Progress value={grade.avgScore} className="h-2" />
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">No grade data available</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Tests */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-secondary" />
              <span>Recent Tests</span>
            </CardTitle>
            <CardDescription>
              Latest test results and scores
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-6 w-12" />
                  </div>
                ))}
              </div>
            ) : recentTests.length > 0 ? (
              <div className="space-y-4">
                {recentTests.map((test) => (
                  <div key={test.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">{test.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {test.grade} • {new Date(test.created_at).toLocaleDateString()} • {test.type}
                      </p>
                    </div>
                    <Badge variant="outline" className="font-bold">
                      {test.total_marks} marks
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No recent tests available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Student Performance Table */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-accent" />
                <span>Student Performance</span>
              </CardTitle>
              <CardDescription>
                Individual student scores and progress
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4" />
              <Select value={selectedGradeFilter} onValueChange={setSelectedGradeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
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
          </div>
        </CardHeader>
        <CardContent>
          {performanceLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <div className="flex space-x-2">
                    <Skeleton className="h-6 w-12" />
                    <Skeleton className="h-6 w-12" />
                  </div>
                </div>
              ))}
            </div>
          ) : studentPerformances.length > 0 ? (
            <div className="space-y-3">
              {studentPerformances.slice(0, 10).map((performance, index) => (
                <div key={performance.studentId} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{performance.studentName}</p>
                      <p className="text-sm text-muted-foreground">
                        {performance.grade} • {performance.testsCompleted} tests completed
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge variant={performance.averageScore >= 80 ? "default" : performance.averageScore >= 60 ? "secondary" : "destructive"}>
                      {performance.averageScore}%
                    </Badge>
                    {performance.improvement !== 0 && (
                      <Badge 
                        variant={performance.improvement > 0 ? "default" : "destructive"}
                        className={performance.improvement > 0 ? "bg-success" : ""}
                      >
                        {performance.improvement > 0 ? '+' : ''}{performance.improvement}%
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
              {studentPerformances.length > 10 && (
                <div className="text-center pt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing top 10 students. Total: {studentPerformances.length}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No student performance data available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;