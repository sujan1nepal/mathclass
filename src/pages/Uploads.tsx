import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  Upload, 
  FileText, 
  BookOpen, 
  TestTube, 
  TestTube2,
  Download,
  Eye,
  Trash2,
  Plus
} from "lucide-react";

interface UploadedFile {
  id: number;
  name: string;
  type: 'lesson' | 'pretest' | 'posttest';
  grade: string;
  uploadDate: string;
  fileSize: string;
}

interface TestQuestion {
  id: number;
  question: string;
  totalMarks: number;
  studentScores: { [studentId: string]: number };
}

const Uploads = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([
    {
      id: 1,
      name: "Algebra_Lesson_Plan.pdf",
      type: "lesson",
      grade: "Grade 9",
      uploadDate: "2024-01-20",
      fileSize: "2.3 MB"
    },
    {
      id: 2,
      name: "Geometry_PreTest.pdf",
      type: "pretest",
      grade: "Grade 10",
      uploadDate: "2024-01-18",
      fileSize: "1.8 MB"
    }
  ]);

  const [testQuestions, setTestQuestions] = useState<TestQuestion[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [testType, setTestType] = useState<'pretest' | 'posttest'>('pretest');
  const [newQuestion, setNewQuestion] = useState({ question: "", totalMarks: 0 });

  // Mock students data
  const students = [
    { id: "1", name: "Alice Johnson", grade: "Grade 9" },
    { id: "2", name: "Bob Smith", grade: "Grade 10" },
    { id: "3", name: "Carol Davis", grade: "Grade 11" }
  ];

  const filteredStudents = selectedGrade 
    ? students.filter(student => student.grade === selectedGrade)
    : students;

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, fileType: 'lesson' | 'pretest' | 'posttest') => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (!selectedGrade) {
      toast.error("Please select a grade first");
      return;
    }

    const file = files[0];
    const newFile: UploadedFile = {
      id: uploadedFiles.length + 1,
      name: file.name,
      type: fileType,
      grade: selectedGrade,
      uploadDate: new Date().toISOString().split('T')[0],
      fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`
    };

    setUploadedFiles([...uploadedFiles, newFile]);
    toast.success(`${fileType} file uploaded successfully!`);
  };

  const handleAddQuestion = () => {
    if (!newQuestion.question || newQuestion.totalMarks <= 0) {
      toast.error("Please enter a valid question and marks");
      return;
    }

    const question: TestQuestion = {
      id: testQuestions.length + 1,
      question: newQuestion.question,
      totalMarks: newQuestion.totalMarks,
      studentScores: {}
    };

    setTestQuestions([...testQuestions, question]);
    setNewQuestion({ question: "", totalMarks: 0 });
    toast.success("Question added successfully!");
  };

  const handleScoreUpdate = (questionId: number, studentId: string, score: number) => {
    setTestQuestions(testQuestions.map(q => 
      q.id === questionId 
        ? { 
            ...q, 
            studentScores: { 
              ...q.studentScores, 
              [studentId]: Math.min(score, q.totalMarks) 
            }
          }
        : q
    ));
  };

  const handleDeleteFile = (id: number) => {
    setUploadedFiles(uploadedFiles.filter(file => file.id !== id));
    toast.success("File deleted successfully!");
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'lesson': return <BookOpen className="w-4 h-4" />;
      case 'pretest': return <TestTube className="w-4 h-4" />;
      case 'posttest': return <TestTube2 className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getFileTypeColor = (type: string) => {
    switch (type) {
      case 'lesson': return 'bg-primary';
      case 'pretest': return 'bg-secondary';
      case 'posttest': return 'bg-accent';
      default: return 'bg-muted';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Upload Files</h1>
          <p className="text-muted-foreground">Manage lesson plans and test materials</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export All Files
        </Button>
      </div>

      {/* Grade Selection */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Select Grade</CardTitle>
          <CardDescription>Choose the grade level for file uploads and test management</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedGrade} onValueChange={setSelectedGrade}>
            <SelectTrigger className="w-full md:w-64">
              <SelectValue placeholder="Select a grade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Grade 9">Grade 9</SelectItem>
              <SelectItem value="Grade 10">Grade 10</SelectItem>
              <SelectItem value="Grade 11">Grade 11</SelectItem>
              <SelectItem value="Grade 12">Grade 12</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Tabs defaultValue="files" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="files" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            File Uploads
          </TabsTrigger>
          <TabsTrigger value="pretest" className="flex items-center gap-2">
            <TestTube className="w-4 h-4" />
            Pre-Tests
          </TabsTrigger>
          <TabsTrigger value="posttest" className="flex items-center gap-2">
            <TestTube2 className="w-4 h-4" />
            Post-Tests
          </TabsTrigger>
        </TabsList>

        {/* File Uploads Tab */}
        <TabsContent value="files" className="space-y-6">
          {/* Upload Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  <span>Lesson Plans</span>
                </CardTitle>
                <CardDescription>Upload PDF lesson plans</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleFileUpload(e, 'lesson')}
                    disabled={!selectedGrade}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                  />
                  <p className="text-xs text-muted-foreground">
                    PDF files only, max 10MB
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TestTube className="w-5 h-5 text-secondary" />
                  <span>Pre-Test Files</span>
                </CardTitle>
                <CardDescription>Upload pre-test questions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleFileUpload(e, 'pretest')}
                    disabled={!selectedGrade}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-secondary file:text-secondary-foreground hover:file:bg-secondary/90"
                  />
                  <p className="text-xs text-muted-foreground">
                    PDF files only, max 10MB
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TestTube2 className="w-5 h-5 text-accent" />
                  <span>Post-Test Files</span>
                </CardTitle>
                <CardDescription>Upload post-test questions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleFileUpload(e, 'posttest')}
                    disabled={!selectedGrade}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-accent file:text-accent-foreground hover:file:bg-accent/90"
                  />
                  <p className="text-xs text-muted-foreground">
                    PDF files only, max 10MB
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Uploaded Files List */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Uploaded Files</CardTitle>
              <CardDescription>Manage your uploaded lesson plans and test files</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {uploadedFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${getFileTypeColor(file.type)}`}>
                        {getFileIcon(file.type)}
                      </div>
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {file.grade} • {file.uploadDate} • {file.fileSize}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="capitalize">
                        {file.type}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteFile(file.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {uploadedFiles.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No files uploaded yet.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pre-Test Tab */}
        <TabsContent value="pretest" className="space-y-6">
          <TestManagement 
            testType="pretest"
            selectedGrade={selectedGrade}
            filteredStudents={filteredStudents}
            testQuestions={testQuestions}
            newQuestion={newQuestion}
            setNewQuestion={setNewQuestion}
            handleAddQuestion={handleAddQuestion}
            handleScoreUpdate={handleScoreUpdate}
          />
        </TabsContent>

        {/* Post-Test Tab */}
        <TabsContent value="posttest" className="space-y-6">
          <TestManagement 
            testType="posttest"
            selectedGrade={selectedGrade}
            filteredStudents={filteredStudents}
            testQuestions={testQuestions}
            newQuestion={newQuestion}
            setNewQuestion={setNewQuestion}
            handleAddQuestion={handleAddQuestion}
            handleScoreUpdate={handleScoreUpdate}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Test Management Component
interface TestManagementProps {
  testType: 'pretest' | 'posttest';
  selectedGrade: string;
  filteredStudents: { id: string; name: string; grade: string }[];
  testQuestions: TestQuestion[];
  newQuestion: { question: string; totalMarks: number };
  setNewQuestion: (question: { question: string; totalMarks: number }) => void;
  handleAddQuestion: () => void;
  handleScoreUpdate: (questionId: number, studentId: string, score: number) => void;
}

const TestManagement = ({ 
  testType, 
  selectedGrade, 
  filteredStudents, 
  testQuestions, 
  newQuestion, 
  setNewQuestion, 
  handleAddQuestion, 
  handleScoreUpdate 
}: TestManagementProps) => {
  return (
    <>
      {/* Add Questions */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {testType === 'pretest' ? <TestTube className="w-5 h-5" /> : <TestTube2 className="w-5 h-5" />}
            <span>Add {testType === 'pretest' ? 'Pre-Test' : 'Post-Test'} Questions</span>
          </CardTitle>
          <CardDescription>
            Create questions for {selectedGrade || 'selected grade'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3">
              <Label htmlFor="question">Question</Label>
              <Textarea
                id="question"
                placeholder="Enter the test question..."
                value={newQuestion.question}
                onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                disabled={!selectedGrade}
              />
            </div>
            <div>
              <Label htmlFor="marks">Total Marks</Label>
              <Input
                id="marks"
                type="number"
                placeholder="10"
                value={newQuestion.totalMarks || ''}
                onChange={(e) => setNewQuestion({ ...newQuestion, totalMarks: parseInt(e.target.value) || 0 })}
                disabled={!selectedGrade}
              />
            </div>
          </div>
          <Button 
            onClick={handleAddQuestion} 
            disabled={!selectedGrade}
            className="w-full md:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Question
          </Button>
        </CardContent>
      </Card>

      {/* Questions and Scoring */}
      {testQuestions.length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Score Entry</CardTitle>
            <CardDescription>
              Enter individual student scores for each question
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {testQuestions.map((question) => (
                <div key={question.id} className="border rounded-lg p-4 space-y-4">
                  <div>
                    <h4 className="font-medium">Question {question.id}</h4>
                    <p className="text-sm text-muted-foreground mb-2">{question.question}</p>
                    <Badge variant="outline">Total Marks: {question.totalMarks}</Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredStudents.map((student) => (
                      <div key={student.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{student.name}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            placeholder="0"
                            min="0"
                            max={question.totalMarks}
                            value={question.studentScores[student.id] || ''}
                            onChange={(e) => handleScoreUpdate(
                              question.id, 
                              student.id, 
                              parseInt(e.target.value) || 0
                            )}
                            className="w-16 text-center"
                          />
                          <span className="text-sm text-muted-foreground">
                            /{question.totalMarks}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default Uploads;