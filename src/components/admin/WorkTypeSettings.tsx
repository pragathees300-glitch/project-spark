import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, GripVertical, Briefcase, FolderOpen } from 'lucide-react';
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
import {
  useAllWorkTypes,
  useCreateWorkType,
  useUpdateWorkType,
  useDeleteWorkType,
  useReorderWorkTypes,
  WorkType,
} from '@/hooks/useWorkTypes';
import { useAllCategories } from '@/hooks/useWorkTypeCategories';

// Default colors for display
const DEFAULT_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6'];

interface SortableRowProps {
  workType: WorkType;
  categoryName?: string;
  categoryColor?: string;
  onEdit: (wt: WorkType) => void;
  onDelete: (wt: WorkType) => void;
  onToggle: (wt: WorkType) => void;
}

const SortableRow: React.FC<SortableRowProps> = ({ workType, categoryName, categoryColor, onEdit, onDelete, onToggle }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: workType.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const color = categoryColor || '#6366f1';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-card border rounded-lg mb-2"
    >
      <button
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4" />
      </button>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{workType.name}</span>
          {categoryName && (
            <Badge 
              variant="outline" 
              className="text-xs shrink-0 gap-1"
              style={{ borderColor: color, color: color }}
            >
              <FolderOpen className="w-3 h-3" />
              {categoryName}
            </Badge>
          )}
        </div>
        {workType.description && (
          <p className="text-xs text-muted-foreground truncate">{workType.description}</p>
        )}
      </div>

      <Switch
        checked={workType.is_active ?? true}
        onCheckedChange={() => onToggle(workType)}
        className="shrink-0"
      />

      <div className="flex items-center gap-1 shrink-0">
        <Button variant="ghost" size="icon" onClick={() => onEdit(workType)}>
          <Pencil className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(workType)}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export const WorkTypeSettings: React.FC = () => {
  const { data: workTypes, isLoading } = useAllWorkTypes();
  const { data: categories } = useAllCategories();
  const createWorkType = useCreateWorkType();
  const updateWorkType = useUpdateWorkType();
  const deleteWorkType = useDeleteWorkType();
  const reorderWorkTypes = useReorderWorkTypes();

  const [orderedTypes, setOrderedTypes] = useState<WorkType[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedWorkType, setSelectedWorkType] = useState<WorkType | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', category_id: '' });

  // Build category map for display
  const categoryMap = new Map<string, { name: string; color: string }>();
  categories?.forEach((cat, index) => {
    categoryMap.set(cat.id, {
      name: cat.name,
      color: DEFAULT_COLORS[index % DEFAULT_COLORS.length],
    });
  });

  useEffect(() => {
    if (workTypes) {
      setOrderedTypes(workTypes);
    }
  }, [workTypes]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = orderedTypes.findIndex((t) => t.id === active.id);
    const newIndex = orderedTypes.findIndex((t) => t.id === over.id);

    const newOrder = arrayMove(orderedTypes, oldIndex, newIndex);
    setOrderedTypes(newOrder);

    await reorderWorkTypes.mutateAsync(newOrder.map((t) => t.id));
  };

  const handleAdd = () => {
    setFormData({ name: '', description: '', category_id: '' });
    setIsAddDialogOpen(true);
  };

  const handleEdit = (workType: WorkType) => {
    setSelectedWorkType(workType);
    setFormData({ 
      name: workType.name, 
      description: workType.description || '',
      category_id: workType.category_id || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (workType: WorkType) => {
    setSelectedWorkType(workType);
    setIsDeleteDialogOpen(true);
  };

  const handleToggleActive = async (workType: WorkType) => {
    await updateWorkType.mutateAsync({
      id: workType.id,
      is_active: !(workType.is_active ?? true),
    });
  };

  const submitAdd = async () => {
    if (!formData.name.trim()) return;
    await createWorkType.mutateAsync({
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      category_id: formData.category_id || undefined,
    });
    setIsAddDialogOpen(false);
  };

  const submitEdit = async () => {
    if (!selectedWorkType || !formData.name.trim()) return;
    await updateWorkType.mutateAsync({
      id: selectedWorkType.id,
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      category_id: formData.category_id || undefined,
    });
    setIsEditDialogOpen(false);
  };

  const confirmDelete = async () => {
    if (!selectedWorkType) return;
    await deleteWorkType.mutateAsync(selectedWorkType.id);
    setIsDeleteDialogOpen(false);
  };

  // Group work types by category
  const groupedWorkTypes = orderedTypes.reduce((acc, wt) => {
    const catId = wt.category_id || 'uncategorized';
    if (!acc[catId]) acc[catId] = [];
    acc[catId].push(wt);
    return acc;
  }, {} as Record<string, WorkType[]>);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-primary" />
            <div>
              <CardTitle className="text-base">Work Types</CardTitle>
              <CardDescription>
                Manage work type options. Drag to reorder.
              </CardDescription>
            </div>
          </div>
          <Button onClick={handleAdd} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Type
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : orderedTypes.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="space-y-4">
              {Object.entries(groupedWorkTypes).map(([catId, types]) => {
                const catInfo = categoryMap.get(catId);
                const categoryName = catInfo?.name || (catId === 'uncategorized' ? 'Uncategorized' : catId);
                const color = catInfo?.color || '#6366f1';
                
                return (
                  <div key={catId}>
                    <div className="flex items-center gap-2 mb-2">
                      <div 
                        className="w-6 h-6 rounded flex items-center justify-center"
                        style={{ backgroundColor: `${color}20` }}
                      >
                        <FolderOpen className="w-3.5 h-3.5" style={{ color }} />
                      </div>
                      <span className="text-sm font-medium" style={{ color }}>{categoryName}</span>
                      <Badge variant="secondary" className="text-xs">
                        {types.length}
                      </Badge>
                    </div>
                    <SortableContext
                      items={types.map((t) => t.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {types.map((workType) => (
                        <SortableRow
                          key={workType.id}
                          workType={workType}
                          categoryName={catInfo?.name}
                          categoryColor={catInfo?.color}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          onToggle={handleToggleActive}
                        />
                      ))}
                    </SortableContext>
                  </div>
                );
              })}
            </div>
          </DndContext>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>No work types configured</p>
            <p className="text-sm">Add work types for users to select when submitting proofs</p>
          </div>
        )}
      </CardContent>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Work Type</DialogTitle>
            <DialogDescription>
              Create a new work type option for proof submissions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="add-name">Name *</Label>
              <Input
                id="add-name"
                placeholder="e.g., Social Media Post"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-category">Category</Label>
              <Select
                value={formData.category_id}
                onValueChange={(val) => setFormData({ ...formData, category_id: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-description">Description</Label>
              <Input
                id="add-description"
                placeholder="Optional description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitAdd}
              disabled={!formData.name.trim() || createWorkType.isPending}
            >
              {createWorkType.isPending ? 'Adding...' : 'Add Type'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Work Type</DialogTitle>
            <DialogDescription>Update the work type details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category">Category</Label>
              <Select
                value={formData.category_id}
                onValueChange={(val) => setFormData({ ...formData, category_id: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitEdit}
              disabled={!formData.name.trim() || updateWorkType.isPending}
            >
              {updateWorkType.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Work Type</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedWorkType?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
