import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BookOpen, 
  TrendingUp, 
  Users, 
  Award,
  Clock,
  BarChart3,
  Eye
} from "lucide-react";

interface LessonData {
  id: number;
  title: string;
  grade: string;
  date: string;
  duration: string;
  studentsEnrolled: number;
  preTestAvg: number;
  postTestAvg: number;
  improvement: number;
  topPerformers: string[];
  needsAttention: string[];
}

const Lessons = () => {
  const [selectedGrade, setSelectedGrade] = useState<string>("all");
  
  // Mock lesson data
  const [lessons] = useState<LessonData[]>([
    {
      id: 1,
      title: "Introduction to Algebra",
      grade: "Grade 9",
      date: "2024-01-15",
      duration: "45 mins",
      studentsEnrolled: 15,
      preTestAvg: 65,
      postTestAvg: 82,
      improvement: 17,
      topPerformers: ["Alice Johnson", "David Wilson"],
      needsAttention: ["Bob Smith"]
    },
    {
      id: 2,
      title: "Geometry Fundamentals",
      grade: "Grade 10",
      date: "2024-01-18",
      duration: "50 mins",
      studentsEnrolled: 18,
      preTestAvg: 58,
      postTestAvg: 75,
      improvement: 17,
      topPerformers: ["Emma Brown", "Carol Davis"],
      needsAttention: ["Frank Miller"]
    },
    {
      id: 3,
      title: "Trigonometry Basics",
      grade: "Grade 11",
      date: "2024-01-20",
      duration: "55 mins",
      studentsEnrolled: 12,
      preTestAvg: 72,
      postTestAvg: 88,
      improvement: 16,
      topPerformers: ["Carol Davis"],
      needsAttention: []
    }
  ]);

  const filteredLessons = selectedGrade === "all" 
    ? lessons 
    : lessons.filter(lesson => lesson.grade === selectedGrade);

  const getImprovementBadge = (improvement: number) => {
    if (improvement >= 15) return { variant: "default" as const, text: "Excellent", color: "bg-success" };
    if (improvement >= 10) return { variant: "secondary" as const, text: "Good", color: "bg-primary" };
    return { variant: "destructive" as const, text: "Needs Work", color: "bg-warning" };
  };

  const getOverallStats = () => {
    const totalStudents = filteredLessons.reduce((sum, lesson) => sum + lesson.studentsEnrolled, 0);
    const avgPreTest = filteredLessons.reduce((sum, lesson) => sum + lesson.preTestAvg, 0) / filteredLessons.length || 0;
    const avgPostTest = filteredLessons.reduce((sum, lesson) => sum + lesson.postTestAvg, 0) / filteredLessons.length || 0;
    const avgImprovement = filteredLessons.reduce((sum, lesson) => sum + lesson.improvement, 0) / filteredLessons.length || 0;
    
    return {
      totalLessons: filteredLessons.length,
      totalStudents,
      avgPreTest: Math.round(avgPreTest),
      avgPostTest: Math.round(avgPostTest),
      avgImprovement: Math.round(avgImprovement)
    };
  };

  const stats = getOverallStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Lessons & Performance</h1>
          <p className="text-muted-foreground">Track lesson effectiveness and student progress</p>
        </div>
        <Button className="bg-gradient-to-r from-primary to-secondary text-white">
          <BarChart3 className="w-4 h-4 mr-2" />
          Performance Report
        </Button>
      </div>

      {/* Grade Filter */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Filter by Grade</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedGrade} onValueChange={setSelectedGrade}>
            <SelectTrigger className="w-full md:w-64">
              <SelectValue placeholder="Select grade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Grades</SelectItem>
              <SelectItem value="Grade 9">Grade 9</SelectItem>
              <SelectItem value="Grade 10">Grade 10</SelectItem>
              <SelectItem value="Grade 11">Grade 11</SelectItem>
              <SelectItem value="Grade 12">Grade 12</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-primary/10 to-primary/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Lessons</CardTitle>
            <BookOpen className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.totalLessons}</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-secondary/10 to-secondary/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students Enrolled</CardTitle>
            <Users className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">{stats.totalStudents}</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-accent/10 to-accent/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Pre-Test</CardTitle>
            <BarChart3 className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{stats.avgPreTest}%</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-success/10 to-success/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Post-Test</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.avgPostTest}%</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-warning/10 to-warning/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Improvement</CardTitle>
            <Award className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">+{stats.avgImprovement}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Lessons List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredLessons.map((lesson) => {
          const improvementBadge = getImprovementBadge(lesson.improvement);
          
          return (
            <Card key={lesson.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{lesson.title}</CardTitle>
                    <CardDescription className="flex items-center space-x-4 mt-1">
                      <span className="flex items-center space-x-1">
                        <BookOpen className="w-3 h-3" />
                        <span>{lesson.grade}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{lesson.duration}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Users className="w-3 h-3" />
                        <span>{lesson.studentsEnrolled} students</span>
                      </span>
                    </CardDescription>
                  </div>
                  <Badge variant={improvementBadge.variant} className={improvementBadge.color}>
                    {improvementBadge.text}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Performance Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Pre-Test Average</span>
                      <span className="font-medium">{lesson.preTestAvg}%</span>
                    </div>
                    <Progress value={lesson.preTestAvg} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Post-Test Average</span>
                      <span className="font-medium">{lesson.postTestAvg}%</span>
                    </div>
                    <Progress value={lesson.postTestAvg} className="h-2" />
                  </div>
                </div>

                {/* Improvement */}
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Learning Improvement</span>
                    <Badge variant="outline" className="bg-success text-success-foreground">
                      +{lesson.improvement}%
                    </Badge>
                  </div>
                </div>

                {/* Top Performers */}
                {lesson.topPerformers.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center space-x-1">
                      <Award className="w-3 h-3 text-success" />
                      <span>Top Performers</span>
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {lesson.topPerformers.map((student, index) => (
                        <Badge key={index} variant="outline" className="text-xs bg-success/10 text-success border-success/20">
                          {student}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Students Needing Attention */}
                {lesson.needsAttention.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center space-x-1">
                      <TrendingUp className="w-3 h-3 text-warning" />
                      <span>Needs Attention</span>
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {lesson.needsAttention.map((student, index) => (
                        <Badge key={index} variant="outline" className="text-xs bg-warning/10 text-warning border-warning/20">
                          {student}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="w-3 h-3 mr-1" />
                    View Details
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <BarChart3 className="w-3 h-3 mr-1" />
                    Analysis
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredLessons.length === 0 && (
        <Card className="border-0 shadow-lg">
          <CardContent className="text-center py-8">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No lessons found for the selected grade.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Lessons;