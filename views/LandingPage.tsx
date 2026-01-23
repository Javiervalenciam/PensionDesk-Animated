import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Navbar } from '../components/Navbar';
import { ArrowRight, ShieldCheck, Database, Zap, FileText } from 'lucide-react';

const WEBP_URL = "https://koauptynsopzpwmgpyps.supabase.co/storage/v1/object/sign/web/49d7e006-063d-4475-95c4-b63b2fd8909b-ezgif.com-video-to-webp-converter%20(1).webp?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8xOGIzM2Q4Zi1mMmJmLTQwNmItODk3OC1lMzAxODc0N2UyOTQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJ3ZWIvNDlkN2UwMDYtMDYzZC00NDc1LTk1YzQtYjYzYjJmZDg5MDliLWV6Z2lmLmNvbS12aWRlby10by13ZWJwLWNvbnZlcnRlciAoMSkud2VicCIsImlhdCI6MTc2OTIwMzU0NywiZXhwIjoxODAwNzM5NTQ3fQ.gSkWQ-pThrJU_eC-hEwLPvXhzk3ZFpT6nOt3fJlJ_4I";

interface LandingPageProps {
  onEnterApp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  // Parallax effects
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.2]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0.3]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, 200]);

  return (
    <div className="relative">
      <Navbar onEnterApp={onEnterApp} />

      {/* Hero Section */}
      <section ref={containerRef} className="relative h-screen w-full overflow-hidden flex items-center justify-center">
        {/* Animated Background */}
        <motion.div
          style={{ y, scale, opacity }}
          className="absolute inset-0 z-0"
        >
          <div className="absolute inset-0 bg-black/40 z-10" /> {/* Overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black z-10" />
          <img
            src={WEBP_URL}
            alt="PensiónDesk Cinematic Background"
            className="w-full h-full object-cover"
          />
        </motion.div>

        {/* Content Overlay */}
        <motion.div
          style={{ y: textY }}
          className="relative z-20 text-center px-4 max-w-4xl mx-auto flex flex-col items-center"
        >
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-xs md:text-sm font-bold tracking-[0.4em] uppercase text-zinc-300 mb-6 border border-zinc-600 rounded-full px-4 py-1 backdrop-blur-sm"
          >
            Local First &bull; Offline &bull; Secure
          </motion.h2>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-6xl md:text-8xl font-serif font-medium text-white mb-4 leading-tight"
          >
            Pensión<span className="font-bold">Desk</span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="text-2xl md:text-3xl font-light text-zinc-200 mb-8"
          >
            Gestión Jurídica Aumentada
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="text-zinc-400 max-w-2xl text-lg mb-10 leading-relaxed"
          >
            Arquitectura experta para gestión de requerimientos pensionales.
            Sin nube. Sin dependencias. 100% privacidad y control local.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-6 items-center"
          >
            <button
              onClick={onEnterApp}
              className="bg-white text-black px-8 py-4 rounded-full font-semibold text-sm uppercase tracking-wider hover:bg-zinc-200 transition-all hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
            >
              Iniciar Entorno Local
            </button>
            <button className="bg-transparent border border-white/30 text-white px-8 py-4 rounded-full font-semibold text-sm uppercase tracking-wider hover:bg-white/10 transition-all hover:border-white">
              Ver Documentación
            </button>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-10 z-20 text-white/50 flex flex-col items-center gap-2"
        >
          <span className="text-[10px] uppercase tracking-widest">Descubre Más</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-white to-transparent" />
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-black py-32 relative z-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<ShieldCheck className="w-8 h-8" />}
              title="100% Offline"
              desc="Privacidad absoluta. Base de datos SQLite local. Sin APIs externas."
            />
            <FeatureCard
              icon={<Zap className="w-8 h-8" />}
              title="Prompts Parametrizados"
              desc="Biblioteca de ingeniería de prompts lista para copiar y pegar."
            />
            <FeatureCard
              icon={<Database className="w-8 h-8" />}
              title="Control de Términos"
              desc="Cálculo automático de días hábiles y alertas de vencimiento."
            />
            <FeatureCard
              icon={<FileText className="w-8 h-8" />}
              title="Motor Experto"
              desc="Playbooks integrados para estandarizar decisiones jurídicas."
            />
          </div>
        </div>
      </section>

       {/* Detailed Spec Preview Section */}
       <section className="bg-surface py-24 border-t border-border">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row gap-16 items-center">
            <div className="flex-1 space-y-8">
                <h3 className="text-4xl font-serif text-white">Ecosistema MVP1</h3>
                <p className="text-zinc-400 leading-relaxed">
                  Diseñado bajo especificaciones rigurosas para un solo usuario experto.
                  Incluye <strong className="text-white">Case Desk</strong>, <strong className="text-white">Prompt Builder</strong>, y gestión documental avanzada.
                  Todo ejecutándose en <code className="bg-zinc-900 px-2 py-1 rounded text-zinc-300 border border-zinc-800">localhost</code>.
                </p>
                <ul className="space-y-4">
                  <ListItem text="Semáforo de términos configurables (Vencido, En Riesgo, OK)" />
                  <ListItem text="Gestión de Estados Críticos (Pendiente Firma)" />
                  <ListItem text="Generación de Prompts Model-Agnostic" />
                  <ListItem text="Cálculo de fechas hábiles con festivos locales" />
                </ul>
                <button onClick={onEnterApp} className="flex items-center gap-2 text-white border-b border-white pb-1 hover:text-zinc-300 transition-colors">
                  Acceder a la Demo <ArrowRight className="w-4 h-4" />
                </button>
            </div>
            <div className="flex-1 w-full relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-zinc-700 to-zinc-900 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                <div className="relative bg-black border border-zinc-800 rounded-lg p-6 h-96 overflow-hidden flex flex-col">
                   {/* Abstract UI Representation */}
                   <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-4">
                      <div className="w-32 h-4 bg-zinc-800 rounded animate-pulse"></div>
                      <div className="flex gap-2">
                        <div className="w-8 h-8 bg-zinc-800 rounded-full"></div>
                        <div className="w-8 h-8 bg-white/10 rounded-full"></div>
                      </div>
                   </div>
                   <div className="space-y-3">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className="flex items-center justify-between p-3 bg-zinc-900/50 rounded border border-zinc-800/50">
                            <div className="w-1/3 h-3 bg-zinc-800 rounded"></div>
                            <div className="w-1/4 h-3 bg-zinc-800 rounded"></div>
                            <div className={`w-2 h-2 rounded-full ${i === 1 ? 'bg-red-500' : i===2 ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                        </div>
                      ))}
                   </div>
                   <div className="mt-auto pt-4 flex justify-center">
                      <span className="text-xs text-zinc-600 font-mono">MVP1 PREVIEW BUILD</span>
                   </div>
                </div>
            </div>
          </div>
       </section>

      <footer className="bg-black py-12 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-6 text-center text-zinc-600 text-sm">
          <p>&copy; 2024 PensiónDesk Local. All systems operational. Localhost Environment.</p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
  <div className="group p-6 rounded-xl border border-zinc-900 bg-zinc-950/50 hover:bg-zinc-900/80 hover:border-zinc-700 transition-all duration-300">
    <div className="mb-4 text-zinc-400 group-hover:text-white transition-colors">{icon}</div>
    <h3 className="text-lg font-medium text-white mb-2">{title}</h3>
    <p className="text-sm text-zinc-500 leading-relaxed">{desc}</p>
  </div>
);

const ListItem = ({ text }: { text: string }) => (
  <li className="flex items-start gap-3 text-zinc-400 text-sm">
    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-white flex-shrink-0" />
    <span>{text}</span>
  </li>
);