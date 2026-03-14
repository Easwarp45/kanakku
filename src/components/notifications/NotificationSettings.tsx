import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bell, BellOff, Target, Users, Receipt } from 'lucide-react';
import { toast } from 'sonner';

export function NotificationSettings() {
  const { permission, prefs, isSupported, requestPermission, updatePrefs } = useNotifications();

  const handleEnableNotifications = async () => {
    const result = await requestPermission();
    if (result === 'granted') {
      toast.success('Notifications enabled!');
    } else if (result === 'denied') {
      toast.error('Notifications blocked. Please enable them in your browser settings.');
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-muted-foreground">
          <BellOff className="h-8 w-8 mx-auto mb-2" />
          <p>Notifications are not supported in this browser.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Bell className="h-5 w-5" />
          Notification Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {permission !== 'granted' ? (
          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Enable notifications to get budget alerts, settlement reminders, and expense logging reminders.
            </p>
            <Button onClick={handleEnableNotifications} className="w-full">
              <Bell className="h-4 w-4 mr-2" />
              Enable Notifications
            </Button>
            {permission === 'denied' && (
              <p className="text-xs text-destructive">
                Notifications are blocked. Please enable them in your browser settings.
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Target className="h-5 w-5 text-destructive" />
                <div>
                  <Label className="font-medium">Budget Alerts</Label>
                  <p className="text-xs text-muted-foreground">Get notified when nearing or exceeding budgets</p>
                </div>
              </div>
              <Switch
                checked={prefs.budgetAlerts}
                onCheckedChange={(checked) => updatePrefs({ budgetAlerts: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <Label className="font-medium">Settlement Reminders</Label>
                  <p className="text-xs text-muted-foreground">Reminders for unsettled group expenses</p>
                </div>
              </div>
              <Switch
                checked={prefs.settlementReminders}
                onCheckedChange={(checked) => updatePrefs({ settlementReminders: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Receipt className="h-5 w-5 text-secondary-foreground" />
                <div>
                  <Label className="font-medium">Expense Reminders</Label>
                  <p className="text-xs text-muted-foreground">Daily reminder to log your expenses</p>
                </div>
              </div>
              <Switch
                checked={prefs.expenseReminders}
                onCheckedChange={(checked) => updatePrefs({ expenseReminders: checked })}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Reminder Time</Label>
              <Input
                type="time"
                value={prefs.reminderTime}
                onChange={(e) => updatePrefs({ reminderTime: e.target.value })}
                className="w-32"
              />
              <p className="text-xs text-muted-foreground">
                When to send daily expense logging reminders
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
