import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, Sparkles, Download, ArrowRight, Check, Zap, Clock, TrendingUp, Package, ChevronLeft, ChevronRight, X } from "lucide-react";

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
            <Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
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

      {/* Hero Section - Optimisé conversion */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-6">
              <Badge variant="secondary" className="bg-accent/20 text-accent-foreground border-0 px-4 py-2">
                <TrendingUp className="w-4 h-4 mr-2" />
                +47% de ventes avec des photos pro
              </Badge>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                Vends <span className="text-primary">3x plus vite</span> sur Vinted
              </h1>
              
              <p className="text-lg text-muted-foreground max-w-lg">
                Tu publies <strong>10+ articles par semaine</strong> ? Arrête de perdre 15 min par photo. 
                PhotoPrep transforme tes photos en <strong>fond blanc pro en 10 secondes</strong>.
              </p>
              
              {/* Social proof vendeurs */}
              <div className="flex items-center gap-4 py-2">
                <div className="flex -space-x-2">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 border-2 border-background flex items-center justify-center text-xs font-bold text-primary">
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">2,847 vendeurs</strong> ont traité 89,000+ photos ce mois
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  data-testid="get-started-btn"
                  onClick={handleLogin}
                  size="lg"
                  className="bg-primary text-white hover:bg-primary/90 rounded-full px-8 py-6 text-lg shadow-brutal hover:shadow-brutal-hover hover:translate-y-[2px] transition-all font-bold"
                >
                  Tester gratuitement
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button 
                  variant="outline"
                  size="lg"
                  className="rounded-full px-8 py-6 text-lg border-2 border-foreground shadow-brutal hover:shadow-brutal-hover hover:translate-y-[2px] transition-all font-bold"
                  onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Voir un exemple
                </Button>
              </div>
              
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  3 photos gratuites
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Sans carte bancaire
                </div>
              </div>
            </div>
            
            {/* Right - Before/After Demo RÉALISTE */}
            <div id="demo" className="relative">
              <Card className="border-2 border-foreground rounded-2xl overflow-hidden shadow-brutal p-0">
                {/* Label explicatif */}
                <div className="bg-foreground text-background px-4 py-2 text-center text-sm font-medium">
                  Glisse pour voir la transformation
                </div>
                <div 
                  ref={sliderRef}
                  className="relative aspect-[4/5] cursor-ew-resize select-none"
                  onMouseMove={handleSliderMove}
                  onTouchMove={handleSliderMove}
                  onMouseDown={() => { isDragging.current = true; }}
                  onTouchStart={() => { isDragging.current = true; }}
                >
                  {/* Before Image - Photo réaliste d'un vêtement mal photographié */}
                  <div className="absolute inset-0 bg-[#e8e4dc]">
                    {/* Simulation photo amateur : pull sur lit froissé */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative w-[85%] h-[85%]">
                        {/* Fond désordre simulé */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[#d4cfc5] via-[#e0dbd3] to-[#c9c4bc] rounded-lg"></div>
                        {/* Ombres/plis simulés */}
                        <div className="absolute top-[10%] left-[5%] w-[30%] h-[20%] bg-[#b8b3a9] rounded-full blur-xl opacity-40"></div>
                        <div className="absolute bottom-[15%] right-[10%] w-[25%] h-[15%] bg-[#a5a095] rounded-full blur-xl opacity-30"></div>
                        {/* Vêtement (pull bleu marine) */}
                        <div className="absolute inset-[15%] bg-[#1e3a5f] rounded-lg shadow-lg transform rotate-2">
                          <div className="absolute top-[8%] left-1/2 -translate-x-1/2 w-[30%] h-[12%] bg-[#2a4a6f] rounded-full"></div>
                          <div className="absolute top-[25%] left-[10%] right-[10%] h-[50%] bg-[#1a3050] rounded-sm"></div>
                        </div>
                        {/* Éléments parasites */}
                        <div className="absolute top-[5%] right-[8%] w-8 h-8 bg-[#f5f0e8] rounded-full shadow-md opacity-60"></div>
                        <div className="absolute bottom-[8%] left-[12%] w-6 h-12 bg-[#8b7355] rounded opacity-40 transform rotate-12"></div>
                      </div>
                    </div>
                    <div className="absolute top-4 left-4 bg-destructive text-white px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-1.5">
                      <X className="w-3.5 h-3.5" />
                      Avant
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 bg-foreground/80 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-xs">
                      Photo sur lit • Lumière jaune • Objets parasites
                    </div>
                  </div>
                  
                  {/* After Image - Même vêtement, fond blanc pro */}
                  <div 
                    className="absolute inset-0 overflow-hidden"
                    style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                  >
                    <div className="absolute inset-0 bg-white flex items-center justify-center">
                      <div className="relative w-[70%] h-[80%]">
                        {/* Vêtement propre, centré */}
                        <div className="absolute inset-0 bg-[#1e3a5f] rounded-lg shadow-2xl">
                          <div className="absolute top-[8%] left-1/2 -translate-x-1/2 w-[28%] h-[12%] bg-[#2a4a6f] rounded-full"></div>
                          <div className="absolute top-[25%] left-[12%] right-[12%] h-[50%] bg-[#1a3050] rounded-sm"></div>
                          {/* Reflet subtil */}
                          <div className="absolute top-[30%] left-[15%] w-[20%] h-[30%] bg-white/5 rounded-full blur-md"></div>
                        </div>
                        {/* Ombre douce */}
                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[80%] h-8 bg-black/10 rounded-full blur-xl"></div>
                      </div>
                    </div>
                    <div className="absolute top-4 right-4 bg-accent text-accent-foreground px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" />
                      Après
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 bg-accent/90 backdrop-blur-sm text-accent-foreground px-3 py-2 rounded-lg text-xs font-medium">
                      Fond blanc • Centré • Lumière optimisée
                    </div>
                  </div>
                  
                  {/* Slider Handle amélioré */}
                  <div 
                    className="absolute top-0 bottom-0 w-1 bg-white z-10 shadow-lg"
                    style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
                  >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white border-4 border-primary shadow-xl flex items-center justify-center cursor-grab active:cursor-grabbing">
                      <ChevronLeft className="w-4 h-4 text-primary" />
                      <ChevronRight className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                </div>
              </Card>
              
              {/* Badge temps */}
              <div className="absolute -bottom-3 -right-3 bg-foreground text-background px-4 py-2 rounded-xl shadow-brutal-sm font-bold text-sm flex items-center gap-2">
                <Clock className="w-4 h-4" />
                10 sec
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section "Pour qui ?" - Qualification vendeurs volume */}
      <section className="py-16 px-6 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Pour les vendeurs qui veulent aller vite</h2>
            <p className="text-muted-foreground">PhotoPrep est fait pour toi si...</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Package,
                stat: "10+",
                label: "articles/semaine",
                description: "Tu publies régulièrement et tu veux automatiser les photos"
              },
              {
                icon: Clock,
                stat: "15 min",
                label: "perdues par photo",
                description: "Tu en as marre de recadrer et retoucher sur ton téléphone"
              },
              {
                icon: TrendingUp,
                stat: "2x",
                label: "plus de vues",
                description: "Tu veux des annonces qui sortent du lot et vendent plus vite"
              }
            ].map((item, index) => (
              <Card key={index} className="bg-card border-2 border-foreground rounded-xl p-6 shadow-brutal-sm text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <div className="text-3xl font-bold text-primary mb-1">{item.stat}</div>
                <div className="text-sm font-medium mb-2">{item.label}</div>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Comment ça marche - Simplifié */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">3 clics, c'est tout</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "1", icon: Upload, title: "Upload", desc: "Glisse ta photo depuis ton téléphone" },
              { step: "2", icon: Sparkles, title: "Traitement", desc: "Fond blanc + lumière en 10 secondes" },
              { step: "3", icon: Download, title: "Download", desc: "Télécharge et publie sur Vinted" }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-brutal-sm text-2xl font-bold">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview - Orientation vers Starter */}
      <section className="py-16 px-6 bg-primary/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Rentabilisé dès ta première vente</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Le plan Starter à <strong>4.99€/mois</strong> te permet de traiter <strong>30 photos</strong>. 
            Si tu vends un article à 15€ grâce à une meilleure photo, tu as déjà rentabilisé 3 mois d'abonnement.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              data-testid="cta-start-free-btn"
              onClick={handleLogin}
              size="lg"
              className="bg-primary text-white hover:bg-primary/90 rounded-full px-8 py-6 text-lg shadow-brutal hover:shadow-brutal-hover hover:translate-y-[2px] transition-all font-bold"
            >
              Essayer 3 photos gratuites
            </Button>
            <Link to="/pricing">
              <Button 
                variant="outline"
                size="lg"
                className="rounded-full px-8 py-6 text-lg border-2 border-foreground font-bold"
              >
                Voir tous les plans
              </Button>
            </Link>
          </div>
          
          <p className="text-sm text-muted-foreground mt-4">
            Pas de carte bancaire requise • Annulation en 1 clic
          </p>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-6 bg-foreground text-background">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Arrête de perdre du temps sur tes photos
          </h2>
          <p className="text-background/70 text-lg mb-8 max-w-2xl mx-auto">
            Chaque minute passée à retoucher, c'est une minute de moins pour sourcer et vendre. 
            <strong className="text-background"> PhotoPrep te rend ce temps.</strong>
          </p>
          <Button 
            data-testid="final-cta-btn"
            onClick={handleLogin}
            size="lg"
            className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-full px-10 py-6 text-lg shadow-brutal hover:shadow-brutal-hover hover:translate-y-[2px] transition-all font-bold"
          >
            Commencer maintenant
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
            © 2025 PhotoPrep
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
