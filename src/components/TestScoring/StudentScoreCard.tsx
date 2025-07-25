import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Student } from "@/hooks/useStudents";
import { TestQuestion } from "@/hooks/useSupabaseUploads";
import { StudentTestScore } from "@/hooks/useStudentScores";
import { User, CheckCircle, AlertCircle, Save } from "lucide-react";

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
    const numValue = Math.max(0, parseInt(value) || 0);
    const question = questions.find(q => q.id === questionId);
    const maxMarks = question?.total_marks || 0;
    const finalValue = Math.min(numValue, maxMarks);
    setScores(prev => ({ ...prev, [questionId]: finalValue }));
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

  const getGradeColor = (percent: number) => {
    if (percent >= 80) return "text-green-700 bg-green-100";
    if (percent >= 60) return "text-yellow-700 bg-yellow-100";
    return "text-red-700 bg-red-100";
  };

  const formatQuestionText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <Card className="border border-border shadow-lg hover:shadow-xl transition-all duration-200">
      <CardHeader className="pb-4 bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">{student.name}</CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="outline" className="text-xs">{student.grade}</Badge>
                <Badge variant="secondary" className="text-xs">{student.gender}</Badge>
              </div>
            </div>
          </div>
          <div className="text-right">
            <Badge className={`text-white ${getPercentageColor(percentage)} px-3 py-1`}>
              {percentage}%
            </Badge>
            <div className="text-sm text-muted-foreground mt-1">
              {totalScored}/{totalPossible} marks
            </div>
          </div>
        </div>
        
        <Separator className="my-3" />
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Progress</span>
          <span className={`text-sm px-2 py-1 rounded-full ${getGradeColor(percentage)}`}>
            {percentage >= 80 ? 'Excellent' : percentage >= 60 ? 'Good' : 'Needs Improvement'}
          </span>
        </div>
        <Progress value={percentage} className="h-2 mt-2" />
      </CardHeader>
      
      <CardContent className="space-y-4 p-6">
        <div className="space-y-4">
          {questions.map((question, index) => {
            const currentScore = scores[question.id] || 0;
            const isValid = currentScore >= 0 && currentScore <= question.total_marks;
            const questionPercentage = question.total_marks > 0 ? Math.round((currentScore / question.total_marks) * 100) : 0;
            
            return (
              <div key={question.id} className="border border-border/50 rounded-lg p-4 bg-background/50 hover:bg-background transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      currentScore === question.total_marks 
                        ? 'bg-green-100 text-green-700' 
                        : currentScore > 0 
                        ? 'bg-yellow-100 text-yellow-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {question.question_order}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium leading-relaxed">
                        {formatQuestionText(question.question_text)}
                      </p>
                      {question.question_text.length > 100 && (
                        <details className="mt-2">
                          <summary className="text-xs text-primary cursor-pointer hover:underline">
                            Show full question
                          </summary>
                          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                            {question.question_text}
                          </p>
                        </details>
                      )}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <span className="text-xs text-muted-foreground block">Max Marks</span>
                    <span className="font-bold text-primary">{question.total_marks}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-muted-foreground">Score:</label>
                    <div className="relative">
                      <Input
                        type="number"
                        min="0"
                        max={question.total_marks}
                        value={currentScore}
                        onChange={(e) => handleScoreChange(question.id, e.target.value)}
                        className={`w-20 text-center font-medium ${
                          !isValid 
                            ? 'border-red-500 focus:border-red-500' 
                            : currentScore === question.total_marks
                            ? 'border-green-500 focus:border-green-500'
                            : 'border-border'
                        }`}
                        disabled={disabled}
                      />
                      {currentScore === question.total_marks && (
                        <CheckCircle className="w-4 h-4 text-green-500 absolute -right-5 top-1/2 transform -translate-y-1/2" />
                      )}
                      {!isValid && (
                        <AlertCircle className="w-4 h-4 text-red-500 absolute -right-5 top-1/2 transform -translate-y-1/2" />
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">Question Progress</span>
                      <span className="text-xs font-medium">{questionPercentage}%</span>
                    </div>
                    <Progress value={questionPercentage} className="h-1.5" />
                  </div>
                </div>
                
                {!isValid && (
                  <div className="mt-2 flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <p className="text-xs text-red-500">
                      Score must be between 0 and {question.total_marks}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {!disabled && (
          <div className="pt-4 border-t border-border">
            <Button 
              onClick={handleSave}
              disabled={saving || questions.some(q => {
                const score = scores[q.id] || 0;
                return score < 0 || score > q.total_marks;
              })}
              className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-medium py-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Saving Scores...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save All Scores ({totalScored}/{totalPossible})
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};