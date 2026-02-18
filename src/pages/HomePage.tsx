import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ChevronDown, Coffee, Play, CheckCircle2, Plus, Search, Zap } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger,
} from '@/components/ui/drawer';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { motion, AnimatePresence } from 'framer-motion';

const today = () => format(new Date(), 'yyyy-MM-dd');

export default function HomePage() {
  const {
    tasks, getTasksForDate, addTask, addTaskToDate, addSession,
    getSessionsForDate, setTaskCompleted, isTaskCompleted, settings, updateSettings,
    timer,
  } = useApp();

  const [accordionOpen, setAccordionOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newTaskName, setNewTaskName] = useState('');
  const [showNewTaskInput, setShowNewTaskInput] = useState(false);

  // Dialog states
  const [showBreakDialog1, setShowBreakDialog1] = useState(false);
  const [showBreakDialog2, setShowBreakDialog2] = useState(false);
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [customBreakMinutes, setCustomBreakMinutes] = useState('');

  // Break state
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [breakStart, setBreakStart] = useState<number | null>(null);
  const [breakLimit, setBreakLimit] = useState<number | null>(null);
  const [breakElapsed, setBreakElapsed] = useState(0);
  const [dontAskBreak, setDontAskBreak] = useState(false);

  // Summary carousel
  const [summaryIndex, setSummaryIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const todayStr = today();
  const todayTasks = getTasksForDate(todayStr);
  const todaySessions = getSessionsForDate(todayStr);
  const selectedTask = tasks.find(t => t.id === selectedTaskId);

  // Sync selectedTaskId with timer's current task
  useEffect(() => {
    if (timer.currentTaskId && !selectedTaskId) {
      setSelectedTaskId(timer.currentTaskId);
    }
  }, [timer.currentTaskId, selectedTaskId]);

  // Break timer
  useEffect(() => {
    if (!isOnBreak || !breakStart) return;
    const interval = setInterval(() => {
      setBreakElapsed(Math.floor((Date.now() - breakStart) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOnBreak, breakStart]);

  useEffect(() => {
    if (isOnBreak && breakLimit && breakElapsed >= breakLimit) {
      endBreak();
    }
  }, [breakElapsed, breakLimit, isOnBreak]);

  const workSessions = todaySessions.filter(s => s.type === 'work');
  const breakSessions = todaySessions.filter(s => s.type === 'break');
  const totalWork = workSessions.reduce((sum, s) => sum + s.duration, 0);
  const totalBreak = breakSessions.reduce((sum, s) => sum + s.duration, 0) + (isOnBreak ? breakElapsed : 0);
  const completedCount = todayTasks.filter(t => isTaskCompleted(t.id, todayStr)).length;

  const unplannedTasks = tasks.filter(t => !t.dates.includes(todayStr));
  const filteredUnplanned = searchQuery
    ? unplannedTasks.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : unplannedTasks;

  const selectTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    setAccordionOpen(false);
  };

  const handleStart = () => {
    if (!selectedTask) return;
    timer.start(selectedTask.id, selectedTask.name);
  };

  const handlePause = () => timer.pause();
  const handleResume = () => timer.resume();

  const handleFinish = () => {
    timer.pause();
    setShowFinishDialog(true);
  };

  const completeTask = (completed: boolean) => {
    const duration = timer.stop();
    if (selectedTask && duration > 0) {
      addSession({
        taskId: selectedTask.id,
        taskName: selectedTask.name,
        date: todayStr,
        duration,
        type: 'work',
        timestamp: Date.now(),
      });
    }
    if (completed && selectedTask) {
      setTaskCompleted(selectedTask.id, todayStr, true);
    }
    timer.reset();
    setSelectedTaskId(null);
    setShowFinishDialog(false);
  };

  const handleBreakClick = () => {
    if (timer.isRunning) {
      setShowBreakDialog1(true);
    }
  };

  const startBreak = (minutes: number | null) => {
    const duration = timer.stop();
    if (selectedTask && duration > 0) {
      addSession({
        taskId: selectedTask.id,
        taskName: selectedTask.name,
        date: todayStr,
        duration,
        type: 'work',
        timestamp: Date.now(),
      });
    }
    timer.reset();
    setIsOnBreak(true);
    setBreakStart(Date.now());
    setBreakLimit(minutes ? minutes * 60 : null);
    setBreakElapsed(0);
    setShowBreakDialog2(false);
    if (dontAskBreak) {
      updateSettings({ askBreakTimer: false });
    }
  };

  const endBreak = () => {
    if (breakElapsed > 0) {
      addSession({
        taskId: selectedTask?.id || 'break',
        taskName: 'Mola',
        date: todayStr,
        duration: breakElapsed,
        type: 'break',
        timestamp: Date.now(),
      });
    }
    setIsOnBreak(false);
    setBreakStart(null);
    setBreakLimit(null);
    setBreakElapsed(0);
  };

  const handleAddUnplannedTask = (taskId: string) => {
    addTaskToDate(taskId, todayStr);
    setSheetOpen(false);
    setSearchQuery('');
  };

  const handleCreateNewTask = () => {
    if (!newTaskName.trim()) return;
    const task = addTask({ name: newTaskName.trim(), dates: [todayStr] });
    setNewTaskName('');
    setShowNewTaskInput(false);
    setSheetOpen(false);
    setSelectedTaskId(task.id);
  };

  const handleFreeWork = () => {
    let freeTask = tasks.find(t => t.name === 'Serbest Çalışma');
    if (!freeTask) {
      freeTask = addTask({ name: 'Serbest Çalışma', dates: [todayStr] });
    } else if (!freeTask.dates.includes(todayStr)) {
      addTaskToDate(freeTask.id, todayStr);
    }
    setSelectedTaskId(freeTask.id);
    setSheetOpen(false);
  };

  // Timer ring
  const ringSize = 240;
  const strokeW = 5;
  const radius = (ringSize - strokeW) / 2;
  const circumference = 2 * Math.PI * radius;
  const isHourMode = timer.elapsed >= 3600;
  const ringProgress = isHourMode
    ? (timer.elapsed % 3600) / 3600
    : (timer.elapsed % 60) / 60;
  const dashOffset = circumference * (1 - ringProgress);

  const breakRingProgress = breakLimit
    ? Math.min(breakElapsed / breakLimit, 1)
    : (breakElapsed % 60) / 60;
  const breakDashOffset = circumference * (1 - breakRingProgress);

  // Swipe handlers for summary carousel
  const handleTouchStart = (e: React.TouchEvent) => setTouchStartX(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      setSummaryIndex(diff > 0 ? 1 : 0);
    }
    setTouchStartX(null);
  };

  return (
    <div className="px-4 pt-6 flex flex-col min-h-[calc(100vh-5rem)]">
      {/* TOP: Today's Tasks Accordion */}
      <div className="mb-4">
        <button
          onClick={() => setAccordionOpen(!accordionOpen)}
          className="flex items-center justify-between w-full text-left"
        >
          <h2 className="text-sm font-semibold text-foreground">Bugün Planlanan Görevler</h2>
          <ChevronDown
            size={18}
            className={`text-muted-foreground transition-transform duration-200 ${accordionOpen ? 'rotate-180' : ''}`}
          />
        </button>

        <AnimatePresence>
          {accordionOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-2 space-y-1.5">
                {todayTasks.length === 0 && (
                  <p className="text-xs text-muted-foreground py-2">Bugün için görev planlanmamış.</p>
                )}
                {todayTasks.map(task => (
                  <button
                    key={task.id}
                    onClick={() => selectTask(task.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors ${
                      selectedTaskId === task.id
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'bg-card text-card-foreground hover:bg-accent'
                    } ${isTaskCompleted(task.id, todayStr) ? 'line-through opacity-50' : ''}`}
                  >
                    {task.name}
                    {task.category && (
                      <span className="ml-2 text-xs text-muted-foreground">• {task.category}</span>
                    )}
                  </button>
                ))}

                <Drawer open={sheetOpen} onOpenChange={setSheetOpen}>
                  <DrawerTrigger asChild>
                    <button className="w-full text-center text-xs text-primary font-medium py-2 hover:underline">
                      Daha Fazla
                    </button>
                  </DrawerTrigger>
                  <DrawerContent>
                    <DrawerHeader>
                      <DrawerTitle>Görev Ekle</DrawerTitle>
                    </DrawerHeader>
                    <div className="px-4 pb-8 space-y-3">
                      {filteredUnplanned.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Bugün planlanmayan görevler</p>
                          <div className="space-y-1">
                            {filteredUnplanned.slice(0, 5).map(t => (
                              <button
                                key={t.id}
                                onClick={() => handleAddUnplannedTask(t.id)}
                                className="w-full text-left px-3 py-2.5 bg-card rounded-xl text-sm hover:bg-accent transition-colors"
                              >
                                {t.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                        <Input
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          placeholder="Görev ara..."
                          className="pl-9"
                        />
                      </div>
                      {showNewTaskInput ? (
                        <div className="flex gap-2">
                          <Input
                            value={newTaskName}
                            onChange={e => setNewTaskName(e.target.value)}
                            placeholder="Görev adı"
                            onKeyDown={e => e.key === 'Enter' && handleCreateNewTask()}
                            autoFocus
                          />
                          <Button size="sm" onClick={handleCreateNewTask}>Ekle</Button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowNewTaskInput(true)}
                          className="flex items-center gap-2 w-full px-3 py-2.5 bg-accent rounded-xl text-sm text-accent-foreground hover:opacity-80 transition-opacity"
                        >
                          <Plus size={16} />
                          Yeni görev oluştur
                        </button>
                      )}
                      <button
                        onClick={handleFreeWork}
                        className="flex items-center gap-2 w-full px-3 py-2.5 bg-accent rounded-xl text-sm text-accent-foreground hover:opacity-80 transition-opacity"
                      >
                        <Zap size={16} />
                        Serbest çalışma
                      </button>
                    </div>
                  </DrawerContent>
                </Drawer>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Selected task indicator */}
      {selectedTask && !timer.isRunning && timer.elapsed === 0 && !isOnBreak && (
        <div className="text-center mb-2">
          <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
            {selectedTask.name}
          </span>
        </div>
      )}
      {timer.currentTaskName && (timer.isRunning || timer.elapsed > 0) && (
        <div className="text-center mb-2">
          <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
            {timer.currentTaskName}
          </span>
        </div>
      )}
      {isOnBreak && (
        <div className="text-center mb-2">
          <span className="text-xs font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">
            ☕ Mola
          </span>
        </div>
      )}

      {/* MIDDLE: TIMER */}
      <div className="flex-1 flex flex-col items-center justify-center -mt-4">
        <div className="relative" style={{ width: ringSize, height: ringSize }}>
          <svg width={ringSize} height={ringSize} className="transform -rotate-90">
            <circle
              cx={ringSize / 2} cy={ringSize / 2} r={radius}
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth={strokeW}
            />
            <circle
              cx={ringSize / 2} cy={ringSize / 2} r={radius}
              fill="none"
              stroke={isOnBreak ? 'hsl(var(--muted-foreground))' : 'hsl(var(--primary))'}
              strokeWidth={strokeW}
              strokeDasharray={circumference}
              strokeDashoffset={isOnBreak ? breakDashOffset : dashOffset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-linear"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl font-bold tracking-tight text-foreground tabular-nums">
              {isOnBreak
                ? timer.formatTime(breakElapsed)
                : timer.formatTime(timer.elapsed)
              }
            </span>
          </div>
        </div>

        {isOnBreak && breakLimit && (
          <p className="text-xs text-muted-foreground mt-2">
            {timer.formatTime(Math.max(0, breakLimit - breakElapsed))} kaldı
          </p>
        )}

        {/* CONTROLS */}
        <div className="mt-8 w-full max-w-xs space-y-3">
          {isOnBreak ? (
            <Button onClick={endBreak} className="w-full h-12 text-base font-semibold rounded-2xl" size="lg">
              Çalışmaya Dön
            </Button>
          ) : !timer.isRunning && timer.elapsed === 0 ? (
            <Button
              onClick={handleStart}
              disabled={!selectedTaskId}
              className="w-full h-14 text-lg font-bold rounded-2xl"
              size="lg"
            >
              <Play size={20} className="mr-2" />
              BAŞLAT
            </Button>
          ) : (
            <div className="flex gap-3">
              {timer.isRunning ? (
                <Button onClick={handlePause} variant="outline" className="flex-1 h-12 rounded-2xl font-semibold">
                  DURDUR
                </Button>
              ) : (
                <Button onClick={handleResume} variant="outline" className="flex-1 h-12 rounded-2xl font-semibold">
                  DEVAM
                </Button>
              )}
              <Button onClick={handleFinish} className="flex-1 h-12 rounded-2xl font-semibold">
                <CheckCircle2 size={18} className="mr-1.5" />
                BİTİR
              </Button>
            </div>
          )}

          {(timer.isRunning || (timer.elapsed > 0 && !isOnBreak)) && (
            <button
              onClick={handleBreakClick}
              className="flex items-center justify-center gap-1.5 w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              <Coffee size={14} />
              Molaya mı ihtiyacın var?
            </button>
          )}

          {!selectedTaskId && !isOnBreak && timer.elapsed === 0 && (
            <p className="text-xs text-center text-muted-foreground">
              Başlamak için yukarıdan bir görev seç
            </p>
          )}
        </div>
      </div>

      {/* BOTTOM: Day Summary Carousel */}
      <div className="mt-4 pb-2">
        <div
          className="relative overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="flex transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${summaryIndex * 100}%)` }}
          >
            {/* Card 1 - Süre Özeti */}
            <div className="w-full flex-shrink-0 px-1">
              <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
                <p className="text-xs text-muted-foreground mb-2">Süre Özeti</p>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-2xl font-bold text-foreground">{timer.formatTime(totalWork)}</span>
                  <span className="text-xs text-muted-foreground">çalışma</span>
                </div>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-lg font-medium text-muted-foreground">{timer.formatTime(totalBreak)}</span>
                  <span className="text-xs text-muted-foreground">mola</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${totalWork + totalBreak > 0 ? (totalWork / (totalWork + totalBreak)) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Card 2 - Görev İlerlemesi */}
            <div className="w-full flex-shrink-0 px-1">
              <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
                <p className="text-xs text-muted-foreground mb-2">Görev İlerlemesi</p>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-2xl font-bold text-foreground">{completedCount}</span>
                  <span className="text-lg text-muted-foreground">/ {todayTasks.length}</span>
                  <span className="text-xs text-muted-foreground ml-1">tamamlandı</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${todayTasks.length > 0 ? (completedCount / todayTasks.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dot indicators */}
        <div className="flex justify-center gap-1.5 mt-3">
          {[0, 1].map(i => (
            <button
              key={i}
              onClick={() => setSummaryIndex(i)}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                summaryIndex === i ? 'bg-primary w-4' : 'bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>
      </div>

      {/* DIALOGS */}
      <AlertDialog open={showBreakDialog1} onOpenChange={setShowBreakDialog1}>
        <AlertDialogContent className="rounded-2xl max-w-sm mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Çalışma durdurulsun mu?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            <AlertDialogAction
              onClick={() => {
                setShowBreakDialog1(false);
                if (settings.askBreakTimer) {
                  setShowBreakDialog2(true);
                } else {
                  startBreak(settings.defaultBreakDuration);
                }
              }}
              className="rounded-xl"
            >
              Durdur & Molaya Geç
            </AlertDialogAction>
            <AlertDialogAction
              onClick={() => {
                setShowBreakDialog1(false);
                handleFinish();
              }}
              className="rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/80"
            >
              Görevi Bitir
            </AlertDialogAction>
            <AlertDialogCancel className="rounded-xl">İptal</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showBreakDialog2} onOpenChange={setShowBreakDialog2}>
        <AlertDialogContent className="rounded-2xl max-w-sm mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Molayı zamanlamak ister misiniz?</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="grid grid-cols-2 gap-2 py-2">
            {[5, 10, 30].map(m => (
              <Button
                key={m}
                variant="outline"
                className="rounded-xl"
                onClick={() => startBreak(m)}
              >
                {m} dk
              </Button>
            ))}
            <div className="flex gap-1">
              <Input
                type="number"
                placeholder="dk"
                value={customBreakMinutes}
                onChange={e => setCustomBreakMinutes(e.target.value)}
                className="rounded-xl w-16"
              />
              <Button
                variant="outline"
                className="rounded-xl"
                disabled={!customBreakMinutes}
                onClick={() => startBreak(parseInt(customBreakMinutes) || 5)}
              >
                Seç
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full rounded-xl text-muted-foreground"
            onClick={() => startBreak(null)}
          >
            Atla
          </Button>
          <div className="flex items-center gap-2 pt-1">
            <Checkbox
              id="dontAsk"
              checked={dontAskBreak}
              onCheckedChange={(v) => setDontAskBreak(!!v)}
            />
            <label htmlFor="dontAsk" className="text-xs text-muted-foreground cursor-pointer">
              Bunu bir daha sorma (Ayarlardan değiştirilebilir)
            </label>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
        <AlertDialogContent className="rounded-2xl max-w-sm mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Görev tamamlandı mı?</AlertDialogTitle>
            <AlertDialogDescription>
              Süren kaydedilecek.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-3">
            <AlertDialogAction className="flex-1 rounded-xl" onClick={() => completeTask(true)}>
              Evet
            </AlertDialogAction>
            <AlertDialogCancel className="flex-1 rounded-xl" onClick={() => completeTask(false)}>
              Hayır
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
