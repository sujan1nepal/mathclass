import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLessons } from "@/hooks/useLessons";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  BookOpen, 
  TrendingUp, 
  Users, 
  Award,
  Clock,
  BarChart3,
  Eye,
  Loader2,
  FileDown,
  Trash2
} from "lucide-react";

const Lessons = () => {
  const { lessons, loading, fetchLessons, deleteLesson } = useLessons();
  const [selectedGrade, setSelectedGrade] = useState<string>("all");

  const filteredLessons = selectedGrade === "all" 
    ? lessons 
    : lessons.filter(lesson => lesson.grade === selectedGrade);

  useEffect(() => {
    fetchLessons(selectedGrade);
  }, [selectedGrade]);

  const getImprovementBadge = (improvement: number) => {
    if (improvement >= 15) return { variant: "default" as const, text: "Excellent", color: "bg-success" };
    if (improvement >= 10) return { variant: "secondary" as const, text: "Good", color: "bg-primary" };
    return { variant: "destructive" as const, text: "Needs Work", color: "bg-warning" };
  };

  const getOverallStats = () => {
    const totalStudents = filteredLessons.reduce((sum, lesson) => sum + lesson.studentsEnrolled, 0);
    const avgPreTest = filteredLessons.reduce((sum, lesson) => sum + (lesson.pretest?.avgScore || 0), 0) / filteredLessons.length || 0;
    const avgPostTest = filteredLessons.reduce((sum, lesson) => sum + (lesson.posttest?.avgScore || 0), 0) / filteredLessons.length || 0;
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

  const handleGenerateReport = () => {
    const reportData = {
      grade: selectedGrade,
      lessons: filteredLessons,
      stats,
      generatedAt: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lessons-report-${selectedGrade}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteLesson = async (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      await deleteLesson(id);
    }
  };

  const handleViewDetails = (lesson: any) => {
    // TODO: Implement lesson details view
    toast.info(`Viewing details for "${lesson.title}" - Feature coming soon!`);
  };

  const handleAnalysis = (lesson: any) => {
    // TODO: Implement lesson analysis
    toast.info(`Analysis for "${lesson.title}" - Feature coming soon!`);
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Lessons & Performance</h1>
          <p className="text-muted-foreground">Track lesson effectiveness and student progress</p>
        </div>
        <Button 
          onClick={handleGenerateReport}
          disabled={filteredLessons.length === 0}
          className="bg-gradient-to-r from-primary to-secondary text-white"
        >
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
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
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
      )}

      {/* Lessons List */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-0 shadow-lg">
              <CardHeader>
                <div className="space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-64" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                </div>
                <Skeleton className="h-12 w-full" />
                <div className="flex space-x-2">
                  <Skeleton className="h-8 flex-1" />
                  <Skeleton className="h-8 flex-1" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredLessons.length > 0 ? (
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
                          <span>{new Date(lesson.upload_date).toLocaleDateString()}</span>
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
                        <span>Pre-Test</span>
                        <span className="font-medium">
                          {lesson.pretest ? `${lesson.pretest.total_marks} marks` : 'No pretest'}
                        </span>
                      </div>
                      <Progress value={lesson.pretest ? 75 : 0} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Post-Test</span>
                        <span className="font-medium">
                          {lesson.posttest ? `${lesson.posttest.total_marks} marks` : 'No posttest'}
                        </span>
                      </div>
                      <Progress value={lesson.posttest ? 85 : 0} className="h-2" />
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

                  {/* File Info */}
                  {lesson.pdf_filename && (
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">PDF File</span>
                        <Badge variant="outline" className="text-xs">
                          {lesson.pdf_filename}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleViewDetails(lesson)}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View Details
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleAnalysis(lesson)}
                    >
                      <BarChart3 className="w-3 h-3 mr-1" />
                      Analysis
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteLesson(lesson.id, lesson.title)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-0 shadow-lg">
          <CardContent className="text-center py-8">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {selectedGrade === "all" 
                ? "No lessons found. Upload some lesson files to get started!" 
                : `No lessons found for ${selectedGrade}. Try selecting a different grade or upload lessons for this grade.`
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Lessons;

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