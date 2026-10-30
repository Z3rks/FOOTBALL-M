import { motion } from "motion/react";
import { Trophy } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function SplashScreen() {
  const { t } = useTranslation();
  return (
    <div className="h-screen w-full bg-primary flex flex-col items-center justify-center relative overflow-hidden">
      {/* Football texture pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.1) 35px, rgba(255,255,255,.1) 70px)`,
          }}
        />
      </div>

      {/* Logo */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center"
      >
        <div className="bg-accent rounded-full p-8 mb-6 shadow-2xl">
          <Trophy className="w-20 h-20 text-primary" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Football Maestro</h1>
        <p className="text-white/80 text-lg">{t("splash.tagline")}</p>
      </motion.div>

      {/* Loading indicator */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="absolute bottom-16 flex flex-col items-center">
        <div className="flex gap-2 mb-3">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2.5 h-2.5 bg-accent rounded-full"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
        <p className="text-white/60 text-sm">{t("common.loading")}</p>
      </motion.div>
    </div>
  );
}
