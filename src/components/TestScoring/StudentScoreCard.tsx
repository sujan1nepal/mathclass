import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Student } from "@/hooks/useStudents";
import { TestQuestion } from "@/hooks/useSupabaseUploads";
import { StudentTestScore } from "@/hooks/useStudentScores";

interface StudentScoreCardProps {
  student: Student;
  questions: TestQuestion[];
  existingScores?: StudentTestScore;
  onSave: (studentId: string, scores: Array<{ questionId: string; marks: number }>) => void;
  disabled?: boolean;
}

export const StudentScoreCard = ({ 
  student, 
  questions, 
  existingScores,
  onSave,
  disabled = false 
}: StudentScoreCardProps) => {
  const [scores, setScores] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    if (existingScores) {
      existingScores.scores.forEach(score => {
        initial[score.question_id] = score.scored_marks;
      });
    }
    return initial;
  });

  const [saving, setSaving] = useState(false);

  const handleScoreChange = (questionId: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setScores(prev => ({ ...prev, [questionId]: numValue }));
  };

  const handleSave = async () => {
    setSaving(true);
    const scoreArray = questions.map(q => ({
      questionId: q.id,
      marks: scores[q.id] || 0
    }));
    
    await onSave(student.id, scoreArray);
    setSaving(false);
  };

  const totalScored = questions.reduce((sum, q) => sum + (scores[q.id] || 0), 0);
  const totalPossible = questions.reduce((sum, q) => sum + q.total_marks, 0);
  const percentage = totalPossible > 0 ? Math.round((totalScored / totalPossible) * 100) : 0;

  const getPercentageColor = (percent: number) => {
    if (percent >= 80) return "bg-green-500";
    if (percent >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <Card className="border border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{student.name}</CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="outline">{student.grade}</Badge>
            <Badge className={`text-white ${getPercentageColor(percentage)}`}>
              {percentage}%
            </Badge>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          Total: {totalScored}/{totalPossible} marks
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {questions.map((question) => {
          const currentScore = scores[question.id] || 0;
          const isValid = currentScore >= 0 && currentScore <= question.total_marks;
          
          return (
            <div key={question.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Q{question.question_order}
                </span>
                <span className="text-xs text-muted-foreground">
                  /{question.total_marks} marks
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  min="0"
                  max={question.total_marks}
                  value={currentScore}
                  onChange={(e) => handleScoreChange(question.id, e.target.value)}
                  className={`w-20 ${!isValid ? 'border-red-500' : ''}`}
                  disabled={disabled}
                />
                <span className="text-sm text-muted-foreground flex-1 truncate">
                  {question.question_text}
                </span>
              </div>
              {!isValid && (
                <p className="text-xs text-red-500">
                  Score must be between 0 and {question.total_marks}
                </p>
              )}
            </div>
          );
        })}
        
        {!disabled && (
          <Button 
            onClick={handleSave}
            disabled={saving}
            className="w-full mt-4"
          >
            {saving ? "Saving..." : "Save Scores"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};