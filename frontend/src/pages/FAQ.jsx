import React from "react";
import PublicLayout from "@/components/layout/PublicLayout";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

const FAQ = [
  ["Qu'est-ce qu'ASKOOL ?", "ASKOOL est une plateforme qui connecte les établissements scolaires, les enseignants, les tuteurs et les apprenants au Sénégal."],
  ["L'inscription est-elle gratuite ?", "Oui, la création de compte est entièrement gratuite pour tous les profils. Des formules Premium sont disponibles pour plus de visibilité."],
  ["Comment sont vérifiés les profils ?", "Les éducateurs peuvent soumettre leurs documents (diplômes, pièce d'identité). Après validation par notre équipe, un badge « Profil vérifié » est affiché."],
  ["Puis-je être à la fois enseignant et tuteur ?", "Absolument. Un même profil vous permet de postuler à des emplois en école et de proposer des cours particuliers."],
  ["Comment fonctionne le paiement ?", "Le paiement Mobile Money (Orange Money, Wave) sera bientôt disponible pour régler vos abonnements et réservations en toute sécurité."],
  ["Mes documents sont-ils publics ?", "Non. Vos documents sensibles ne sont jamais rendus publics. Seul le badge de vérification est visible."],
];

export default function FAQPage() {
  return (
    <PublicLayout>
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="mb-3 text-center font-display text-4xl font-bold text-gray-900">Questions fréquentes</h1>
        <p className="mb-10 text-center text-muted-foreground">Tout ce que vous devez savoir sur ASKOOL.</p>
        <Accordion type="single" collapsible className="space-y-3">
          {FAQ.map(([q, a], i) => (
            <AccordionItem key={i} value={`item-${i}`} data-testid={`faq-${i}`} className="rounded-2xl border border-gray-100 bg-white px-5">
              <AccordionTrigger className="text-left font-display font-semibold text-gray-900">{q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </PublicLayout>
  );
}
