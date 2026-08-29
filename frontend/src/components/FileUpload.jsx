import React, { useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

// Reusable uploader. onUploaded(fileObj) called with the created file document.
export default function FileUpload({ category = "photo", visibility = "public", accept, label = "Téléverser un fichier", testId, onUploaded, children }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const pick = () => inputRef.current?.click();
  const onChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post(`/uploads?category=${category}&visibility=${visibility}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Fichier téléversé");
      onUploaded?.(data.file);
      window.dispatchEvent(new CustomEvent("askool-upload", { detail: data.file }));
    } catch (err) {
      toast.error(err.response?.data?.detail || "Échec du téléversement");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <>
      <input ref={inputRef} type="file" accept={accept} onChange={onChange} className="hidden" data-testid={`${testId}-input`} />
      <button type="button" onClick={pick} disabled={busy} data-testid={testId}
        className="inline-flex items-center gap-2 rounded-xl border-2 border-dashed border-askool-blue/40 bg-askool-bluelight/50 px-4 py-2.5 text-sm font-medium text-askool-blue transition-colors hover:bg-askool-bluelight disabled:opacity-60">
        {busy ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} {children || label}
      </button>
    </>
  );
}
