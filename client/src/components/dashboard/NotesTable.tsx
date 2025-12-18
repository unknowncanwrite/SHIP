import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus } from 'lucide-react';

interface Note {
  id: string;
  date: string;
  content: string;
}

export default function NotesTable() {
  const [notes, setNotes] = useState<Note[]>([
    { id: '1', date: new Date().toISOString().split('T')[0], content: 'Sample note' }
  ]);
  const [newNote, setNewNote] = useState('');

  const addNote = () => {
    if (newNote.trim()) {
      setNotes([
        ...notes,
        {
          id: Date.now().toString(),
          date: new Date().toISOString().split('T')[0],
          content: newNote
        }
      ]);
      setNewNote('');
    }
  };

  const updateNote = (id: string, content: string) => {
    setNotes(notes.map(n => n.id === id ? { ...n, content } : n));
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter(n => n.id !== id));
  };

  return (
    <div className="bg-card rounded-lg border shadow-sm overflow-hidden h-fit sticky top-24">
      {/* Header */}
      <div className="bg-muted/30 px-4 py-3 border-b">
        <h2 className="font-semibold text-base text-foreground">Notes</h2>
      </div>

      {/* Table */}
      <div className="overflow-y-auto max-h-96">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/20">
              <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Date</th>
              <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Note</th>
            </tr>
          </thead>
          <tbody>
            {notes.map((note) => (
              <tr key={note.id} className="border-b hover:bg-muted/10 transition-colors group">
                <td className="px-4 py-2 text-xs text-muted-foreground font-mono whitespace-nowrap">{note.date}</td>
                <td className="px-4 py-2 text-xs flex items-center justify-between gap-1">
                  <input
                    type="text"
                    value={note.content}
                    onChange={(e) => updateNote(note.id, e.target.value)}
                    className="flex-1 bg-transparent border-0 focus:outline-none focus:ring-0 text-foreground placeholder-muted-foreground"
                    placeholder="Note..."
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => deleteNote(note.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add New Note */}
      <div className="bg-muted/5 px-4 py-3 border-t flex gap-2">
        <Input
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addNote()}
          placeholder="Add..."
          className="h-8 text-xs"
        />
        <Button
          onClick={addNote}
          className="bg-accent hover:bg-accent/90 text-white h-8 px-2"
          size="sm"
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
