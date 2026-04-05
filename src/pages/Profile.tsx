import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import BottomNav from '@/components/layout/BottomNav';
import {
  User, Mail, Phone, Globe, Moon, Sun, LogOut,
  Save, Loader2, Shield, Info
} from 'lucide-react';
import { toast } from 'sonner';

const CURRENCIES = [
  { value: 'INR', label: '₹ Indian Rupee (INR)' },
  { value: 'USD', label: '$ US Dollar (USD)' },
  { value: 'EUR', label: '€ Euro (EUR)' },
  { value: 'GBP', label: '£ British Pound (GBP)' },
];

export default function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const { theme, setTheme } = useTheme();

  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [hasChanges, setHasChanges] = useState(false);

  const normalizePhoneNumber = (value: string) => value.replace(/\D/g, '').slice(-10);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setPhoneNumber(profile.phone_number || '');
      setCurrency(profile.currency || 'INR');
    }
  }, [profile]);

  useEffect(() => {
    if (profile) {
      const normalizedCurrentPhone = normalizePhoneNumber(phoneNumber);
      const normalizedProfilePhone = normalizePhoneNumber(profile.phone_number || '');
      const changed =
        displayName !== (profile.display_name || '') ||
        normalizedCurrentPhone !== normalizedProfilePhone ||
        currency !== (profile.currency || 'INR');
      setHasChanges(changed);
    }
  }, [displayName, phoneNumber, currency, profile]);

  const handleSave = async () => {
    const trimmedPhone = phoneNumber.trim();
    let normalizedPhone: string | undefined;

    if (trimmedPhone) {
      const digits = normalizePhoneNumber(trimmedPhone);
      if (digits.length !== 10) {
        toast.error('Please enter a valid 10-digit phone number');
        return;
      }
      normalizedPhone = digits;
    }

    await updateProfile.mutateAsync({
      display_name: displayName.trim() || undefined,
      phone_number: normalizedPhone,
      currency,
    });

    setPhoneNumber(normalizedPhone || '');
    setHasChanges(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const isDark = theme === 'dark';

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold text-foreground">Profile</h1>
          {hasChanges && (
            <Button
              size="sm"
              onClick={handleSave}
              disabled={updateProfile.isPending}
            >
              {updateProfile.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save
            </Button>
          )}
        </div>
      </header>

      <div className="p-4 space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : (
          <>
            {/* User Avatar & Info */}
            <div className="flex flex-col items-center py-6">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <User className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">
                {profile?.display_name || user?.user_metadata?.display_name || 'User'}
              </h2>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <Mail className="h-3.5 w-3.5" />
                {user?.email}
              </p>
            </div>

            {/* Personal Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    placeholder="Your name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      placeholder="+91 XXXXX XXXXX"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/[^\d\s()+-]/g, ''))}
                      inputMode="tel"
                      className="pl-9"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Stored as a normalized 10-digit number for contact matching.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Preferences */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    This converts all amounts across the app using the latest exchange rate (base currency: INR).
                  </p>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isDark ? (
                      <Moon className="h-5 w-5 text-primary" />
                    ) : (
                      <Sun className="h-5 w-5 text-accent" />
                    )}
                    <div>
                      <p className="font-medium text-sm">Dark Mode</p>
                      <p className="text-xs text-muted-foreground">
                        {isDark ? 'Dark theme active' : 'Light theme active'}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={isDark}
                    onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Account */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  Account
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="destructive"
                  className="w-full gap-2"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </CardContent>
            </Card>

            {/* App Info */}
            <div className="text-center text-xs text-muted-foreground space-y-1 pt-4">
              <div className="flex items-center justify-center gap-1">
                <Info className="h-3 w-3" />
                <span>Kanakku v1.0.0</span>
              </div>
              <p>Expense Tracker for Indian Users</p>
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
