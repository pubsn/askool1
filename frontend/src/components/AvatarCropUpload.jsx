import React, { useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, Loader2, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import api, { API_ROOT } from "@/lib/api";

const SIZE = 280;

export default function AvatarCropUpload({ current, onChange, testId = "avatar" }) {
  const inputRef = useRef(null);
  const canvasRef = useRef(null);
  const [img, setImg] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [off, setOff] = useState({ x: 0, y: 0 });
  const [drag, setDrag] = useState(null);
  const [busy, setBusy] = useState(false);

  const pick = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const url = URL.createObjectURL(file); const im = new Image();
    im.onload = () => { setImg(im); setZoom(1); setOff({ x: 0, y: 0 }); }; im.src = url;
    e.target.value = "";
  };
  const base = img ? Math.max(SIZE / img.width, SIZE / img.height) : 1;
  const draw = (canvas, out = SIZE) => {
    const ctx = canvas.getContext("2d"); const k = out / SIZE; ctx.clearRect(0, 0, out, out);
    const sc = base * zoom * k, w = img.width * sc, h = img.height * sc;
    ctx.drawImage(img, (out - w) / 2 + off.x * k, (out - h) / 2 + off.y * k, w, h);
  };
  React.useEffect(() => { if (img && canvasRef.current) draw(canvasRef.current); });
  const onDown = (e) => setDrag({ x: e.clientX - off.x, y: e.clientY - off.y });
  const onMove = (e) => drag && setOff({ x: e.clientX - drag.x, y: e.clientY - drag.y });
  const save = async () => {
    setBusy(true);
    try {
      const c = document.createElement("canvas"); c.width = c.height = 512; draw(c, 512);
      const blob = await new Promise((r) => c.toBlob(r, "image/jpeg", 0.9));
      const fd = new FormData(); fd.append("file", blob, "avatar.jpg");
      const { data } = await api.post("/uploads?category=photo&visibility=public", fd, { headers: { "Content-Type": "multipart/form-data" } });
      await onChange(`${API_ROOT}/files/${data.file.file_id}`);
      toast.success("Photo de profil mise à jour"); setImg(null);
    } catch (e) { toast.error(e.response?.data?.detail || "Erreur"); } finally { setBusy(false); }
  };
  const remove = async () => { try { await onChange(null); toast.success("Photo supprimée"); } catch { toast.error("Erreur"); } };

  return (
    <div className="flex flex-wrap items-center gap-4">
      {current ? <img src={current} alt="avatar" data-testid={`${testId}-preview`} className="h-20 w-20 rounded-full object-cover ring-2 ring-askool-bluelight" /> : <span className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 text-xs text-gray-400">Photo</span>}
      <input ref={inputRef} type="file" accept="image/*" onChange={pick} className="hidden" data-testid={`${testId}-input`} />
      <button type="button" data-testid={`${testId}-pick`} onClick={() => inputRef.current?.click()} className="inline-flex items-center gap-2 rounded-xl border-2 border-dashed border-askool-blue/40 bg-askool-bluelight/50 px-4 py-2.5 text-sm font-medium text-askool-blue hover:bg-askool-bluelight"><Upload size={16} /> {current ? "Modifier la photo" : "Ajouter une photo"}</button>
      {current && <Button type="button" variant="ghost" data-testid={`${testId}-remove`} onClick={remove} className="rounded-xl text-red-500 hover:bg-red-50"><Trash2 size={16} /> Supprimer</Button>}
      <Dialog open={!!img} onOpenChange={(v) => !v && setImg(null)}>
        <DialogContent data-testid={`${testId}-crop-dialog`}><DialogHeader><DialogTitle>Recadrer la photo</DialogTitle><DialogDescription>Déplacez l'image et ajustez le zoom.</DialogDescription></DialogHeader>
          <div className="flex flex-col items-center gap-3">
            <canvas ref={canvasRef} width={SIZE} height={SIZE} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={() => setDrag(null)} onPointerLeave={() => setDrag(null)} className="cursor-move rounded-full border-4 border-askool-bluelight bg-gray-100 touch-none" />
            <input data-testid={`${testId}-zoom`} type="range" min="1" max="3" step="0.01" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-full accent-askool-blue" />
            <Button data-testid={`${testId}-crop-save`} onClick={save} disabled={busy} className="w-full rounded-xl bg-askool-blue text-white">{busy ? <Loader2 size={16} className="animate-spin" /> : "Enregistrer la photo"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
