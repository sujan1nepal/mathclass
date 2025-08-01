import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Save, Edit3, FileText, Copy } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Question {
  id?: string;
  question_text: string;
  total_marks: number;
  question_order: number;
}

interface ManualQuestionEditorProps {
  testId: string;
  testTitle: string;
  initialQuestions: Question[];
  onSave: (questions: Question[]) => Promise<boolean>;
}

export const ManualQuestionEditor = ({ 
  testId, 
  testTitle, 
  initialQuestions = [], 
  onSave 
}: ManualQuestionEditorProps) => {
  const [questions, setQuestions] = useState<Question[]>(
    initialQuestions.length > 0 
      ? initialQuestions 
      : [{ question_text: '', total_marks: 1, question_order: 1 }]
  );
  const [saving, setSaving] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  const addQuestion = () => {
    const newQuestion: Question = {
      question_text: '',
      total_marks: 1,
      question_order: questions.length + 1
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length <= 1) {
      toast.error('You must have at least one question');
      return;
    }
    
    const newQuestions = questions.filter((_, i) => i !== index);
    // Reorder questions
    const reorderedQuestions = newQuestions.map((q, i) => ({
      ...q,
      question_order: i + 1
    }));
    setQuestions(reorderedQuestions);
  };

  const updateQuestion = (index: number, field: keyof Question, value: string | number) => {
    const newQuestions = [...questions];
    newQuestions[index] = {
      ...newQuestions[index],
      [field]: value
    };
    setQuestions(newQuestions);
  };

  const parseBulkText = (text: string): Question[] => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const parsedQuestions: Question[] = [];
    
    let currentQuestionNumber = 1;
    
    for (const line of lines) {
      // Match patterns like: "1. Question text [5 marks]" or "1) Question text (3 marks)"
      const questionMatch = line.match(/^(\d+)[\.\)]\s*(.+?)(?:\s*[\[\(](\d+)\s*marks?[\]\)])?$/i);
      
      if (questionMatch) {
        const questionText = questionMatch[2].trim();
        const marks = questionMatch[3] ? parseInt(questionMatch[3]) : 1;
        
        parsedQuestions.push({
          question_text: questionText,
          total_marks: marks > 0 && marks <= 100 ? marks : 1,
          question_order: currentQuestionNumber++
        });
      } else if (line.length > 5) {
        // If it doesn't match the pattern but is substantial text, treat as question
        parsedQuestions.push({
          question_text: line,
          total_marks: 1,
          question_order: currentQuestionNumber++
        });
      }
    }
    
    return parsedQuestions;
  };

  const handleImportText = () => {
    if (!bulkText.trim()) {
      toast.error('Please enter some text to import');
      return;
    }
    
    const parsedQuestions = parseBulkText(bulkText);
    
    if (parsedQuestions.length === 0) {
      toast.error('No valid questions found in the text');
      return;
    }
    
    setQuestions(parsedQuestions);
    setBulkText('');
    setIsImportDialogOpen(false);
    toast.success(`Imported ${parsedQuestions.length} questions successfully`);
  };

  const handleSave = async () => {
    // Validate questions
    const validQuestions = questions.filter(q => q.question_text.trim().length > 0);
    
    if (validQuestions.length === 0) {
      toast.error('Please add at least one question with content');
      return;
    }

    // Check for valid marks
    const invalidMarks = validQuestions.some(q => q.total_marks <= 0 || q.total_marks > 100);
    if (invalidMarks) {
      toast.error('All questions must have marks between 1 and 100');
      return;
    }

    setSaving(true);
    try {
      const success = await onSave(validQuestions);
      if (success) {
        toast.success(`Saved ${validQuestions.length} questions successfully`);
      }
    } catch (error) {
      console.error('Error saving questions:', error);
      toast.error('Failed to save questions');
    } finally {
      setSaving(false);
    }
  };

  const totalMarks = questions.reduce((sum, q) => sum + (q.total_marks || 0), 0);

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Edit3 className="w-5 h-5 text-blue-600" />
              <span>Manual Question Editor</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Edit questions for: {testTitle}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-blue-600 border-blue-600">
                {questions.length} Questions
              </Badge>
              <Badge variant="secondary">
                {totalMarks} Total Marks
              </Badge>
            </div>
            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <FileText className="w-4 h-4" />
                  Import Text
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Import Questions from Text</DialogTitle>
                  <DialogDescription>
                    Paste your questions here. Use this format for best results:
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg text-sm">
                    <p className="font-semibold mb-2">Format Examples:</p>
                    <div className="space-y-1 text-muted-foreground">
                      <p>1. What is the capital of France? [2 marks]</p>
                      <p>2) Calculate the area of a circle with radius 5cm (3 marks)</p>
                      <p>3. Explain photosynthesis</p>
                    </div>
                  </div>
                  <Textarea
                    placeholder="Paste your questions here..."
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    className="min-h-[200px]"
                  />
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleImportText}>
                      Import Questions
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {questions.map((question, index) => (
          <div key={index} className="border border-border/50 rounded-lg p-4 bg-background/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
              <Label className="font-semibold text-primary">
                Question {question.question_order}
              </Label>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeQuestion(index)}
                  className="text-destructive hover:text-destructive"
                  disabled={questions.length <= 1}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor={`question-${index}`}>Question Text</Label>
                <Textarea
                  id={`question-${index}`}
                  value={question.question_text}
                  onChange={(e) => updateQuestion(index, 'question_text', e.target.value)}
                  placeholder="Enter your question here..."
                  className="min-h-[100px] mt-1"
                />
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="flex items-center space-x-2">
                  <Label htmlFor={`marks-${index}`}>Marks:</Label>
                  <Input
                    id={`marks-${index}`}
                    type="number"
                    min="1"
                    max="100"
                    value={question.total_marks}
                    onChange={(e) => updateQuestion(index, 'total_marks', parseInt(e.target.value) || 1)}
                    className="w-20"
                  />
                </div>
                
                <div className="flex-1">
                  <div className="text-sm text-muted-foreground">
                    Character count: {question.question_text.length}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-4 border-t border-border gap-4">
          <Button
            variant="outline"
            onClick={addQuestion}
            className="border-primary text-primary hover:bg-primary/10"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Question
          </Button>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="text-sm text-muted-foreground">
              Total: {totalMarks} marks, {questions.filter(q => q.question_text.trim()).length} questions
            </div>
            <Button
              onClick={handleSave}
              disabled={saving || questions.every(q => !q.question_text.trim())}
              className="bg-gradient-to-r from-primary to-secondary text-white w-full sm:w-auto"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Questions
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};