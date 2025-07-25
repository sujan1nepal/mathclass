import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Download, 
  Eye, 
  EyeOff,
  Maximize2,
  Minimize2
} from "lucide-react";

interface PDFViewerProps {
  title: string;
  content: string | null;
  filename: string | null;
  grade?: string;
  type?: string;
  totalMarks?: number;
}

export const PDFViewer = ({ 
  title, 
  content, 
  filename, 
  grade, 
  type, 
  totalMarks 
}: PDFViewerProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showContent, setShowContent] = useState(false);

  const handleDownload = () => {
    if (content) {
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename || title}.txt`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <Card className={`border border-border transition-all duration-200 ${isExpanded ? 'col-span-full' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileText className="w-6 h-6 text-primary" />
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                {grade && <Badge variant="outline">{grade}</Badge>}
                {type && <Badge variant={type === 'pretest' ? 'default' : 'secondary'}>{type}</Badge>}
                {totalMarks && <Badge variant="outline">{totalMarks} marks</Badge>}
                {filename && <Badge variant="secondary">PDF</Badge>}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowContent(!showContent)}
            >
              {showContent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
            {content && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
              >
                <Download className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      {showContent && content && (
        <CardContent>
          <ScrollArea className={`w-full ${isExpanded ? 'h-96' : 'h-48'} border rounded-md p-4`}>
            <div className="whitespace-pre-wrap text-sm font-mono">
              {content}
            </div>
          </ScrollArea>
        </CardContent>
      )}
      
      {showContent && !content && (
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No content available</p>
          </div>
        </CardContent>
      )}
    </Card>
  );
};