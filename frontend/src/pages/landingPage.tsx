import React from "react";
import "./landingPage.css";
import Scale from "../icons/scale.png";
import Tree from "../icons/tree.png";
import Lightning from "../icons/lightning.png"
import { useNavigate } from "react-router-dom";



type CardColor = "green" | "blue" | "purple";

type UnionCardProps = {
  title: string;
  description: string;
  badgeText: string;
  color: CardColor;
  icon: React.ReactNode;
  ctaLabel?: string;
  onClick?: () => void;
};

function UnionCard({
  title,
  description,
  badgeText,
  color,
  icon,
  ctaLabel = "Start exploring →",
  onClick,
}: UnionCardProps) {
  return (
    <article className={`uf-card uf-card--${color}`}>
      <div className="uf-card__top-line" />
      <div className={`uf-card__icon-wrap uf-card__icon-wrap--${color}`}>
        {icon}
      </div>

      <h2 className="uf-card__title">{title}</h2>
      <p className="uf-card__description">{description}</p>

      <div className={`uf-card__badge uf-card__badge--${color}`}>
        {badgeText}
      </div>

      <button
        type="button"
        className={`uf-card__button uf-card__button--${color}`}
        onClick={onClick}
      >
        {ctaLabel}
      </button>
    </article>
  );
}

export default function UnionFindLanding() {
    const navigate = useNavigate();
  return (
    <main className="uf-page">
      <div className="uf-page__grid" aria-hidden="true" />
      <div className="uf-page__dots" aria-hidden="true" />

      <section className="uf-hero">
        <h1 className="uf-hero__title">Choose a Union-Find version</h1>
        <p className="uf-hero__subtitle">
          Explore how each optimization improves the data structure
          <br />
          with interactive visualisations.
        </p>
      </section>

      <section className="uf-cards" aria-label="Union-Find versions">
        <UnionCard
          title="Basic Union-Find"
          description="Learn the core idea of union find."
          badgeText="Start here"
          color="green"
          icon={<img src={Tree} className="uf-icon" />}
          onClick={() => navigate("/builder/UF")}
        />

        <UnionCard
          title="Weighted Union-Find"
          description="See how balancing keeps trees shallow."
          badgeText="Improves performance"
          color="blue"
          icon={<img src={Scale} className="uf-icon" />}
          onClick={() => navigate("/builder/WUF")}
        />

        <UnionCard
          title="Path Compression"
          description="The fastest version for find operations."
          badgeText="Maximum speed"
          color="purple"
          icon={<img src={Lightning} className="uf-icon" />}
          //onClick={() => navigate("/builder/basic")}
        />
      </section>
    </main>
  );
}
