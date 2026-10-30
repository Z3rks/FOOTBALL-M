import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import i18n from "./i18n";
import { authApi, usersApi } from "./api/api";
import { onSessionLost, refreshSession, SessionUser } from "./api/client";
import SplashScreen from "./components/SplashScreen";
import WelcomeScreen from "./components/WelcomeScreen";
import SignInScreen from "./components/SignInScreen";
import RegisterScreen from "./components/RegisterScreen";
import ForgotPasswordScreen from "./components/ForgotPasswordScreen";
import ResetPasswordScreen from "./components/ResetPasswordScreen";
import MainHomeScreen from "./components/MainHomeScreen";
import MinigamesScreen from "./components/MinigamesScreen";
import GamePlayScreen from "./components/GamePlayScreen";
import ResultsScreen from "./components/ResultsScreen";
import NewsScreen from "./components/NewsScreen";
import CreditsScreen from "./components/CreditsScreen";
import ProfileScreen from "./components/ProfileScreen";
import EditProfileScreen from "./components/EditProfileScreen";
import AccountSettingsScreen from "./components/AccountSettingsScreen";
import AdminDashboardScreen from "./components/AdminDashboardScreen";
import AdminUsersScreen from "./components/AdminUsersScreen";
import AdminAnalyticsScreen from "./components/AdminAnalyticsScreen";
import AdminReportsScreen from "./components/AdminReportsScreen";
import AdminGamesScreen from "./components/AdminGamesScreen";
import AdminEconomyScreen from "./components/AdminEconomyScreen";

type Screen =
  | "splash"
  | "welcome"
  | "signin"
  | "register"
  | "forgot-password"
  | "reset-password"
  // jugador
  | "home"
  | "minigames"
  | "play"
  | "results"
  | "news"
  | "credits"
  | "profile"
  | "edit-profile"
  | "account-settings"
  // admin
  | "admin-dashboard"
  | "admin-users"
  | "admin-analytics"
  | "admin-reports"
  | "admin-games"
  | "admin-economy";

/** Tiempo mínimo del SplashScreen, para que la animación se vea (RF-001, RNF-PERF-01: máx. 3 s). */
const SPLASH_MIN_MS = 1500;
/** Cada cuánto se avisa a la API que la app sigue abierta (métricas del panel admin). */
const HEARTBEAT_MS = 60_000;

const homeFor = (user: SessionUser): Screen => (user.role === "admin" ? "admin-dashboard" : "home");

/** El enlace del correo de recuperación llega a /reset-password?token=… */
function resetTokenFromUrl(): string | null {
  return window.location.pathname.endsWith("/reset-password") ? new URLSearchParams(window.location.search).get("token") : null;
}

