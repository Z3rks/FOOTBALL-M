import { Star } from "lucide-react";
import { gamesApi } from "../api/api";
import { useApi } from "../api/hooks";
import LoadState from "./LoadState";
import GameIcon from "./games/GameIcon";
import PageHeader from "./layout/PageHeader";
import PlayerLayout from "./layout/PlayerLayout";
import { useTranslation } from "react-i18next";

interface MinigamesScreenProps {
  onNavigate: (screen: string) => void;
  onPlayGame: (gameId: string) => void;
}

const difficultyColors = {
  Easy: "text-green-600 bg-green-50 border-green-200",
  Medium: "text-orange-600 bg-orange-50 border-orange-200",
  Hard: "text-red-600 bg-red-50 border-red-200",
  Expert: "text-purple-600 bg-purple-50 border-purple-200",
};

/** Catálogo de minijuegos (RF-083 a RF-090). */
export default function MinigamesScreen({ onNavigate, onPlayGame }: MinigamesScreenProps) {
  const { t } = useTranslation();
  const games = useApi(gamesApi.list);

  return (
    <PlayerLayout active="minigames" onNavigate={onNavigate}>
      <PageHeader title={t("minigames.title")} subtitle={t("minigames.subtitle")} />
      <LoadState loading={games.loading} error={games.error} onRetry={games.reload} />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
        {games.data?.map((game) => (
          <button
            key={game.id}
            onClick={() => onPlayGame(game.id)}
            className="text-left bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-primary/30 transition-all active:scale-95"
          >
            <GameIcon icon={game.icon} size="lg" className="mb-3" />
            <h3 className="font-bold text-sm text-foreground mb-1 line-clamp-2 min-h-[40px]">{game.name}</h3>
            <p className="text-xs text-muted-foreground mb-3 line-clamp-2 min-h-[32px]">{game.description}</p>
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{t(`enums.category.${game.category}`)}</span>
              </div>
              <div className={`text-xs font-semibold px-2 py-1 rounded-md border inline-block ${difficultyColors[game.difficulty]}`}>
                {t(`enums.difficulty.${game.difficulty}`)}
              </div>
            </div>
          </button>
        ))}
      </div>
    </PlayerLayout>
  );
}
