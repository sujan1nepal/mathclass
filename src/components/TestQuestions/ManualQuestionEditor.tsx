import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Save, Edit3 } from "lucide-react";
import { toast } from "sonner";

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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Edit3 className="w-5 h-5 text-blue-600" />
              <span>Manual Question Editor</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Edit questions for: {testTitle}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-blue-600 border-blue-600">
              {questions.length} Questions
            </Badge>
            <Badge variant="secondary">
              {totalMarks} Total Marks
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {questions.map((question, index) => (
          <div key={index} className="border border-border/50 rounded-lg p-4 bg-background/50">
            <div className="flex items-center justify-between mb-4">
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
              
              <div className="flex items-center space-x-4">
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
        
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <Button
            variant="outline"
            onClick={addQuestion}
            className="border-primary text-primary hover:bg-primary/10"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Question
          </Button>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-muted-foreground">
              Total: {totalMarks} marks, {questions.filter(q => q.question_text.trim()).length} questions
            </div>
            <Button
              onClick={handleSave}
              disabled={saving || questions.every(q => !q.question_text.trim())}
              className="bg-gradient-to-r from-primary to-secondary text-white"
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