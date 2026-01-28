import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { API } from "@/App";
import { 
  Sparkles, Check, ArrowRight, X, Crown, Zap, Rocket, 
  Clock, Image as ImageIcon, Gauge, HelpCircle
} from "lucide-react";

const Pricing = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(null);

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
      // Not logged in
    } finally {
      setLoading(false);
    }
  };

  // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
  const handleLogin = () => {
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const handleUpgrade = async (plan) => {
    if (!user) {
      handleLogin();
      return;
    }
    
    setUpgrading(plan);
    try {
      const response = await fetch(`${API}/user/upgrade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ plan })
      });
      if (response.ok) {
        const data = await response.json();
        toast.success(`Bienvenue sur ${plan === 'starter' ? 'Starter' : 'Pro'} !`, {
          description: plan === 'starter' ? "30 photos/mois débloquées" : "Accès illimité activé"
        });
        setUser(prev => ({ ...prev, subscription: plan, credits: data.credits }));
      } else {
        toast.error("Erreur lors de la mise à niveau");
      }
    } catch (error) {
      toast.error("Erreur de connexion");
    } finally {
      setUpgrading(null);
    }
  };

  const handleDowngrade = async () => {
    try {
      const response = await fetch(`${API}/user/downgrade`, {
        method: "POST",
        credentials: "include"
      });
      if (response.ok) {
        toast.success("Plan modifié", { description: "Retour au plan gratuit" });
        setUser(prev => ({ ...prev, subscription: "free", credits: 3 }));
      }
    } catch (error) {
      toast.error("Erreur de connexion");
    }
  };

  const plans = [
    {
      id: "free",
      name: "Gratuit",
      price: "0€",
      period: "",
      tagline: "Pour tester",
      description: "Découvre PhotoPrep avec 3 photos par mois",
      features: [
        { text: "3 photos par mois", included: true },
        { text: "Suppression de fond basique", included: true },
        { text: "Fond blanc", included: true },
        { text: "Téléchargement standard", included: true },
      ],
      limitations: [
        { text: "Filigrane PhotoPrep", icon: X },
        { text: "Traitement lent (file d'attente)", icon: Clock },
        { text: "Qualité 720p max", icon: ImageIcon },
        { text: "Pas d'historique", icon: X },
      ],
      cta: user?.subscription === "free" ? "Plan actuel" : "Commencer",
      popular: false,
      highlighted: false,
      icon: Zap,
      costJustification: "Coût serveur : ~0.02€/image"
    },
    {
      id: "starter",
      name: "Starter",
      price: "4.99€",
      period: "/mois",
      tagline: "Le plus populaire",
      description: "Pour les vendeurs réguliers (10-30 articles/mois)",
      features: [
        { text: "30 photos par mois", included: true, highlight: true },
        { text: "Suppression de fond avancée", included: true },
        { text: "Fond blanc parfait", included: true },
        { text: "Sans filigrane", included: true },
        { text: "Qualité HD 1080p", included: true },
        { text: "Historique 30 jours", included: true },
        { text: "Traitement normal", included: true },
      ],
      limitations: [],
      cta: user?.subscription === "starter" ? "Plan actuel" : "Choisir Starter",
      popular: true,
      highlighted: true,
      icon: Rocket,
      badge: "Rentabilisé dès 1 vente",
      costJustification: "30 images × 0.15€ = 4.50€ de coût serveur"
    },
    {
      id: "pro",
      name: "Pro",
      price: "14.99€",
      period: "/mois",
      tagline: "Pour les gros vendeurs",
      description: "Pour les vendeurs intensifs (50+ articles/mois)",
      features: [
        { text: "Photos illimitées", included: true, highlight: true },
        { text: "Traitement prioritaire", included: true, highlight: true },
        { text: "Qualité 4K maximum", included: true },
        { text: "Suppression de fond IA premium", included: true },
        { text: "Historique illimité", included: true },
        { text: "Support prioritaire", included: true },
        { text: "Export batch (bientôt)", included: true },
      ],
      limitations: [],
      cta: user?.subscription === "pro" ? "Plan actuel" : "Choisir Pro",
      popular: false,
      highlighted: false,
      icon: Crown,
      costJustification: "Usage intensif justifie le prix"
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

      {/* Hero Pricing */}
      <section className="pt-32 pb-8 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <Badge className="bg-accent text-accent-foreground border-0 px-4 py-2 mb-6">
            <Zap className="w-4 h-4 mr-2" />
            Rentabilisé dès ta première vente
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Des tarifs pensés pour les vendeurs
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Un article vendu 15€ grâce à une meilleure photo = <strong>3 mois de Starter payés</strong>. 
            Le calcul est simple.
          </p>
        </div>
      </section>

      {/* Pricing Cards - 3 colonnes avec Starter au centre */}
      <section className="pb-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6 items-start">
            {plans.map((plan, index) => (
              <Card 
                key={plan.id}
                data-testid={`pricing-card-${plan.id}`}
                className={`relative border-2 rounded-2xl p-6 transition-all ${
                  plan.highlighted 
                    ? 'border-primary shadow-brutal bg-card scale-105 md:-mt-4 md:mb-4 z-10' 
                    : 'border-foreground/30 shadow-brutal-sm bg-card hover:border-foreground/50'
                }`}
              >
                {/* Badge populaire */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-white px-4 py-1.5 text-sm font-bold">
                      <Crown className="w-4 h-4 mr-1" />
                      {plan.badge || plan.tagline}
                    </Badge>
                  </div>
                )}
                
                {/* Header */}
                <div className="text-center mb-6 pt-2">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 ${
                    plan.highlighted ? 'bg-primary text-white' : 'bg-secondary text-primary'
                  }`}>
                    <plan.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{plan.tagline}</p>
                  <div className="flex items-baseline justify-center gap-1 mt-4">
                    <span className={`text-4xl font-bold ${plan.highlighted ? 'text-primary' : ''}`}>
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className="text-muted-foreground">{plan.period}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{plan.description}</p>
                </div>
                
                {/* Features */}
                <div className="space-y-2.5 mb-6">
                  {plan.features.map((feature, i) => (
                    <div key={i} className={`flex items-center gap-2.5 ${feature.highlight ? 'font-medium' : ''}`}>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                        feature.highlight ? 'bg-accent' : 'bg-green-100'
                      }`}>
                        <Check className={`w-3 h-3 ${feature.highlight ? 'text-accent-foreground' : 'text-green-600'}`} />
                      </div>
                      <span className="text-sm">{feature.text}</span>
                    </div>
                  ))}
                  
                  {/* Limitations (pour le plan gratuit) */}
                  {plan.limitations.map((limitation, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-muted-foreground">
                      <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <limitation.icon className="w-3 h-3" />
                      </div>
                      <span className="text-sm">{limitation.text}</span>
                    </div>
                  ))}
                </div>
                
                {/* CTA Button */}
                {plan.highlighted ? (
                  <Button
                    data-testid={`upgrade-btn-${plan.id}`}
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={user?.subscription === plan.id || upgrading === plan.id}
                    className="w-full bg-primary text-white hover:bg-primary/90 rounded-full py-5 text-base shadow-brutal hover:shadow-brutal-hover hover:translate-y-[2px] transition-all font-bold"
                  >
                    {upgrading === plan.id ? "Mise à niveau..." : plan.cta}
                    {user?.subscription !== plan.id && <ArrowRight className="w-5 h-5 ml-2" />}
                  </Button>
                ) : plan.id === "free" ? (
                  <Button
                    variant="outline"
                    onClick={user ? () => {} : handleLogin}
                    disabled={user?.subscription === "free"}
                    className="w-full rounded-full py-5 text-base border-2 border-foreground/30 font-medium"
                  >
                    {plan.cta}
                  </Button>
                ) : (
                  <Button
                    data-testid={`upgrade-btn-${plan.id}`}
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={user?.subscription === plan.id || upgrading === plan.id}
                    className="w-full bg-foreground text-background hover:bg-foreground/90 rounded-full py-5 text-base shadow-brutal-sm hover:shadow-brutal-hover hover:translate-y-[2px] transition-all font-bold"
                  >
                    {upgrading === plan.id ? "Mise à niveau..." : plan.cta}
                    {user?.subscription !== plan.id && <ArrowRight className="w-5 h-5 ml-2" />}
                  </Button>
                )}
                
                {/* Downgrade option */}
                {user && user.subscription !== "free" && plan.id === "free" && (
                  <button 
                    onClick={handleDowngrade}
                    className="w-full text-center text-xs text-muted-foreground hover:text-foreground mt-3 underline"
                  >
                    Revenir au gratuit
                  </button>
                )}
                
                {/* Cost justification (tooltip style) */}
                <div className="mt-4 pt-4 border-t border-border/50">
                  <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
                    <HelpCircle className="w-3 h-3" />
                    {plan.costJustification}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Comparatif rapide */}
      <section className="py-12 px-6 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Quel plan pour toi ?</h2>
          
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <Card className="p-6 border border-border/50">
              <div className="text-4xl font-bold text-muted-foreground mb-2">{"<"}5</div>
              <div className="text-sm font-medium mb-1">articles/mois</div>
              <div className="text-xs text-muted-foreground mb-4">Vendeur occasionnel</div>
              <Badge variant="outline" className="bg-muted">Plan Gratuit</Badge>
            </Card>
            
            <Card className="p-6 border-2 border-primary bg-primary/5">
              <div className="text-4xl font-bold text-primary mb-2">10-30</div>
              <div className="text-sm font-medium mb-1">articles/mois</div>
              <div className="text-xs text-muted-foreground mb-4">Vendeur régulier</div>
              <Badge className="bg-primary text-white">Plan Starter</Badge>
            </Card>
            
            <Card className="p-6 border border-border/50">
              <div className="text-4xl font-bold text-foreground mb-2">50+</div>
              <div className="text-sm font-medium mb-1">articles/mois</div>
              <div className="text-xs text-muted-foreground mb-4">Gros vendeur / Pro</div>
              <Badge variant="outline" className="bg-foreground text-background">Plan Pro</Badge>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ optimisée conversion */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Questions fréquentes</h2>
          <div className="space-y-4">
            {[
              {
                q: "Pourquoi seulement 3 photos gratuites ?",
                a: "Le traitement d'image coûte ~0.15€ par photo en ressources serveur. 3 photos te permettent de tester sans nous ruiner. Si tu vends régulièrement, le Starter à 4.99€ est fait pour toi."
              },
              {
                q: "Est-ce que ça vaut vraiment le coup ?",
                a: "Calcule : tu passes 15 min par photo à retoucher. Avec 30 photos/mois, c'est 7h30 de perdues. PhotoPrep te rend ce temps pour 4.99€. Et une seule vente en plus rembourse 3 mois d'abo."
              },
              {
                q: "Pourquoi le traitement est lent sur le gratuit ?",
                a: "Les utilisateurs payants ont la priorité sur nos serveurs (c'est logique, ils financent l'infrastructure). Le gratuit passe après, d'où l'attente. Pas de magie, juste de l'honnêteté."
              },
              {
                q: "Je peux annuler quand je veux ?",
                a: "Oui, en 1 clic depuis ton profil. Pas de frais cachés, pas d'engagement. Tu gardes l'accès jusqu'à la fin du mois payé."
              },
              {
                q: "C'est quoi le filigrane sur le gratuit ?",
                a: "Un petit 'PhotoPrep' discret en bas de l'image. Les acheteurs Vinted s'en fichent, mais si ça te gêne, le Starter l'enlève."
              }
            ].map((faq, index) => (
              <Card key={index} className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-bold mb-2">{faq.q}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{faq.a}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-16 px-6 bg-primary text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Prêt à vendre plus vite ?
          </h2>
          <p className="text-white/80 mb-8">
            Teste avec 3 photos gratuites. Si ça te convient, le Starter t'attend.
          </p>
          <Button 
            onClick={handleLogin}
            size="lg"
            className="bg-white text-primary hover:bg-white/90 rounded-full px-10 py-6 text-lg shadow-brutal hover:shadow-brutal-hover hover:translate-y-[2px] transition-all font-bold"
          >
            Commencer gratuitement
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
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
            © 2025 PhotoPrep
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Pricing;
