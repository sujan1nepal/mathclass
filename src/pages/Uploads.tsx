import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useSupabaseUploads } from "@/hooks/useSupabaseUploads";
import { useStudents } from "@/hooks/useStudents";
import { useStudentScores } from "@/hooks/useStudentScores";
import { QuestionEditor } from "@/components/TestQuestions/QuestionEditor";
import { StudentScoreCard } from "@/components/TestScoring/StudentScoreCard";
import { PDFViewer } from "@/components/PDFViewer/PDFViewer";
import {
  Upload,
  FileText,
  Image,
  File,
  Download,
  Trash2,
  Loader2,
  Cloud,
  HardDrive,
  BookOpen,
  Plus,
  Users,
  BarChart3
} from "lucide-react";

const Uploads = () => {
  const { lessons, tests, testQuestions, loading: uploadsLoading, uploadLesson, uploadTest, deleteLesson, deleteTest, fetchTestQuestions } = useSupabaseUploads();
  const { students } = useStudents();
  const { getStudentTestScores, saveBulkScores } = useStudentScores();
  
  const [activeTab, setActiveTab] = useState<'lessons' | 'tests' | 'scoring'>('lessons');
  const [uploadType, setUploadType] = useState<'lesson' | 'pretest' | 'posttest'>('lesson');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<string>('');
  const [studentTestScores, setStudentTestScores] = useState<any[]>([]);
  const [scoringLoading, setScoringLoading] = useState(false);
  
  const [uploadForm, setUploadForm] = useState({
    title: '',
    grade: '',
    lessonId: ''
  });

  const handleFileUpload = async (file: File) => {
    if (!uploadForm.title || !uploadForm.grade) {
      toast.error('Please fill in title and grade before uploading');
      return false;
    }

    try {
      setUploading(true);
      setUploadProgress(50);

      let result;
      if (uploadType === 'lesson') {
        result = await uploadLesson(file, uploadForm.title, uploadForm.grade);
      } else {
        result = await uploadTest(file, uploadForm.title, uploadType, uploadForm.grade, uploadForm.lessonId || undefined);
      }

      setUploadProgress(100);
      
      if (result) {
        setUploadForm({ title: '', grade: '', lessonId: '' });
        setIsUploadDialogOpen(false);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Upload error:', error);
      return false;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const loadTestScoring = async (testId: string) => {
    setScoringLoading(true);
    try {
      await fetchTestQuestions(testId);
      const scores = await getStudentTestScores(testId);
      setStudentTestScores(scores);
    } catch (error) {
      console.error('Error loading test scoring:', error);
      toast.error('Failed to load test scoring');
    } finally {
      setScoringLoading(false);
    }
  };

  const handleSaveStudentScores = async (studentId: string, scores: Array<{ questionId: string; marks: number }>) => {
    const scoreRecords = scores.map(score => ({
      studentId,
      testQuestionId: score.questionId,
      scoredMarks: score.marks
    }));

    const success = await saveBulkScores(scoreRecords);
    if (success && selectedTest) {
      await loadTestScoring(selectedTest);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Content Management</h1>
          <p className="text-muted-foreground">Upload lessons, tests and manage student scoring</p>
        </div>
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-secondary text-white">
              <Plus className="w-4 h-4 mr-2" />
              Upload Content
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Upload New Content</DialogTitle>
              <DialogDescription>
                Upload PDF lessons or tests with automatic text extraction and question parsing.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Content Type</Label>
                <Select value={uploadType} onValueChange={(value: any) => setUploadType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lesson">Lesson Plan</SelectItem>
                    <SelectItem value="pretest">Pre-test</SelectItem>
                    <SelectItem value="posttest">Post-test</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Title</Label>
                <Input
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  placeholder="Enter title"
                />
              </div>
              
              <div>
                <Label>Grade</Label>
                <Select value={uploadForm.grade} onValueChange={(value) => setUploadForm({ ...uploadForm, grade: value })}>
                  <SelectTrigger>
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
              
              {uploadType !== 'lesson' && (
                <div>
                  <Label>Associated Lesson (Optional)</Label>
                  <Select value={uploadForm.lessonId} onValueChange={(value) => setUploadForm({ ...uploadForm, lessonId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select lesson" />
                    </SelectTrigger>
                    <SelectContent>
                      {lessons.filter(l => l.grade === uploadForm.grade).map(lesson => (
                        <SelectItem key={lesson.id} value={lesson.id}>
                          {lesson.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div>
                <Label>PDF File</Label>
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileInput}
                  disabled={uploading}
                />
              </div>
              
              {uploading && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} />
                  <p className="text-sm text-muted-foreground">Processing PDF and extracting content...</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-4 border-b">
        <button
          onClick={() => setActiveTab('lessons')}
          className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'lessons' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <BookOpen className="w-4 h-4 inline mr-2" />
          Lessons ({lessons.length})
        </button>
        <button
          onClick={() => setActiveTab('tests')}
          className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'tests' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <FileText className="w-4 h-4 inline mr-2" />
          Tests ({tests.length})
        </button>
        <button
          onClick={() => setActiveTab('scoring')}
          className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'scoring' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <BarChart3 className="w-4 h-4 inline mr-2" />
          Student Scoring
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'lessons' && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Uploaded Lessons</CardTitle>
            <CardDescription>PDF lessons with extracted content</CardDescription>
          </CardHeader>
          <CardContent>
            {uploadsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : lessons.length > 0 ? (
              <div className="space-y-4">
                {lessons.map((lesson) => (
                  <div key={lesson.id} className="relative">
                    <PDFViewer
                      title={lesson.title}
                      content={lesson.pdf_content}
                      filename={lesson.pdf_filename}
                      grade={lesson.grade}
                    />
                    <div className="absolute top-4 right-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteLesson(lesson.id)}
                        className="text-destructive hover:text-destructive bg-white/80 hover:bg-white"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      <span>{new Date(lesson.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No lessons uploaded yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'tests' && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Uploaded Tests</CardTitle>
            <CardDescription>Pre-tests and post-tests with auto-parsed questions</CardDescription>
          </CardHeader>
          <CardContent>
            {uploadsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : tests.length > 0 ? (
              <div className="space-y-4">
                {tests.map((test) => (
                  <div key={test.id} className="relative">
                    <PDFViewer
                      title={test.title}
                      content={test.pdf_content}
                      filename={test.pdf_filename}
                      grade={test.grade}
                      type={test.type}
                      totalMarks={test.total_marks}
                    />
                    <div className="absolute top-4 right-4 flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTest(test.id);
                          setActiveTab('scoring');
                          loadTestScoring(test.id);
                        }}
                        className="bg-white/80 hover:bg-white"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Score Students
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteTest(test.id)}
                        className="text-destructive hover:text-destructive bg-white/80 hover:bg-white"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      <span>{new Date(test.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No tests uploaded yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'scoring' && (
        <div className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Student Test Scoring</CardTitle>
              <CardDescription>Enter marks for each student per question</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Select Test</Label>
                  <Select value={selectedTest} onValueChange={(value) => {
                    setSelectedTest(value);
                    loadTestScoring(value);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a test to score" />
                    </SelectTrigger>
                    <SelectContent>
                      {tests.map(test => (
                        <SelectItem key={test.id} value={test.id}>
                          {test.title} ({test.type}) - {test.grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {selectedTest && testQuestions.length > 0 && (
            <>
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Test Questions</CardTitle>
                </CardHeader>
                <CardContent>
                  <QuestionEditor 
                    questions={testQuestions} 
                    onUpdate={() => {}} 
                    disabled={true}
                  />
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Student Scores</CardTitle>
                  <CardDescription>Enter marks for each student</CardDescription>
                </CardHeader>
                <CardContent>
                  {scoringLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {students
                        .filter(student => {
                          const selectedTestData = tests.find(t => t.id === selectedTest);
                          return student.grade === selectedTestData?.grade;
                        })
                        .map(student => {
                          const existingScores = studentTestScores.find(s => s.student_id === student.id);
                          return (
                            <StudentScoreCard
                              key={student.id}
                              student={student}
                              questions={testQuestions}
                              existingScores={existingScores}
                              onSave={handleSaveStudentScores}
                            />
                          );
                        })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {selectedTest && testQuestions.length === 0 && !scoringLoading && (
            <Card className="border-0 shadow-lg">
              <CardContent className="text-center py-8">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No questions found for this test.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default Uploads;
