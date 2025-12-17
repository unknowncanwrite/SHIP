import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useShipmentStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Save, Trash2, Printer, Moon, Sun, Clock, AlertCircle, Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PhaseSection from './PhaseSection';
import DonutProgress from './DonutProgress';
import { useTheme } from 'next-themes';
import { printDeclaration, printUndertaking, printShoesUndertaking } from '@/lib/PrintTemplates';
import { format } from 'date-fns';
import { calculateProgress, calculatePhaseProgress, getIncompleteTasks } from '@/lib/shipment-utils';
import { PHASE_1_TASKS, PHASE_2_TASKS, PHASE_3_TASKS, getForwarderTasks, getFumigationTasks, TaskDefinition } from '@/lib/shipment-definitions';
import { ShipmentData } from '@/types/shipment';

// Debounce hook for text input - fixed to prevent hook dependency issues
const useDebouncedSave = (value: string, delay: number, onSave: (val: string) => void) => {
  const onSaveRef = useRef(onSave);
  
  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);
  
  useEffect(() => {
    if (!value) return;
    const timer = setTimeout(() => {
      onSaveRef.current(value);
    }, delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
};

// Sub-component that safely receives non-null shipment data
function ShipmentDetailContent({ currentShipment }: { currentShipment: ShipmentData }) {
  const [_, setLocation] = useLocation();
  const { updateShipment, deleteShipment, toggleChecklist, isSaving, addCustomTask, deleteCustomTask, toggleCustomTask } = useShipmentStore();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [newTaskInput, setNewTaskInput] = useState('');
  
  // Local states for all text input fields (prevents re-render during typing)
  const [details, setDetails] = useState(currentShipment.details);
  const [commercial, setCommercial] = useState(currentShipment.commercial);
  const [actual, setActual] = useState(currentShipment.actual);
  const [manualFumigationName, setManualFumigationName] = useState(currentShipment.manualFumigationName);
  const [manualForwarderName, setManualForwarderName] = useState(currentShipment.manualForwarderName);
  
  // Sync when shipment changes (on load or when switching shipments)
  useEffect(() => {
    setDetails(currentShipment.details);
    setCommercial(currentShipment.commercial);
    setActual(currentShipment.actual);
    setManualFumigationName(currentShipment.manualFumigationName);
    setManualForwarderName(currentShipment.manualForwarderName);
  }, [currentShipment.id]);
  
  // Debounced saves for all sections
  const saveFn = useCallback((section: string, data: any) => {
    if (section === 'details' && JSON.stringify(data) !== JSON.stringify(currentShipment.details)) {
      updateShipment(currentShipment.id, { details: data });
    } else if (section === 'commercial' && JSON.stringify(data) !== JSON.stringify(currentShipment.commercial)) {
      updateShipment(currentShipment.id, { commercial: data });
    } else if (section === 'actual' && JSON.stringify(data) !== JSON.stringify(currentShipment.actual)) {
      updateShipment(currentShipment.id, { actual: data });
    }
  }, [currentShipment, updateShipment]);
  
  useDebouncedSave(JSON.stringify(details), 800, (val) => saveFn('details', JSON.parse(val)));
  useDebouncedSave(JSON.stringify(commercial), 800, (val) => saveFn('commercial', JSON.parse(val)));
  useDebouncedSave(JSON.stringify(actual), 800, (val) => saveFn('actual', JSON.parse(val)));
  
  useDebouncedSave(manualFumigationName, 800, (val) => {
    if (val !== currentShipment.manualFumigationName) {
      updateShipment(currentShipment.id, { manualFumigationName: val });
    }
  });
  
  useDebouncedSave(manualForwarderName, 800, (val) => {
    if (val !== currentShipment.manualForwarderName) {
      updateShipment(currentShipment.id, { manualForwarderName: val });
    }
  });
  
  const handleDetailChange = (field: string, value: any) => {
    setDetails(prev => ({ ...prev, [field]: value }));
  };
  
  const handleCommercialChange = (field: string, value: any) => {
    setCommercial(prev => ({ ...prev, [field]: value }));
  };
  
  const handleActualChange = (field: string, value: any) => {
    setActual(prev => ({ ...prev, [field]: value }));
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this shipment?')) {
      deleteShipment(currentShipment.id);
      setLocation('/');
      toast({ title: 'Shipment Deleted', variant: 'destructive' });
    }
  };

  const handlePrint = (type: 'declaration' | 'undertaking' | 'shoes') => {
    let content = '';
    if (type === 'declaration') content = printDeclaration(currentShipment);
    else if (type === 'undertaking') content = printUndertaking(currentShipment);
    else if (type === 'shoes') content = printShoesUndertaking(currentShipment);

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(content);
      win.document.close();
    }
  };

  const handleAddCustomTask = () => {
    if (newTaskInput.trim()) {
      addCustomTask(currentShipment.id, newTaskInput.trim());
      setNewTaskInput('');
    }
  };

  // Countdown Logic
  const countdown = useMemo(() => {
    if (!currentShipment.details.inspectionDate) {
      return { text: 'Set Inspection Date', color: 'text-muted-foreground', bg: 'bg-muted', icon: Clock };
    }
    const target = new Date(currentShipment.details.inspectionDate);
    const today = new Date();
    today.setHours(0,0,0,0);
    target.setHours(0,0,0,0);
    
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: 'Passed', color: 'text-muted-foreground', bg: 'bg-muted', icon: Clock };
    if (diffDays === 0) return { text: 'Inspection Today!', color: 'text-destructive', bg: 'bg-destructive/10', icon: AlertCircle };
    if (diffDays <= 5) return { text: `${diffDays} Days Remaining`, color: 'text-warning', bg: 'bg-warning/10', icon: Clock };
    return { text: `${diffDays} Days Remaining`, color: 'text-primary', bg: 'bg-primary/10', icon: Clock };
  }, [currentShipment.details.inspectionDate]);

  const progress = calculateProgress(currentShipment);
  const incompleteTasks = useMemo(() => getIncompleteTasks(currentShipment), [currentShipment]);

  const getPhaseForTask = (taskId: string): string => {
    // Check which phase the task belongs to
    if (phase1Mapped.some(t => t.id === taskId)) return 'phase-1';
    if (fumigationMapped.some(t => t.id === taskId)) return 'phase-2';
    if (phase3Mapped.some(t => t.id === taskId)) return 'phase-3';
    if (forwarderMapped.some(t => t.id === taskId)) return 'phase-4';
    return 'phases-section';
  };

  const handleScrollToMissed = (taskId?: string) => {
    const targetPhase = taskId ? getPhaseForTask(taskId) : 'phases-section';
    const phasesSection = document.getElementById(targetPhase);
    if (phasesSection) {
      phasesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Helper to map tasks with dynamic email content
  const mapTasks = (tasks: TaskDefinition[], data: ShipmentData) => {
    return tasks.map(t => ({
      ...t,
      emailSubject: typeof t.emailSubject === 'function' ? t.emailSubject(data) : t.emailSubject,
      emailBody: typeof t.emailBody === 'function' ? t.emailBody(data) : t.emailBody,
      emailTo: typeof t.emailTo === 'function' ? t.emailTo(data) : t.emailTo,
      emailCC: typeof t.emailCC === 'function' ? t.emailCC(data) : t.emailCC,
    }));
  };

  const phase1Mapped = useMemo(() => mapTasks(PHASE_1_TASKS, currentShipment), [currentShipment]);
  const phase2Mapped = useMemo(() => mapTasks(PHASE_2_TASKS, currentShipment), [currentShipment]);
  const phase3Mapped = useMemo(() => mapTasks(PHASE_3_TASKS, currentShipment), [currentShipment]);
  const forwarderMapped = useMemo(() => mapTasks(getForwarderTasks(currentShipment), currentShipment), [currentShipment]);
  const fumigationMapped = useMemo(() => mapTasks(getFumigationTasks(currentShipment), currentShipment), [currentShipment]);

  const getForwarderDisplayName = () => {
    if (currentShipment.forwarder === 'xpo') return 'XPO Logistics';
    if (currentShipment.forwarder === 'hmi') return 'HMI Logistics';
    return currentShipment.manualForwarderName || 'Forwarder';
  };

  const getFumigationDisplayName = () => {
    if (currentShipment.fumigation === 'sky-services') return 'Sky Services';
    if (currentShipment.fumigation === 'sgs') return 'SGS';
    return currentShipment.manualFumigationName || 'Fumigation';
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur px-4 h-16 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold flex items-center gap-2">
              {currentShipment.id}
              <Badge variant={progress === 100 ? 'default' : 'secondary'} className={progress === 100 ? 'bg-success' : ''}>
                {progress === 100 ? 'Completed' : 'In Progress'}
              </Badge>
            </h1>
          </div>
        </div>

        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <div className="flex justify-between text-xs mb-1 text-muted-foreground">
            <span>Overall Progress</span>
            <div className="flex items-center gap-3">
              <span>{progress}%</span>
              {incompleteTasks.length > 0 && (
                <span className="text-warning font-semibold flex items-center gap-1">
                  <span className="text-lg">⚠</span> {incompleteTasks.length} Missed
                </span>
              )}
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="flex items-center gap-2">
          <div className="text-xs font-medium text-muted-foreground mr-2 flex items-center gap-1">
            {isSaving ? (
              <span className="animate-pulse text-accent">Saving...</span>
            ) : (
              <span className="text-success flex items-center gap-1"><Save className="h-3 w-3" /> Saved</span>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button variant="destructive" size="icon" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-5xl space-y-8">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Widgets Column */}
            <div className="md:col-span-1 space-y-6">
                {/* Donut Chart Widget */}
                <div className="bg-card p-6 rounded-lg border shadow-sm flex flex-col items-center justify-center cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleScrollToMissed()}>
                    <DonutProgress percentage={progress} missedCount={incompleteTasks.length} />
                </div>

                {/* Missed Tasks Widget */}
                {incompleteTasks.length > 0 && (
                  <div className="bg-card p-4 rounded-lg border shadow-sm">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">Missed Tasks ({incompleteTasks.length})</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {incompleteTasks.map((task) => (
                        <div 
                          key={task.id} 
                          className="text-xs p-2 bg-muted/30 rounded border-l-2 border-l-warning cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => handleScrollToMissed(task.id)}
                        >
                          <div className="font-medium text-foreground">{task.label}</div>
                        </div>
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground mt-3 text-center">Click any task to view</div>
                  </div>
                )}

                {/* Countdown Widget */}
                <div className={`p-6 rounded-lg border shadow-sm flex flex-col items-center justify-center gap-2 ${countdown.bg}`}>
                    <countdown.icon className={`h-8 w-8 ${countdown.color}`} />
                    <span className={`text-lg font-bold ${countdown.color}`}>{countdown.text}</span>
                    {currentShipment.details.inspectionDate && (
                         <span className="text-xs text-muted-foreground">
                             Target: {format(new Date(currentShipment.details.inspectionDate), 'MMM d, yyyy')}
                         </span>
                    )}
                </div>

                {/* Controls */}
                <div className="bg-card p-4 rounded-lg border shadow-sm space-y-4">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Configuration</h3>
                    
                    <div className="space-y-3">
                        <Label>Shipment Type</Label>
                        <RadioGroup 
                            value={currentShipment.shipmentType} 
                            onValueChange={(val) => updateShipment(currentShipment.id, { shipmentType: val as any })}
                            className="flex flex-col space-y-1"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="with-inspection" id="r1" />
                                <Label htmlFor="r1" className="cursor-pointer font-normal">With Inspection</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="no-inspection" id="r2" />
                                <Label htmlFor="r2" className="cursor-pointer font-normal">No Inspection</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                        <Label>Fumigation</Label>
                        <RadioGroup 
                            value={currentShipment.fumigation} 
                            onValueChange={(val) => updateShipment(currentShipment.id, { fumigation: val as any })}
                            className="flex flex-col space-y-1"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="sky-services" id="fum1" />
                                <Label htmlFor="fum1" className="cursor-pointer font-normal">Sky Services</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="sgs" id="fum2" />
                                <Label htmlFor="fum2" className="cursor-pointer font-normal">SGS</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="manual" id="fum3" />
                                <Label htmlFor="fum3" className="cursor-pointer font-normal">Manual / Other</Label>
                            </div>
                        </RadioGroup>
                        
                        {currentShipment.fumigation === 'manual' && (
                            <div className="pt-2 space-y-2 animate-in slide-in-from-top-2 fade-in">
                                <Input 
                                    placeholder="Fumigation Provider Name" 
                                    value={manualFumigationName} 
                                    onChange={(e) => setManualFumigationName(e.target.value)}
                                    className="h-8 text-sm"
                                />
                                <RadioGroup 
                                    value={currentShipment.manualFumigationMethod} 
                                    onValueChange={(val) => updateShipment(currentShipment.id, { manualFumigationMethod: val as any })}
                                    className="flex items-center gap-4"
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="email" id="fum_m1" />
                                        <Label htmlFor="fum_m1" className="text-xs">Email</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="whatsapp" id="fum_m2" />
                                        <Label htmlFor="fum_m2" className="text-xs">WhatsApp</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                        )}
                    </div>

                    <Separator />

                    <div className="space-y-3">
                        <Label>Forwarder</Label>
                        <RadioGroup 
                            value={currentShipment.forwarder} 
                            onValueChange={(val) => updateShipment(currentShipment.id, { forwarder: val as any })}
                            className="flex flex-col space-y-1"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="xpo" id="f1" />
                                <Label htmlFor="f1" className="cursor-pointer font-normal">XPO Logistics</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="hmi" id="f2" />
                                <Label htmlFor="f2" className="cursor-pointer font-normal">HMI Logistics</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="manual" id="f3" />
                                <Label htmlFor="f3" className="cursor-pointer font-normal">Manual / Other</Label>
                            </div>
                        </RadioGroup>
                        
                        {currentShipment.forwarder === 'manual' && (
                            <div className="pt-2 space-y-2 animate-in slide-in-from-top-2 fade-in">
                                <Input 
                                    placeholder="Forwarder Name" 
                                    value={manualForwarderName} 
                                    onChange={(e) => setManualForwarderName(e.target.value)}
                                    className="h-8 text-sm"
                                />
                                <RadioGroup 
                                    value={currentShipment.manualMethod} 
                                    onValueChange={(val) => updateShipment(currentShipment.id, { manualMethod: val as any })}
                                    className="flex items-center gap-4"
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="email" id="m1" />
                                        <Label htmlFor="m1" className="text-xs">Email</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="whatsapp" id="m2" />
                                        <Label htmlFor="m2" className="text-xs">WhatsApp</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                        )}
                    </div>
                </div>

                {/* Print Actions */}
                <div className="bg-card p-4 rounded-lg border shadow-sm space-y-2">
                     <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">Documents</h3>
                     <Button variant="outline" size="sm" className="w-full justify-start gap-2" onClick={() => handlePrint('declaration')}>
                        <Printer className="h-4 w-4" /> Print Declaration
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start gap-2" onClick={() => handlePrint('undertaking')}>
                        <Printer className="h-4 w-4" /> Print Undertaking
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start gap-2" onClick={() => handlePrint('shoes')}>
                        <Printer className="h-4 w-4" /> Print Shoes Undertaking
                    </Button>
                </div>
            </div>

            {/* Main Content Column */}
            <div className="md:col-span-2 space-y-6">
                {/* Input Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-card p-6 rounded-lg border border-l-4 border-l-primary shadow-sm">
                <h2 className="col-span-full text-lg font-bold text-primary mb-2">Shipment Details</h2>
                
                <div className="space-y-2">
                    <Label htmlFor="customer" className="text-xs text-muted-foreground uppercase font-bold">Customer</Label>
                    <Input id="customer" value={details.customer} onChange={(e) => handleDetailChange('customer', e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="consignee" className="text-xs text-muted-foreground uppercase font-bold">Consignee</Label>
                    <Input id="consignee" value={details.consignee} onChange={(e) => handleDetailChange('consignee', e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="location" className="text-xs text-muted-foreground uppercase font-bold">Location</Label>
                    <Input id="location" value={details.location} onChange={(e) => handleDetailChange('location', e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="brand" className="text-xs text-muted-foreground uppercase font-bold">Brand</Label>
                    <Input id="brand" value={details.brand} onChange={(e) => handleDetailChange('brand', e.target.value)} />
                </div>

                {currentShipment.shipmentType === 'with-inspection' && (
                    <div className="space-y-2">
                        <Label htmlFor="inspectionDate" className="text-xs text-muted-foreground uppercase font-bold">Inspection Date</Label>
                        <Input type="date" id="inspectionDate" value={details.inspectionDate} onChange={(e) => handleDetailChange('inspectionDate', e.target.value)} />
                    </div>
                )}
                <div className="space-y-2">
                    <Label htmlFor="loadingDate" className="text-xs text-muted-foreground uppercase font-bold">Loading Date</Label>
                    <Input type="date" id="loadingDate" value={details.loadingDate} onChange={(e) => handleDetailChange('loadingDate', e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="eta" className="text-xs text-muted-foreground uppercase font-bold">ETA</Label>
                    <Input type="date" id="eta" value={details.eta} onChange={(e) => handleDetailChange('eta', e.target.value)} />
                </div>
                {currentShipment.shipmentType === 'with-inspection' && (
                    <div className="space-y-2">
                        <Label htmlFor="idf" className="text-xs text-muted-foreground uppercase font-bold">IDF Number / PART</Label>
                        <Input id="idf" value={details.idf} onChange={(e) => handleDetailChange('idf', e.target.value)} className="font-mono uppercase" />
                    </div>
                )}
                {currentShipment.shipmentType === 'with-inspection' && (
                    <div className="space-y-2">
                        <Label htmlFor="seal" className="text-xs text-muted-foreground uppercase font-bold">Seal Number</Label>
                        <Input id="seal" value={details.seal} onChange={(e) => handleDetailChange('seal', e.target.value)} className="font-mono uppercase" />
                    </div>
                )}

                {currentShipment.shipmentType === 'with-inspection' && (
                    <div className="space-y-2">
                        <Label htmlFor="ucr" className="text-xs text-muted-foreground uppercase font-bold">UCR</Label>
                        <Input id="ucr" value={details.ucr} onChange={(e) => handleDetailChange('ucr', e.target.value)} className="font-mono uppercase" />
                    </div>
                )}
                {currentShipment.shipmentType === 'with-inspection' && (
                    <div className="space-y-2">
                        <Label htmlFor="proforma" className="text-xs text-muted-foreground uppercase font-bold">Proforma Inv.</Label>
                        <Input id="proforma" value={details.proforma} onChange={(e) => handleDetailChange('proforma', e.target.value)} className="font-mono uppercase" />
                    </div>
                )}
                <div className="space-y-2">
                    <Label htmlFor="container" className="text-xs text-muted-foreground uppercase font-bold">Container No.</Label>
                    <Input id="container" value={details.container} onChange={(e) => handleDetailChange('container', e.target.value)} className="font-mono uppercase" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="booking" className="text-xs text-muted-foreground uppercase font-bold">Booking No.</Label>
                    <Input id="booking" value={details.booking} onChange={(e) => handleDetailChange('booking', e.target.value)} className="font-mono uppercase" />
                </div>

                {/* Commercial Details - inline */}
                <div className="col-span-full pt-4 border-t">
                    <h3 className="text-sm font-semibold text-primary uppercase tracking-wide mb-3">Commercial Details</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground uppercase font-bold">Invoice #</Label>
                            <Input className="h-8 text-sm" value={commercial.invoice} onChange={(e) => handleCommercialChange('invoice', e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground uppercase font-bold">Quantity</Label>
                            <Input className="h-8 text-sm" value={commercial.qty} onChange={(e) => handleCommercialChange('qty', e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground uppercase font-bold">Net Weight</Label>
                            <Input className="h-8 text-sm" value={commercial.netWeight} onChange={(e) => handleCommercialChange('netWeight', e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground uppercase font-bold">Gross Weight</Label>
                            <Input className="h-8 text-sm" value={commercial.grossWeight} onChange={(e) => handleCommercialChange('grossWeight', e.target.value)} />
                        </div>
                    </div>
                </div>
                </div>

                {/* Reconciliation */}
                <div className="space-y-4">

                    {/* Actual */}
                    <div className="bg-accent/5 p-5 rounded-lg border border-accent/20">
                        <h3 className="font-bold text-accent mb-3 text-sm uppercase tracking-wide">Actual Details (Loaded)</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Invoice #</Label>
                            <Input className="h-8 bg-white" value={actual.invoice} onChange={(e) => handleActualChange('invoice', e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Quantity</Label>
                            <Input className="h-8 bg-white" value={actual.qty} onChange={(e) => handleActualChange('qty', e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Net Weight</Label>
                            <Input className="h-8 bg-white" value={actual.netWeight} onChange={(e) => handleActualChange('netWeight', e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Gross Weight</Label>
                            <Input className="h-8 bg-white" value={actual.grossWeight} onChange={(e) => handleActualChange('grossWeight', e.target.value)} />
                        </div>
                        </div>
                        <div className="mt-4 flex items-center space-x-2 bg-success/10 p-3 rounded-md border border-success/20 w-fit">
                        <input 
                            type="checkbox" 
                            id="invoiceSent"
                            checked={actual.invoiceSent}
                            onChange={(e) => handleActualChange('invoiceSent', e.target.checked)}
                            className="h-4 w-4 text-success focus:ring-success border-gray-300 rounded cursor-pointer"
                        />
                        <Label htmlFor="invoiceSent" className="text-success font-bold cursor-pointer text-sm">Actual Invoice Sent to Client</Label>
                        </div>
                    </div>
                </div>

                {/* Phases */}
                <div className="space-y-6" id="phases-section">
                {currentShipment.shipmentType === 'with-inspection' && (
                    <>
                    <div id="phase-1">
                      <PhaseSection 
                          title="Phase 1: Pre-Inspection" 
                          phaseId="p1" 
                          tasks={phase1Mapped}
                          checklistState={currentShipment.checklist}
                          onToggle={(key) => toggleChecklist(currentShipment.id, key)}
                          progress={calculatePhaseProgress(currentShipment, phase1Mapped)}
                          missedTaskIds={incompleteTasks.map(t => t.id)}
                      />
                    </div>
                    <div id="phase-2">
                      <PhaseSection 
                          title={`Phase 2: Fumigation (${getFumigationDisplayName()})`}
                          phaseId="p2" 
                          tasks={fumigationMapped}
                          checklistState={currentShipment.checklist}
                          onToggle={(key) => toggleChecklist(currentShipment.id, key)}
                          progress={calculatePhaseProgress(currentShipment, fumigationMapped)}
                          missedTaskIds={incompleteTasks.map(t => t.id)}
                      />
                    </div>
                    <div id="phase-3">
                      <PhaseSection 
                          title="Phase 3: COC Finalization" 
                          phaseId="p3" 
                          tasks={phase3Mapped}
                          checklistState={currentShipment.checklist}
                          onToggle={(key) => toggleChecklist(currentShipment.id, key)}
                          progress={calculatePhaseProgress(currentShipment, phase3Mapped)}
                          missedTaskIds={incompleteTasks.map(t => t.id)}
                      />
                    </div>
                    </>
                )}
                
                <div id="phase-4">
                  <PhaseSection 
                      title={`Phase 4: Forwarding (${getForwarderDisplayName()})`}
                      phaseId="p4"
                      tasks={forwarderMapped}
                      checklistState={currentShipment.checklist}
                      onToggle={(key) => toggleChecklist(currentShipment.id, key)}
                      progress={calculatePhaseProgress(currentShipment, forwarderMapped)}
                      missedTaskIds={incompleteTasks.map(t => t.id)}
                  />
                </div>

                {/* Custom Tasks Section */}
                <div className="mb-6 border rounded-lg overflow-hidden bg-card shadow-sm">
                    <div className="bg-muted/30 px-4 py-3 border-b flex justify-between items-center">
                        <h3 className="font-semibold text-lg text-primary">Additional / Custom Tasks</h3>
                    </div>
                    
                    <div className="p-4 space-y-3">
                        {currentShipment.customTasks.length > 0 ? (
                            currentShipment.customTasks.map((task) => (
                                <div key={task.id} className="flex items-center justify-between group p-2 rounded-md hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center space-x-3">
                                        <Checkbox 
                                            id={task.id} 
                                            checked={task.completed}
                                            onCheckedChange={() => toggleCustomTask(currentShipment.id, task.id)}
                                        />
                                        <Label 
                                            htmlFor={task.id}
                                            className={`text-sm font-medium leading-none cursor-pointer ${
                                                task.completed ? 'text-muted-foreground line-through decoration-muted-foreground/50' : ''
                                            }`}
                                        >
                                            {task.text}
                                        </Label>
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => deleteCustomTask(currentShipment.id, task.id)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-4 text-muted-foreground text-sm italic">
                                No custom tasks added yet.
                            </div>
                        )}

                        <div className="pt-2 mt-2 border-t flex gap-2">
                            <Input 
                                placeholder="Add a new task..." 
                                value={newTaskInput}
                                onChange={(e) => setNewTaskInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddCustomTask()}
                            />
                            <Button size="icon" onClick={handleAddCustomTask}>
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
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
  const { currentShipment, loadShipment } = useShipmentStore();

  useEffect(() => {
    if (params?.id) {
      loadShipment(params.id);
    }
  }, [params?.id, loadShipment]);

  if (!currentShipment) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return <ShipmentDetailContent currentShipment={currentShipment} />;
}
