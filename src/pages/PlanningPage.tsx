import { useState, useRef, useEffect, useMemo } from 'react';
import { format, getDaysInMonth } from 'date-fns';
import { Plus, Trash2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useTemplates, TaskTemplate } from '@/hooks/useTemplates';
import { Task } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle,
} from '@/components/ui/drawer';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

export default function PlanningPage() {
  const {
    getTasksForDate, addTask, deleteTask, toggleTaskCompletion,
    isTaskCompleted, settings,
  } = useApp();
  const { templates, addTemplate, deleteTemplate } = useTemplates();

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState(now.getDate());

  const [fabOpen, setFabOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'menu' | 'new' | 'templates' | 'createTemplate'>('menu');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newDuration, setNewDuration] = useState('');
  const [newStartHour, setNewStartHour] = useState<string>('');

  const [tplName, setTplName] = useState('');
  const [tplCategory, setTplCategory] = useState('');
  const [tplDuration, setTplDuration] = useState('');

  const selectedDayRef = useRef<HTMLButtonElement>(null);

  const totalDays = getDaysInMonth(new Date(selectedYear, selectedMonth));
  const selectedDate = new Date(selectedYear, selectedMonth, Math.min(selectedDay, totalDays));
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const dayTasks = getTasksForDate(dateStr);

  useEffect(() => {
    const max = getDaysInMonth(new Date(selectedYear, selectedMonth));
    if (selectedDay > max) setSelectedDay(max);
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    selectedDayRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [selectedDay, selectedMonth, selectedYear]);

  const { planningHourStart = 8, planningHourEnd = 20 } = settings;
  const hours = useMemo(() =>
    Array.from({ length: Math.max(planningHourEnd - planningHourStart, 1) }, (_, i) => planningHourStart + i),
    [planningHourStart, planningHourEnd]
  );

  const tasksByHour = useMemo(() => {
    const map: Record<number, Task[]> = {};
    dayTasks.forEach(t => {
      if (t.startHour !== undefined) {
        if (!map[t.startHour]) map[t.startHour] = [];
        map[t.startHour].push(t);
      }
    });
    return map;
  }, [dayTasks]);

  const unscheduledTasks = useMemo(() =>
    dayTasks.filter(t => t.startHour === undefined),
    [dayTasks]
  );

  const handleCreate = () => {
    if (!newName.trim()) return;
    addTask({
      name: newName.trim(),
      category: newCategory.trim() || undefined,
      plannedDuration: newDuration ? parseInt(newDuration) : undefined,
      startHour: newStartHour ? parseInt(newStartHour) : undefined,
      dates: [dateStr],
    });
    resetForm();
    setFabOpen(false);
    setDrawerMode('menu');
  };

  const handleCreateFromTemplate = (tpl: TaskTemplate) => {
    addTask({
      name: tpl.name,
      category: tpl.category,
      plannedDuration: tpl.plannedDuration,
      startHour: tpl.startHour,
      dates: [dateStr],
    });
    setFabOpen(false);
    setDrawerMode('menu');
  };

  const handleSaveTemplate = () => {
    if (!tplName.trim()) return;
    addTemplate({
      name: tplName.trim(),
      category: tplCategory.trim() || undefined,
      plannedDuration: tplDuration ? parseInt(tplDuration) : undefined,
    });
    setTplName(''); setTplCategory(''); setTplDuration('');
    setDrawerMode('menu');
  };

  const handleCreateAtHour = (hour: number) => {
    setNewStartHour(String(hour));
    setDrawerMode('new');
    setFabOpen(true);
  };

  const resetForm = () => {
    setNewName(''); setNewCategory(''); setNewDuration(''); setNewStartHour('');
  };

  const dayOfWeek = dayNames[selectedDate.getDay()];

  return (
    <div className="px-4 pt-6 flex flex-col h-[calc(100vh-5rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-lg font-bold text-foreground">Planlama</h1>
        <div className="flex items-center gap-1.5 text-sm">
          <span className="font-bold text-foreground">{selectedDay}</span>
          <Popover>
            <PopoverTrigger asChild>
              <button className="text-foreground font-medium hover:text-primary transition-colors">
                {monthNames[selectedMonth]}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2 pointer-events-auto" align="end">
              <div className="grid grid-cols-3 gap-1">
                {monthNames.map((name, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedMonth(i)}
                    className={`text-xs py-1.5 rounded-lg transition-colors ${
                      selectedMonth === i ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                    }`}
                  >
                    {name.slice(0, 3)}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <button className="text-foreground font-medium hover:text-primary transition-colors">
                {selectedYear}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-36 p-2 pointer-events-auto" align="end">
              <div className="grid grid-cols-2 gap-1">
                {Array.from({ length: 6 }, (_, i) => now.getFullYear() - 1 + i).map(year => (
                  <button
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className={`text-xs py-1.5 rounded-lg transition-colors ${
                      selectedYear === year ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <span className="text-xs text-muted-foreground">{dayOfWeek}</span>
        </div>
      </div>

      {/* Day selector */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide mb-3 -mx-4 px-4 pb-1" onTouchStart={e => e.stopPropagation()}>
        {Array.from({ length: totalDays }, (_, i) => i + 1).map(day => {
          const d = new Date(selectedYear, selectedMonth, day);
          const isSelected = day === selectedDay;
          const isToday = day === now.getDate() && selectedMonth === now.getMonth() && selectedYear === now.getFullYear();
          return (
            <button
              key={day}
              ref={isSelected ? selectedDayRef : undefined}
              onClick={() => setSelectedDay(day)}
              className={`flex flex-col items-center min-w-[40px] py-2 px-1 rounded-xl transition-all ${
                isSelected
                  ? 'bg-primary text-primary-foreground'
                  : isToday
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent/50'
              }`}
            >
              <span className="text-[9px] font-medium">{dayNames[d.getDay()]}</span>
              <span className={`text-sm ${isSelected ? 'font-bold' : 'font-medium'}`}>{day}</span>
            </button>
          );
        })}
      </div>

      {/* Time grid */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {unscheduledTasks.length > 0 && (
          <div className="mb-3">
            <p className="text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wide">Zamanlanmamış</p>
            <div className="space-y-1.5">
              {unscheduledTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  dateStr={dateStr}
                  isCompleted={isTaskCompleted(task.id, dateStr)}
                  onToggle={() => toggleTaskCompletion(task.id, dateStr)}
                  onDelete={() => deleteTask(task.id)}
                />
              ))}
            </div>
          </div>
        )}

        {hours.map(hour => {
          const hourTasks = tasksByHour[hour] || [];
          return (
            <div key={hour} className="flex min-h-[56px] border-t border-border/50">
              <div className="w-12 pt-1.5 text-[11px] text-muted-foreground font-medium shrink-0">
                {String(hour).padStart(2, '0')}:00
              </div>
              <div className="flex-1 py-1 space-y-1 min-h-[56px]">
                {hourTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    dateStr={dateStr}
                    isCompleted={isTaskCompleted(task.id, dateStr)}
                    onToggle={() => toggleTaskCompletion(task.id, dateStr)}
                    onDelete={() => deleteTask(task.id)}
                    compact
                  />
                ))}
              </div>
              <button onClick={() => handleCreateAtHour(hour)} className="self-start mt-1.5 p-1 text-muted-foreground/40 hover:text-primary transition-colors">
                <Plus size={14} />
              </button>
            </div>
          );
        })}
      </div>

      {/* FAB */}
      <button
        onClick={() => { setDrawerMode('menu'); resetForm(); setFabOpen(true); }}
        className="fixed bottom-24 right-5 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:opacity-90 active:scale-95 transition-all z-10"
      >
        <Plus size={22} />
      </button>

      {/* Drawer */}
      <Drawer open={fabOpen} onOpenChange={(open) => { setFabOpen(open); if (!open) setDrawerMode('menu'); }}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>
              {drawerMode === 'menu' ? 'Görev Ekle' :
               drawerMode === 'new' ? 'Yeni Görev' :
               drawerMode === 'templates' ? 'Şablonlar' : 'Şablon Oluştur'}
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-8 space-y-3">
            {drawerMode === 'menu' && (
              <>
                <button onClick={() => setDrawerMode('new')} className="flex items-center gap-3 w-full px-4 py-3 bg-card rounded-xl border border-border text-sm hover:bg-accent transition-colors">
                  <Plus size={16} className="text-primary" /> Yeni Görev
                </button>
                <button onClick={() => setDrawerMode('templates')} className="flex items-center gap-3 w-full px-4 py-3 bg-card rounded-xl border border-border text-sm hover:bg-accent transition-colors">
                  📋 Şablon Kullan
                </button>
                <button onClick={() => setDrawerMode('createTemplate')} className="flex items-center gap-3 w-full px-4 py-3 bg-card rounded-xl border border-border text-sm hover:bg-accent transition-colors">
                  ✨ Şablon Oluştur
                </button>
              </>
            )}
            {drawerMode === 'new' && (
              <div className="space-y-3">
                <Input placeholder="Görev adı *" value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreate()} className="rounded-xl" autoFocus />
                <Input placeholder="Kategori (opsiyonel)" value={newCategory} onChange={e => setNewCategory(e.target.value)} className="rounded-xl" />
                <Input type="number" placeholder="Süre - dk (opsiyonel)" value={newDuration} onChange={e => setNewDuration(e.target.value)} className="rounded-xl" />
                <Select value={newStartHour} onValueChange={setNewStartHour}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Saat (opsiyonel)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Zamansız</SelectItem>
                    {hours.map(h => (
                      <SelectItem key={h} value={String(h)}>{String(h).padStart(2, '0')}:00</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleCreate} disabled={!newName.trim()} className="w-full rounded-xl">Oluştur</Button>
              </div>
            )}
            {drawerMode === 'templates' && (
              <div className="space-y-2">
                {templates.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">Henüz şablon yok</p>
                )}
                {templates.map(tpl => (
                  <div key={tpl.id} className="flex items-center gap-2">
                    <button
                      onClick={() => handleCreateFromTemplate(tpl)}
                      className="flex-1 text-left px-3 py-2.5 bg-card rounded-xl text-sm hover:bg-accent transition-colors border border-border"
                    >
                      {tpl.name}
                      {tpl.category && <span className="ml-2 text-xs text-muted-foreground">• {tpl.category}</span>}
                      {tpl.plannedDuration && <span className="ml-2 text-xs text-muted-foreground">{tpl.plannedDuration}dk</span>}
                    </button>
                    <button onClick={() => deleteTemplate(tpl.id)} className="p-1 text-muted-foreground hover:text-destructive">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {drawerMode === 'createTemplate' && (
              <div className="space-y-3">
                <Input placeholder="Şablon adı *" value={tplName} onChange={e => setTplName(e.target.value)} className="rounded-xl" autoFocus />
                <Input placeholder="Kategori (opsiyonel)" value={tplCategory} onChange={e => setTplCategory(e.target.value)} className="rounded-xl" />
                <Input type="number" placeholder="Süre - dk (opsiyonel)" value={tplDuration} onChange={e => setTplDuration(e.target.value)} className="rounded-xl" />
                <Button onClick={handleSaveTemplate} disabled={!tplName.trim()} className="w-full rounded-xl">Kaydet</Button>
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

function TaskCard({ task, dateStr, isCompleted, onToggle, onDelete, compact }: {
  task: Task; dateStr: string; isCompleted: boolean;
  onToggle: () => void; onDelete: () => void; compact?: boolean;
}) {
  return (
    <div className={`flex items-center gap-2.5 bg-card rounded-xl ${compact ? 'px-3 py-2' : 'px-4 py-3'} border border-border shadow-sm`}>
      <Checkbox checked={isCompleted} onCheckedChange={onToggle} className="rounded-md" />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isCompleted ? 'line-through text-muted-foreground' : 'text-card-foreground'}`}>
          {task.name}
        </p>
        {!compact && (task.category || task.plannedDuration) && (
          <div className="flex gap-2 mt-0.5">
            {task.category && <span className="text-[10px] text-muted-foreground">{task.category}</span>}
            {task.plannedDuration && <span className="text-[10px] text-muted-foreground">{task.plannedDuration} dk</span>}
          </div>
        )}
      </div>
      <button onClick={onDelete} className="text-muted-foreground hover:text-destructive transition-colors p-1">
        <Trash2 size={14} />
      </button>
    </div>
  );
}
