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
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Test Questions</h3>
        <Badge variant="outline">Total: {totalMarks} marks</Badge>
      </div>

      {/* Add new question */}
      {!disabled && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Add New Question</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="question">Question Text</Label>
              <Textarea
                id="question"
                value={newQuestion.question_text}
                onChange={(e) => setNewQuestion({ ...newQuestion, question_text: e.target.value })}
                placeholder="Enter the question..."
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Label htmlFor="marks">Marks</Label>
                <Input
                  id="marks"
                  type="number"
                  min="1"
                  value={newQuestion.total_marks}
                  onChange={(e) => setNewQuestion({ ...newQuestion, total_marks: parseInt(e.target.value) || 1 })}
                />
              </div>
              <Button onClick={handleAddQuestion} className="mt-6">
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
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <Label>Marks</Label>
                      <Input
                        type="number"
                        min="1"
                        value={question.total_marks}
                        onChange={(e) => handleUpdateQuestion(index, { total_marks: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                    <div className="flex space-x-2 mt-6">
                      <Button size="sm" onClick={() => setEditingIndex(null)}>
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingIndex(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        Question {question.question_order}
                      </span>
                      <Badge variant="secondary">{question.total_marks} marks</Badge>
                    </div>
                    <p className="text-sm">{question.question_text}</p>
                  </div>
                  {!disabled && (
                    <div className="flex space-x-1 ml-4">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingIndex(index)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteQuestion(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
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
        <div className="text-center py-8 text-muted-foreground">
          <p>No questions added yet. {!disabled && "Add your first question above."}</p>
        </div>
      )}
    </div>
  );
};