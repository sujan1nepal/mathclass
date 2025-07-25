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
  // Show content by default for lessons, hidden by default for tests
  const [showContent, setShowContent] = useState(!type || type === 'lesson');

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

  const formatContent = (text: string) => {
    if (!text) return [];
    
    // Split by lines and process each line
    const lines = text.split('\n');
    const formatted = [];
    let currentSection = '';
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip empty lines
      if (!trimmedLine) {
        if (currentSection) {
          formatted.push({ type: 'paragraph', content: currentSection });
          currentSection = '';
        }
        continue;
      }
      
      // Check for headers (lines with specific patterns)
      if (trimmedLine.match(/^[A-Z][A-Z\s]+[A-Z]$/) && trimmedLine.length < 50) {
        if (currentSection) {
          formatted.push({ type: 'paragraph', content: currentSection });
          currentSection = '';
        }
        formatted.push({ type: 'header', content: trimmedLine });
      }
      // Check for lesson plan sections (common headings)
      else if (trimmedLine.match(/^(OBJECTIVES?|MATERIALS?|ACTIVITIES?|ASSESSMENT|INTRODUCTION|CONCLUSION|HOMEWORK|RESOURCES?):?$/i)) {
        if (currentSection) {
          formatted.push({ type: 'paragraph', content: currentSection });
          currentSection = '';
        }
        formatted.push({ type: 'section-header', content: trimmedLine });
      }
      // Check for numbered questions
      else if (trimmedLine.match(/^\d+[\.\)]/)) {
        if (currentSection) {
          formatted.push({ type: 'paragraph', content: currentSection });
          currentSection = '';
        }
        formatted.push({ type: 'question', content: trimmedLine });
      }
      // Check for lettered options
      else if (trimmedLine.match(/^[a-d][\.\)]/i)) {
        if (currentSection) {
          formatted.push({ type: 'paragraph', content: currentSection });
          currentSection = '';
        }
        formatted.push({ type: 'option', content: trimmedLine });
      }
      // Check for bullets or dashes
      else if (trimmedLine.match(/^[-•*]/)) {
        if (currentSection) {
          formatted.push({ type: 'paragraph', content: currentSection });
          currentSection = '';
        }
        formatted.push({ type: 'bullet', content: trimmedLine });
      }
      // Check for time indicators (for lesson plans)
      else if (trimmedLine.match(/^\d+\s*(min|minutes?|hour?s?)\s*[-:]/i)) {
        if (currentSection) {
          formatted.push({ type: 'paragraph', content: currentSection });
          currentSection = '';
        }
        formatted.push({ type: 'time-block', content: trimmedLine });
      }
      // Regular content
      else {
        if (currentSection) {
          currentSection += ' ' + trimmedLine;
        } else {
          currentSection = trimmedLine;
        }
      }
    }
    
    // Add any remaining content
    if (currentSection) {
      formatted.push({ type: 'paragraph', content: currentSection });
    }
    
    return formatted;
  };

  const renderFormattedContent = (formattedContent: Array<{ type: string; content: string }>) => {
    return formattedContent.map((item, index) => {
      switch (item.type) {
        case 'header':
          return (
            <h2 key={index} className="text-xl font-bold text-primary mb-4 mt-8 first:mt-0 border-b-2 border-primary pb-2">
              {item.content}
            </h2>
          );
        case 'section-header':
          return (
            <h3 key={index} className="text-lg font-bold text-secondary mb-3 mt-6 first:mt-0 bg-secondary/10 p-3 rounded-lg border-l-4 border-secondary">
              {item.content}
            </h3>
          );
        case 'question':
          return (
            <div key={index} className="bg-primary/5 p-4 rounded-lg mb-4 border-l-4 border-primary">
              <p className="font-semibold text-foreground">{item.content}</p>
            </div>
          );
        case 'option':
          return (
            <div key={index} className="ml-6 mb-2 flex items-start">
              <span className="inline-block w-8 h-8 bg-secondary/20 rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5 flex-shrink-0">
                {item.content.charAt(0).toUpperCase()}
              </span>
              <p className="text-foreground leading-relaxed">{item.content.substring(2).trim()}</p>
            </div>
          );
        case 'bullet':
          return (
            <div key={index} className="ml-4 mb-2 flex items-start">
              <span className="text-primary mr-3 mt-1">•</span>
              <p className="text-foreground leading-relaxed">{item.content.substring(1).trim()}</p>
            </div>
          );
        case 'time-block':
          return (
            <div key={index} className="bg-accent/10 p-3 rounded-lg mb-3 border-l-4 border-accent">
              <p className="font-medium text-accent flex items-center">
                <span className="text-sm bg-accent/20 px-2 py-1 rounded mr-3">
                  ⏱️ {item.content.match(/^\d+\s*(min|minutes?|hour?s?)/i)?.[0] || 'Time'}
                </span>
                {item.content.replace(/^\d+\s*(min|minutes?|hour?s?)\s*[-:]?\s*/i, '')}
              </p>
            </div>
          );
        case 'paragraph':
          return (
            <p key={index} className="text-foreground leading-relaxed mb-4 text-justify">
              {item.content}
            </p>
          );
        default:
          return (
            <p key={index} className="text-foreground leading-relaxed mb-4">
              {item.content}
            </p>
          );
      }
    });
  };

  return (
    <Card className={`border border-border transition-all duration-200 shadow-md hover:shadow-lg ${isExpanded ? 'col-span-full' : ''}`}>
      <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">{title}</CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                {grade && <Badge variant="outline" className="text-xs">{grade}</Badge>}
                {type && <Badge variant={type === 'pretest' ? 'default' : type === 'posttest' ? 'secondary' : 'outline'} className="text-xs">{type}</Badge>}
                {totalMarks && <Badge variant="outline" className="text-xs">{totalMarks} marks</Badge>}
                {filename && <Badge variant="secondary" className="text-xs">PDF</Badge>}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowContent(!showContent)}
              className="hover:bg-primary/10"
            >
              {showContent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span className="ml-2 hidden sm:inline">{showContent ? 'Hide' : 'Show'}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="hover:bg-secondary/10"
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
            {content && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="hover:bg-accent/10"
              >
                <Download className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      {showContent && content && (
        <CardContent className="p-6">
          <ScrollArea className={`w-full ${isExpanded ? 'h-[600px]' : 'h-96'} border rounded-lg p-6 bg-background`}>
            <div className="prose prose-sm max-w-none">
              {renderFormattedContent(formatContent(content))}
            </div>
          </ScrollArea>
        </CardContent>
      )}
      
      {showContent && !content && (
        <CardContent className="p-6">
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No content available</p>
            <p className="text-sm">The PDF content could not be extracted or is empty</p>
          </div>
        </CardContent>
      )}
    </Card>
  );
};