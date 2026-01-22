import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Trophy, Plus, Pencil, Trash2, Crown, Medal, Award, GripVertical, IndianRupee } from 'lucide-react';
import { useTopDropshippers, TopDropshipper } from '@/hooks/useTopDropshippers';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const getRankIcon = (position: number) => {
  switch (position) {
    case 1:
      return <Crown className="w-5 h-5 text-yellow-500" />;
    case 2:
      return <Medal className="w-5 h-5 text-slate-400" />;
    case 3:
      return <Medal className="w-5 h-5 text-amber-600" />;
    default:
      return <Award className="w-5 h-5 text-primary" />;
  }
};

const getRankColor = (position: number) => {
  switch (position) {
    case 1:
      return 'bg-yellow-500/20 text-yellow-600';
    case 2:
      return 'bg-slate-400/20 text-slate-500';
    case 3:
      return 'bg-amber-600/20 text-amber-600';
    default:
      return 'bg-primary/20 text-primary';
  }
};

interface SortableDropshipperRowProps {
  entry: TopDropshipper;
  onEdit: (entry: TopDropshipper) => void;
  onDelete: (id: string) => void;
  onToggle: (params: { id: string; is_active: boolean }) => void;
}

const SortableDropshipperRow: React.FC<SortableDropshipperRowProps> = ({
  entry,
  onEdit,
  onDelete,
  onToggle,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: entry.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const sortOrder = entry.sort_order ?? entry.rank ?? 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 bg-card border rounded-lg transition-opacity ${
        !entry.is_active ? 'opacity-50' : ''
      }`}
    >
      <button
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-5 h-5" />
      </button>

      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getRankColor(sortOrder)}`}>
        {getRankIcon(sortOrder)}
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{entry.display_name}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            #{sortOrder}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
          <span className="flex items-center gap-1">
            <IndianRupee className="w-3 h-3" />
            {(entry.earnings || 0).toLocaleString()}
          </span>
        </div>
      </div>

      <Switch
        checked={entry.is_active ?? true}
        onCheckedChange={(checked) =>
          onToggle({ id: entry.id, is_active: checked })
        }
      />

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onEdit(entry)}
      >
        <Pencil className="w-4 h-4" />
      </Button>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
            <Trash2 className="w-4 h-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {entry.display_name} from the leaderboard?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => onDelete(entry.id)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export const TopDropshippersSettings: React.FC = () => {
  const {
    allDropshippers,
    isLoading,
    upsertDropshipper,
    deleteDropshipper,
    toggleActive,
    reorderDropshippers,
    isUpdating,
  } = useTopDropshippers();
  
  const { dropshippers } = useAdminUsers();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TopDropshipper | null>(null);
  const [formData, setFormData] = useState({
    display_name: '',
    rank: 1,
    earnings: 0,
    is_active: true,
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const sortedDropshippers = [...allDropshippers].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sortedDropshippers.findIndex((d) => d.id === active.id);
      const newIndex = sortedDropshippers.findIndex((d) => d.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(sortedDropshippers, oldIndex, newIndex);
        const updates = reordered.map((item, index) => ({
          id: item.id,
          sort_order: index + 1,
        }));
        reorderDropshippers(updates);
      }
    }
  };

  const handleOpenDialog = (entry?: TopDropshipper) => {
    if (entry) {
      setEditingEntry(entry);
      setFormData({
        display_name: entry.display_name,
        rank: entry.rank ?? 1,
        earnings: entry.earnings ?? 0,
        is_active: entry.is_active ?? true,
      });
    } else {
      setEditingEntry(null);
      setFormData({
        display_name: '',
        rank: allDropshippers.length + 1,
        earnings: 0,
        is_active: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.display_name.trim()) return;
    
    upsertDropshipper({
      ...(editingEntry ? { id: editingEntry.id } : {}),
      display_name: formData.display_name,
      rank: formData.rank,
      earnings: formData.earnings,
      is_active: formData.is_active,
      sort_order: editingEntry?.sort_order ?? allDropshippers.length + 1,
    });
    setIsDialogOpen(false);
  };

  const handleUserSelect = (userId: string) => {
    if (userId === 'custom') {
      setFormData((prev) => ({
        ...prev,
      }));
    } else {
      const selectedUser = dropshippers?.find((u) => u.id === userId);
      setFormData((prev) => ({
        ...prev,
        display_name: selectedUser?.name || prev.display_name,
      }));
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-yellow-500/10 rounded-lg">
            <Trophy className="w-5 h-5 text-yellow-500" />
          </div>
          <div>
            <CardTitle className="text-lg">Top Dropshippers Leaderboard</CardTitle>
            <CardDescription>
              Manually add names, positions & earnings. Drag to reorder.
            </CardDescription>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              className="text-primary border-primary hover:bg-primary/10"
              onClick={() => handleOpenDialog()} 
              disabled={allDropshippers.length >= 10}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Dropshipper
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingEntry ? 'Edit Top Dropshipper' : 'Add Top Dropshipper'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
              <div className="space-y-2">
                <Label>Link to User (Optional)</Label>
                <Select
                  value="custom"
                  onValueChange={handleUserSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Enter custom name" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">-- Enter Custom Name --</SelectItem>
                    {dropshippers?.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Display Name *</Label>
                <Input
                  value={formData.display_name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, display_name: e.target.value }))
                  }
                  placeholder="e.g., Rahul Sharma"
                />
              </div>

              <div className="space-y-2">
                <Label>Position (1-10)</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={formData.rank}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    setFormData((prev) => ({ 
                      ...prev, 
                      rank: Math.min(10, Math.max(1, value)) 
                    }));
                  }}
                  placeholder="Enter position (1-10)"
                />
              </div>

              <div className="space-y-2">
                <Label>Earnings (₹)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={formData.earnings}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, earnings: parseFloat(e.target.value) || 0 }))
                  }
                  placeholder="e.g., 50000"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <Label className="cursor-pointer">Active on Leaderboard</Label>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, is_active: checked }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs">Preview</Label>
                <div className="p-3 bg-card border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getRankColor(formData.rank)}`}>
                      {getRankIcon(formData.rank)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {formData.display_name || 'Dropshipper Name'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          #{formData.rank}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span>₹{formData.earnings.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isUpdating || !formData.display_name.trim()}>
                {editingEntry ? 'Update' : 'Add'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent className="space-y-3">
        {sortedDropshippers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No dropshippers added yet</p>
            <p className="text-xs mt-1">Click "Add Dropshipper" to get started</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sortedDropshippers.map((d) => d.id)}
              strategy={verticalListSortingStrategy}
            >
              {sortedDropshippers.map((entry) => (
                <SortableDropshipperRow
                  key={entry.id}
                  entry={entry}
                  onEdit={handleOpenDialog}
                  onDelete={deleteDropshipper}
                  onToggle={toggleActive}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </CardContent>
    </Card>
  );
};
