import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { API } from "@/App";
import { 
  Sparkles, Check, ArrowRight, Zap, Crown, Star
} from "lucide-react";

const Pricing = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch(`${API}/auth/me`, {
        credentials: "include"
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      // Not logged in - that's ok for pricing page
    } finally {
      setLoading(false);
    }
  };

  // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
  const handleLogin = () => {
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const handleUpgrade = async () => {
    if (!user) {
      handleLogin();
      return;
    }
    
    setUpgrading(true);
    try {
      const response = await fetch(`${API}/user/upgrade`, {
        method: "POST",
        credentials: "include"
      });
      if (response.ok) {
        toast.success("Bienvenue en Premium ! 🎉", {
          description: "Tu as maintenant un accès illimité"
        });
        setUser(prev => ({ ...prev, subscription: "premium" }));
      } else {
        toast.error("Erreur lors de la mise à niveau");
      }
    } catch (error) {
      toast.error("Erreur de connexion");
    } finally {
      setUpgrading(false);
    }
  };

  const handleDowngrade = async () => {
    try {
      const response = await fetch(`${API}/user/downgrade`, {
        method: "POST",
        credentials: "include"
      });
      if (response.ok) {
        toast.success("Plan modifié", {
          description: "Tu es de retour sur le plan gratuit"
        });
        setUser(prev => ({ ...prev, subscription: "free", credits: 5 }));
      }
    } catch (error) {
      toast.error("Erreur de connexion");
    }
  };

  const plans = [
    {
      name: "Gratuit",
      price: "0€",
      period: "/mois",
      description: "Parfait pour commencer",
      features: [
        "5 photos par mois",
        "Suppression de fond",
        "Fond blanc automatique",
        "Téléchargement HD",
        "Historique 30 jours"
      ],
      limitations: [
        "Filigrane discret",
        "Traitement standard"
      ],
      cta: user?.subscription === "free" ? "Plan actuel" : "Commencer",
      popular: false,
      disabled: user?.subscription === "free"
    },
    {
      name: "Premium",
      price: "9.99€",
      period: "/mois",
      description: "Pour les vendeurs sérieux",
      features: [
        "Photos illimitées",
        "Suppression de fond avancée",
        "Fond blanc parfait",
        "Téléchargement HD max",
        "Historique illimité",
        "Sans filigrane",
        "Traitement prioritaire",
        "Support prioritaire"
      ],
      limitations: [],
      cta: user?.subscription === "premium" ? "Plan actuel" : "Passer au Premium",
      popular: true,
      disabled: user?.subscription === "premium"
    }
  ];

  return (
    <div className="min-h-screen bg-background noise-bg">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-brutal-sm">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">PhotoPrep</span>
          </Link>
          <div className="flex items-center gap-4">
            {user ? (
              <Link to="/dashboard">
                <Button className="bg-primary text-white hover:bg-primary/90 rounded-full px-6 shadow-brutal-sm hover:shadow-brutal-hover hover:translate-y-[2px] transition-all font-semibold">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <Button 
                onClick={handleLogin}
                className="bg-primary text-white hover:bg-primary/90 rounded-full px-6 shadow-brutal-sm hover:shadow-brutal-hover hover:translate-y-[2px] transition-all font-semibold"
              >
                Connexion
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-12 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Star className="w-4 h-4" />
            Tarification simple et transparente
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">
            Choisis ton plan
          </h1>
          <p className="text-lg text-muted-foreground">
            Commence gratuitement, passe au premium quand tu veux
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {plans.map((plan, index) => (
              <Card 
                key={index}
                data-testid={`pricing-card-${plan.name.toLowerCase()}`}
                className={`relative border-2 rounded-2xl p-8 ${
                  plan.popular 
                    ? 'border-primary shadow-brutal bg-card' 
                    : 'border-foreground shadow-brutal-sm bg-card'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="bg-primary text-white px-4 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                      <Crown className="w-4 h-4" />
                      Populaire
                    </div>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                </div>
                
                <div className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-accent-foreground" />
                      </div>
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                  {plan.limitations.map((limitation, i) => (
                    <div key={i} className="flex items-center gap-3 text-muted-foreground">
                      <div className="w-5 h-5 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xs">-</span>
                      </div>
                      <span className="text-sm">{limitation}</span>
                    </div>
                  ))}
                </div>
                
                {plan.popular ? (
                  <Button
                    data-testid="upgrade-btn"
                    onClick={handleUpgrade}
                    disabled={plan.disabled || upgrading}
                    className="w-full bg-primary text-white hover:bg-primary/90 rounded-full py-6 text-lg shadow-brutal hover:shadow-brutal-hover hover:translate-y-[2px] transition-all font-bold"
                  >
                    {upgrading ? "Mise à niveau..." : plan.cta}
                    {!plan.disabled && <ArrowRight className="w-5 h-5 ml-2" />}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={user ? () => {} : handleLogin}
                    disabled={plan.disabled}
                    className="w-full rounded-full py-6 text-lg border-2 border-foreground shadow-brutal-sm hover:shadow-brutal-hover hover:translate-y-[2px] transition-all font-bold"
                  >
                    {plan.cta}
                  </Button>
                )}
                
                {user?.subscription === "premium" && !plan.popular && (
                  <button 
                    onClick={handleDowngrade}
                    className="w-full text-center text-sm text-muted-foreground hover:text-foreground mt-4 underline"
                  >
                    Revenir au plan gratuit
                  </button>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6 bg-muted/50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Questions fréquentes</h2>
          <div className="space-y-6">
            {[
              {
                q: "Qu'est-ce qui est inclus dans les 5 photos gratuites ?",
                a: "Chaque mois, tu peux traiter jusqu'à 5 photos avec suppression de fond et optimisation automatique. Les photos non utilisées ne s'accumulent pas."
              },
              {
                q: "Puis-je annuler mon abonnement Premium ?",
                a: "Oui, tu peux annuler à tout moment. Tu garderas l'accès premium jusqu'à la fin de ta période de facturation."
              },
              {
                q: "Quelle est la qualité des images téléchargées ?",
                a: "Les images sont téléchargées en qualité HD (jusqu'à 4K pour le Premium). Le format est optimisé pour les plateformes de revente."
              },
              {
                q: "Mes photos sont-elles sécurisées ?",
                a: "Oui, tes photos sont stockées de manière sécurisée et ne sont jamais partagées. Tu peux les supprimer à tout moment."
              }
            ].map((faq, index) => (
              <Card key={index} className="bg-card border-2 border-foreground rounded-xl p-6 shadow-brutal-sm">
                <h3 className="font-bold mb-2">{faq.q}</h3>
                <p className="text-muted-foreground text-sm">{faq.a}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold">PhotoPrep</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2025 PhotoPrep. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Pricing;