export default function App() {
  const [resetToken] = useState(resetTokenFromUrl);
  const [currentScreen, setCurrentScreen] = useState<Screen>(resetToken ? "reset-password" : "splash");
  const [session, setSession] = useState<SessionUser | null>(null);
  // attempt identifica cada partida: "Play Again" monta una pantalla de juego nueva.
  const [game, setGame] = useState<{ gameId: string; dailyChallenge: boolean; attempt: number } | null>(null);
  const [resultSessionId, setResultSessionId] = useState<string | null>(null);

  const signedIn = useCallback((user: SessionUser) => {
    setSession(user);
    setCurrentScreen(homeFor(user));
  }, []);

  const signedOut = useCallback(() => {
    setSession(null);
    setGame(null);
    setResultSessionId(null);
    setCurrentScreen("welcome");
  }, []);

  // RF-007/RF-009: el Splash verifica si hay sesión antes de decidir a dónde ir.
  useEffect(() => {
    if (currentScreen !== "splash") return;
    let cancelled = false;
    Promise.all([refreshSession().catch(() => null), new Promise((r) => setTimeout(r, SPLASH_MIN_MS))]).then(([restored]) => {
      if (cancelled) return;
      if (restored) signedIn(restored.user);
      else setCurrentScreen("welcome");
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Si la sesión expira o la cuenta es suspendida, se vuelve a Welcome.
  useEffect(() => {
    onSessionLost(() => {
      toast.error(i18n.t("errors.sessionEnded"));
      signedOut();
    });
  }, [signedOut]);

  // Actividad de uso (POST /activity/heartbeat) mientras la app está visible.
  useEffect(() => {
    if (!session) return;
    const beat = () => {
      if (document.visibilityState === "visible") usersApi.heartbeat().catch(() => undefined);
    };
    beat();
    const timer = setInterval(beat, HEARTBEAT_MS);
    document.addEventListener("visibilitychange", beat);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", beat);
    };
  }, [session]);

  const handleLogout = async () => {
    await authApi.logout().catch(() => undefined);
    signedOut();
  };

  const handleNavigate = (screen: string) => setCurrentScreen(screen as Screen);

  const playGame = (gameId: string, dailyChallenge = false) => {
    setGame({ gameId, dailyChallenge, attempt: Date.now() });
    setCurrentScreen("play");
  };

  const leaveResetFlow = () => {
    window.history.replaceState(null, "", "/");
    setCurrentScreen("signin");
  };

  const adminProps = { onNavigate: handleNavigate, onLogout: handleLogout };
  const isAdmin = session?.role === "admin";
  const isPlayer = session?.role === "player";

  return (
    <div className="min-h-screen w-full bg-background">
      {/* ── Acceso ── */}
      {currentScreen === "splash" && <SplashScreen />}

      {currentScreen === "welcome" && <WelcomeScreen onSignIn={() => setCurrentScreen("signin")} onCreateAccount={() => setCurrentScreen("register")} onGoogleSignIn={signedIn} />}

      {currentScreen === "signin" && (
        <SignInScreen
          onBack={() => setCurrentScreen("welcome")}
          onSignIn={signedIn}
          onGoToRegister={() => setCurrentScreen("register")}
          onForgotPassword={() => setCurrentScreen("forgot-password")}
        />
      )}

      {currentScreen === "register" && <RegisterScreen onBack={() => setCurrentScreen("welcome")} onRegister={signedIn} onGoToSignIn={() => setCurrentScreen("signin")} />}

      {currentScreen === "forgot-password" && <ForgotPasswordScreen onBack={() => setCurrentScreen("signin")} />}

      {currentScreen === "reset-password" && resetToken && <ResetPasswordScreen token={resetToken} onDone={leaveResetFlow} />}

      {/* ── Portal de administración ── */}
      {currentScreen === "admin-dashboard" && isAdmin && <AdminDashboardScreen {...adminProps} />}
      {currentScreen === "admin-users" && isAdmin && <AdminUsersScreen {...adminProps} />}
      {currentScreen === "admin-analytics" && isAdmin && <AdminAnalyticsScreen {...adminProps} />}
      {currentScreen === "admin-reports" && isAdmin && <AdminReportsScreen {...adminProps} />}
      {currentScreen === "admin-games" && isAdmin && <AdminGamesScreen {...adminProps} />}
      {currentScreen === "admin-economy" && isAdmin && <AdminEconomyScreen {...adminProps} />}

      {/* ── App del jugador ── */}
      {currentScreen === "home" && isPlayer && <MainHomeScreen onNavigate={handleNavigate} onPlayGame={playGame} />}
      {currentScreen === "minigames" && isPlayer && <MinigamesScreen onNavigate={handleNavigate} onPlayGame={playGame} />}
      {currentScreen === "play" && isPlayer && game && (
        <GamePlayScreen
          key={game.attempt}
          gameId={game.gameId}
          dailyChallenge={game.dailyChallenge}
          onExit={() => setCurrentScreen("minigames")}
          onFinished={(sessionId) => {
            setResultSessionId(sessionId);
            setCurrentScreen("results");
          }}
        />
      )}
      {currentScreen === "results" && isPlayer && resultSessionId && (
        <ResultsScreen sessionId={resultSessionId} onBack={() => setCurrentScreen("minigames")} onNavigate={handleNavigate} onPlayAgain={(gameId) => playGame(gameId)} />
      )}
      {currentScreen === "news" && isPlayer && <NewsScreen onNavigate={handleNavigate} />}
      {currentScreen === "credits" && isPlayer && <CreditsScreen onNavigate={handleNavigate} />}
      {currentScreen === "profile" && isPlayer && <ProfileScreen onNavigate={handleNavigate} onLogout={handleLogout} />}
      {currentScreen === "edit-profile" && isPlayer && <EditProfileScreen onBack={() => setCurrentScreen("profile")} onNavigate={handleNavigate} />}
      {currentScreen === "account-settings" && isPlayer && (
        <AccountSettingsScreen onBack={() => setCurrentScreen("profile")} onNavigate={handleNavigate} onSignedOut={handleLogout} />
      )}
    </div>
  );
}
