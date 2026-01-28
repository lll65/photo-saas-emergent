import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { API } from "@/App";
import { 
  Sparkles, History as HistoryIcon, Upload, Download, 
  Trash2, Eye, Calendar, Loader2, Image as ImageIcon, User, LogOut
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const History = ({ user }) => {
  const navigate = useNavigate();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [deleting, setDeleting] = useState({});

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await fetch(`${API}/images/history`, {
        credentials: "include"
      });
      if (response.ok) {
        const data = await response.json();
        setImages(data);
      }
    } catch (error) {
      toast.error("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (imageId) => {
    setDeleting(prev => ({ ...prev, [imageId]: true }));
    try {
      const response = await fetch(`${API}/images/${imageId}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (response.ok) {
        setImages(prev => prev.filter(img => img.image_id !== imageId));
        toast.success("Image supprimée");
      } else {
        toast.error("Erreur de suppression");
      }
    } catch (error) {
      toast.error("Erreur de connexion");
    } finally {
      setDeleting(prev => ({ ...prev, [imageId]: false }));
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
              className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload
            </Link>
            <Link 
              to="/history" 
              className="text-foreground font-medium flex items-center gap-2"
            >
              <HistoryIcon className="w-4 h-4" />
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
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Historique</h1>
          <p className="text-muted-foreground">
            Retrouve toutes tes images traitées
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : images.length === 0 ? (
          <Card className="border-2 border-dashed border-foreground/20 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ImageIcon className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-2">Aucune image</h3>
            <p className="text-muted-foreground mb-6">
              Tu n'as pas encore traité d'images
            </p>
            <Link to="/dashboard">
              <Button className="bg-primary text-white hover:bg-primary/90 rounded-full">
                <Upload className="w-4 h-4 mr-2" />
                Upload une image
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {images.map((image) => (
              <Card 
                key={image.image_id}
                data-testid={`history-card-${image.image_id}`}
                className="border-2 border-foreground rounded-xl overflow-hidden shadow-brutal hover:shadow-brutal-hover hover:-translate-y-1 transition-all"
              >
                <div className="aspect-square relative group">
                  <img 
                    src={`${API}${(image.processed_url || image.original_url).replace('/api', '')}`}
                    alt={image.original_filename}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={() => setSelectedImage(image)}
                      className="rounded-full"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    {image.processed_url && (
                      <Button
                        size="icon"
                        onClick={() => handleDownload(image)}
                        className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-full"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={() => handleDelete(image.image_id)}
                      disabled={deleting[image.image_id]}
                      className="rounded-full"
                    >
                      {deleting[image.image_id] ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  {image.status === "completed" && (
                    <div className="absolute top-2 right-2 bg-accent text-accent-foreground px-2 py-1 rounded-full text-xs font-medium">
                      ✓ Traité
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="font-medium text-sm truncate">{image.original_filename}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(image.created_at)}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Image Preview Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedImage?.original_filename}</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium mb-2 text-center">Avant</p>
                  <img 
                    src={`${API}${selectedImage.original_url.replace('/api', '')}`}
                    alt="Original"
                    className="w-full rounded-lg border border-border"
                  />
                </div>
                {selectedImage.processed_url && (
                  <div>
                    <p className="text-sm font-medium mb-2 text-center">Après</p>
                    <img 
                      src={`${API}${selectedImage.processed_url.replace('/api', '')}`}
                      alt="Processed"
                      className="w-full rounded-lg border border-border bg-white"
                    />
                  </div>
                )}
              </div>
              {selectedImage.processed_url && (
                <Button
                  onClick={() => handleDownload(selectedImage)}
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90 rounded-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger HD
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default History;
