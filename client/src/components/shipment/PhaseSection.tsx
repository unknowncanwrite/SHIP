import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Copy, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Task {
  id: string;
  label: string;
  hasEmail?: boolean;
  emailSubject?: string;
  emailBody?: string;
}

interface PhaseSectionProps {
  title: string;
  phaseId: string;
  tasks: Task[];
  checklistState: Record<string, boolean>;
  onToggle: (key: string) => void;
  progress: number;
}

export default function PhaseSection({ 
  title, 
  phaseId, 
  tasks, 
  checklistState, 
  onToggle,
  progress 
}: PhaseSectionProps) {
  const { toast } = useToast();

  const copyToClipboard = (subject: string, body: string) => {
    const text = `Subject: ${subject}\n\n${body}`;
    navigator.clipboard.writeText(text);
    toast({
      title: "Email Copied",
      description: "Subject and body copied to clipboard.",
    });
  };

  return (
    <div className="mb-6 border rounded-lg overflow-hidden bg-card shadow-sm">
      <div className="bg-muted/30 px-4 py-3 border-b flex justify-between items-center">
        <h3 className="font-semibold text-lg text-primary">{title}</h3>
        <div className="flex items-center gap-2">
          <div className="text-xs font-medium text-muted-foreground">{Math.round(progress)}%</div>
          <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-accent transition-all duration-500" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
      
      <div className="p-4 space-y-3">
        {tasks.map((task) => (
          <div key={task.id} className="flex items-start justify-between group p-2 rounded-md hover:bg-muted/50 transition-colors">
            <div className="flex items-start space-x-3 pt-1">
              <Checkbox 
                id={task.id} 
                checked={checklistState[task.id] || false}
                onCheckedChange={() => onToggle(task.id)}
                className="mt-1"
              />
              <div className="space-y-1">
                <Label 
                  htmlFor={task.id}
                  className={`text-sm font-medium leading-none cursor-pointer ${
                    checklistState[task.id] ? 'text-muted-foreground line-through decoration-muted-foreground/50' : ''
                  }`}
                >
                  {task.label}
                </Label>
              </div>
            </div>
            
            {task.hasEmail && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 text-xs text-accent hover:text-accent hover:bg-accent/10 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => copyToClipboard(task.emailSubject || '', task.emailBody || '')}
              >
                <Copy className="h-3 w-3 mr-1" /> Copy Email
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
