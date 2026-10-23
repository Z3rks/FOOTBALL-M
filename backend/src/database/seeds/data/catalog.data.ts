import { StoreItemType } from '../../../credits/entities/store-item.entity';
import { GameCategory } from '../../../games/enums';
import { BadgeCode } from '../../../users/entities/badge.entity';

/** Los 6 artículos de la tienda de CreditsScreen (nombre original en inglés, traducción al español). */
export const STORE_ITEMS = [
  { name: 'Golden Ball Avatar', itemType: StoreItemType.AVATAR, cost: 500, icon: '⚽', translations: { es: { name: 'Avatar Balón de Oro' } } },
  { name: 'Champions Badge Frame', itemType: StoreItemType.BADGE_FRAME, cost: 750, icon: '🏆', translations: { es: { name: 'Marco de Campeones' } } },
  { name: 'Fire Ball Icon', itemType: StoreItemType.BALL_ICON, cost: 300, icon: '🔥', translations: { es: { name: 'Balón de fuego' } } },
  { name: 'Camp Nou Background', itemType: StoreItemType.BACKGROUND, cost: 1000, icon: '🏟️', translations: { es: { name: 'Fondo Camp Nou' } } },
  { name: 'Royal Crown Avatar', itemType: StoreItemType.AVATAR, cost: 600, icon: '👑', translations: { es: { name: 'Avatar Corona Real' } } },
  { name: 'Rainbow Badge Frame', itemType: StoreItemType.BADGE_FRAME, cost: 800, icon: '🌈', translations: { es: { name: 'Marco Arcoíris' } } },
];

/** Catálogo de insignias, escritas en español con su traducción al inglés. Las reglas para otorgarlas están en users/progress.listener.ts. */
export const BADGES = [
  { code: BadgeCode.FIRST_GAME, name: 'Primer partido', icon: '🎯', description: 'Completa tu primera partida.', translations: { en: { name: 'First match', description: 'Complete your first game.' } } },
  { code: BadgeCode.STREAK_7, name: 'Racha de 7 días', icon: '🔥', description: 'Juega 7 días seguidos.', translations: { en: { name: '7-day streak', description: 'Play 7 days in a row.' } } },
  { code: BadgeCode.PERFECT_GAME, name: 'Perfeccionista', icon: '💯', description: 'Responde bien todas las preguntas de una partida.', translations: { en: { name: 'Perfectionist', description: 'Answer every question of a game correctly.' } } },
  { code: BadgeCode.DAILY_HUNTER, name: 'Cazador de retos', icon: '📆', description: 'Completa 10 retos diarios.', translations: { en: { name: 'Challenge hunter', description: 'Complete 10 daily challenges.' } } },
  { code: BadgeCode.ALL_ROUNDER, name: 'Todoterreno', icon: '🧭', description: 'Juega al menos una partida de cada categoría.', translations: { en: { name: 'All-rounder', description: 'Play at least one game of each category.' } } },
  { code: BadgeCode.COLLECTOR, name: 'Coleccionista', icon: '🛍️', description: 'Compra tu primer artículo en la tienda.', translations: { en: { name: 'Collector', description: 'Buy your first item in the store.' } } },
  { code: BadgeCode.LEGEND, name: 'Leyenda', icon: '👑', description: 'Alcanza el nivel 20.', translations: { en: { name: 'Legend', description: 'Reach level 20.' } } },
];

/** Datos curiosos de ResultsScreen ("Did you know?"), escritos en español con su traducción al inglés. */
export const FUN_FACTS = [
  { text: 'El primer Balón de Oro se entregó en 1956 y lo ganó Stanley Matthews.', category: GameCategory.HISTORY, translations: { en: { text: 'The first Ballon d\'Or was awarded in 1956 and won by Stanley Matthews.' } } },
  { text: 'Uruguay ganó el primer Mundial de la historia, en 1930.', category: GameCategory.HISTORY, translations: { en: { text: 'Uruguay won the first World Cup in history, in 1930.' } } },
  { text: 'Brasil es la selección con más Mundiales ganados: cinco.', category: GameCategory.HISTORY, translations: { en: { text: 'Brazil has won the most World Cups: five.' } } },
  { text: 'El Real Madrid es el club con más títulos de Copa de Europa / Champions League.', category: GameCategory.CLUBS, translations: { en: { text: 'Real Madrid is the club with the most European Cup / Champions League titles.' } } },
  { text: 'Miroslav Klose es el máximo goleador en la historia de los Mundiales, con 16 goles.', category: GameCategory.PLAYERS, translations: { en: { text: 'Miroslav Klose is the all-time top scorer in World Cup history, with 16 goals.' } } },
  { text: 'El Maracaná fue sede de las finales de los Mundiales de 1950 y 2014.', category: GameCategory.STADIUMS, translations: { en: { text: 'The Maracanã hosted the World Cup finals of 1950 and 2014.' } } },
  { text: 'Se puede marcar gol directamente de un tiro de esquina, pero no de un saque de banda.', category: GameCategory.RULES, translations: { en: { text: 'You can score directly from a corner kick, but not from a throw-in.' } } },
  { text: 'René Higuita hizo su famoso "escorpión" en Wembley en 1995, en un amistoso contra Inglaterra.', category: GameCategory.PLAYERS, translations: { en: { text: 'René Higuita pulled off his famous "scorpion kick" at Wembley in 1995, in a friendly against England.' } } },
  { text: 'El traspaso de Neymar del Barcelona al PSG en 2017, por €222 millones, sigue siendo el más caro de la historia.', category: GameCategory.TRANSFERS, translations: { en: { text: 'Neymar\'s transfer from Barcelona to PSG in 2017, for €222 million, is still the most expensive in history.' } } },
];
