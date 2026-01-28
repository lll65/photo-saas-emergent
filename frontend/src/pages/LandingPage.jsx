import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, Sparkles, Download, History, ArrowRight, Check, Zap, Shield, Clock } from "lucide-react";

const LandingPage = () => {
  const navigate = useNavigate();
  const [sliderPosition, setSliderPosition] = useState(50);
  const sliderRef = useRef(null);
  const isDragging = useRef(false);

  // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
  const handleLogin = () => {
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const handleSliderMove = (e) => {
    if (!isDragging.current || !sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  useEffect(() => {
    const handleMouseUp = () => { isDragging.current = false; };
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchend', handleMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background noise-bg">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-brutal-sm">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">PhotoPrep</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              Tarifs
            </Link>
            <Button 
              data-testid="login-btn"
              onClick={handleLogin}
              className="bg-primary text-white hover:bg-primary/90 rounded-full px-6 shadow-brutal-sm hover:shadow-brutal-hover hover:translate-y-[2px] transition-all font-semibold"
            >
              Connexion
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-full text-sm font-medium">
                <Zap className="w-4 h-4" />
                5 photos gratuites par mois
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                Vends plus vite avec des{" "}
                <span className="text-primary">photos pro</span>
              </h1>
              
              <p className="text-lg text-muted-foreground max-w-lg">
                Transforme tes photos en 1 clic. Fond blanc parfait, lumière optimisée, 
                prêt pour Vinted, Leboncoin ou Depop.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  data-testid="get-started-btn"
                  onClick={handleLogin}
                  size="lg"
                  className="bg-primary text-white hover:bg-primary/90 rounded-full px-8 py-6 text-lg shadow-brutal hover:shadow-brutal-hover hover:translate-y-[2px] transition-all font-bold"
                >
                  Commencer gratuitement
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button 
                  variant="outline"
                  size="lg"
                  className="rounded-full px-8 py-6 text-lg border-2 border-foreground shadow-brutal hover:shadow-brutal-hover hover:translate-y-[2px] transition-all font-bold"
                  onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Voir la démo
                </Button>
              </div>
              
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Pas de carte requise
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Résultat en 10 secondes
                </div>
              </div>
            </div>
            
            {/* Right - Before/After Demo */}
            <div id="demo" className="relative">
              <Card className="border-2 border-foreground rounded-2xl overflow-hidden shadow-brutal p-0">
                <div 
                  ref={sliderRef}
                  className="relative aspect-square cursor-ew-resize select-none"
                  onMouseMove={handleSliderMove}
                  onTouchMove={handleSliderMove}
                  onMouseDown={() => { isDragging.current = true; }}
                  onTouchStart={() => { isDragging.current = true; }}
                >
                  {/* Before Image */}
                  <div className="absolute inset-0">
                    <img 
                      src="https://images.unsplash.com/photo-1698586252650-f0d15ff0c8da?crop=entropy&cs=srgb&fm=jpg&q=85&w=800"
                      alt="Avant"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 left-4 bg-foreground/80 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Avant
                    </div>
                  </div>
                  
                  {/* After Image (clipped) */}
                  <div 
                    className="absolute inset-0 overflow-hidden"
                    style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                  >
                    <img 
                      src="https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?crop=entropy&cs=srgb&fm=jpg&q=85&w=800"
                      alt="Après"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 right-4 bg-accent text-accent-foreground px-3 py-1 rounded-full text-sm font-medium">
                      Après
                    </div>
                  </div>
                  
                  {/* Slider Handle */}
                  <div 
                    className="absolute top-0 bottom-0 w-1 bg-white z-10"
                    style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
                  >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white border-4 border-primary shadow-lg flex items-center justify-center">
                      <div className="flex gap-0.5">
                        <div className="w-0.5 h-4 bg-primary rounded-full"></div>
                        <div className="w-0.5 h-4 bg-primary rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
              
              {/* Floating Badge */}
              <div className="absolute -bottom-4 -right-4 bg-accent text-accent-foreground px-4 py-2 rounded-xl shadow-brutal-sm font-bold text-sm animate-float">
                ✨ Magie IA
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Comment ça marche ?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              3 étapes simples pour transformer tes photos amateur en images qui vendent
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Upload,
                title: "1. Upload ta photo",
                description: "Glisse-dépose ou clique pour ajouter tes photos depuis ton téléphone ou ordinateur"
              },
              {
                icon: Sparkles,
                title: "2. Magie automatique",
                description: "Notre IA supprime le fond, ajuste la lumière et optimise pour la revente"
              },
              {
                icon: Download,
                title: "3. Télécharge & vends",
                description: "Récupère ton image HD parfaite, prête à publier sur Vinted ou Leboncoin"
              }
            ].map((feature, index) => (
              <Card 
                key={index}
                className="bg-card border-2 border-foreground rounded-xl p-8 shadow-brutal hover:shadow-brutal-hover hover:-translate-y-1 transition-all"
              >
                <div className="w-14 h-14 bg-secondary rounded-xl flex items-center justify-center mb-6">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Pourquoi les vendeurs adorent PhotoPrep
              </h2>
              <div className="space-y-6">
                {[
                  {
                    icon: Clock,
                    title: "Gain de temps",
                    description: "Plus besoin de retoucher pendant des heures. Résultat pro en 10 secondes."
                  },
                  {
                    icon: Zap,
                    title: "Ventes plus rapides",
                    description: "Des photos pro = plus de clics = ventes plus rapides sur Vinted."
                  },
                  {
                    icon: Shield,
                    title: "Qualité constante",
                    description: "Même rendu pro pour toutes tes annonces. Ta boutique devient reconnaissable."
                  }
                ].map((benefit, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <benefit.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold mb-1">{benefit.title}</h3>
                      <p className="text-muted-foreground text-sm">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <Card className="border-2 border-foreground rounded-2xl p-8 shadow-brutal bg-card">
              <div className="text-center">
                <div className="text-6xl font-bold text-primary mb-2">5</div>
                <p className="text-muted-foreground mb-6">photos gratuites par mois</p>
                <div className="space-y-3 text-left mb-8">
                  {[
                    "Suppression de fond automatique",
                    "Fond blanc professionnel",
                    "Optimisation lumière & contraste",
                    "Téléchargement HD",
                    "Historique sauvegardé"
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-500" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
                <Button 
                  data-testid="cta-start-free-btn"
                  onClick={handleLogin}
                  className="w-full bg-primary text-white hover:bg-primary/90 rounded-full py-6 text-lg shadow-brutal hover:shadow-brutal-hover hover:translate-y-[2px] transition-all font-bold"
                >
                  Commencer gratuitement
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-primary text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Prêt à vendre plus vite ?
          </h2>
          <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
            Rejoins les milliers de vendeurs qui utilisent PhotoPrep pour créer des annonces irrésistibles
          </p>
          <Button 
            data-testid="final-cta-btn"
            onClick={handleLogin}
            size="lg"
            className="bg-white text-primary hover:bg-white/90 rounded-full px-10 py-6 text-lg shadow-brutal hover:shadow-brutal-hover hover:translate-y-[2px] transition-all font-bold"
          >
            Essayer gratuitement
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
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/pricing" className="hover:text-foreground transition-colors">Tarifs</Link>
            <a href="#" className="hover:text-foreground transition-colors">Confidentialité</a>
            <a href="#" className="hover:text-foreground transition-colors">CGU</a>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2025 PhotoPrep. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
