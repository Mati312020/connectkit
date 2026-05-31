"use client";

import { useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { logEvent } from "@/lib/logger";
import { Camera, Trash2 } from "lucide-react";

interface AvatarUploadProps {
  currentUrl?:  string | null;
  userName:     string;
  onSuccess?:   (newUrl: string) => void;
  onDelete?:    () => void;
}

export function AvatarUpload({ currentUrl, userName, onSuccess, onDelete }: AvatarUploadProps) {
  const [preview,    setPreview]    = useState<string | null>(currentUrl ?? null);
  const [uploading,  setUploading]  = useState(false);
  const [deleting,   setDeleting]   = useState(false);
  const [error,      setError]      = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const initials = userName.slice(0, 2).toUpperCase();

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview local inmediato
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setError("");
    setUploading(true);

    try {
      const form = new FormData();
      form.append("avatar", file);

      const res  = await fetch("/api/profile/avatar", { method: "POST", body: form });
      const data = await res.json();

      if (!res.ok) {
        setPreview(currentUrl ?? null); // revertir preview
        setError(data.error ?? "Error al subir la imagen");
        return;
      }

      setPreview(data.avatarUrl);
      logEvent("PROFILE_UPDATED", { field: "avatarUrl" });
      onSuccess?.(data.avatarUrl);
    } finally {
      setUploading(false);
      // Limpiar el input para permitir seleccionar el mismo archivo otra vez
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch("/api/profile/avatar", { method: "DELETE" });
      if (res.ok) {
        setPreview(null);
        logEvent("PROFILE_UPDATED", { field: "avatarUrl", action: "deleted" });
        onDelete?.();
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      {/* Avatar con overlay de cámara al hover */}
      <div className="relative group">
        <Avatar className="h-20 w-20">
          {preview && <AvatarImage src={preview} alt={userName} />}
          <AvatarFallback className="text-xl">{initials}</AvatarFallback>
        </Avatar>

        {/* Overlay de "cambiar foto" */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        >
          <Camera className="h-5 w-5 text-white" />
        </button>
      </div>

      {/* Input oculto */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Botones de acción */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? "Subiendo..." : "Cambiar foto"}
          </Button>

          {preview && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">JPG, PNG o WebP · Máx. 5 MB</p>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    </div>
  );
}
