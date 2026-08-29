import React, { useEffect, useRef, useState } from "react";
import { X, Download, FileText } from "lucide-react";
import api from "@/lib/api";

// Overlay document viewer: fetches a (possibly private) file as an authenticated blob
// and displays it in-place (image or embedded PDF) instead of opening a new tab.
export default function DocViewer({ fileId, filename, contentType, children, triggerClassName }) {
  const [open, setOpen] = useState(false);
  const [blobUrl, setBlobUrl] = useState(null);
  const [error, setError] = useState(false);
  const urlRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setError(false);
    let active = true;
    api.get(`/files/${fileId}`, { responseType: "blob" }).then(({ data }) => {
      if (!active) return;
      const url = URL.createObjectURL(data);
      urlRef.current = url;
      setBlobUrl(url);
    }).catch(() => active && setError(true));
    return () => { active = false; if (urlRef.current) { URL.revokeObjectURL(urlRef.current); urlRef.current = null; } setBlobUrl(null); };
  }, [open, fileId]);

  const isImage = (contentType || "").startsWith("image") || /\.(png|jpe?g|webp|gif)$/i.test(filename || "");

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={triggerClassName || "cursor-pointer"} data-testid={`docviewer-open-${fileId}`}>
        {children}
      </button>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" data-testid="docviewer-overlay">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
              <div className="flex items-center gap-2 truncate font-medium text-gray-900"><FileText size={16} className="text-askool-blue" /> {filename || "Document"}</div>
              <div className="flex items-center gap-2">
                {blobUrl && <a href={blobUrl} download={filename} data-testid="docviewer-download" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"><Download size={18} /></a>}
                <button onClick={() => setOpen(false)} data-testid="docviewer-close" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"><X size={18} /></button>
              </div>
            </div>
            <div className="flex min-h-[300px] flex-1 items-center justify-center overflow-auto bg-gray-50 p-4">
              {error ? <p className="text-red-500">Impossible de charger le document.</p>
                : !blobUrl ? <div className="h-10 w-10 animate-spin rounded-full border-4 border-askool-blue border-t-transparent" />
                : isImage ? <img src={blobUrl} alt={filename} className="max-h-[70vh] max-w-full rounded-lg object-contain" />
                : <iframe title={filename} src={blobUrl} className="h-[70vh] w-full rounded-lg border-0" />}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
