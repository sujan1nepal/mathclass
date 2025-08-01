import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Student } from "@/hooks/useStudents";
import { useStudentScores } from "@/hooks/useStudentScores";
import { useSupabaseUploads } from "@/hooks/useSupabaseUploads";
import { useAttendance } from "@/hooks/useAttendance";
import { 
  User, 
  BookOpen, 
  TrendingUp, 
  Calendar,
  Award,
  Target,
  CheckCircle,
  XCircle,
  Clock,
  FileText
} from "lucide-react";

interface StudentDetailViewProps {
  student: Student;
  isOpen: boolean;
  onClose: () => void;
}

interface StudentLessonProgress {
  lessonId: string;
  lessonTitle: string;
  pretestScore?: { scored: number; total: number; percentage: number };
  posttestScore?: { scored: number; total: number; percentage: number };
  improvement?: number;
}

export const StudentDetailView = ({ student, isOpen, onClose }: StudentDetailViewProps) => {
  const { getStudentTestScores } = useStudentScores();
  const { tests, lessons } = useSupabaseUploads();
  const { attendanceRecords, getAttendanceStats } = useAttendance();
  
  const [lessonProgress, setLessonProgress] = useState<StudentLessonProgress[]>([]);
  const [loading, setLoading] = useState(false);
  const [attendanceStats, setAttendanceStats] = useState({ present: 0, absent: 0, late: 0, rate: 0 });

  useEffect(() => {
    if (isOpen && student) {
      loadStudentProgress();
      loadAttendanceStats();
    }
  }, [isOpen, student]);

  const loadStudentProgress = async () => {
    setLoading(true);
    try {
      const studentGradeLessons = lessons.filter(lesson => lesson.grade === student.grade);
      const progressData: StudentLessonProgress[] = [];

      for (const lesson of studentGradeLessons) {
        const lessonTests = tests.filter(test => test.lesson_id === lesson.id);
        const pretest = lessonTests.find(test => test.type === 'pretest');
        const posttest = lessonTests.find(test => test.type === 'posttest');

        let pretestScore, posttestScore, improvement;

        if (pretest) {
          const pretestScores = await getStudentTestScores(pretest.id);
          const studentPretestScore = pretestScores.find(score => score.student_id === student.id);
          if (studentPretestScore) {
            pretestScore = {
              scored: studentPretestScore.total_scored,
              total: studentPretestScore.total_possible,
              percentage: studentPretestScore.percentage
            };
          }
        }

        if (posttest) {
          const posttestScores = await getStudentTestScores(posttest.id);
          const studentPosttestScore = posttestScores.find(score => score.student_id === student.id);
          if (studentPosttestScore) {
            posttestScore = {
              scored: studentPosttestScore.total_scored,
              total: studentPosttestScore.total_possible,
              percentage: studentPosttestScore.percentage
            };
          }
        }

        if (pretestScore && posttestScore) {
          improvement = posttestScore.percentage - pretestScore.percentage;
        }

        progressData.push({
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          pretestScore,
          posttestScore,
          improvement
        });
      }

      setLessonProgress(progressData);
    } catch (error) {
      console.error('Error loading student progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAttendanceStats = () => {
    const studentAttendance = attendanceRecords.filter(record => record.student_id === student.id);
    const stats = getAttendanceStats(studentAttendance);
    setAttendanceStats(stats);
  };

  const getScoreBadgeVariant = (percentage: number) => {
    if (percentage >= 80) return "default";
    if (percentage >= 60) return "secondary";
    return "destructive";
  };

  const getImprovementColor = (improvement: number) => {
    if (improvement > 0) return "text-success";
    if (improvement < 0) return "text-destructive";
    return "text-muted-foreground";
  };

  const overallAverage = lessonProgress.length > 0 
    ? Math.round(lessonProgress.reduce((sum, lesson) => {
        const scores = [lesson.pretestScore?.percentage, lesson.posttestScore?.percentage].filter(Boolean);
        return sum + (scores.length > 0 ? scores.reduce((a, b) => a + b!, 0) / scores.length : 0);
      }, 0) / lessonProgress.length)
    : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] w-[95vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3 text-lg">
            <User className="w-5 h-5" />
            <span className="truncate">{student.name} - Progress Report</span>
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-6 p-1">
            {/* Student Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Student Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Grade</p>
                    <Badge variant="outline">{student.grade}</Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Gender</p>
                    <p className="font-medium">{student.gender}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Overall Average</p>
                    <Badge variant={getScoreBadgeVariant(overallAverage)}>
                      {overallAverage}%
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Attendance Rate</p>
                    <Badge variant={attendanceStats.rate >= 90 ? "default" : attendanceStats.rate >= 80 ? "secondary" : "destructive"}>
                      {attendanceStats.rate}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Attendance Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>Attendance Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-success" />
                      <span className="font-bold text-xl sm:text-2xl text-success">{attendanceStats.present}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Present</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <XCircle className="w-5 h-5 text-destructive" />
                      <span className="font-bold text-xl sm:text-2xl text-destructive">{attendanceStats.absent}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Absent</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <Clock className="w-5 h-5 text-warning" />
                      <span className="font-bold text-xl sm:text-2xl text-warning">{attendanceStats.late}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Late</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lesson Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="w-5 h-5" />
                  <span>Lesson Progress ({lessonProgress.length} lessons)</span>
                </CardTitle>
                <CardDescription>
                  Pre-test and post-test scores for each lesson
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground mt-2">Loading progress...</p>
                  </div>
                ) : lessonProgress.length > 0 ? (
                  <div className="space-y-4">
                    {lessonProgress.map((lesson) => (
                      <Card key={lesson.lessonId} className="border border-border">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center justify-between">
                            <span>{lesson.lessonTitle}</span>
                            {lesson.improvement !== undefined && (
                              <Badge 
                                variant={lesson.improvement > 0 ? "default" : lesson.improvement < 0 ? "destructive" : "secondary"}
                                className={lesson.improvement > 0 ? "bg-success" : ""}
                              >
                                {lesson.improvement > 0 ? '+' : ''}{lesson.improvement}%
                              </Badge>
                            )}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Pre-test */}
                            <div className="space-y-2">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <span className="text-sm font-medium">Pre-test</span>
                                {lesson.pretestScore ? (
                                  <Badge variant={getScoreBadgeVariant(lesson.pretestScore.percentage)} className="text-xs">
                                    {lesson.pretestScore.scored}/{lesson.pretestScore.total} ({lesson.pretestScore.percentage}%)
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs">Not taken</Badge>
                                )}
                              </div>
                              {lesson.pretestScore && (
                                <Progress value={lesson.pretestScore.percentage} className="h-2" />
                              )}
                            </div>

                            {/* Post-test */}
                            <div className="space-y-2">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <span className="text-sm font-medium">Post-test</span>
                                {lesson.posttestScore ? (
                                  <Badge variant={getScoreBadgeVariant(lesson.posttestScore.percentage)} className="text-xs">
                                    {lesson.posttestScore.scored}/{lesson.posttestScore.total} ({lesson.posttestScore.percentage}%)
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs">Not taken</Badge>
                                )}
                              </div>
                              {lesson.posttestScore && (
                                <Progress value={lesson.posttestScore.percentage} className="h-2" />
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No lessons found for this student's grade</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};