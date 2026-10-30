"use client";

import React, { useState } from "react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { INITIAL_NEWS, NewsItem } from "@/app/noticias/page";
import {
  Smartphone,
  Shield,
  Award,
  Activity,
  Tv,
  X,
  MapPin,
  ChevronRight,
  Info,
  Clock,
  Mail,
  Building2,
  Users2,
  CalendarDays,
  FileText,
  Sparkles,
} from "lucide-react";

function InstagramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

interface TeamMember {
  id: string;
  role: string;
  title: string;
  area: string;
  description: string;
  tag: string;
}

const PUBLIC_STAFF: TeamMember[] = [
  {
    id: "staff-1",
    role: "Junta Directiva",
    title: "Comisión Directiva Central",
    area: "Alta Conducción",
    description:
      "Máximo órgano ejecutivo de la Liga responsable de la gobernanza, planificación estratégica y articulación institucional con entidades deportivas.",
    tag: "Dirección",
  },
  {
    id: "staff-2",
    role: "Secretaría General",
    title: "Secretaría General y Asuntos Legales",
    area: "Administración",
    description:
      "Gestión documental, reglamentaria y vínculo protocolar permanente con los delegados y representantes de los clubes afiliados.",
    tag: "Gobernanza",
  },
  {
    id: "staff-3",
    role: "Dirección Técnica",
    title: "Comisión Técnica y Competiciones",
    area: "Área Deportiva",
    description:
      "Programación de calendarios, fixture, homologación de plantillas de jugadores y supervisión del formato de competición oficial.",
    tag: "Torneo",
  },
  {
    id: "staff-4",
    role: "Colegio de Árbitros",
    title: "Comisión Arbitral Oficial",
    area: "Justicia Deportiva",
    description:
      "Designación, evaluación continua y capacitación reglamentaria del cuerpo arbitral bajo las directrices oficiales de las reglas del futsal.",
    tag: "Arbitraje",
  },
  {
    id: "staff-5",
    role: "Mesa Técnica",
    title: "Coordinación de Cronometraje y Actas",
    area: "Operaciones",
    description:
      "Operación del sistema digital de cronometraje, registro de incidencias, tiempos muertos y control de faltas acumuladas en cada encuentro.",
    tag: "Mesa Digital",
  },
  {
    id: "staff-6",
    role: "Tribunal Disciplinario",
    title: "Tribunal de Penas y Fair Play",
    area: "Resoluciones",
    description:
      "Aplicación objetiva de las normas de conducta deportiva, análisis de actas arbitrales y emisión de resoluciones sancionatorias.",
    tag: "Disciplina",
  },
  {
    id: "staff-7",
    role: "Infraestructura",
    title: "Comisión de Sedes y Seguridad",
    area: "Logística",
    description:
      "Supervisión del estado de las canchas con superficie de madera flotante, iluminación técnica, accesos y protocolos de seguridad en los estadios.",
    tag: "Sedes",
  },
  {
    id: "staff-8",
    role: "Prensa y Medios",
    title: "Departamento de Comunicaciones",
    area: "Prensa Oficial",
    description:
      "Emisión de comunicados oficiales, coberturas audiovisuales, atención a medios acreditados y difusión pública de la Liga.",
    tag: "Comunicaciones",
  },
];

interface GalleryItem {
  id: string;
  category: "JORNADAS" | "EQUIPOS" | "CANCHAS" | "INAUGURACIONES" | "PREMIACIONES" | "EVENTOS";
  title: string;
  caption: string;
  gradient: string;
  badge: string;
}

