"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { AuthGuard } from "@/components/auth/AuthGuard";
import {
  Activity,
  Calendar,
  Tag,
  ArrowRight,
  ArrowLeft,
  X,
  Share2,
  CheckCircle,
} from "lucide-react";

export interface NewsItem {
  id: string;
  title: string;
  category: "COMUNICADO OFICIAL" | "INFRAESTRUCTURA" | "COMPETICIÓN" | "PREMIACIONES" | "INSTITUCIONAL";
  date: string;
  summary: string;
  content: string;
  author: string;
  imageUrl?: string;
}

export const INITIAL_NEWS: NewsItem[] = [
  {
    id: "noticia-1",
    title: "Aprobación del reglamento de doble penalti para el Torneo Apertura 2026",
    category: "COMUNICADO OFICIAL",
    date: "25 de Octubre, 2026",
    summary:
      "El Tribunal Disciplinario y el Colegio de Árbitros ratifican la aplicación de la regla FIFA de la 5ta falta acumulada y tiro sin barrera desde los 10 metros.",
    content:
      "La Comisión Técnica de FUTSALBA informa a todos los clubes afiliados, directores técnicos y capitanes que, en concordancia con el reglamento internacional de fútbol sala, a partir de la presente temporada se aplicará de manera estricta el régimen de faltas acumuladas. A partir de la sexta falta acumulada por período reglamentario, cada infracción subsiguiente será sancionada con un tiro libre directo sin barrera (doble penalti) desde el punto de 10 metros.",
    author: "Secretaría General FUTSALBA",
  },
  {
    id: "noticia-2",
    title: "Inauguración de la nueva superficie de parquet flotante en el Microestadio Municipal",
    category: "INFRAESTRUCTURA",
    date: "23 de Octubre, 2026",
    summary:
      "La nueva cancha cuenta con tecnología de amortiguación de alto impacto y capacidad ampliada para albergar las finales de la Liga.",
    content:
      "Con la presencia de autoridades de la Liga y representantes de los clubes participantes, se llevó a cabo el corte de cinta del flamante piso de madera flotante en la Sede Central. Esta infraestructura cumple con todas las homologaciones de seguridad para reducir el impacto articular de los jugadores y permitir un juego más dinámico y vistoso.",
    author: "Comisión de Sedes e Infraestructura",
  },
  {
    id: "noticia-3",
    title: "Jornada de capacitación arbitral y uso de planilla electrónica de mesa",
    category: "INSTITUCIONAL",
    date: "20 de Octubre, 2026",
    summary:
      "Árbitros y delegados de mesa técnica participaron en el seminario de sincronización digital de actas y cronometraje en tiempo real.",
    content:
      "FUTSALBA continúa su proceso de modernización tecnológica con la implementación total del sistema digital de mesa técnica. Los jueces principales y cronometristas fueron instruidos en la operación de las tablets de control de faltas, tiempos muertos y eventos disciplinarios instantáneos.",
    author: "Colegio de Árbitros",
  },
  {
    id: "noticia-4",
    title: "Gran gala de premiación y presentación de las camisetas oficiales 2026",
    category: "PREMIACIONES",
    date: "16 de Octubre, 2026",
    summary:
      "Se reconoció al campeón de la temporada pasada y se exhibieron las indumentarias de los 12 clubes que disputarán el trofeo este año.",
    content:
      "En una noche repleta de emoción, la directiva de la Liga reunió a la familia del fútbol sala para galardonar a los mejores de la edición anterior. Además, se presentó oficialmente el trofeo de la Liga FUTSALBA 2026 y los balones oficiales provistos por la organización.",
    author: "Prensa y Comunicaciones",
  },
  {
    id: "noticia-5",
    title: "Reunión de Delegados: Aprobación del fixture y sistema de play-offs",
    category: "COMPETICIÓN",
    date: "12 de Octubre, 2026",
    summary:
      "Quedó definido el calendario de partidos y el formato de eliminación directa para los mejores 8 clasificados de la fase regular.",
    content:
      "La asamblea ordinaria de delegados aprobó de forma unánime el cronograma de fechas. Los primeros 8 equipos de la tabla general clasificarán a cuartos de final a doble partido, coronando al campeón en la gran final a disputarse en el Microestadio Central.",
    author: "Comisión de Torneos",
  },
];

export default function NoticiasPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("TODAS");
  const [activeArticle, setActiveArticle] = useState<NewsItem | null>(null);

  const categories = [
    "TODAS",
    "COMUNICADO OFICIAL",
    "INFRAESTRUCTURA",
    "INSTITUCIONAL",
    "PREMIACIONES",
    "COMPETICIÓN",
  ];

  const filteredNews = INITIAL_NEWS.filter((n) => {
    if (selectedCategory === "TODAS") return true;
    return n.category === selectedCategory;
  });

  return (
    <AuthGuard fallbackMessage="Verificando acceso a Noticias y Comunicados...">
      <div className="min-h-screen bg-[#050914] text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
        <PublicHeader currentPath="/noticias" />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 md:px-8 py-8 md:py-12 space-y-8">
        {/* Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-blue-400" />
            Volver a la portada oficial
          </Link>

          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
            FUTSALBA Oficial • Sala de Prensa
          </span>
        </div>

        {/* Title */}
        <div className="pb-4 border-b border-slate-800">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-2">
            <Activity className="w-3.5 h-3.5" />
            Canal Informativo Oficial
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight uppercase">
            NOTICIAS Y COMUNICADOS
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-2xl">
            Toda la información institucional, resoluciones disciplinarias, coberturas de jornadas e infraestructura de la Liga.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-2 pb-2 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* News Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNews.map((news) => (
            <div
              key={news.id}
              className="sports-card rounded-3xl p-6 border border-slate-800 flex flex-col justify-between space-y-4 hover:border-blue-500/40 transition-all duration-300"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded bg-blue-600/20 text-blue-400 border border-blue-500/30">
                    {news.category}
                  </span>
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    {news.date}
                  </span>
                </div>

                <h2 className="font-bold text-white text-base leading-snug">
                  {news.title}
                </h2>

                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                  {news.summary}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[10px] font-semibold text-slate-500">
                  {news.author}
                </span>

                <button
                  onClick={() => setActiveArticle(news)}
                  className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                >
                  LEER MÁS
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Article Modal */}
        {activeArticle && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="sports-card rounded-3xl max-w-2xl w-full p-6 md:p-8 border border-slate-700 shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 duration-150">
              <button
                onClick={() => setActiveArticle(null)}
                className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
                aria-label="Cerrar modal"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded bg-blue-600/20 text-blue-400 border border-blue-500/30">
                  {activeArticle.category}
                </span>
                <h3 className="text-xl md:text-2xl font-black text-white leading-tight">
                  {activeArticle.title}
                </h3>
                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <span>{activeArticle.date}</span>
                  <span>•</span>
                  <span>{activeArticle.author}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs md:text-sm text-slate-300 leading-relaxed space-y-3">
                <p className="font-semibold text-slate-200">{activeArticle.summary}</p>
                <p className="text-slate-400">{activeArticle.content}</p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setActiveArticle(null)}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/30"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      </div>
    </AuthGuard>
  );
}
