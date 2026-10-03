import React, { useEffect, useRef, useState } from "react";
import { FileX } from "lucide-react";
import api, { API_ROOT } from "@/lib/api";

// Displays a private file (image or PDF link) by fetching it as an authenticated blob.
export default function SecureFile({ fileId, contentType, filename, className }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [failed, setFailed] = useState(false);
  const urlRef = useRef(null);
  useEffect(() => {
    let active = true;
    setFailed(false);
    api.get(`/files/${fileId}`, { responseType: "blob" }).then(({ data }) => {
      if (!active) return;
      const url = URL.createObjectURL(data);
      urlRef.current = url;
      setBlobUrl(url);
    }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; if (urlRef.current) URL.revokeObjectURL(urlRef.current); };
  }, [fileId]);

  const isImage = (contentType || "").startsWith("image");
  if (failed) return <span data-testid="secure-file-unavailable" className="inline-flex items-center gap-1 text-xs text-askool-subtle"><FileX size={14} /> Document indisponible</span>;
  if (!blobUrl) return <div className={className || "h-24 w-24 animate-pulse rounded-lg bg-askool-bluelight"} />;
  if (isImage) return <img src={blobUrl} alt={filename} className={className || "h-24 w-24 rounded-lg object-cover"} />;
  return <a href={blobUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-askool-blue underline">{filename || "Ouvrir le document"}</a>;
}
