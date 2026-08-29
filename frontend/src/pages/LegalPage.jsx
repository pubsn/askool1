import React from "react";
import PublicLayout from "@/components/layout/PublicLayout";

const CONTENT = {
  cgu: { title: "Conditions générales d'utilisation", body: "En utilisant ASKOOL, vous acceptez nos conditions générales. La plateforme met en relation écoles, éducateurs et apprenants. Chaque utilisateur est responsable de l'exactitude des informations fournies." },
  confidentialite: { title: "Politique de confidentialité", body: "ASKOOL protège vos données personnelles conformément aux principes de protection des données. Vos documents sensibles ne sont jamais rendus publics. Vous pouvez demander la suppression de votre compte à tout moment." },
  cookies: { title: "Politique de cookies", body: "ASKOOL utilise des cookies essentiels au fonctionnement de la plateforme ainsi que des cookies de mesure d'audience pour améliorer votre expérience. Vous pouvez gérer votre consentement à tout moment." },
};

export default function LegalPage({ kind }) {
  const c = CONTENT[kind] || CONTENT.cgu;
  return (
    <PublicLayout>
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-bold text-gray-900 lg:text-4xl">{c.title}</h1>
        <p className="mt-6 leading-relaxed text-muted-foreground">{c.body}</p>
        <p className="mt-4 text-sm text-gray-400">Dernière mise à jour : {new Date().getFullYear()}. Ce document est fourni à titre indicatif.</p>
      </div>
    </PublicLayout>
  );
}
