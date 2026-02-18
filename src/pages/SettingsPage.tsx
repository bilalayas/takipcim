import { useApp } from '@/context/AppContext';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ColorPalette, paletteNames } from '@/types';
import { Download, Trash2, Sun, Moon } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function SettingsPage() {
  const { settings, updateSettings, clearAllData, exportData } = useApp();

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timetracker-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="px-4 pt-6">
      <h1 className="text-lg font-bold mb-6 text-foreground">Ayarlar</h1>

      <div className="space-y-6">
        {/* Notifications */}
        <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
          <h3 className="text-sm font-semibold mb-3 text-card-foreground">Bildirim Ayarları</h3>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Bildirimler</span>
            <Switch
              checked={settings.notifications}
              onCheckedChange={v => updateSettings({ notifications: v })}
            />
          </div>
        </div>

        {/* Break timer */}
        <div className="bg-card rounded-2xl p-4 border border-border shadow-sm space-y-3">
          <h3 className="text-sm font-semibold text-card-foreground">Mola Zamanlayıcı</h3>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Zamanlayıcıyı göster</span>
            <Switch
              checked={settings.askBreakTimer}
              onCheckedChange={v => updateSettings({ askBreakTimer: v })}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Varsayılan mola süresi</span>
            <Select
              value={String(settings.defaultBreakDuration)}
              onValueChange={v => updateSettings({ defaultBreakDuration: parseInt(v) })}
            >
              <SelectTrigger className="w-24 h-8 rounded-lg text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 dk</SelectItem>
                <SelectItem value="10">10 dk</SelectItem>
                <SelectItem value="15">15 dk</SelectItem>
                <SelectItem value="30">30 dk</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Theme */}
        <div className="bg-card rounded-2xl p-4 border border-border shadow-sm space-y-3">
          <h3 className="text-sm font-semibold text-card-foreground">Tema</h3>

          {/* Mode */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Mod</span>
            <div className="flex gap-1 bg-muted rounded-lg p-0.5">
              <button
                onClick={() => updateSettings({ themeMode: 'light' })}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs transition-colors ${
                  settings.themeMode === 'light'
                    ? 'bg-card text-foreground shadow-sm font-medium'
                    : 'text-muted-foreground'
                }`}
              >
                <Sun size={12} />
                Light
              </button>
              <button
                onClick={() => updateSettings({ themeMode: 'dark' })}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs transition-colors ${
                  settings.themeMode === 'dark'
                    ? 'bg-card text-foreground shadow-sm font-medium'
                    : 'text-muted-foreground'
                }`}
              >
                <Moon size={12} />
                Dark
              </button>
            </div>
          </div>

          {/* Palette */}
          <div>
            <span className="text-sm text-muted-foreground block mb-2">Renk Paleti</span>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(paletteNames) as [ColorPalette, string][]).map(([key, name]) => {
                const colors: Record<ColorPalette, string> = {
                  forest: 'bg-[hsl(152,44%,34%)]',
                  pink: 'bg-[hsl(340,55%,60%)]',
                  blue: 'bg-[hsl(210,55%,45%)]',
                  mono: 'bg-[hsl(0,0%,15%)]',
                };
                return (
                  <button
                    key={key}
                    onClick={() => updateSettings({ colorPalette: key })}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all ${
                      settings.colorPalette === key
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full ${colors[key]}`} />
                    <span className="text-xs font-medium">{name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Data actions */}
        <div className="flex gap-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="flex-1 rounded-2xl h-11 text-destructive border-destructive/30 hover:bg-destructive/5">
                <Trash2 size={14} className="mr-2" />
                Veri Sıfırla
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl max-w-sm">
              <AlertDialogHeader>
                <AlertDialogTitle>Tüm veriler silinsin mi?</AlertDialogTitle>
                <AlertDialogDescription>
                  Bu işlem geri alınamaz. Tüm görevler, oturumlar ve tamamlama bilgileri silinecek.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl">İptal</AlertDialogCancel>
                <AlertDialogAction onClick={clearAllData} className="rounded-xl bg-destructive text-destructive-foreground">
                  Sıfırla
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button
            variant="outline"
            className="flex-1 rounded-2xl h-11"
            onClick={handleExport}
          >
            <Download size={14} className="mr-2" />
            Veri Export
          </Button>
        </div>
      </div>
    </div>
  );
}
