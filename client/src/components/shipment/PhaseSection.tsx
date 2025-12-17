import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Copy, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Task {
  id: string;
  label: string;
  hasEmail?: boolean;
  emailSubject?: string;
  emailBody?: string;
  emailTo?: string;
  emailCC?: string;
  isWhatsApp?: boolean;
  needsAttachmentCheck?: boolean;
}

interface PhaseSectionProps {
  title: string;
  phaseId: string;
  tasks: Task[];
  checklistState: Record<string, boolean>;
  onToggle: (key: string) => void;
  progress: number;
  missedTaskIds?: string[];
}

export default function PhaseSection({ 
  title, 
  phaseId, 
  tasks, 
  checklistState, 
  onToggle,
  progress,
  missedTaskIds = []
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
      
      <div className="p-4 space-y-4">
        {tasks.map((task) => {
          const isMissed = missedTaskIds.includes(task.id);
          return (
          <div key={task.id} className={`space-y-2 ${isMissed ? 'border-l-2 border-l-warning bg-warning/5 pl-3 py-2 rounded' : ''}`}>
            <div className={`flex items-start justify-between group p-2 rounded-md hover:bg-muted/50 transition-colors ${isMissed ? 'border-l-4 border-l-warning/50 pl-1' : ''}`}>
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
                      checklistState[task.id] ? 'text-muted-foreground line-through decoration-muted-foreground/50' : isMissed ? 'text-warning font-semibold' : ''
                    }`}
                  >
                    {task.label}
                  </Label>
                  {isMissed && <div className="text-xs text-warning font-medium">⚠ Skipped</div>}
                  {task.needsAttachmentCheck && (
                    <div className="flex items-center gap-2 pt-1">
                      <Checkbox 
                        id={`attachmentCheck_${task.id}`}
                        checked={checklistState[`attachmentCheck_${task.id}`] || false}
                        onCheckedChange={() => onToggle(`attachmentCheck_${task.id}`)}
                        className="h-4 w-4"
                      />
                      <Label 
                        htmlFor={`attachmentCheck_${task.id}`}
                        className="text-xs text-info font-medium cursor-pointer leading-none"
                      >
                        ✓ Attachments verified before sending (Check: RFC, declaration, IDF & Commercial Invoice)
                      </Label>
                    </div>
                  )}
                </div>
              </div>
              
              {task.hasEmail && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 text-xs text-accent hover:text-accent hover:bg-accent/10"
                  onClick={() => copyToClipboard(task.emailSubject || '', task.emailBody || '')}
                >
                  <Copy className="h-3 w-3 mr-1" /> Copy
                </Button>
              )}
            </div>

            {task.hasEmail && (
              <div className="ml-7 space-y-2 p-3 bg-muted/30 rounded-md border border-muted text-xs">
                {task.emailTo && (
                  <div className="space-y-1">
                    <div className="font-bold text-muted-foreground uppercase">To:</div>
                    <div className="text-foreground">{task.emailTo}</div>
                  </div>
                )}
                {task.emailCC && (
                  <div className="space-y-1">
                    <div className="font-bold text-muted-foreground uppercase">CC:</div>
                    <div className="text-foreground">{task.emailCC}</div>
                  </div>
                )}
                <div className="space-y-1">
                  <div className="font-bold text-muted-foreground uppercase">Subject:</div>
                  <div className="text-foreground">{task.emailSubject}</div>
                </div>
                <div className="space-y-1">
                  <div className="font-bold text-muted-foreground uppercase">Body:</div>
                  <div className="text-foreground whitespace-pre-wrap">{task.emailBody}</div>
                </div>
              </div>
            )}
          </div>
        );
        })}
      </div>
    </div>
  );
}
