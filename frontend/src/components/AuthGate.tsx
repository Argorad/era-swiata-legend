import { useState } from "react";
import type { AuthSession } from "../types/Auth";

interface Props {
    authEnabled: boolean;
    authReady: boolean;
    currentUser: AuthSession | null;
    isBusy: boolean;
    error: string | null;
    onLogin: (login: string, password: string) => Promise<void>;
    onChangePassword: (currentPassword: string, newPassword: string) => Promise<void>;
    onLogout: () => Promise<void>;
}

export default function AuthGate({
    authEnabled,
    authReady,
    currentUser,
    isBusy,
    error,
    onLogin,
    onChangePassword,
    onLogout,
}: Props) {
    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [localError, setLocalError] = useState<string | null>(null);

    if (!authReady) {
        return (
            <section className="auth-gate" aria-busy="true">
                <article className="auth-card">
                    <span className="auth-kicker">Ładowanie</span>
                    <h2>Sprawdzam sesję użytkownika…</h2>
                </article>
            </section>
        );
    }

    if (!authEnabled) {
        return null;
    }

    if (!currentUser) {
        const submit = async (event: React.FormEvent) => {
            event.preventDefault();
            if (!login.trim() || !password.trim()) {
                setLocalError("Podaj login lub e-mail i hasło.");
                return;
            }

            setLocalError(null);
            await onLogin(login, password);
        };

        return (
            <section className="auth-gate" data-testid="auth-screen">
                <form className="auth-card" onSubmit={submit}>
                    <span className="auth-kicker">Logowanie lokalne</span>
                    <h2>Wejście do prywatnej kampanii</h2>
                    <p>Użyj nicku albo e-maila oraz hasła. Publicznej rejestracji nie ma.</p>
                    <label>
                        Nick lub e-mail
                        <input value={login} onChange={(event) => setLogin(event.target.value)} autoComplete="username" disabled={isBusy} data-testid="auth-login" />
                    </label>
                    <label>
                        Hasło
                        <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" disabled={isBusy} data-testid="auth-password" />
                    </label>
                    {(localError ?? error) && <p className="page-dialog-error" role="alert">{localError ?? error}</p>}
                    <div className="page-dialog-actions">
                        <button type="submit" className="page-button page-button--primary" disabled={isBusy}>Zaloguj</button>
                    </div>
                </form>
            </section>
        );
    }

    if (currentUser.mustChangePassword) {
        const submit = async (event: React.FormEvent) => {
            event.preventDefault();
            if (!currentPassword.trim() || newPassword.trim().length < 8) {
                setLocalError("Podaj obecne hasło i nowe hasło z minimum 8 znaków.");
                return;
            }
            if (newPassword !== confirmPassword) {
                setLocalError("Nowe hasła muszą być identyczne.");
                return;
            }

            setLocalError(null);
            await onChangePassword(currentPassword, newPassword);
        };

        return (
            <section className="auth-gate" data-testid="password-change-screen">
                <form className="auth-card" onSubmit={submit}>
                    <span className="auth-kicker">Wymagana zmiana hasła</span>
                    <h2>{currentUser.displayName}</h2>
                    <p>To konto musi ustawić nowe hasło przed dalszą pracą.</p>
                    <label>
                        Obecne hasło
                        <input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" disabled={isBusy} />
                    </label>
                    <label>
                        Nowe hasło
                        <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" disabled={isBusy} />
                    </label>
                    <label>
                        Powtórz nowe hasło
                        <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" disabled={isBusy} />
                    </label>
                    {(localError ?? error) && <p className="page-dialog-error" role="alert">{localError ?? error}</p>}
                    <div className="page-dialog-actions">
                        <button type="button" className="page-button page-button--ghost" onClick={() => void onLogout()} disabled={isBusy}>Wyloguj</button>
                        <button type="submit" className="page-button page-button--primary" disabled={isBusy}>Zmień hasło</button>
                    </div>
                </form>
            </section>
        );
    }

    return null;
}
