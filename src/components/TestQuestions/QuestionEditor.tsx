import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Edit } from "lucide-react";
import { TestQuestion } from "@/hooks/useSupabaseUploads";

interface QuestionEditorProps {
  questions: TestQuestion[];
  onUpdate: (questions: TestQuestion[]) => void;
  disabled?: boolean;
}

export const QuestionEditor = ({ questions, onUpdate, disabled = false }: QuestionEditorProps) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newQuestion, setNewQuestion] = useState({
    question_text: "",
    total_marks: 1
  });

  const handleAddQuestion = () => {
    if (!newQuestion.question_text.trim()) return;
    
    const question: Partial<TestQuestion> = {
      question_text: newQuestion.question_text,
      total_marks: newQuestion.total_marks,
      question_order: questions.length + 1
    };
    
    onUpdate([...questions, question as TestQuestion]);
    setNewQuestion({ question_text: "", total_marks: 1 });
  };

  const handleUpdateQuestion = (index: number, updates: Partial<TestQuestion>) => {
    const updated = questions.map((q, i) => 
      i === index ? { ...q, ...updates } : q
    );
    onUpdate(updated);
    setEditingIndex(null);
  };

  const handleDeleteQuestion = (index: number) => {
    const filtered = questions.filter((_, i) => i !== index);
    const reordered = filtered.map((q, i) => ({ ...q, question_order: i + 1 }));
    onUpdate(reordered);
  };

  const totalMarks = questions.reduce((sum, q) => sum + q.total_marks, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <h3 className="text-base sm:text-lg font-semibold">Test Questions</h3>
        <Badge variant="outline">Total: {totalMarks} marks</Badge>
      </div>

      {/* Add new question */}
      {!disabled && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm sm:text-base">Add New Question</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="question" className="text-sm">Question Text</Label>
              <Textarea
                id="question"
                value={newQuestion.question_text}
                onChange={(e) => setNewQuestion({ ...newQuestion, question_text: e.target.value })}
                placeholder="Enter the question..."
                rows={3}
                className="mt-1"
              />
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-end space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="flex-1 w-full sm:w-auto">
                <Label htmlFor="marks" className="text-sm">Marks</Label>
                <Input
                  id="marks"
                  type="number"
                  min="1"
                  value={newQuestion.total_marks}
                  onChange={(e) => setNewQuestion({ ...newQuestion, total_marks: parseInt(e.target.value) || 1 })}
                  className="mt-1"
                />
              </div>
              <Button onClick={handleAddQuestion} className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Add Question
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Questions list */}
      <div className="space-y-3">
        {questions.map((question, index) => (
          <Card key={question.id || index}>
            <CardContent className="pt-4">
              {editingIndex === index ? (
                <div className="space-y-4">
                  <Textarea
                    value={question.question_text}
                    onChange={(e) => handleUpdateQuestion(index, { question_text: e.target.value })}
                    rows={3}
                  />
                  <div className="flex flex-col sm:flex-row items-start sm:items-end space-y-4 sm:space-y-0 sm:space-x-4">
                    <div className="flex-1 w-full sm:w-auto">
                      <Label className="text-sm">Marks</Label>
                      <Input
                        type="number"
                        min="1"
                        value={question.total_marks}
                        onChange={(e) => handleUpdateQuestion(index, { total_marks: parseInt(e.target.value) || 1 })}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex space-x-2 w-full sm:w-auto">
                      <Button size="sm" onClick={() => setEditingIndex(null)} className="flex-1 sm:flex-none">
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingIndex(null)} className="flex-1 sm:flex-none">
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 mb-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        Question {question.question_order}
                      </span>
                      <Badge variant="secondary" className="text-xs">{question.total_marks} marks</Badge>
                    </div>
                    <p className="text-sm break-words">{question.question_text}</p>
                  </div>
                  {!disabled && (
                    <div className="flex space-x-1 shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingIndex(index)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteQuestion(index)}
                        className="text-destructive hover:text-destructive h-8 w-8 p-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {questions.length === 0 && (
        <div className="text-center py-6 sm:py-8 text-muted-foreground">
          <p className="text-sm">{!disabled ? "No questions added yet. Add your first question above." : "No questions available."}</p>
        </div>
      )}
    </div>
  );
};