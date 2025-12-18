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
  whatsappBody?: string;
  needsAttachmentCheck?: boolean;
  note?: string;
  subTasks?: string[];
  hideSubject?: boolean;
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
  const [subTaskState, setSubTaskState] = useState<Record<string, boolean>>({});

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: `${label} copied to clipboard.`,
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
          const isHighlighted = task.id === 'p3_prepare_docs';
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
                  {isHighlighted && (
                    <div className="text-sm mt-1 bg-accent/20 text-foreground p-2 rounded border border-accent/30">
                      Health Cert, Fumigation Cert, CI, PL, Declaration of Origin, Used Clothing & Shoes Undertakings
                    </div>
                  )}
                  {task.id === 'p3a_sgs_docs' && (
                    <div className="text-xs mt-2">
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          id={`${task.id}-attachment-confirm`}
                          checked={subTaskState[`${task.id}-attachment-confirm`] || false}
                          onCheckedChange={() => setSubTaskState(prev => ({
                            ...prev,
                            [`${task.id}-attachment-confirm`]: !prev[`${task.id}-attachment-confirm`]
                          }))}
                          className="h-4 w-4"
                        />
                        <Label 
                          htmlFor={`${task.id}-attachment-confirm`}
                          className="text-xs font-medium cursor-pointer text-muted-foreground"
                        >
                          CONFIRM ATTACHEMENT: Health Cert, Fumigation Cert, CI, PL, Declaration of Origin, Used Clothing & Shoes Undertakings
                        </Label>
                      </div>
                    </div>
                  )}
                  {task.subTasks && task.subTasks.length > 0 && (
                    <div className="text-xs mt-2 ml-0 space-y-1">
                      {task.subTasks.map((subTask, idx) => {
                        const subTaskKey = `${task.id}-subtask-${idx}`;
                        return (
                          <div key={idx} className="flex items-center gap-2">
                            <Checkbox 
                              id={subTaskKey}
                              checked={subTaskState[subTaskKey] || false}
                              onCheckedChange={() => setSubTaskState(prev => ({
                                ...prev,
                                [subTaskKey]: !prev[subTaskKey]
                              }))}
                              className="h-4 w-4"
                            />
                            <Label 
                              htmlFor={subTaskKey}
                              className="text-xs font-medium cursor-pointer text-muted-foreground"
                            >
                              {subTask}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {isMissed && <div className="text-xs text-warning font-medium">⚠ Skipped</div>}
                </div>
              </div>
            </div>

            {task.hasEmail && (
              <div className="ml-7 space-y-2 p-3 bg-muted/30 rounded-md border border-muted text-xs">
                {task.emailTo && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-muted-foreground uppercase">To:</div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-accent hover:text-accent hover:bg-accent/10"
                        onClick={() => copyToClipboard(task.emailTo || '', 'To')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="text-foreground">{task.emailTo}</div>
                  </div>
                )}
                {task.emailCC && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-muted-foreground uppercase">CC:</div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-accent hover:text-accent hover:bg-accent/10"
                        onClick={() => copyToClipboard(task.emailCC || '', 'CC')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="text-foreground">{task.emailCC}</div>
                  </div>
                )}
                {!task.hideSubject && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-muted-foreground uppercase">Subject:</div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-accent hover:text-accent hover:bg-accent/10"
                      onClick={() => copyToClipboard(task.emailSubject || '', 'Subject')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="text-foreground">{task.emailSubject}</div>
                </div>
                )}
                {task.note && (
                  <div className="text-xs text-muted-foreground italic bg-muted/20 p-2 rounded border border-muted/50">
                    {task.note}
                  </div>
                )}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-muted-foreground uppercase">Body:</div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-accent hover:text-accent hover:bg-accent/10"
                      onClick={() => copyToClipboard(task.emailBody || '', 'Body')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="text-foreground whitespace-pre-wrap">{task.emailBody}</div>
                </div>
              </div>
            )}

            {task.isWhatsApp && task.whatsappBody && (
              <div className="ml-7 space-y-2 p-3 bg-muted/30 rounded-md border border-muted text-xs">
                {task.note && (
                  <div className="text-xs text-muted-foreground italic bg-muted/20 p-2 rounded border border-muted/50">
                    {task.note}
                  </div>
                )}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-muted-foreground uppercase">Message:</div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-accent hover:text-accent hover:bg-accent/10"
                      onClick={() => copyToClipboard(task.whatsappBody || '', 'Message')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="text-foreground whitespace-pre-wrap">{task.whatsappBody}</div>
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