const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: "gal-1",
    category: "CANCHAS",
    title: "Superficie de Parquet Flotante Habilitada",
    caption:
      "Microestadio central acondicionado con piso reglamentario de alta amortiguación para el máximo rendimiento de los atletas.",
    gradient: "from-blue-900/60 via-slate-900/80 to-[#050914]",
    badge: "Infraestructura",
  },
  {
    id: "gal-2",
    category: "INAUGURACIONES",
    title: "Ceremonia Protocolar de Apertura",
    caption:
      "Acto inaugural de la temporada oficial con la presentación de delegaciones, himnos patrios y encendido del marcador central.",
    gradient: "from-indigo-900/60 via-slate-900/80 to-[#050914]",
    badge: "Institucional",
  },
  {
    id: "gal-3",
    category: "JORNADAS",
    title: "Intensidad y Velocidad en Pista",
    caption:
      "Duelos de alto nivel técnico en el desarrollo de la fase regular seguidos con entusiasmo por la afición.",
    gradient: "from-cyan-950 via-slate-900/80 to-[#050914]",
    badge: "Competencia",
  },
  {
    id: "gal-4",
    category: "PREMIACIONES",
    title: "El Trofeo Oficial de la Liga FUTSALBA",
    caption:
      "La máxima distinción que coronará al campeón absoluto tras una temporada de esfuerzo, estrategia y disciplina.",
    gradient: "from-amber-950/60 via-slate-900/80 to-[#050914]",
    badge: "Galardón",
  },
  {
    id: "gal-5",
    category: "EQUIPOS",
    title: "Plantillas Oficiales Homologadas",
    caption:
      "Los clubes afiliados posando con su indumentaria reglamentaria y cuerpo técnico antes del pitazo inicial.",
    gradient: "from-blue-950/80 via-slate-900/90 to-[#050914]",
    badge: "Clubes",
  },
  {
    id: "gal-6",
    category: "EVENTOS",
    title: "Capacitación y Seminarios Técnicos",
    caption:
      "Jornadas de actualización sobre el reglamento de arbitraje y cronometraje de mesa con los directores de cada club.",
    gradient: "from-slate-800/80 via-slate-900/90 to-[#050914]",
    badge: "Formación",
  },
];

const SPONSORS = [
  { id: "sp-1", name: "Patrocinador Principal", role: "Sponsor Oficial", category: "Presentador de la Liga" },
  { id: "sp-2", name: "Balón Oficial de Competición", role: "Equipamiento Técnico", category: "Proveedor Oficial" },
  { id: "sp-3", name: "Bebida e Hidratación", role: "Salud y Nutrición Deportiva", category: "Aliado Oficial" },
  { id: "sp-4", name: "Infraestructura & Sedes", role: "Apoyo Logístico e Instalaciones", category: "Socio Estratégico" },
  { id: "sp-5", name: "Cobertura Audiovisual", role: "Medios y Transmisión", category: "Media Partner" },
  { id: "sp-6", name: "Institución Colaboradora", role: "Fomento del Deporte Comunitario", category: "Aliado Institucional" },
];

