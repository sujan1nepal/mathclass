import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
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
  BarChart3,
  GraduationCap,
  Target,
  TrendingUp
} from "lucide-react";

const Uploads = () => {
  const { lessons, tests, testQuestions, loading: uploadsLoading, uploadLesson, uploadTest, deleteLesson, deleteTest, fetchTestQuestions, reparseTestQuestions } = useSupabaseUploads();
  const { students } = useStudents();
  const { getStudentTestScores, saveBulkScores } = useStudentScores();
  
  const [activeTab, setActiveTab] = useState<'lessons' | 'tests' | 'scoring'>('lessons');
  const [scoringSubTab, setScoringSubTab] = useState<'pretest' | 'posttest'>('pretest');
  const [uploadType, setUploadType] = useState<'lesson' | 'pretest' | 'posttest'>('lesson');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<string>('');
  const [studentTestScores, setStudentTestScores] = useState<any[]>([]);
  const [scoringLoading, setScoringLoading] = useState(false);
  const [reparsingQuestions, setReparsingQuestions] = useState(false);
  
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
      console.log('🔍 Loading test scoring for test ID:', testId);
      
      // Fetch test questions for the specific test
      await fetchTestQuestions(testId);
      
      // Fetch existing student scores
      const scores = await getStudentTestScores(testId);
      setStudentTestScores(scores);
      
      console.log('📊 Test questions loaded:', testQuestions.length);
      console.log('📊 Student scores loaded:', scores.length);
      
      // Also log the selected test details
      const selectedTestData = tests.find(t => t.id === testId);
      console.log('📝 Selected test:', selectedTestData);
      
    } catch (error) {
      console.error('❌ Error loading test scoring:', error);
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

  const handleReparseQuestions = async () => {
    if (!selectedTest) return;
    
    setReparsingQuestions(true);
    try {
      const success = await reparseTestQuestions(selectedTest);
      if (success) {
        // Reload the test scoring to show the new questions
        await loadTestScoring(selectedTest);
      }
    } catch (error) {
      console.error('Error re-parsing questions:', error);
    } finally {
      setReparsingQuestions(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const getFilteredTests = (type: 'pretest' | 'posttest') => {
    return tests.filter(test => test.type === type);
  };

  const getTestStats = (type: 'pretest' | 'posttest') => {
    const filteredTests = getFilteredTests(type);
    return {
      total: filteredTests.length,
      totalMarks: filteredTests.reduce((sum, test) => sum + (test.total_marks || 0), 0),
      avgMarks: filteredTests.length > 0 ? Math.round(filteredTests.reduce((sum, test) => sum + (test.total_marks || 0), 0) / filteredTests.length) : 0
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Content Management</h1>
          <p className="text-muted-foreground">Upload lessons, tests and manage comprehensive student scoring</p>
        </div>
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-secondary text-white shadow-lg hover:shadow-xl transition-all">
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
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <span>Uploaded Lessons</span>
            </CardTitle>
            <CardDescription>PDF lessons with beautifully formatted content display</CardDescription>
          </CardHeader>
          <CardContent>
            {uploadsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : lessons.length > 0 ? (
              <div className="space-y-6">
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
                        className="text-destructive hover:text-destructive bg-white/80 hover:bg-white shadow-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground flex justify-between items-center">
                      <span>{new Date(lesson.created_at).toLocaleDateString()}</span>
                      <Badge variant="outline" className="text-xs">
                        {lesson.grade}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No lessons uploaded yet</h3>
                <p className="text-muted-foreground">Upload your first lesson to get started!</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'tests' && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-primary" />
              <span>Uploaded Tests</span>
            </CardTitle>
            <CardDescription>Pre-tests and post-tests with auto-parsed questions and scoring capabilities</CardDescription>
          </CardHeader>
          <CardContent>
            {uploadsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : tests.length > 0 ? (
              <div className="space-y-6">
                {/* Test Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center space-x-2">
                        <Target className="w-4 h-4 text-blue-600" />
                        <span>Pre-tests</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">{getTestStats('pretest').total}</div>
                      <p className="text-xs text-blue-600/70 mt-1">
                        Avg: {getTestStats('pretest').avgMarks} marks
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center space-x-2">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <span>Post-tests</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">{getTestStats('posttest').total}</div>
                      <p className="text-xs text-green-600/70 mt-1">
                        Avg: {getTestStats('posttest').avgMarks} marks
                      </p>
                    </CardContent>
                  </Card>
                </div>

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
                          setScoringSubTab(test.type as 'pretest' | 'posttest');
                          setActiveTab('scoring');
                          loadTestScoring(test.id);
                        }}
                        className="bg-white/80 hover:bg-white shadow-sm"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Score Students
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteTest(test.id)}
                        className="text-destructive hover:text-destructive bg-white/80 hover:bg-white shadow-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground flex justify-between items-center">
                      <span>{new Date(test.created_at).toLocaleDateString()}</span>
                      <div className="flex items-center space-x-2">
                        <Badge variant={test.type === 'pretest' ? 'default' : 'secondary'} className="text-xs">
                          {test.type}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {test.grade}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No tests uploaded yet</h3>
                <p className="text-muted-foreground">Upload pre-tests and post-tests to start scoring!</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'scoring' && (
        <div className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <GraduationCap className="w-5 h-5 text-primary" />
                <span>Student Test Scoring</span>
              </CardTitle>
              <CardDescription>
                Comprehensive scoring system for individual questions with progress tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Select Test to Score</Label>
                  <Select value={selectedTest} onValueChange={(value) => {
                    setSelectedTest(value);
                    const test = tests.find(t => t.id === value);
                    if (test) {
                      setScoringSubTab(test.type as 'pretest' | 'posttest');
                    }
                    loadTestScoring(value);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a test to score" />
                    </SelectTrigger>
                    <SelectContent>
                      {tests.map(test => (
                        <SelectItem key={test.id} value={test.id}>
                          <div className="flex items-center space-x-2">
                            <Badge variant={test.type === 'pretest' ? 'default' : 'secondary'} className="text-xs">
                              {test.type}
                            </Badge>
                            <span>{test.title} - {test.grade}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {selectedTest && (
            <Tabs value={scoringSubTab} onValueChange={(value) => setScoringSubTab(value as 'pretest' | 'posttest')} className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 lg:w-96">
                <TabsTrigger value="pretest" className="flex items-center space-x-2">
                  <Target className="w-4 h-4" />
                  <span>Pre-test Scoring</span>
                </TabsTrigger>
                <TabsTrigger value="posttest" className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>Post-test Scoring</span>
                </TabsTrigger>
              </TabsList>

              {/* Debug Information */}
              {selectedTest && (
                <Card className="border-orange-200 bg-orange-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-orange-700 flex items-center space-x-2">
                      <FileText className="w-4 h-4" />
                      <span>Debug Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="font-medium text-orange-700">Selected Test:</p>
                        <p className="text-orange-600">{tests.find(t => t.id === selectedTest)?.title || 'Unknown'}</p>
                      </div>
                      <div>
                        <p className="font-medium text-orange-700">Test Type:</p>
                        <p className="text-orange-600">{tests.find(t => t.id === selectedTest)?.type || 'Unknown'}</p>
                      </div>
                      <div>
                        <p className="font-medium text-orange-700">Questions Found:</p>
                        <p className="text-orange-600">{testQuestions.length} questions</p>
                      </div>
                    </div>
                    {testQuestions.length === 0 && (
                      <div className="mt-3 p-3 bg-orange-100 rounded-lg">
                        <p className="text-orange-700 font-medium">Troubleshooting Tips:</p>
                        <ul className="text-orange-600 text-xs mt-1 space-y-1">
                          <li>• Check browser console for question parsing logs</li>
                          <li>• Ensure your PDF has numbered questions (1., 2., etc.)</li>
                          <li>• Try re-uploading the test if questions weren't parsed</li>
                          <li>• Questions should be clearly formatted with numbers</li>
                        </ul>
                      </div>
                    )}
                    <Separator className="my-3" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleReparseQuestions}
                      className="text-orange-600 hover:text-orange-700"
                      disabled={reparsingQuestions}
                    >
                      {reparsingQuestions ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Re-parsing...
                        </>
                      ) : (
                        <>
                          <Cloud className="w-4 h-4 mr-2" />
                          Re-parse Questions
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}

              <TabsContent value="pretest" className="space-y-6">
                {testQuestions.length > 0 && (
                  <>
                    <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2 text-blue-700">
                          <Target className="w-5 h-5" />
                          <span>Pre-test Questions</span>
                        </CardTitle>
                        <CardDescription className="text-blue-600">
                          Questions for initial assessment before lesson delivery
                        </CardDescription>
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
                        <CardTitle className="flex items-center space-x-2">
                          <Users className="w-5 h-5 text-blue-600" />
                          <span>Student Pre-test Scores</span>
                        </CardTitle>
                        <CardDescription>
                          Enter marks for each student's pre-test performance
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {scoringLoading ? (
                          <div className="flex justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin" />
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              </TabsContent>

              <TabsContent value="posttest" className="space-y-6">
                {testQuestions.length > 0 && (
                  <>
                    <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2 text-green-700">
                          <TrendingUp className="w-5 h-5" />
                          <span>Post-test Questions</span>
                        </CardTitle>
                        <CardDescription className="text-green-600">
                          Questions for assessment after lesson completion
                        </CardDescription>
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
                        <CardTitle className="flex items-center space-x-2">
                          <Users className="w-5 h-5 text-green-600" />
                          <span>Student Post-test Scores</span>
                        </CardTitle>
                        <CardDescription>
                          Enter marks for each student's post-test performance
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {scoringLoading ? (
                          <div className="flex justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin" />
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              </TabsContent>
            </Tabs>
          )}

          {selectedTest && testQuestions.length === 0 && !scoringLoading && (
            <Card className="border-0 shadow-lg">
              <CardContent className="text-center py-12">
                <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No questions found</h3>
                <p className="text-muted-foreground">This test doesn't have any parsed questions available for scoring.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default Uploads;
