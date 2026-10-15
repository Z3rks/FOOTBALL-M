import { IsBoolean, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { GameSessionStatus } from '../enums';

/** POST /games/:id/sessions */
export class StartSessionDto {
  /** true si la partida se inicia desde la tarjeta del reto diario (RF-061). */
  @IsOptional()
  @IsBoolean()
  dailyChallenge?: boolean;
}

/** POST /games/sessions/:id/answers */
export class AnswerDto {
  @IsInt()
  @Min(1)
  @Max(50)
  questionNumber: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  answer: string;
}

/**
 * PATCH /games/sessions/:id. Solo el estado: el puntaje lo calcula el servidor y cualquier
 * otro campo (ej. "score") se rechaza con 400 (Plan de Seguridad §6, TC-42).
 */
export class FinishSessionDto {
  @IsIn([GameSessionStatus.COMPLETED, GameSessionStatus.ABANDONED])
  status: GameSessionStatus.COMPLETED | GameSessionStatus.ABANDONED;
}
