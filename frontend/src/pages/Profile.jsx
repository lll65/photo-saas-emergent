import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { API } from "@/App";
import { 
  Sparkles, User, LogOut, Upload, History, 
  Image as ImageIcon, Crown, Calendar, ArrowRight
} from "lucide-react";

const Profile = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`${API}/user/profile`, {
        credentials: "include"
      });
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (error) {
      toast.error("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API}/auth/logout`, {
        method: "POST",
        credentials: "include"
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
    navigate("/");
  };

  const handleUpgrade = async () => {
    try {
      const response = await fetch(`${API}/user/upgrade`, {
        method: "POST",
        credentials: "include"
      });
      if (response.ok) {
        toast.success("Bienvenue en Premium ! 🎉");
        fetchProfile();
        setUser(prev => ({ ...prev, subscription: "premium" }));
      }
    } catch (error) {
      toast.error("Erreur de connexion");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-brutal-sm">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">PhotoPrep</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              to="/dashboard" 
              className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload
            </Link>
            <Link 
              to="/history" 
              className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
            >
              <History className="w-4 h-4" />
              Historique
            </Link>
            <Link 
              to="/pricing" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Tarifs
            </Link>
          </nav>
          
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Mon profil</h1>
          <p className="text-muted-foreground">
            Gère ton compte et tes abonnements
          </p>
        </div>

        {/* Profile Card */}
        <Card className="border-2 border-foreground rounded-2xl p-8 shadow-brutal mb-8">
          <div className="flex items-center gap-6">
            {profile?.picture ? (
              <img 
                src={profile.picture} 
                alt={profile.name}
                className="w-20 h-20 rounded-full border-4 border-primary"
              />
            ) : (
              <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center">
                <User className="w-10 h-10 text-primary" />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl font-bold">{profile?.name}</h2>
                {profile?.subscription === "premium" && (
                  <div className="bg-accent text-accent-foreground px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <Crown className="w-3 h-3" />
                    Premium
                  </div>
                )}
              </div>
              <p className="text-muted-foreground">{profile?.email}</p>
            </div>
          </div>
        </Card>

        {/* Stats Cards */}
        <div className="grid sm:grid-cols-2 gap-6 mb-8">
          <Card className="bg-card border-2 border-foreground rounded-xl p-6 shadow-brutal-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{profile?.total_images || 0}</p>
                <p className="text-sm text-muted-foreground">Images totales</p>
              </div>
            </div>
          </Card>
          
          <Card className="bg-card border-2 border-foreground rounded-xl p-6 shadow-brutal-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{profile?.images_this_month || 0}</p>
                <p className="text-sm text-muted-foreground">Ce mois-ci</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Subscription Card */}
        <Card className="bg-card border-2 border-foreground rounded-2xl p-8 shadow-brutal">
          <h3 className="text-lg font-bold mb-6">Mon abonnement</h3>
          
          {profile?.subscription === "free" ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-semibold">Plan Gratuit</p>
                  <p className="text-sm text-muted-foreground">5 photos par mois</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{profile?.credits}</p>
                  <p className="text-sm text-muted-foreground">crédits restants</p>
                </div>
              </div>
              
              <Progress value={(profile?.credits / 5) * 100} className="h-3 mb-6" />
              
              <div className="bg-secondary/50 rounded-xl p-4 mb-6">
                <p className="font-medium mb-2">Passe au Premium pour :</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✓ Photos illimitées</li>
                  <li>✓ Traitement prioritaire</li>
                  <li>✓ Sans filigrane</li>
                  <li>✓ Support prioritaire</li>
                </ul>
              </div>
              
              <Button
                data-testid="profile-upgrade-btn"
                onClick={handleUpgrade}
                className="w-full bg-primary text-white hover:bg-primary/90 rounded-full py-6 shadow-brutal hover:shadow-brutal-hover hover:translate-y-[2px] transition-all font-bold"
              >
                Passer au Premium - 9.99€/mois
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="font-semibold flex items-center gap-2">
                    Plan Premium
                    <Crown className="w-4 h-4 text-primary" />
                  </p>
                  <p className="text-sm text-muted-foreground">Photos illimitées</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">∞</p>
                  <p className="text-sm text-muted-foreground">illimité</p>
                </div>
              </div>
              
              <div className="bg-accent/20 rounded-xl p-4">
                <p className="text-sm text-accent-foreground">
                  🎉 Tu profites de toutes les fonctionnalités Premium !
                </p>
              </div>
            </div>
          )}
        </Card>

        {/* Danger Zone */}
        <Card className="bg-card border-2 border-destructive/30 rounded-2xl p-8 mt-8">
          <h3 className="text-lg font-bold text-destructive mb-4">Zone de danger</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Se déconnecter supprimera ta session actuelle. Tes images et ton historique seront conservés.
          </p>
          <Button
            variant="destructive"
            onClick={handleLogout}
            className="rounded-full"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Se déconnecter
          </Button>
        </Card>
      </main>
    </div>
  );
};

export default Profile;
