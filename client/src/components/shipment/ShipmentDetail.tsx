import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useShipment, useUpdateShipment, useDeleteShipment } from '@/hooks/useShipments';
import { useQuery } from '@tanstack/react-query';
import { ShipmentHistory } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ArrowLeft, Save, Trash2, Printer, Moon, Sun, Clock, 
  AlertCircle, Plus, X, Download, Loader2, Check, History 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PhaseSection from './PhaseSection';
import DonutProgress from './DonutProgress';
import { useTheme } from 'next-themes';
import { printDeclaration, printUndertaking, printShoesUndertaking } from '@/lib/PrintTemplates';
import { format } from 'date-fns';
import { calculateProgress, calculatePhaseProgress, getIncompleteTasks } from '@/lib/shipment-utils';
import { PHASE_1_TASKS, PHASE_2_TASKS, PHASE_3_TASKS, PHASE_5_TASKS, getForwarderTasks, getFumigationTasks, TaskDefinition } from '@/lib/shipment-definitions';
import { ShipmentData } from '@/types/shipment';
import type { Shipment } from '@shared/schema';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

// Debounce hook for text input
const useDebouncedSave = (value: string, delay: number, onSave: (val: string) => void) => {
  const onSaveRef = useRef(onSave);
  useEffect(() => { onSaveRef.current = onSave; }, [onSave]);
  useEffect(() => {
    if (!value) return;
    const timer = setTimeout(() => { onSaveRef.current(value); }, delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
};

function ShipmentDetailContent({ currentShipment: inputShipment }: { currentShipment: Shipment }) {
  const currentShipment = { ...inputShipment, documents: inputShipment.documents || [] };
  const [_, setLocation] = useLocation();
  const updateShipment = useUpdateShipment();
  const deleteShipmentMutation = useDeleteShipment();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [newLogisticsTaskInput, setNewLogisticsTaskInput] = useState('');
  const [newDocName, setNewDocName] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const isSaving = updateShipment.isPending;
  const { data: history = [] } = useQuery<ShipmentHistory[]>({
    queryKey: [`/api/shipments/${currentShipment.id}/history`],
    enabled: !!currentShipment.id,
  });

  const [details, setDetails] = useState(currentShipment.details);
  const [commercial, setCommercial] = useState(currentShipment.commercial);
  const [actual, setActual] = useState(currentShipment.actual);
  const [manualFumigationName, setManualFumigationName] = useState(currentShipment.manualFumigationName);
  const [manualForwarderName, setManualForwarderName] = useState(currentShipment.manualForwarderName);
  
  useEffect(() => {
    setDetails(currentShipment.details);
    setCommercial(currentShipment.commercial);
    setActual(currentShipment.actual);
    setManualFumigationName(currentShipment.manualFumigationName);
    setManualForwarderName(currentShipment.manualForwarderName);
  }, [currentShipment.id]);
  
  const saveFn = useCallback((section: string, data: any) => {
    if (JSON.stringify(data) !== JSON.stringify((currentShipment as any)[section])) {
      updateShipment.mutate({ id: currentShipment.id, data: { [section]: data } });
    }
  }, [currentShipment, updateShipment]);
  
  useDebouncedSave(JSON.stringify(details), 800, (val) => saveFn('details', JSON.parse(val)));
  useDebouncedSave(JSON.stringify(commercial), 800, (val) => saveFn('commercial', JSON.parse(val)));
  useDebouncedSave(JSON.stringify(actual), 800, (val) => saveFn('actual', JSON.parse(val)));
  
  useDebouncedSave(manualFumigationName || '', 800, (val) => {
    if (val !== currentShipment.manualFumigationName) {
      updateShipment.mutate({ id: currentShipment.id, data: { manualFumigationName: val } });
    }
  });
  
  useDebouncedSave(manualForwarderName || '', 800, (val) => {
    if (val !== currentShipment.manualForwarderName) {
      updateShipment.mutate({ id: currentShipment.id, data: { manualForwarderName: val } });
    }
  });
  
  const handleDetailChange = (field: string, value: any) => { setDetails(prev => ({ ...prev, [field]: value })); };
  const handleCommercialChange = (field: string, value: any) => { setCommercial(prev => ({ ...prev, [field]: value })); };
  const handleActualChange = (field: string, value: any) => { setActual(prev => ({ ...prev, [field]: value })); };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this shipment?')) {
      deleteShipmentMutation.mutate(currentShipment.id, { onSuccess: () => { setLocation('/'); toast({ title: 'Shipment Deleted', variant: 'destructive' }); } });
    }
  };

  const handlePrint = (type: 'declaration' | 'undertaking' | 'shoes') => {
    let content = '';
    if (type === 'declaration') content = printDeclaration(currentShipment as any);
    else if (type === 'undertaking') content = printUndertaking(currentShipment as any);
    else if (type === 'shoes') content = printShoesUndertaking(currentShipment as any);
    const win = window.open('', '_blank');
    if (win) { win.document.write(content); win.document.close(); }
  };

  const handleAddLogisticsTask = () => {
    if (newLogisticsTaskInput.trim()) {
      const newTask = { id: `log-${Math.random().toString(36).substr(2, 9)}`, text: newLogisticsTaskInput.trim(), completed: false };
      updateShipment.mutate({ id: currentShipment.id, data: { logisticsTasks: [...(currentShipment.logisticsTasks || []), newTask] } });
      setNewLogisticsTaskInput('');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== 'application/pdf') { toast({ title: "Invalid File", description: "Please upload a PDF file only.", variant: "destructive" }); return; }
    setUploadProgress(0); setUploadError(null);
    const reader = new FileReader();
    reader.onprogress = (event) => { if (event.lengthComputable) setUploadProgress(Math.round((event.loaded / event.total) * 100)); };
    reader.onload = (event) => {
      try {
        const base64Content = (event.target?.result as string).replace(/^data:application\/pdf;base64,/, '');
        const docName = newDocName.trim() || file.name.replace('.pdf', '');
        const newDocument = { id: Math.random().toString(36).substr(2, 9), name: docName, file: base64Content, createdAt: Date.now() };
        updateShipment.mutate({ id: currentShipment.id, data: { documents: [...currentShipment.documents, newDocument] } });
        setNewDocName(''); (e.target as HTMLInputElement).value = ''; setUploadProgress(100);
        setTimeout(() => { setUploadProgress(null); toast({ title: "Document Uploaded", description: `${docName} has been added.` }); }, 300);
      } catch (error) { setUploadError('Error uploading file'); setUploadProgress(null); }
    };
    reader.readAsDataURL(file);
  };

  const toggleChecklist = (id: string, key: string) => {
    const newChecklist = { ...(currentShipment.checklist || {}), [key]: !(currentShipment.checklist || {})[key] };
    updateShipment.mutate({ id, data: { checklist: newChecklist } });
  };

  const deleteDocument = (id: string, documentId: string) => {
    updateShipment.mutate({ id, data: { documents: currentShipment.documents.filter(d => d.id !== documentId) } });
  };

  const toggleLogisticsTask = (id: string, taskId: string) => {
    const newLogisticsTasks = (currentShipment.logisticsTasks || []).map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
    updateShipment.mutate({ id: currentShipment.id, data: { logisticsTasks: newLogisticsTasks } });
  };

  const deleteLogisticsTask = (id: string, taskId: string) => {
    const newLogisticsTasks = (currentShipment.logisticsTasks || []).filter(t => t.id !== taskId);
    updateShipment.mutate({ id: currentShipment.id, data: { logisticsTasks: newLogisticsTasks } });
  };

  const countdown = useMemo(() => {
    if (!currentShipment.details.inspectionDate) return { text: 'Set Inspection Date', color: 'text-muted-foreground', bg: 'bg-muted', icon: Clock };
    const target = new Date(currentShipment.details.inspectionDate);
    const today = new Date(); today.setHours(0,0,0,0); target.setHours(0,0,0,0);
    const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { text: 'Passed', color: 'text-muted-foreground', bg: 'bg-muted', icon: Clock };
    if (diffDays === 0) return { text: 'Inspection Today!', color: 'text-destructive', bg: 'bg-destructive/10', icon: AlertCircle };
    return { text: `${diffDays} Days Remaining`, color: diffDays <= 5 ? 'text-warning' : 'text-primary', bg: diffDays <= 5 ? 'bg-warning/10' : 'bg-primary/10', icon: Clock };
  }, [currentShipment.details.inspectionDate]);

  const progress = calculateProgress(currentShipment as any);
  const incompleteTasks = useMemo(() => getIncompleteTasks(currentShipment as any), [currentShipment]);

  const phase1Mapped = useMemo(() => mapTasks(PHASE_1_TASKS, currentShipment as any), [currentShipment]);
  const phase2Mapped = useMemo(() => mapTasks(PHASE_2_TASKS, currentShipment as any), [currentShipment]);
  const phase3Mapped = useMemo(() => mapTasks(PHASE_3_TASKS, currentShipment as any), [currentShipment]);
  const forwarderMapped = useMemo(() => mapTasks(getForwarderTasks(currentShipment as any), currentShipment as any), [currentShipment]);
  const fumigationMapped = useMemo(() => mapTasks(getFumigationTasks(currentShipment as any), currentShipment as any), [currentShipment]);
  const phase5Mapped = useMemo(() => mapTasks(PHASE_5_TASKS, currentShipment as any), [currentShipment]);

  function mapTasks(tasks: TaskDefinition[], data: ShipmentData) {
    return tasks.map(t => ({
      ...t,
      emailSubject: typeof t.emailSubject === 'function' ? t.emailSubject(data) : t.emailSubject,
      emailBody: typeof t.emailBody === 'function' ? t.emailBody(data) : t.emailBody,
      emailTo: typeof t.emailTo === 'function' ? t.emailTo(data) : t.emailTo,
      emailCC: typeof t.emailCC === 'function' ? t.emailCC(data) : t.emailCC,
      whatsappBody: typeof t.whatsappBody === 'function' ? t.whatsappBody(data) : t.whatsappBody,
    }));
  }

  const getForwarderDisplayName = () => currentShipment.forwarder === 'xpo' ? 'XPO Logistics' : currentShipment.forwarder === 'hmi' ? 'HMI Logistics' : currentShipment.manualForwarderName || 'Forwarder';
  const getFumigationDisplayName = () => currentShipment.fumigation === 'sky-services' ? 'Sky Services' : currentShipment.fumigation === 'sgs' ? 'SGS' : currentShipment.manualFumigationName || 'Fumigation';

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur px-4 h-16 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation('/')}><ArrowLeft className="h-5 w-5" /></Button>
          <h1 className="text-lg font-bold flex items-center gap-2">{currentShipment.id} <Badge variant={progress === 100 ? 'default' : 'secondary'}>{progress === 100 ? 'Completed' : 'In Progress'}</Badge></h1>
        </div>
        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <div className="flex justify-between text-xs mb-1 text-muted-foreground"><span>Overall Progress</span><span>{progress}%</span></div>
          <Progress value={progress} className="h-2" />
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs font-medium text-muted-foreground mr-2">{isSaving ? <span className="animate-pulse text-accent">Saving...</span> : <span className="text-success flex items-center gap-1"><Save className="h-3 w-3" /> Saved</span>}</div>
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</Button>
          <Sheet><SheetTrigger asChild><Button variant="ghost" size="icon"><History className="h-4 w-4" /></Button></SheetTrigger><SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto"><SheetHeader><SheetTitle>Shipment History</SheetTitle><SheetDescription>Audit log for {currentShipment.id}</SheetDescription></SheetHeader><div className="mt-6 space-y-6">{history.map((entry) => (<div key={entry.id} className="relative pl-6 pb-6 border-l last:pb-0"><div className="absolute left-[-5px] top-1 w-2 h-2 rounded-full bg-primary" /><div className="flex flex-col gap-1"><div className="flex items-center justify-between"><span className="font-semibold text-sm">{entry.action}</span><span className="text-xs text-muted-foreground">{format(new Date(entry.timestamp), 'MMM d, h:mm a')}</span></div><div className="text-xs bg-muted/50 p-2 rounded mt-1 overflow-x-auto"><pre className="whitespace-pre-wrap font-sans">{JSON.stringify(entry.changes, null, 2)}</pre></div></div></div>))}{history.length === 0 && <div className="text-center text-muted-foreground py-10">No history recorded yet</div>}</div></SheetContent></Sheet>
          <Button variant="destructive" size="icon" onClick={handleDelete}><Trash2 className="h-4 w-4" /></Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-5xl space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Left Column (Widgets) */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-card p-6 rounded-lg border shadow-sm flex flex-col items-center justify-center"><DonutProgress percentage={progress} missedCount={incompleteTasks.length} /></div>
            <div className={`p-6 rounded-lg border shadow-sm flex flex-col items-center justify-center gap-2 ${countdown.bg}`}><countdown.icon className={`h-8 w-8 ${countdown.color}`} /><span className={`text-lg font-bold ${countdown.color}`}>{countdown.text}</span></div>
            <div className="bg-card p-4 rounded-lg border shadow-sm space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Quick Contacts</h3>
              <div className="space-y-2 text-xs">
                <div className="p-2 bg-muted/20 rounded-md border"><div>Fumigation</div><div className="text-muted-foreground">HASSAN SKY FUMIGATION</div><div className="text-accent font-mono">03332990665</div></div>
                <div className="p-2 bg-muted/20 rounded-md border"><div>SGS</div><div className="text-accent font-mono">Fazila.Shaikh@sgs.com</div></div>
                <div className="p-2 bg-muted/20 rounded-md border"><div>Forwarder</div><div className="text-accent font-mono">docs@xml.com.pk</div></div>
              </div>
            </div>
          </div>

          {/* Center Column (Details) */}
          <div className="md:col-span-3 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-card p-6 rounded-lg border border-l-4 border-l-primary shadow-sm">
              <h2 className="col-span-full text-lg font-bold text-primary mb-2">Shipment Details</h2>
              <div className="space-y-2"><Label>Customer</Label><Input value={details.customer} onChange={(e) => handleDetailChange('customer', e.target.value)} /></div>
              <div className="space-y-2"><Label>Consignee</Label><Input value={details.consignee} onChange={(e) => handleDetailChange('consignee', e.target.value)} /></div>
              <div className="space-y-2"><Label>Location</Label><Input value={details.location} onChange={(e) => handleDetailChange('location', e.target.value)} /></div>
              <div className="space-y-2"><Label>Shipping Line</Label><Input value={details.shippingLine} onChange={(e) => handleDetailChange('shippingLine', e.target.value)} /></div>
              <div className="space-y-2"><Label>Brand</Label><Input value={details.brand} onChange={(e) => handleDetailChange('brand', e.target.value)} /></div>
              <div className="space-y-2"><Label>Loading Date</Label><Input type="date" value={details.loadingDate} onChange={(e) => handleDetailChange('loadingDate', e.target.value)} /></div>
              <div className="space-y-2"><Label>ETA</Label><Input type="date" value={details.eta} onChange={(e) => handleDetailChange('eta', e.target.value)} /></div>
              <div className="space-y-2"><Label>Container</Label><Input value={details.container} onChange={(e) => handleDetailChange('container', e.target.value)} /></div>
              <div className="space-y-2"><Label>Booking</Label><Input value={details.booking} onChange={(e) => handleDetailChange('booking', e.target.value)} /></div>
            </div>

            <div className="space-y-6">
              {currentShipment.shipmentType === 'with-inspection' && (
                <>
                  <PhaseSection title="Phase 1: Pre-Inspection" phaseId="p1" tasks={phase1Mapped} checklistState={currentShipment.checklist} onToggle={(key) => toggleChecklist(currentShipment.id, key)} progress={calculatePhaseProgress(currentShipment as any, phase1Mapped)} missedTaskIds={incompleteTasks.map(t => t.id)} />
                  <PhaseSection title={`Phase 2: Fumigation (${getFumigationDisplayName()})`} phaseId="p2" tasks={fumigationMapped} checklistState={currentShipment.checklist} onToggle={(key) => toggleChecklist(currentShipment.id, key)} progress={calculatePhaseProgress(currentShipment as any, fumigationMapped)} missedTaskIds={incompleteTasks.map(t => t.id)} />
                  <PhaseSection title="Phase 3: COC Finalization" phaseId="p3" tasks={phase3Mapped} checklistState={currentShipment.checklist} onToggle={(key) => toggleChecklist(currentShipment.id, key)} progress={calculatePhaseProgress(currentShipment as any, phase3Mapped)} missedTaskIds={incompleteTasks.map(t => t.id)} />
                </>
              )}
              <PhaseSection title={`Phase 4: Forwarding (${getForwarderDisplayName()})`} phaseId="p4" tasks={forwarderMapped} checklistState={currentShipment.checklist} onToggle={(key) => toggleChecklist(currentShipment.id, key)} progress={calculatePhaseProgress(currentShipment as any, forwarderMapped)} missedTaskIds={incompleteTasks.map(t => t.id)} />
              <PhaseSection title="Phase 5: Final Delivery" phaseId="p5" tasks={phase5Mapped} checklistState={currentShipment.checklist} onToggle={(key) => toggleChecklist(currentShipment.id, key)} progress={calculatePhaseProgress(currentShipment as any, phase5Mapped)} missedTaskIds={incompleteTasks.map(t => t.id)} />
            </div>
          </div>

          {/* Right Column (Logistics/Custom Checklist) */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-card p-4 rounded-lg border shadow-sm">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-4">Custom Checklist</h3>
              <div className="space-y-3">
                {(currentShipment.logisticsTasks || []).map((task) => (
                  <div key={task.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-2">
                      <Checkbox id={task.id} checked={task.completed} onCheckedChange={() => toggleLogisticsTask(currentShipment.id, task.id)} />
                      <label htmlFor={task.id} className={`text-sm cursor-pointer ${task.completed ? 'line-through text-muted-foreground' : ''}`}>{task.text}</label>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => deleteLogisticsTask(currentShipment.id, task.id)}><X className="h-3 w-3" /></Button>
                  </div>
                ))}
                <div className="flex gap-2 mt-4">
                  <Input placeholder="Add task..." value={newLogisticsTaskInput} onChange={(e) => setNewLogisticsTaskInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddLogisticsTask()} className="h-8 text-xs" />
                  <Button size="icon" className="h-8 w-8 shrink-0" onClick={handleAddLogisticsTask}><Plus className="h-4 w-4" /></Button>
                </div>
              </div>
            </div>

            <div className="bg-card p-4 rounded-lg border shadow-sm space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Documents</h3>
              <div className="space-y-2">
                {currentShipment.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-2 bg-muted/30 rounded border">
                    <span className="text-xs truncate max-w-[100px]">{doc.name}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteDocument(currentShipment.id, doc.id)}><X className="h-3 w-3" /></Button>
                  </div>
                ))}
                <div className="space-y-2 mt-2">
                  <Input placeholder="Doc Name" value={newDocName} onChange={(e) => setNewDocName(e.target.value)} className="h-8 text-xs" />
                  <Input type="file" accept=".pdf" onChange={handleFileUpload} className="h-8 text-xs cursor-pointer" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ShipmentDetail() {
  const [match, params] = useRoute('/shipment/:id');
  const { data: currentShipment, isLoading } = useShipment(params?.id || '');
  if (isLoading) return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin" /></div>;
  if (!currentShipment) return <div>Shipment not found</div>;
  return <ShipmentDetailContent currentShipment={currentShipment} />;
}
