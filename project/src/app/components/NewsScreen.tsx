import { useEffect, useState } from "react";
import { Clock, ExternalLink, Search } from "lucide-react";
import { newsApi } from "../api/api";
import { errorMessage, useApi } from "../api/hooks";
import type { NewsArticle, NewsCategory, NewsDays, NewsFilters } from "../api/types";
import { timeAgo } from "../format";
import LoadState from "./LoadState";
import PageHeader from "./layout/PageHeader";
import PlayerLayout from "./layout/PlayerLayout";
import { useTranslation } from "react-i18next";

interface NewsScreenProps {
  onNavigate: (screen: string) => void;
}

const newsCategories: Array<NewsCategory | "All"> = [
  "All",
  "Transfers",
  "Champions League",
  "World Cup",
  "Premier League",
  "La Liga",
  "Serie A",
  "Bundesliga",
  "Copa Libertadores",
];
/** Período del filtro (RF-178): sin límite, hoy, 3 días o una semana. */
const PERIODS: Array<NewsDays | undefined> = [undefined, 1, 3, 7];
const PAGE_SIZE = 20;
/** Espera tras la última tecla antes de buscar. */
const SEARCH_DEBOUNCE_MS = 300;

/** Feed de noticias (RF-071 a RF-082 y RF-176 a RF-178). */
export default function NewsScreen({ onNavigate }: NewsScreenProps) {
  const { t } = useTranslation();
  const [category, setCategory] = useState<NewsCategory | "All">("All");
  const [days, setDays] = useState<NewsDays | undefined>();
  const [searchText, setSearchText] = useState("");
  const [search, setSearch] = useState("");
  const [extra, setExtra] = useState<NewsArticle[]>([]);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchText.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchText]);

  const filters: NewsFilters = { category, search, days };
  const feed = useApi(() => newsApi.list(filters, 1, PAGE_SIZE), [category, search, days]);

  // RF-077/RF-078: cambiar un filtro no cambia de pantalla; la lista vuelve a la primera página.
  useEffect(() => {
    setExtra([]);
    setPage(1);
    setMoreError(null);
  }, [category, search, days]);

  const articles = [...(feed.data?.data ?? []), ...extra];
  const hasMore = feed.data ? articles.length < feed.data.total : false;
  const filtered = search !== "" || days !== undefined;

  const clearFilters = () => {
    setSearchText("");
    setSearch("");
    setDays(undefined);
    setCategory("All");
  };

  const loadMore = async () => {
    setLoadingMore(true);
    setMoreError(null);
    try {
      const next = await newsApi.list(filters, page + 1, PAGE_SIZE);
      setExtra((current) => [...current, ...next.data]);
      setPage(page + 1);
    } catch (err) {
      setMoreError(errorMessage(err));
    } finally {
      setLoadingMore(false);
    }
  };

  const chip = (active: boolean) =>
    `px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
      active ? "bg-primary text-white" : "bg-card border border-border text-muted-foreground hover:bg-primary/10"
    }`;

  return (
    <PlayerLayout active="news" onNavigate={onNavigate}>
      <PageHeader title={t("news.title")} subtitle={t("news.subtitle")} />

      {/* Buscador (RF-177) y período (RF-178) */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2.5 md:w-96 focus-within:border-primary/50">
          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input
            type="search"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder={t("news.search")}
            aria-label={t("news.search")}
            maxLength={100}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
        <div className="inline-flex self-start rounded-full bg-muted p-1" role="group" aria-label={t("news.period")}>
          {PERIODS.map((option) => (
            <button
              key={option ?? "all"}
              onClick={() => setDays(option)}
              aria-pressed={days === option}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                days === option ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {option === undefined ? t("news.anyTime") : t("news.lastDays", { count: option })}
            </button>
          ))}
        </div>
      </div>

      {/* Categorías (RF-075, RF-076) */}
      <div className="overflow-x-auto scrollbar-hide mb-5">
        <div className="flex gap-2">
          {newsCategories.map((option) => (
            <button key={option} onClick={() => setCategory(option)} className={chip(option === category)}>
              {t(`enums.news.${option}`)}
            </button>
          ))}
        </div>
      </div>

      <LoadState loading={feed.loading} error={feed.error} onRetry={feed.reload} />
      {!feed.loading && feed.data && articles.length === 0 && (
        <div className="text-center py-10">
          <p className="text-sm text-muted-foreground">{filtered ? t("news.noMatches") : t("news.empty")}</p>
          {filtered && (
            <button onClick={clearFilters} className="mt-3 text-sm font-semibold text-primary hover:text-secondary">
              {t("news.clearFilters")}
            </button>
          )}
        </div>
      )}

      {/* Feed en columnas: 1 en celular, 2 en tableta y 3 en escritorio */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {!feed.loading &&
          articles.map((article) => (
            // RF-080 a RF-082: la fuente se abre en otra pestaña; al volver, la lista sigue en el mismo punto.
            <a
              key={article.id}
              href={article.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            >
              {article.imageUrl && <img src={article.imageUrl} alt={article.title} className="w-full h-40 object-cover" />}
              <div className="p-4 flex flex-col flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded">{t(`enums.news.${article.category}`)}</span>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span className="text-xs">{timeAgo(article.publishedAt)}</span>
                  </div>
                </div>
                <h3 className="font-bold text-base text-foreground mb-2 line-clamp-2">{article.title}</h3>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{article.description}</p>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-xs font-medium text-muted-foreground">{article.source}</span>
                  <span className="text-primary hover:text-secondary transition-colors" aria-label={t("news.openOriginal")}>
                    <ExternalLink className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </a>
          ))}
      </div>
      {hasMore && !feed.loading && (
        <button
          onClick={loadMore}
          disabled={loadingMore}
          className="block mx-auto mt-6 px-8 text-primary font-semibold py-3 rounded-xl border border-primary/30 hover:bg-primary/5 transition-colors disabled:opacity-60"
        >
          {loadingMore ? t("common.loading") : t("news.loadMore")}
        </button>
      )}
      {moreError && <p className="text-center text-sm text-red-600 mt-3">{moreError}</p>}
    </PlayerLayout>
  );
}
