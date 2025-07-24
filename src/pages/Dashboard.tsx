import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  BookOpen, 
  TrendingUp, 
  Calendar,
  Award,
  BarChart3
} from "lucide-react";

const Dashboard = () => {
  // Mock data - in a real app, this would come from your backend
  const stats = {
    totalStudents: 45,
    totalLessons: 12,
    averageScore: 78,
    attendanceRate: 92
  };

  const recentTests = [
    { id: 1, lesson: "Algebra Basics", grade: "Grade 9", avgScore: 85, date: "2024-01-20" },
    { id: 2, lesson: "Geometry", grade: "Grade 10", avgScore: 72, date: "2024-01-18" },
    { id: 3, lesson: "Trigonometry", grade: "Grade 11", avgScore: 68, date: "2024-01-15" },
  ];

  const gradePerformance = [
    { grade: "Grade 9", students: 15, avgScore: 82, color: "bg-success" },
    { grade: "Grade 10", students: 18, avgScore: 76, color: "bg-primary" },
    { grade: "Grade 11", students: 12, avgScore: 71, color: "bg-warning" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Mathematics Progress Tracking</p>
        </div>
        <Button className="bg-gradient-to-r from-primary to-secondary text-white">
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
            <div className="text-2xl font-bold text-primary">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              +3 from last month
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-secondary/10 to-secondary/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Lessons</CardTitle>
            <BookOpen className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">{stats.totalLessons}</div>
            <p className="text-xs text-muted-foreground">
              2 new this week
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-accent/10 to-accent/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Award className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{stats.averageScore}%</div>
            <p className="text-xs text-muted-foreground">
              +5% from last term
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-success/10 to-success/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <Calendar className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.attendanceRate}%</div>
            <p className="text-xs text-muted-foreground">
              Excellent attendance
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
            {gradePerformance.map((grade) => (
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
            ))}
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
            <div className="space-y-4">
              {recentTests.map((test) => (
                <div key={test.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">{test.lesson}</p>
                    <p className="text-sm text-muted-foreground">{test.grade} • {test.date}</p>
                  </div>
                  <Badge 
                    variant={test.avgScore >= 80 ? "default" : test.avgScore >= 70 ? "secondary" : "destructive"}
                    className="font-bold"
                  >
                    {test.avgScore}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;