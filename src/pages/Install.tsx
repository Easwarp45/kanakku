import { Download, Check, Wifi, Zap, Shield, Share, MoreVertical } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { KanakkuLogo } from '@/components/ui/KanakkuLogo';

export default function Install() {
  const { isInstallable, isInstalled, promptInstall } = usePWA();
  const navigate = useNavigate();

  const handleInstall = async () => {
    const success = await promptInstall();
    if (success) {
      navigate('/dashboard');
    }
  };

  const features = [
    { icon: Wifi, title: 'Works Offline', description: 'Track expenses even without internet' },
    { icon: Zap, title: 'Fast & Light', description: 'Loads instantly, uses minimal data' },
    { icon: Shield, title: 'Secure', description: 'Your data stays on your device' },
  ];

  // iOS detection
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  return (
    <div className="min-h-screen bg-background p-4 safe-top safe-bottom">
      <div className="max-w-md mx-auto pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 -m-4 rounded-full"
                style={{ background: 'radial-gradient(circle,rgba(0,207,255,0.2) 0%,transparent 70%)', filter: 'blur(12px)' }}
              />
              <KanakkuLogo size={88} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground mt-2">Install Kanakku</h1>
          <p className="text-muted-foreground mt-2">
            Get the full app experience on your device
          </p>
        </div>

        {/* Features */}
        <div className="space-y-3 mb-8">
          {features.map((feature) => (
            <Card key={feature.title} className="border-border">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="bg-secondary/10 rounded-lg p-2.5">
                  <feature.icon className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Install Status */}
        {isInstalled ? (
          <Card className="border-secondary bg-secondary/5">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="bg-secondary rounded-full p-2">
                <Check className="h-5 w-5 text-secondary-foreground" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Already Installed!</h3>
                <p className="text-sm text-muted-foreground">
                  Kanakku is ready on your home screen
                </p>
              </div>
            </CardContent>
          </Card>
        ) : isInstallable ? (
          <Button 
            size="lg" 
            onClick={handleInstall} 
            className="w-full gap-2 h-12"
          >
            <Download className="h-5 w-5" />
            Install Now
          </Button>
        ) : (
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">How to Install</CardTitle>
              <CardDescription>
                {isIOS ? 'Safari on iOS' : 'Chrome/Edge on Android'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isIOS ? (
                <>
                  <div className="flex items-center gap-3">
                    <div className="bg-muted rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">1</div>
                    <span className="text-sm">Tap <Share className="inline h-4 w-4" /> Share button</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-muted rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">2</div>
                    <span className="text-sm">Scroll and tap "Add to Home Screen"</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-muted rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">3</div>
                    <span className="text-sm">Tap "Add" to confirm</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <div className="bg-muted rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">1</div>
                    <span className="text-sm">Tap <MoreVertical className="inline h-4 w-4" /> menu (3 dots)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-muted rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">2</div>
                    <span className="text-sm">Tap "Add to Home Screen" or "Install"</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-muted rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">3</div>
                    <span className="text-sm">Tap "Install" to confirm</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Continue Button */}
        <Button 
          variant="ghost" 
          className="w-full mt-4"
          onClick={() => navigate('/dashboard')}
        >
          Continue in Browser
        </Button>
      </div>
    </div>
  );
}
