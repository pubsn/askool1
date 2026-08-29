import React, { useState } from "react";
import { Mail, Phone, MapPin } from "lucide-react";
import { toast } from "sonner";
import PublicLayout from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function Contact() {
  const [sent, setSent] = useState(false);
  return (
    <PublicLayout>
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <h1 className="font-display text-4xl font-bold text-gray-900">Contactez-nous</h1>
          <p className="mt-4 text-muted-foreground">Une question ? Notre équipe vous répond rapidement.</p>
          <div className="mt-8 space-y-4">
            {[[Mail, "contact@askool.sn"], [Phone, "+221 33 800 00 00"], [MapPin, "Dakar, Sénégal"]].map(([Icon, v], i) => (
              <div key={i} className="flex items-center gap-3 text-gray-700">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-askool-bluelight text-askool-blue"><Icon size={18} /></span> {v}
              </div>
            ))}
          </div>
        </div>
        <form data-testid="contact-form" onSubmit={(e) => { e.preventDefault(); setSent(true); toast.success("Message envoyé ! Nous vous répondrons bientôt."); }}
          className="rounded-2xl border border-gray-100 bg-white p-7 shadow-sm">
          <div className="space-y-4">
            <div><Label>Nom complet</Label><Input data-testid="contact-name" required className="mt-1 rounded-lg" placeholder="Votre nom" /></div>
            <div><Label>Email</Label><Input data-testid="contact-email" type="email" required className="mt-1 rounded-lg" placeholder="vous@email.com" /></div>
            <div><Label>Message</Label><Textarea data-testid="contact-message" required rows={5} className="mt-1 rounded-lg" placeholder="Votre message…" /></div>
            <Button data-testid="contact-submit" type="submit" disabled={sent} className="w-full rounded-xl bg-askool-blue text-white hover:bg-askool-bluehover">{sent ? "Envoyé ✓" : "Envoyer"}</Button>
          </div>
        </form>
      </div>
    </PublicLayout>
  );
}
