import { useState } from "react";
import { Coins, Trophy, Share2, Flame, Gift, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { creditsApi } from "../api/api";
import { errorMessage, useApi } from "../api/hooks";
import type { StoreItem } from "../api/types";
import { formatNumber } from "../format";
import LoadState from "./LoadState";
import PageHeader from "./layout/PageHeader";
import PlayerLayout from "./layout/PlayerLayout";
import { useTranslation } from "react-i18next";

interface CreditsScreenProps {
  onNavigate: (screen: string) => void;
}

const earnIcons: Record<string, LucideIcon> = {
  daily_challenge: Trophy,
  streak_7_days: Flame,
  share_result: Share2,
  referral: Gift,
};

const typeLabels: Record<StoreItem["type"], string> = {
  avatar: "credits.types.avatar",
  badge_frame: "credits.types.badgeFrame",
  ball_icon: "credits.types.ballIcon",
  background: "credits.types.background",
};

/**
 * Colores de la maqueta por artículo, según su ícono (el nombre cambia con el idioma); los
 * artículos nuevos usan el color de su tipo.
 */
const itemColors: Record<string, string> = {
  "⚽": "bg-yellow-100", // Golden Ball Avatar
  "🏆": "bg-blue-100", // Champions Badge Frame
  "🔥": "bg-red-100", // Fire Ball Icon
  "🏟️": "bg-green-100", // Camp Nou Background
  "👑": "bg-purple-100", // Royal Crown Avatar
  "🌈": "bg-pink-100", // Rainbow Badge Frame
};
const typeColors: Record<StoreItem["type"], string> = {
  avatar: "bg-yellow-100",
  badge_frame: "bg-blue-100",
  ball_icon: "bg-red-100",
  background: "bg-green-100",
};

/** Saldo, formas de ganar créditos y tienda (RF-114 a RF-120). */
export default function CreditsScreen({ onNavigate }: CreditsScreenProps) {
  const { t } = useTranslation();
  const balance = useApi(creditsApi.balance);
  const methods = useApi(creditsApi.earnMethods);
  const items = useApi(creditsApi.storeItems);
  const [busyItem, setBusyItem] = useState<string | null>(null);

  // RF-119/RF-120: descuenta, aplica el artículo y el usuario sigue en la tienda con el saldo nuevo.
  const purchase = async (item: StoreItem) => {
    setBusyItem(item.id);
    try {
      const { newBalance } = await creditsApi.purchase(item.id);
      balance.setData({ balance: newBalance });
      await items.reload();
      toast.success(t("credits.purchased", { item: item.name }));
    } catch (err) {
      toast.error(errorMessage(err));
      void balance.reload();
      void items.reload();
    } finally {
      setBusyItem(null);
    }
  };

  const equip = async (item: StoreItem) => {
    setBusyItem(item.id);
    try {
      await creditsApi.equip(item.id);
      await items.reload();
      toast.success(t("credits.equipped", { item: item.name }));
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusyItem(null);
    }
  };

  const buttonFor = (item: StoreItem) => {
    if (item.equipped) return { label: t("credits.button.equipped"), action: undefined, style: "bg-green-100 text-green-700 cursor-default" };
    if (item.owned) return { label: t("credits.button.equip"), action: () => equip(item), style: "bg-white text-primary border-2 border-primary hover:bg-primary/5" };
    if (item.affordable) return { label: t("credits.button.purchase"), action: () => purchase(item), style: "bg-primary text-white hover:bg-secondary" };
    return { label: t("credits.button.notEnough"), action: undefined, style: "bg-muted text-muted-foreground cursor-not-allowed" };
  };

  return (
    <PlayerLayout active="credits" onNavigate={onNavigate}>
      <PageHeader
        title={t("credits.title")}
        subtitle={t("credits.subtitle")}
        actions={
          // Saldo (RF-114)
          <div className="flex items-center gap-3 bg-gradient-to-br from-accent/25 to-accent/5 border border-accent/30 rounded-2xl px-4 py-2.5">
            <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center">
              <Coins className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("credits.balance")}</p>
              <p className="text-2xl font-bold text-foreground leading-tight">{balance.data ? formatNumber(balance.data.balance) : "–"}</p>
            </div>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3 items-start">
        {/* Cómo ganar créditos (RF-115) */}
        <section className="bg-card border border-border rounded-2xl p-4 md:p-5 shadow-sm">
          <h3 className="text-lg font-bold text-foreground mb-3">{t("credits.howToEarn")}</h3>
          <LoadState loading={methods.loading} error={methods.error} onRetry={methods.reload} />
          <div className="space-y-2">
            {methods.data?.map((method) => {
              const Icon = earnIcons[method.reason] ?? Coins;
              return (
                <div key={method.reason} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{t(`credits.earn.${method.reason}`, { defaultValue: method.method })}</p>
                  </div>
                  <div className="flex items-center gap-1 text-accent font-bold">
                    <Coins className="w-4 h-4" />
                    <span className="text-sm">+{method.credits}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Tienda (RF-116 a RF-120) */}
        <section className="lg:col-span-2">
          <h3 className="text-lg font-bold text-foreground mb-3">{t("credits.storeItems")}</h3>
          <LoadState loading={items.loading && !items.data} error={items.error} onRetry={items.reload} />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
            {items.data?.map((item) => {
              const button = buttonFor(item);
              const dimmed = !item.owned && !item.affordable;
              return (
                <div key={item.id} className={`bg-card border rounded-xl p-4 shadow-sm transition-all ${dimmed ? "border-border opacity-60" : "border-border hover:shadow-md"}`}>
                  <div className={`${itemColors[item.icon] ?? typeColors[item.type]} w-16 h-16 rounded-xl flex items-center justify-center text-3xl mb-3 mx-auto`}>{item.icon}</div>
                  <h4 className="font-semibold text-sm text-foreground mb-1 text-center line-clamp-2 min-h-[40px]">{item.name}</h4>
                  <p className="text-xs text-muted-foreground text-center mb-3">{t(typeLabels[item.type])}</p>
                  <div className="flex items-center justify-center gap-1.5">
                    <Coins className="w-4 h-4 text-accent" />
                    <span className="font-bold text-foreground">{formatNumber(item.cost)}</span>
                  </div>
                  <button
                    disabled={!button.action || busyItem !== null}
                    onClick={button.action}
                    className={`w-full mt-3 py-2 rounded-lg font-semibold text-sm transition-colors disabled:opacity-80 ${button.style}`}
                  >
                    {busyItem === item.id ? "…" : button.label}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </PlayerLayout>
  );
}
