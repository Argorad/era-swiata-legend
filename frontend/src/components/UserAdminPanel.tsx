import { useEffect, useState } from "react";
import { api } from "../services/api";
import type { CreateUserRequest, UpdateUserRequest, UserAdmin } from "../types/Auth";
import type { UserRole } from "../types/UserRole";

interface Props {
    enabled: boolean;
}

const roleLabels: Record<UserRole, string> = {
    0: "Administrator",
    1: "MG",
    2: "Gracz",
};

export default function UserAdminPanel({ enabled }: Props) {
    const [users, setUsers] = useState<UserAdmin[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [displayName, setDisplayName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState<UserRole>(2);
    const [isActive, setIsActive] = useState(true);
    const [mustChangePassword, setMustChangePassword] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!enabled) {
            return;
        }

        let cancelled = false;

        void (async () => {
            try {
                setLoading(true);
                const response = await api.get<UserAdmin[]>("/users");
                if (cancelled) return;
                setUsers(response.data);
                setError(null);
            } catch {
                if (!cancelled) {
                    setError("Nie udało się pobrać użytkowników.");
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [enabled]);

    const resetForm = () => {
        setEditingId(null);
        setDisplayName("");
        setEmail("");
        setPassword("");
        setRole(2);
        setIsActive(true);
        setMustChangePassword(true);
    };

    const beginEdit = (user: UserAdmin) => {
        setEditingId(user.id);
        setDisplayName(user.displayName);
        setEmail(user.email ?? "");
        setPassword("");
        setRole(user.role);
        setIsActive(user.isActive);
        setMustChangePassword(user.mustChangePassword);
    };

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!displayName.trim()) {
            setError("Podaj nick użytkownika.");
            return;
        }

        try {
            setSaving(true);
            const payload: CreateUserRequest | UpdateUserRequest = {
                displayName: displayName.trim(),
                email: email.trim() || null,
                password: editingId ? (password.trim() || null) : password.trim(),
                role,
                isActive,
                mustChangePassword,
            };

            if (editingId) {
                await api.put(`/users/${editingId}`, payload);
            } else {
                await api.post("/users", payload);
            }

            await refreshUsers();
            resetForm();
            setError(null);
        } catch (exception) {
            const message = (exception as { response?: { data?: { message?: string } } })?.response?.data?.message;
            setError(message ?? "Nie udało się zapisać użytkownika.");
        } finally {
            setSaving(false);
        }
    };

    const forceReset = async (userId: string) => {
        try {
            await api.patch(`/users/${userId}/force-password-change`);
            await refreshUsers();
        } catch {
            setError("Nie udało się wymusić zmiany hasła.");
        }
    };

    const toggleActive = async (user: UserAdmin) => {
        try {
            await api.put(`/users/${user.id}`, {
                displayName: user.displayName,
                email: user.email,
                password: null,
                role: user.role,
                isActive: !user.isActive,
                mustChangePassword: user.mustChangePassword,
            });
            await refreshUsers();
        } catch {
            setError("Nie udało się zmienić stanu konta.");
        }
    };

    const refreshUsers = async () => {
        try {
            setLoading(true);
            const response = await api.get<UserAdmin[]>("/users");
            setUsers(response.data);
            setError(null);
        } catch {
            setError("Nie udało się pobrać użytkowników.");
        } finally {
            setLoading(false);
        }
    };

    if (!enabled) {
        return null;
    }

    return (
        <section className="admin-users-panel" data-testid="admin-users-panel">
            <header>
                <span>Administracja kontami</span>
                <strong>Użytkownicy lokalni</strong>
            </header>

            <form className="admin-users-form" onSubmit={submit}>
                <div className="admin-users-grid">
                    <label>
                        Nick
                        <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} disabled={saving} />
                    </label>
                    <label>
                        E-mail
                        <input value={email} onChange={(event) => setEmail(event.target.value)} disabled={saving} />
                    </label>
                    <label>
                        Hasło {editingId ? "(opcjonalnie)" : ""}
                        <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} disabled={saving} />
                    </label>
                    <label>
                        Rola
                        <select value={role} onChange={(event) => setRole(Number(event.target.value) as UserRole)} disabled={saving}>
                            <option value={0}>Administrator</option>
                            <option value={1}>MG</option>
                            <option value={2}>Gracz</option>
                        </select>
                    </label>
                    <label className="dialog-checkbox">
                        <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} disabled={saving} />
                        Konto aktywne
                    </label>
                    <label className="dialog-checkbox">
                        <input type="checkbox" checked={mustChangePassword} onChange={(event) => setMustChangePassword(event.target.checked)} disabled={saving} />
                        Wymuś zmianę hasła
                    </label>
                </div>

                {error && <p className="page-dialog-error" role="alert">{error}</p>}

                <div className="page-dialog-actions">
                    {editingId && <button type="button" className="page-button page-button--ghost" onClick={resetForm} disabled={saving}>Nowe konto</button>}
                    <button type="submit" className="page-button page-button--primary" disabled={saving}>{saving ? "Zapisywanie..." : editingId ? "Zapisz zmiany" : "Utwórz konto"}</button>
                </div>
            </form>

            <div className="admin-users-list">
                <div className="admin-users-list-head">
                    <strong>Lista użytkowników</strong>
                    <button type="button" className="page-button page-button--ghost" onClick={() => void refreshUsers()} disabled={loading}>{loading ? "Ładowanie..." : "Odśwież"}</button>
                </div>
                {users.map((user) => (
                    <article key={user.id} className={`admin-user-row ${user.isActive ? "" : "is-disabled"}`} data-testid={`admin-user-${user.id}`}>
                        <div>
                            <strong>{user.displayName}</strong>
                            <p>{user.email ?? "brak e-maila"} · {roleLabels[user.role]}</p>
                        </div>
                        <div className="admin-user-actions">
                            <button type="button" className="page-button page-button--ghost" onClick={() => beginEdit(user)}>Edytuj</button>
                            <button type="button" className="page-button page-button--ghost" onClick={() => void toggleActive(user)}>{user.isActive ? "Dezaktywuj" : "Aktywuj"}</button>
                            <button type="button" className="page-button page-button--ghost" onClick={() => void forceReset(user.id)}>Wymuś hasło</button>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}
