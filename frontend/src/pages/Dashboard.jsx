import { useState, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { API } from "@/App";
import { 
  Upload, Sparkles, Download, History, User, LogOut, 
  Image as ImageIcon, ArrowRight, X, Check, Loader2,
  ChevronLeft, ChevronRight
} from "lucide-react";

const Dashboard = ({ user, setUser }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [processingImages, setProcessingImages] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const sliderRef = useRef(null);
  const isDraggingSlider = useRef(false);

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

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length > 0) {
      handleFileUpload(files);
    }
  }, []);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };

  const handleFileUpload = async (files) => {
    // Check credits
    if (user.subscription === "free" && user.credits <= 0) {
      toast.error("Plus de crédits disponibles", {
        description: "Passe au premium pour un accès illimité"
      });
      return;
    }

    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch(`${API}/images/upload`, {
          method: "POST",
          credentials: "include",
          body: formData
        });

        if (response.ok) {
          const data = await response.json();
          const imageData = {
            ...data,
            file,
            previewUrl: URL.createObjectURL(file),
            name: file.name
          };
          setUploadedImages(prev => [...prev, imageData]);
          toast.success("Image uploadée", {
            description: "Clique sur 'Traiter' pour optimiser"
          });
        } else {
          const error = await response.json();
          toast.error("Erreur d'upload", { description: error.detail });
        }
      } catch (error) {
        toast.error("Erreur de connexion");
      }
    }
  };

  const handleProcessImage = async (image) => {
    setProcessingImages(prev => ({ ...prev, [image.image_id]: true }));
    
    try {
      const response = await fetch(`${API}/images/process/${image.image_id}`, {
        method: "POST",
        credentials: "include"
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update image in list
        setUploadedImages(prev => prev.map(img => 
          img.image_id === image.image_id 
            ? { ...img, ...data, status: "completed" }
            : img
        ));
        
        // Update user credits
        if (user.subscription === "free") {
          setUser(prev => ({ ...prev, credits: prev.credits - 1 }));
        }
        
        toast.success("Image traitée !", {
          description: "Tu peux maintenant la télécharger"
        });
      } else {
        const error = await response.json();
        toast.error("Erreur de traitement", { description: error.detail });
      }
    } catch (error) {
      toast.error("Erreur de connexion");
    } finally {
      setProcessingImages(prev => ({ ...prev, [image.image_id]: false }));
    }
  };

  const handleDownload = async (image) => {
    if (!image.processed_url) return;
    
    try {
      const response = await fetch(`${API}${image.processed_url.replace('/api', '')}`, {
        credentials: "include"
      });
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `photoprep_${image.image_id}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Image téléchargée !");
    } catch (error) {
      toast.error("Erreur de téléchargement");
    }
  };

  const handleRemoveImage = (imageId) => {
    setUploadedImages(prev => prev.filter(img => img.image_id !== imageId));
    if (selectedImage?.image_id === imageId) {
      setSelectedImage(null);
    }
  };

  const handleSliderMove = (e) => {
    if (!isDraggingSlider.current || !sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

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
              className="text-foreground font-medium flex items-center gap-2"
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
            {/* Credits Badge - adapté au plan */}
            {user.subscription === "free" ? (
              <div className="hidden sm:flex items-center gap-2 bg-muted px-4 py-2 rounded-full">
                <ImageIcon className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium text-sm">{user.credits}/3</span>
              </div>
            ) : user.subscription === "starter" ? (
              <div className="hidden sm:flex items-center gap-2 bg-secondary px-4 py-2 rounded-full">
                <ImageIcon className="w-4 h-4 text-primary" />
                <span className="font-medium text-sm">{user.credits}/30</span>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2 bg-accent px-4 py-2 rounded-full">
                <Sparkles className="w-4 h-4 text-accent-foreground" />
                <span className="font-medium text-sm text-accent-foreground">Pro</span>
              </div>
            )}
            
            <Link to="/profile">
              <Button variant="ghost" size="icon" className="rounded-full">
                {user.picture ? (
                  <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full" />
                ) : (
                  <User className="w-5 h-5" />
                )}
              </Button>
            </Link>
            
            <Button 
              data-testid="logout-btn"
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

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upload Zone */}
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold mb-2">Upload tes photos</h1>
              <p className="text-muted-foreground">
                Glisse-dépose ou clique pour ajouter des images
              </p>
            </div>
            
            <Card 
              data-testid="upload-zone"
              className={`upload-zone border-2 border-dashed cursor-pointer ${
                isDragging ? 'drag-active border-primary bg-primary/10' : 'border-foreground/30'
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <p className="font-semibold mb-2">Glisse tes photos ici</p>
                <p className="text-sm text-muted-foreground mb-4">ou clique pour parcourir</p>
                <p className="text-xs text-muted-foreground">
                  JPEG, PNG, WebP • Max 10 MB
                </p>
              </div>
            </Card>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
            
            {/* Uploaded Images List */}
            {uploadedImages.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold">Images uploadées ({uploadedImages.length})</h3>
                <div className="space-y-3">
                  {uploadedImages.map((image) => (
                    <Card 
                      key={image.image_id}
                      data-testid={`image-card-${image.image_id}`}
                      className="border-2 border-foreground rounded-xl p-4 shadow-brutal-sm"
                    >
                      <div className="flex items-center gap-4">
                        <img 
                          src={image.previewUrl || `${API}${image.original_url?.replace('/api', '')}`}
                          alt={image.name}
                          className="w-16 h-16 object-cover rounded-lg border border-border"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{image.name || image.original_filename}</p>
                          <p className="text-sm text-muted-foreground">
                            {image.status === "completed" ? (
                              <span className="text-green-600 flex items-center gap-1">
                                <Check className="w-4 h-4" /> Traité
                              </span>
                            ) : image.status === "processing" || processingImages[image.image_id] ? (
                              <span className="text-primary flex items-center gap-1">
                                <Loader2 className="w-4 h-4 animate-spin" /> Traitement...
                              </span>
                            ) : (
                              "En attente"
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {image.status === "completed" ? (
                            <>
                              <Button
                                data-testid={`view-btn-${image.image_id}`}
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedImage(image)}
                                className="rounded-full"
                              >
                                Voir
                              </Button>
                              <Button
                                data-testid={`download-btn-${image.image_id}`}
                                size="sm"
                                onClick={() => handleDownload(image)}
                                className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-full"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              data-testid={`process-btn-${image.image_id}`}
                              size="sm"
                              onClick={() => handleProcessImage(image)}
                              disabled={processingImages[image.image_id]}
                              className="bg-primary text-white hover:bg-primary/90 rounded-full"
                            >
                              {processingImages[image.image_id] ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <Sparkles className="w-4 h-4 mr-1" />
                                  Traiter
                                </>
                              )}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveImage(image.image_id)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Preview Zone */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Aperçu</h2>
              <p className="text-muted-foreground">
                Compare avant/après en glissant le curseur
              </p>
            </div>
            
            {selectedImage && selectedImage.status === "completed" ? (
              <Card className="border-2 border-foreground rounded-2xl overflow-hidden shadow-brutal">
                <div 
                  ref={sliderRef}
                  className="relative aspect-square cursor-ew-resize select-none"
                  onMouseMove={handleSliderMove}
                  onTouchMove={handleSliderMove}
                  onMouseDown={() => { isDraggingSlider.current = true; }}
                  onTouchStart={() => { isDraggingSlider.current = true; }}
                  onMouseUp={() => { isDraggingSlider.current = false; }}
                  onMouseLeave={() => { isDraggingSlider.current = false; }}
                  onTouchEnd={() => { isDraggingSlider.current = false; }}
                >
                  {/* Before Image */}
                  <div className="absolute inset-0">
                    <img 
                      src={selectedImage.previewUrl || `${API}${selectedImage.original_url?.replace('/api', '')}`}
                      alt="Avant"
                      className="w-full h-full object-contain bg-muted"
                    />
                    <div className="absolute top-4 left-4 bg-foreground/80 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Avant
                    </div>
                  </div>
                  
                  {/* After Image */}
                  <div 
                    className="absolute inset-0 overflow-hidden"
                    style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                  >
                    <img 
                      src={`${API}${selectedImage.processed_url?.replace('/api', '')}`}
                      alt="Après"
                      className="w-full h-full object-contain bg-white"
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
                      <ChevronLeft className="w-4 h-4 text-primary" />
                      <ChevronRight className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                </div>
                
                <div className="p-4 border-t border-border flex justify-between items-center">
                  <span className="font-medium truncate max-w-[200px]">{selectedImage.name}</span>
                  <Button
                    data-testid="download-selected-btn"
                    onClick={() => handleDownload(selectedImage)}
                    className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger HD
                  </Button>
                </div>
              </Card>
            ) : (
              <Card className="border-2 border-dashed border-foreground/20 rounded-2xl p-12 text-center">
                <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">
                  {uploadedImages.length > 0 
                    ? "Traite une image pour voir l'aperçu"
                    : "Upload une image pour commencer"
                  }
                </p>
              </Card>
            )}
            
            {/* Credits Info - adapté au plan */}
            {user.subscription !== "pro" && (
              <Card className="bg-secondary/50 border-0 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Crédits restants</p>
                    <p className="text-sm text-muted-foreground">
                      {user.credits} / {user.subscription === "starter" ? 30 : 3} ce mois
                    </p>
                  </div>
                  <Progress value={(user.credits / (user.subscription === "starter" ? 30 : 3)) * 100} className="w-24" />
                </div>
                {user.credits <= (user.subscription === "starter" ? 5 : 1) && (
                  <Link to="/pricing">
                    <Button 
                      className="w-full mt-4 bg-primary text-white hover:bg-primary/90 rounded-full"
                    >
                      {user.subscription === "free" ? "Passer au Starter (4.99€)" : "Passer au Pro (14.99€)"}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                )}
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