export default function HomePage() {
  const [activeArticle, setActiveArticle] = useState<NewsItem | null>(null);
  const [galleryFilter, setGalleryFilter] = useState<string>("TODOS");

  const filteredGallery = GALLERY_ITEMS.filter((item) => {
    if (galleryFilter === "TODOS") return true;
    return item.category === galleryFilter;
  });

  return (
    <div className="min-h-screen bg-[#050914] text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* 1. Header Oficial de la Liga */}
      <PublicHeader currentPath="/" />

      {/* 2. Hero Principal Institucional */}
      <section className="relative overflow-hidden py-20 md:py-32 px-4 md:px-8 bg-gradient-to-b from-[#091328] via-[#060c18] to-[#050914] border-b border-slate-800/80">
        {/* Glow de fondo institucional */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[650px] md:w-[900px] h-[400px] bg-blue-600/10 rounded-full blur-[160px] pointer-events-none" />

        <div className="max-w-4xl mx-auto space-y-8 relative z-10 text-center">
          {/* Badge institucional */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-600/15 border border-blue-500/30 text-blue-300 text-xs font-bold tracking-widest uppercase">
            <Shield className="w-3.5 h-3.5 text-blue-400" />
            <span>Sitio Oficial de la Liga</span>
          </div>

          {/* Título Principal */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight uppercase leading-[1.08]">
              LA PASIÓN DEL FUTSAL <br className="hidden sm:inline" /> EN TIEMPO REAL
            </h1>

            <p className="text-sm md:text-base text-slate-300 font-normal max-w-2xl mx-auto leading-relaxed">
              Portal institucional de la Liga FUTSALBA. Promoviendo la excelencia deportiva, la integridad competitiva y el desarrollo del fútbol sala bajo estándares reglamentarios oficiales.
            </p>
          </div>

          {/* CTAs del Hero */}
          <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            {/* CTA Principal: App Móvil (Próximamente) */}
            <a
              href="#app-futsalba"
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-200 hover:text-white text-xs font-black tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
            >
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>APP FUTSALBA — PRÓXIMAMENTE</span>
            </a>

            {/* CTA Secundario: Conoce la Liga */}
            <a
              href="#la-liga"
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-md"
            >
              <span>CONOCE LA LIGA</span>
              <ChevronRight className="w-4 h-4 text-blue-400" />
            </a>
          </div>
        </div>
      </section>

      {/* 3. Sección: ACTUALIDAD FUTSALBA */}
      <section id="actualidad" className="scroll-mt-20 max-w-6xl w-full mx-auto px-4 md:px-8 py-20 space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-widest mb-1.5">
              <Tv className="w-3.5 h-3.5" />
              <span>Comunicaciones y Medios</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">
              ACTUALIDAD FUTSALBA
            </h2>
            <p className="text-xs md:text-sm text-slate-400 mt-0.5">
              Noticias, resoluciones reglamentarias y comunicados oficiales emitidos por la Liga.
            </p>
          </div>
        </div>

        {/* Artículos de prensa */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {INITIAL_NEWS.slice(0, 3).map((news) => (
            <article
              key={news.id}
              className="sports-card rounded-3xl p-6 border border-slate-800/90 bg-slate-950/60 flex flex-col justify-between space-y-4 hover:border-blue-500/40 transition-all duration-300"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded bg-blue-600/20 text-blue-400 border border-blue-500/30">
                    {news.category}
                  </span>
                  <span className="text-[10px] text-slate-500">{news.date}</span>
                </div>

                <h3 className="font-bold text-white text-base leading-snug">
                  {news.title}
                </h3>

                <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                  {news.summary}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-[10px] text-slate-500 font-medium truncate max-w-[150px]">
                  {news.author}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveArticle(news)}
                  className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                >
                  LEER COMUNICADO
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 4. Sección: CONOCE FUTSALBA & PRESIDENCIA */}
      <section id="la-liga" className="scroll-mt-20 bg-[#060b18] border-y border-slate-800/90 py-20 md:py-28 px-4 md:px-8">
        <div className="max-w-6xl mx-auto space-y-16">
          {/* Cabecera institucional */}
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">
              Institución, Propósito y Gobernanza
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">
              CONOCE FUTSALBA
            </h2>
            <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
              La entidad oficial orientada a estructurar, organizar y jerarquizar la práctica del fútbol sala en la región, asegurando un marco competitivo transparente y de alto rendimiento.
            </p>
          </div>

          {/* Bloques Editoriales: Historia, Propósito y Valores */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 md:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base">Historia y Fundación</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                FUTSALBA nació con la visión de consolidar un torneo integral que dignifique a clubes, jugadores y técnicos, unificando criterios reglamentarios y elevando el estándar competitivo de la disciplina.
              </p>
            </div>

            <div className="p-6 md:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center font-bold">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base">Propósito Deportivo</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Fomentar el talento atlético, proveer infraestructura moderna con pisos reglamentarios de madera flotante y garantizar un espectáculo de calidad para la afición deportiva.
              </p>
            </div>

            <div className="p-6 md:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base">Valores Fundamentales</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Juego limpio (Fair Play), respeto a las normas del arbitraje oficial, disciplina formativa, integridad institucional y compromiso con la juventud.
              </p>
            </div>
          </div>

          {/* Espacio Grande de Presidencia */}
          <div className="rounded-3xl border border-blue-500/30 bg-gradient-to-br from-slate-900/90 via-[#071126] to-[#040814] p-8 md:p-12 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Marco Fotográfico Protocolar de Presidencia (Sin datos inventados) */}
              <div className="lg:col-span-4 flex flex-col items-center text-center space-y-4">
                <div className="w-44 h-44 sm:w-48 sm:h-48 rounded-3xl bg-gradient-to-tr from-slate-900 via-blue-950 to-slate-900 border-2 border-blue-400/40 shadow-2xl flex flex-col items-center justify-center p-4 relative group">
                  <div className="w-20 h-20 rounded-2xl bg-blue-600/20 border border-blue-400/30 flex items-center justify-center mb-2">
                    <Shield className="w-10 h-10 text-blue-300" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-300">
                    FUTSALBA
                  </span>
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider mt-0.5">
                    Despacho de Presidencia
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-black uppercase tracking-wider text-blue-400">
                    Presidencia Institucional
                  </div>
                  <div className="text-lg font-black text-white">
                    Presidente de la Liga FUTSALBA
                  </div>
                  <div className="text-xs text-slate-400">
                    Conducción Oficial de la Liga
                  </div>
                </div>
              </div>

              {/* Mensaje Institucional del Presidente */}
              <div className="lg:col-span-8 space-y-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/15 border border-blue-500/25 text-blue-300 text-xs font-bold uppercase tracking-wider">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Mensaje Institucional</span>
                </div>

                <blockquote className="text-sm md:text-base text-slate-200 font-normal leading-relaxed italic border-l-2 border-blue-500 pl-4 md:pl-6 space-y-3">
                  <p>
                    &ldquo;FUTSALBA nació con la convicción de que el fútbol sala merece una estructura formal, moderna y transparente. Cada club, cada atleta y cada partido reflejan el esfuerzo de una comunidad deportiva que sueña con competencias organizadas bajo los más rigurosos estándares.&rdquo;
                  </p>
                  <p>
                    &ldquo;Nuestra meta primordial es consolidar un torneo ejemplar, donde impere el juego limpio, la formación continua de nuestros jueces y la jerarquización de nuestras sedes. La Liga es el hogar de quienes viven este deporte con auténtica pasión.&rdquo;
                  </p>
                </blockquote>

                <div className="pt-2 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
                  <span className="font-semibold text-slate-300">
                    Despacho Oficial de Presidencia
                  </span>
                  <span className="text-blue-400 font-bold uppercase tracking-wider">
                    Gestión Oficial 2026
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Sección: NUESTRO EQUIPO */}
      <section id="nuestro-equipo" className="scroll-mt-20 max-w-6xl w-full mx-auto px-4 md:px-8 py-20 space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">
            Estructura Organizativa Oficial
          </span>
          <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">
            NUESTRO EQUIPO
          </h2>
          <p className="text-xs md:text-sm text-slate-400">
            Cuerpo directivo, comisiones técnicas y personal responsable de la gestión de la Liga FUTSALBA.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {PUBLIC_STAFF.map((member) => (
            <div
              key={member.id}
              className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 hover:border-blue-500/30 transition-all flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-blue-600/15 text-blue-400 border border-blue-500/25">
                    {member.tag}
                  </span>
                  <span className="text-[10px] text-slate-500">{member.area}</span>
                </div>

                <h3 className="font-bold text-white text-sm leading-snug">
                  {member.role}
                </h3>

                <p className="text-[11px] font-semibold text-blue-300">
                  {member.title}
                </p>

                <p className="text-xs text-slate-400 leading-relaxed pt-1">
                  {member.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Sección: GALERÍA FUTSALBA */}
      <section id="galeria" className="scroll-mt-20 bg-[#060b18] border-t border-slate-800/90 py-20 md:py-28 px-4 md:px-8">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">
                Archivo Visual Oficial
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">
                GALERÍA FUTSALBA
              </h2>
              <p className="text-xs md:text-sm text-slate-400 mt-0.5">
                Imágenes de jornadas, clubes, microestadios, inauguraciones, premiaciones y eventos oficiales.
              </p>
            </div>

            {/* Filtros de la Galería */}
            <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
              {[
                { label: "Todos", key: "TODOS" },
                { label: "Jornadas", key: "JORNADAS" },
                { label: "Equipos", key: "EQUIPOS" },
                { label: "Canchas", key: "CANCHAS" },
                { label: "Inauguraciones", key: "INAUGURACIONES" },
                { label: "Premiaciones", key: "PREMIACIONES" },
                { label: "Eventos", key: "EVENTOS" },
              ].map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setGalleryFilter(filter.key)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                    galleryFilter === filter.key
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                      : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grid de Galería Visual */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGallery.map((item) => (
              <div
                key={item.id}
                className={`sports-card rounded-3xl p-6 border border-slate-800/90 relative overflow-hidden min-h-[240px] flex flex-col justify-end bg-gradient-to-t ${item.gradient} hover:border-blue-500/50 transition-all duration-300 group`}
              >
                <div className="absolute top-4 left-4">
                  <span className="text-[9px] font-black uppercase px-2.5 py-1 rounded bg-black/70 backdrop-blur-md text-blue-300 border border-blue-500/30">
                    {item.badge}
                  </span>
                </div>

                <div className="space-y-1 relative z-10">
                  <h3 className="font-bold text-white text-base group-hover:text-blue-300 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {item.caption}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Sección: APP FUTSALBA (Promocional y Destacada) */}
      <section
        id="app-futsalba"
        className="scroll-mt-20 py-20 md:py-28 px-4 md:px-8 bg-gradient-to-b from-[#050914] via-[#07132a] to-[#050914] border-t border-slate-800"
      >
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500/20 to-blue-600/20 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center shadow-xl shadow-emerald-500/10">
            <Smartphone className="w-8 h-8" />
          </div>

          <div className="space-y-3 max-w-2xl mx-auto">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
              Aplicación Móvil Oficial
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight">
              LLEVA FUTSALBA CONTIGO
            </h2>
            <p className="text-sm md:text-base text-slate-300 leading-relaxed font-normal">
              Partidos, resultados, clasificación, estadísticas y toda la información oficial de FUTSALBA desde tu teléfono.
            </p>
          </div>

          {/* Botón Promocional Seguro (Próximamente para Android) */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <div className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-slate-900 border border-emerald-500/40 text-slate-100 text-xs font-black tracking-widest uppercase shadow-xl">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>PRÓXIMAMENTE PARA ANDROID</span>
            </div>
          </div>

          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            La app oficial será el espacio exclusivo para el seguimiento en vivo de cada jornada, tablas de posiciones en tiempo real y notificaciones al instante.
          </p>
        </div>
      </section>

      {/* 8. Sección: PATROCINADORES OFICIALES */}
      <section className="py-16 md:py-20 px-4 md:px-8 bg-[#040711] border-t border-slate-800/80">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">
              Alianzas y Respaldo Institucional
            </span>
            <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">
              PATROCINADORES Y ALIADOS OFICIALES
            </h2>
            <p className="text-xs text-slate-400">
              Marcas e instituciones comprometidas con el impulso del fútbol sala reglamentario.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {SPONSORS.map((sp) => (
              <div
                key={sp.id}
                className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 text-center space-y-1.5 flex flex-col items-center justify-center min-h-[100px] hover:border-slate-700 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-600/10 text-blue-400 flex items-center justify-center text-xs font-black">
                  F
                </div>
                <div className="text-xs font-bold text-white leading-tight">
                  {sp.name}
                </div>
                <div className="text-[10px] text-slate-500">
                  {sp.role}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modal para lectura de comunicado oficial */}
      {activeArticle && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="sports-card rounded-3xl max-w-2xl w-full p-6 md:p-8 border border-slate-700 shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setActiveArticle(null)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
              aria-label="Cerrar comunicado"
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

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs md:text-sm text-slate-300 leading-relaxed space-y-3 max-h-[60vh] overflow-y-auto">
              <p className="font-semibold text-slate-200">{activeArticle.summary}</p>
              <p className="text-slate-400 whitespace-pre-line">{activeArticle.content}</p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setActiveArticle(null)}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/30"
              >
                Cerrar Comunicado
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. FOOTER INSTITUCIONAL */}
      <footer className="mt-auto border-t border-slate-800/80 bg-[#02050b] py-14 px-4 md:px-8 text-xs text-slate-400">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Identidad */}
            <div className="md:col-span-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-blue-500/20">
                  F
                </div>
                <div>
                  <div className="font-black text-base text-white tracking-wider">
                    FUTSALBA
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
                    Liga Oficial de Fútbol Sala
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                Asociación rectora del fútbol sala reglamentario. Compromiso con el deporte formativo, la alta competencia y la transparencia organizativa.
              </p>
            </div>

            {/* Navegación y Secciones */}
            <div className="md:col-span-4 space-y-2">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Secciones Oficiales
              </div>
              <ul className="space-y-1.5 text-xs text-slate-400">
                <li>
                  <a href="/#" className="hover:text-blue-400 transition-colors">
                    Inicio
                  </a>
                </li>
                <li>
                  <a href="/#la-liga" className="hover:text-blue-400 transition-colors">
                    La Liga e Historia
                  </a>
                </li>
                <li>
                  <a href="/#actualidad" className="hover:text-blue-400 transition-colors">
                    Actualidad y Sala de Prensa
                  </a>
                </li>
                <li>
                  <a href="/#galeria" className="hover:text-blue-400 transition-colors">
                    Galería Oficial
                  </a>
                </li>
                <li>
                  <a href="/#app-futsalba" className="hover:text-blue-400 transition-colors">
                    App Móvil FUTSALBA
                  </a>
                </li>
              </ul>
            </div>

            {/* Redes y Contacto */}
            <div className="md:col-span-3 space-y-3">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Contacto y Redes
              </div>

              <div className="space-y-2">
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs text-slate-300 hover:text-white transition-colors"
                >
                  <InstagramIcon className="w-4 h-4 text-pink-400" />
                  <span>Instagram Oficial @futsalba</span>
                </a>

                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Mail className="w-4 h-4 text-blue-400" />
                  <span>contacto@futsalba.com</span>
                </div>
              </div>
            </div>
          </div>

          {/* Barra inferior */}
          <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
            <div>
              © 2026 FUTSALBA — Sitio Web Oficial de la Liga. Todos los derechos reservados.
            </div>
            <div className="text-slate-500">
              Desarrollado para la excelencia del fútbol sala.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
