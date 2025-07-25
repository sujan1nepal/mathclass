import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
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
  Filter,
  Target,
  Activity,
  Zap,
  Star
} from "lucide-react";

interface StudentPerformance {
  studentId: string;
  studentName: string;
  grade: string;
  averageScore: number;
  testsCompleted: number;
  improvement: number;
  lessonsCompleted: number;
  pretestAverage: number;
  posttestAverage: number;
}

interface GradeAnalytics {
  grade: string;
  totalStudents: number;
  averageScore: number;
  topPerformer: string;
  improvementRate: number;
  completionRate: number;
  color: string;
}

const Dashboard = () => {
  const { stats, recentTests, gradePerformance, loading } = useDashboard();
  const { students } = useStudents();
  const { getStudentTestScores } = useStudentScores();
  const { tests, lessons } = useSupabaseUploads();
  
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>("all");
  const [studentPerformances, setStudentPerformances] = useState<StudentPerformance[]>([]);
  const [gradeAnalytics, setGradeAnalytics] = useState<GradeAnalytics[]>([]);
  const [performanceLoading, setPerformanceLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("overview");

  useEffect(() => {
    loadDetailedAnalytics();
  }, [students, tests, selectedGradeFilter]);

  const loadDetailedAnalytics = async () => {
    if (students.length === 0 || tests.length === 0) return;
    
    setPerformanceLoading(true);
    try {
      const performances: StudentPerformance[] = [];
      const gradeData: Record<string, any> = {};
      
      const filteredStudents = selectedGradeFilter === "all" 
        ? students 
        : students.filter(s => s.grade === selectedGradeFilter);

      for (const student of filteredStudents) {
        const studentTests = tests.filter(test => test.grade === student.grade);
        const studentLessons = lessons.filter(lesson => lesson.grade === student.grade);
        
        let totalScore = 0;
        let totalPossible = 0;
        let testsCompleted = 0;
        let pretestScores = [];
        let posttestScores = [];
        let lessonsWithTests = 0;

        for (const test of studentTests) {
          const testScores = await getStudentTestScores(test.id);
          const studentScore = testScores.find(score => score.student_id === student.id);
          
          if (studentScore && studentScore.total_possible > 0) {
            totalScore += studentScore.total_scored;
            totalPossible += studentScore.total_possible;
            testsCompleted++;

            if (test.type === 'pretest') {
              pretestScores.push(studentScore.percentage);
            } else if (test.type === 'posttest') {
              posttestScores.push(studentScore.percentage);
              lessonsWithTests++;
            }
          }
        }

        const averageScore = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;
        const pretestAverage = pretestScores.length > 0 ? Math.round(pretestScores.reduce((a, b) => a + b, 0) / pretestScores.length) : 0;
        const posttestAverage = posttestScores.length > 0 ? Math.round(posttestScores.reduce((a, b) => a + b, 0) / posttestScores.length) : 0;
        const improvement = posttestAverage - pretestAverage;

        const performance: StudentPerformance = {
          studentId: student.id,
          studentName: student.name,
          grade: student.grade,
          averageScore,
          testsCompleted,
          improvement,
          lessonsCompleted: lessonsWithTests,
          pretestAverage,
          posttestAverage
        };

        performances.push(performance);

        // Aggregate grade data
        if (!gradeData[student.grade]) {
          gradeData[student.grade] = {
            students: [],
            totalTests: 0,
            totalScores: [],
            improvements: [],
            completions: 0
          };
        }
        gradeData[student.grade].students.push(performance);
        gradeData[student.grade].totalScores.push(averageScore);
        if (improvement !== 0) gradeData[student.grade].improvements.push(improvement);
        if (lessonsWithTests > 0) gradeData[student.grade].completions++;
      }

      // Calculate grade analytics
      const analytics: GradeAnalytics[] = Object.entries(gradeData).map(([grade, data]: [string, any]) => {
        const students = data.students;
        const scores = data.totalScores.filter((score: number) => score > 0);
        const improvements = data.improvements;
        
        const averageScore = scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0;
        const topPerformer = students.reduce((top: any, current: any) => 
          current.averageScore > top.averageScore ? current : top, students[0])?.studentName || 'N/A';
        const improvementRate = improvements.length > 0 ? Math.round(improvements.reduce((a: number, b: number) => a + b, 0) / improvements.length) : 0;
        const completionRate = students.length > 0 ? Math.round((data.completions / students.length) * 100) : 0;

        return {
          grade,
          totalStudents: students.length,
          averageScore,
          topPerformer,
          improvementRate,
          completionRate,
          color: getGradeColor(grade)
        };
      });

      // Sort by average score descending
      performances.sort((a, b) => b.averageScore - a.averageScore);
      analytics.sort((a, b) => b.averageScore - a.averageScore);
      
      setStudentPerformances(performances);
      setGradeAnalytics(analytics);
    } catch (error) {
      console.error('Error loading detailed analytics:', error);
    } finally {
      setPerformanceLoading(false);
    }
  };

  const getGradeColor = (grade: string) => {
    const colors = {
      'Grade 9': 'bg-blue-500',
      'Grade 10': 'bg-green-500',
      'Grade 11': 'bg-yellow-500',
      'Grade 12': 'bg-purple-500'
    };
    return colors[grade as keyof typeof colors] || 'bg-gray-500';
  };

  const getPerformanceBadge = (score: number) => {
    if (score >= 90) return { variant: "default" as const, label: "Excellent", color: "bg-green-500" };
    if (score >= 80) return { variant: "default" as const, label: "Good", color: "bg-blue-500" };
    if (score >= 70) return { variant: "secondary" as const, label: "Average", color: "bg-yellow-500" };
    return { variant: "destructive" as const, label: "Needs Help", color: "bg-red-500" };
  };

  const handleGenerateReport = () => {
    const reportData = {
      overview: { stats, recentTests, gradePerformance },
      detailedAnalytics: { studentPerformances, gradeAnalytics },
      metadata: {
        generatedAt: new Date().toISOString(),
        totalStudents: students.length,
        totalTests: tests.length,
        totalLessons: lessons.length,
        filter: selectedGradeFilter
      }
    };
    
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `comprehensive-report-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive mathematics performance tracking and insights</p>
        </div>
        <div className="flex items-center space-x-3">
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
          <Button 
            onClick={handleGenerateReport}
            className="bg-gradient-to-r from-primary to-secondary text-white shadow-lg hover:shadow-xl transition-all"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-primary/10 to-primary/5 hover:shadow-xl transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <div className="p-2 bg-primary/10 rounded-full">
              <Users className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div>
                <div className="text-2xl font-bold text-primary">{stats.totalStudents}</div>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    {selectedGradeFilter === "all" ? "All Grades" : selectedGradeFilter}
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-secondary/10 to-secondary/5 hover:shadow-xl transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Content</CardTitle>
            <div className="p-2 bg-secondary/10 rounded-full">
              <BookOpen className="h-4 w-4 text-secondary" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div>
                <div className="text-2xl font-bold text-secondary">{stats.totalLessons}</div>
                <p className="text-xs text-muted-foreground mt-1">{tests.length} tests available</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-accent/10 to-accent/5 hover:shadow-xl transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Performance</CardTitle>
            <div className="p-2 bg-accent/10 rounded-full">
              <Award className="h-4 w-4 text-accent" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div>
                <div className="text-2xl font-bold text-accent">{stats.averageScore}%</div>
                <div className="flex items-center space-x-1 mt-2">
                  <Progress value={stats.averageScore} className="h-1 flex-1" />
                  <Badge variant={getPerformanceBadge(stats.averageScore).variant} className="text-xs">
                    {getPerformanceBadge(stats.averageScore).label}
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500/10 to-green-500/5 hover:shadow-xl transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
            <div className="p-2 bg-green-500/10 rounded-full">
              <Activity className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div>
                <div className="text-2xl font-bold text-green-500">{stats.attendanceRate}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.attendanceRate >= 90 ? 'Excellent engagement' : stats.attendanceRate >= 80 ? 'Good engagement' : 'Needs improvement'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Tabs for Different Views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-96">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="grades">Grade Analysis</TabsTrigger>
          <TabsTrigger value="students">Student Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Enhanced Grade Performance */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <span>Grade Performance Overview</span>
                </CardTitle>
                <CardDescription>
                  Average scores and improvement trends by grade level
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
                    <div key={grade.grade} className="space-y-3 p-4 rounded-lg bg-muted/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-4 h-4 rounded-full ${grade.color}`} />
                          <div>
                            <span className="font-medium">{grade.grade}</span>
                            <Badge variant="secondary" className="ml-2 text-xs">{grade.students} students</Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-lg">{grade.avgScore}%</span>
                        </div>
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
                  <span>Recent Test Activity</span>
                </CardTitle>
                <CardDescription>
                  Latest test uploads and completion status
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
                  <div className="space-y-3">
                    {recentTests.map((test) => (
                      <div key={test.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                        <div>
                          <p className="font-medium">{test.title}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline" className="text-xs">{test.grade}</Badge>
                            <Badge variant={test.type === 'pretest' ? 'default' : 'secondary'} className="text-xs">
                              {test.type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(test.created_at).toLocaleDateString()}
                            </span>
                          </div>
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
        </TabsContent>

        <TabsContent value="grades" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-primary" />
                <span>Detailed Grade Analytics</span>
              </CardTitle>
              <CardDescription>
                Comprehensive analysis of performance by grade level
              </CardDescription>
            </CardHeader>
            <CardContent>
              {performanceLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="p-4 border rounded-lg space-y-3">
                      <Skeleton className="h-6 w-24" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-2 w-full" />
                    </div>
                  ))}
                </div>
              ) : gradeAnalytics.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {gradeAnalytics.map((grade) => (
                    <Card key={grade.grade} className="border border-border/50 hover:shadow-md transition-all">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg flex items-center space-x-2">
                            <div className={`w-4 h-4 rounded-full ${grade.color}`} />
                            <span>{grade.grade}</span>
                          </CardTitle>
                          <Badge variant="outline">{grade.totalStudents} students</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Average Score</p>
                            <p className="font-bold text-lg">{grade.averageScore}%</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Top Performer</p>
                            <p className="font-medium truncate" title={grade.topPerformer}>{grade.topPerformer}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Improvement</p>
                            <p className={`font-medium ${grade.improvementRate > 0 ? 'text-green-600' : grade.improvementRate < 0 ? 'text-red-600' : ''}`}>
                              {grade.improvementRate > 0 ? '+' : ''}{grade.improvementRate}%
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Completion</p>
                            <p className="font-medium">{grade.completionRate}%</p>
                          </div>
                        </div>
                        <Separator />
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Performance Level</span>
                            <Badge variant={getPerformanceBadge(grade.averageScore).variant}>
                              {getPerformanceBadge(grade.averageScore).label}
                            </Badge>
                          </div>
                          <Progress value={grade.averageScore} className="h-2" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No grade analytics available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-accent" />
                <span>Individual Student Performance</span>
              </CardTitle>
              <CardDescription>
                Detailed breakdown of each student's progress and achievements
              </CardDescription>
            </CardHeader>
            <CardContent>
              {performanceLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <div className="flex space-x-2">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-6 w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : studentPerformances.length > 0 ? (
                <div className="space-y-3">
                  {studentPerformances.slice(0, 15).map((performance, index) => (
                    <div key={performance.studentId} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors border border-border/50">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-lg">{performance.studentName}</p>
                          <div className="flex items-center space-x-3 mt-1">
                            <Badge variant="outline" className="text-xs">{performance.grade}</Badge>
                            <span className="text-sm text-muted-foreground">
                              {performance.testsCompleted} tests • {performance.lessonsCompleted} lessons
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-sm text-muted-foreground">Pre:</span>
                            <Badge variant="outline" className="text-xs">{performance.pretestAverage}%</Badge>
                            <span className="text-sm text-muted-foreground">Post:</span>
                            <Badge variant="outline" className="text-xs">{performance.posttestAverage}%</Badge>
                          </div>
                          <Progress value={performance.averageScore} className="w-24 h-1" />
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                          <Badge variant={getPerformanceBadge(performance.averageScore).variant} className="font-semibold">
                            {performance.averageScore}%
                          </Badge>
                          {performance.improvement !== 0 && (
                            <Badge 
                              variant={performance.improvement > 0 ? "default" : "destructive"}
                              className={`text-xs ${performance.improvement > 0 ? "bg-green-100 text-green-700 border-green-200" : ""}`}
                            >
                              <TrendingUp className="w-3 h-3 mr-1" />
                              {performance.improvement > 0 ? '+' : ''}{performance.improvement}%
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {studentPerformances.length > 15 && (
                    <div className="text-center pt-4">
                      <p className="text-sm text-muted-foreground">
                        Showing top 15 students. Total: {studentPerformances.length}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No student performance data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;