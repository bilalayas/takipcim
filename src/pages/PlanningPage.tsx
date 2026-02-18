import { useState } from 'react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';

export default function PlanningPage() {
  const {
    getTasksForDate, addTask, deleteTask, toggleTaskCompletion,
    isTaskCompleted,
  } = useApp();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newDuration, setNewDuration] = useState('');

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const dayTasks = getTasksForDate(dateStr);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const handleCreate = () => {
    if (!newName.trim()) return;
    addTask({
      name: newName.trim(),
      category: newCategory.trim() || undefined,
      plannedDuration: newDuration ? parseInt(newDuration) : undefined,
      dates: [dateStr],
    });
    setNewName('');
    setNewCategory('');
    setNewDuration('');
    setDialogOpen(false);
  };

  return (
    <div className="px-4 pt-6">
      <h1 className="text-lg font-bold mb-4 text-foreground">Planlama</h1>

      {/* Week Selector */}
      <div className="flex items-center gap-1 mb-4">
        <button
          onClick={() => setWeekStart(prev => addDays(prev, -7))}
          className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="flex-1 flex gap-1 overflow-x-auto scrollbar-hide">
          {weekDays.map(day => {
            const isSelected = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={`flex-1 min-w-[40px] flex flex-col items-center py-2 rounded-xl transition-all ${
                  isSelected
                    ? 'bg-primary text-primary-foreground'
                    : isToday
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent/50'
                }`}
              >
                <span className="text-[10px] font-medium uppercase">
                  {format(day, 'EEE', { locale: tr })}
                </span>
                <span className={`text-sm ${isSelected ? 'font-bold' : 'font-medium'}`}>
                  {format(day, 'd')}
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setWeekStart(prev => addDays(prev, 7))}
          className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Date label */}
      <p className="text-xs text-muted-foreground mb-3">
        {format(selectedDate, 'd MMMM yyyy, EEEE', { locale: tr })}
      </p>

      {/* Tasks */}
      <div className="space-y-2 mb-4">
        {dayTasks.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">Bu gün için görev yok</p>
          </div>
        )}
        {dayTasks.map(task => (
          <div
            key={task.id}
            className="flex items-center gap-3 bg-card rounded-2xl px-4 py-3 border border-border shadow-sm"
          >
            <Checkbox
              checked={isTaskCompleted(task.id, dateStr)}
              onCheckedChange={() => toggleTaskCompletion(task.id, dateStr)}
              className="rounded-md"
            />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${
                isTaskCompleted(task.id, dateStr) ? 'line-through text-muted-foreground' : 'text-card-foreground'
              }`}>
                {task.name}
              </p>
              <div className="flex gap-2 mt-0.5">
                {task.category && (
                  <span className="text-[10px] text-muted-foreground">{task.category}</span>
                )}
                {task.plannedDuration && (
                  <span className="text-[10px] text-muted-foreground">{task.plannedDuration} dk</span>
                )}
              </div>
            </div>
            <button
              onClick={() => deleteTask(task.id)}
              className="text-muted-foreground hover:text-destructive transition-colors p-1"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Add Task */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full rounded-2xl h-11 border-dashed">
            <Plus size={16} className="mr-2" />
            Görev Ekle
          </Button>
        </DialogTrigger>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>Yeni Görev</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <Input
              placeholder="Görev adı *"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              className="rounded-xl"
              autoFocus
            />
            <Input
              placeholder="Kategori (opsiyonel)"
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              className="rounded-xl"
            />
            <Input
              type="number"
              placeholder="Planlanan süre - dk (opsiyonel)"
              value={newDuration}
              onChange={e => setNewDuration(e.target.value)}
              className="rounded-xl"
            />
            <Button onClick={handleCreate} disabled={!newName.trim()} className="w-full rounded-xl">
              Oluştur
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
