import { useState } from 'react';
import { useShipmentStore } from '@/lib/store';
import { calculateProgress } from '@/lib/shipment-utils';
import ShipmentCard from './ShipmentCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Filter, LayoutGrid, List, Moon, Sun } from 'lucide-react';
import { useLocation } from 'wouter';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useTheme } from 'next-themes';

export default function Dashboard() {
  const { shipments, createShipment } = useShipmentStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [_, setLocation] = useLocation();
  const [newId, setNewId] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const filteredShipments = shipments
    .filter((s) => 
      s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.details.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.details.container.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'date') return b.createdAt - a.createdAt;
      if (sortBy === 'progress') return calculateProgress(b) - calculateProgress(a);
      // Add more sort logic if needed
      return 0;
    });

  const handleCreate = () => {
    if (newId) {
      createShipment(newId);
      setIsDialogOpen(false);
      setLocation(`/shipment/${newId}`);
    }
  };

  const stats = {
    total: shipments.length,
    completed: shipments.filter(s => calculateProgress(s) === 100).length,
    pending: shipments.filter(s => calculateProgress(s) < 100).length,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">S</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-primary hidden sm:block">
              Shipment Manager
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent hover:bg-accent/90 text-white shadow-md transition-all hover:-translate-y-0.5">
                <Plus className="mr-2 h-4 w-4" /> New Shipment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Shipment</DialogTitle>
                <DialogDescription>
                  Enter the unique Invoice ID for the new shipment.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="invoice-id" className="text-right">
                    Invoice ID
                  </Label>
                  <Input
                    id="invoice-id"
                    value={newId}
                    onChange={(e) => setNewId(e.target.value)}
                    className="col-span-3 uppercase font-mono"
                    placeholder="INV-..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreate}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card rounded-xl p-6 shadow-sm border border-border flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Shipments</p>
              <h3 className="text-3xl font-bold text-primary mt-1">{stats.total}</h3>
            </div>
            <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
              <LayoutGrid className="h-6 w-6" />
            </div>
          </div>
          <div className="bg-card rounded-xl p-6 shadow-sm border border-border flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Completed</p>
              <h3 className="text-3xl font-bold text-success mt-1">{stats.completed}</h3>
            </div>
            <div className="h-12 w-12 bg-success/10 rounded-full flex items-center justify-center text-success">
              <div className="h-6 w-6 rounded-full border-2 border-current flex items-center justify-center text-[10px] font-bold">✓</div>
            </div>
          </div>
          <div className="bg-card rounded-xl p-6 shadow-sm border border-border flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending Action</p>
              <h3 className="text-3xl font-bold text-warning mt-1">{stats.pending}</h3>
            </div>
            <div className="h-12 w-12 bg-warning/10 rounded-full flex items-center justify-center text-warning">
              <div className="h-6 w-6 rounded-full border-2 border-current border-dashed"></div>
            </div>
          </div>
        </div>

        {/* Filters & Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-lg border border-border shadow-sm">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by ID, Customer, Container..." 
              className="pl-9 bg-background border-border"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Sort by" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date Created</SelectItem>
                <SelectItem value="progress">Progress</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex bg-muted rounded-md p-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm bg-background shadow-sm">
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm text-muted-foreground hover:text-foreground">
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Grid */}
        {filteredShipments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredShipments.map((shipment) => (
              <ShipmentCard key={shipment.id} data={shipment} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground bg-card rounded-xl border border-dashed border-border">
            <p className="text-lg">No shipments found</p>
            <p className="text-sm">Try adjusting your search or create a new one.</p>
          </div>
        )}
      </main>
    </div>
  );
}
