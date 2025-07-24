import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useStudents } from "@/hooks/useStudents";
import { useSupabaseUploads } from "@/hooks/useSupabaseUploads";
import { 
  Upload, 
  FileText, 
  BookOpen, 
  TestTube, 
  TestTube2,
  Download,
  Eye,
  Trash2,
  Loader2
} from "lucide-react";

const Uploads = () => {
  const { students } = useStudents();
  const { lessons, tests, testQuestions, loading, uploadLesson, uploadTest, deleteLesson, deleteTest } = useSupabaseUploads();
  
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [uploadingFiles, setUploadingFiles] = useState<{ [key: string]: boolean }>({});

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, fileType: 'lesson' | 'pretest' | 'posttest') => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (!selectedGrade) {
      toast.error("Please select a grade first");
      return;
    }

    const file = files[0];
    const uploadKey = `${fileType}-${Date.now()}`;
    
    setUploadingFiles(prev => ({ ...prev, [uploadKey]: true }));

    try {
      const title = file.name.replace('.pdf', '');
      
      if (fileType === 'lesson') {
        await uploadLesson(file, title, selectedGrade);
      } else {
        await uploadTest(file, title, fileType, selectedGrade);
      }
    } finally {
      setUploadingFiles(prev => ({ ...prev, [uploadKey]: false }));
      // Reset the file input
      event.target.value = '';
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'lesson': return <BookOpen className="w-4 h-4 text-white" />;
      case 'pretest': return <TestTube className="w-4 h-4 text-white" />;
      case 'posttest': return <TestTube2 className="w-4 h-4 text-white" />;
      default: return <FileText className="w-4 h-4 text-white" />;
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

  const formatFileSize = (content: string | null) => {
    if (!content) return '0 KB';
    const sizeInBytes = new Blob([content]).size;
    return `${(sizeInBytes / 1024).toFixed(1)} KB`;
  };

  const allFiles = [
    ...lessons.map(lesson => ({
      id: lesson.id,
      name: lesson.pdf_filename || lesson.title,
      type: 'lesson' as const,
      grade: lesson.grade,
      uploadDate: new Date(lesson.upload_date).toLocaleDateString(),
      content: lesson.pdf_content,
      title: lesson.title
    })),
    ...tests.map(test => ({
      id: test.id,
      name: test.pdf_filename || test.title,
      type: test.type,
      grade: test.grade,
      uploadDate: new Date(test.created_at).toLocaleDateString(),
      content: test.pdf_content,
      title: test.title,
      totalMarks: test.total_marks
    }))
  ];

  const filteredFiles = selectedGrade 
    ? allFiles.filter(file => file.grade === selectedGrade)
    : allFiles;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Upload Files</h1>
          <p className="text-muted-foreground">Manage lesson plans and test materials with PDF text extraction</p>
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

      {/* Upload Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <span>Lesson Plans</span>
            </CardTitle>
            <CardDescription>Upload PDF lesson plans - text will be extracted automatically</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                type="file"
                accept=".pdf"
                onChange={(e) => handleFileUpload(e, 'lesson')}
                disabled={!selectedGrade || Object.values(uploadingFiles).some(Boolean)}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
              <p className="text-xs text-muted-foreground">
                PDF files only, max 10MB. Text content will be extracted and stored.
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
            <CardDescription>Upload pre-test PDFs - questions and marks will be parsed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                type="file"
                accept=".pdf"
                onChange={(e) => handleFileUpload(e, 'pretest')}
                disabled={!selectedGrade || Object.values(uploadingFiles).some(Boolean)}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-secondary file:text-secondary-foreground hover:file:bg-secondary/90"
              />
              <p className="text-xs text-muted-foreground">
                PDF files only, max 10MB. Questions and marks will be automatically parsed.
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
            <CardDescription>Upload post-test PDFs - questions and marks will be parsed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                type="file"
                accept=".pdf"
                onChange={(e) => handleFileUpload(e, 'posttest')}
                disabled={!selectedGrade || Object.values(uploadingFiles).some(Boolean)}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-accent file:text-accent-foreground hover:file:bg-accent/90"
              />
              <p className="text-xs text-muted-foreground">
                PDF files only, max 10MB. Questions and marks will be automatically parsed.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Uploaded Files List */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Uploaded Files</CardTitle>
          <CardDescription>Manage your uploaded lesson plans and test files with extracted content</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${getFileTypeColor(file.type)}`}>
                      {getFileIcon(file.type)}
                    </div>
                    <div>
                      <p className="font-medium">{file.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {file.grade} • {file.uploadDate} • {formatFileSize(file.content)}
                        {'totalMarks' in file && file.totalMarks > 0 && ` • ${file.totalMarks} marks`}
                      </p>
                      {file.content && (
                        <p className="text-xs text-muted-foreground mt-1 max-w-md truncate">
                          Content: {file.content.substring(0, 100)}...
                        </p>
                      )}
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
                      onClick={() => {
                        if (file.type === 'lesson') {
                          deleteLesson(file.id);
                        } else {
                          deleteTest(file.id);
                        }
                      }}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {filteredFiles.length === 0 && !loading && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No files uploaded yet. Select a grade and upload your first file!</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processing Indicator */}
      {Object.values(uploadingFiles).some(Boolean) && (
        <Card className="border-0 shadow-lg bg-muted/50">
          <CardContent className="flex items-center justify-center py-6">
            <div className="flex items-center space-x-3">
              <Loader2 className="w-5 h-5 animate-spin" />
              <p className="text-sm font-medium">Processing PDF and extracting content...</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Uploads;