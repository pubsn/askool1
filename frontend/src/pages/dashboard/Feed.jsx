import React from "react";
import { PageHeader } from "@/components/common";
import NewsFeed from "@/components/NewsFeed";

export default function Feed() {
  return (
    <div>
      <PageHeader title="Mes actualités" subtitle="Les publications des écoles que vous suivez : inscriptions, événements, informations aux familles." />
      <NewsFeed limit={30} />
    </div>
  );
}
