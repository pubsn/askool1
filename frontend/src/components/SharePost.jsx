import React from "react";
import { Share2, Link2 } from "lucide-react";
import { toast } from "sonner";

const postUrl = (post) => `${window.location.origin}/ecoles/${post.school_slug}#actualites`;

export default function SharePost({ post }) {
  const url = postUrl(post);
  const text = `${post.school_name ? post.school_name + " — " : ""}${post.title}\n${url}`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Lien copié");
    } catch {
      toast.error("Copie impossible");
    }
  };
  return (
    <span className="inline-flex items-center gap-1">
      <a data-testid={`share-whatsapp-${post.post_id}`} href={`https://wa.me/?text=${encodeURIComponent(text)}`}
        target="_blank" rel="noreferrer" title="Partager sur WhatsApp"
        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-askool-text transition-colors hover:bg-askool-bluelight hover:text-askool-blue">
        <Share2 size={15} /> <span className="hidden sm:inline">WhatsApp</span>
      </a>
      <button data-testid={`share-copy-${post.post_id}`} onClick={copy} title="Copier le lien"
        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-askool-text transition-colors hover:bg-askool-bluelight hover:text-askool-blue">
        <Link2 size={15} /> <span className="hidden sm:inline">Lien</span>
      </button>
    </span>
  );
}
