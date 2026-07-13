export default function AiReadinessPanel() {
    return (
        <section className="content-surface ai-readiness-panel">
            <span className="content-eyebrow">Moduł w przygotowaniu</span>
            <h1>Wyszukiwarka AI</h1>
            <div className="ai-rune" aria-hidden="true">✦</div>
            <h2>Integracja nie jest jeszcze skonfigurowana</h2>
            <p>
                Lokalna wyszukiwarka wiedzy działa bez usług zewnętrznych.
                Odpowiedzi AI zostaną udostępnione po wyborze dostawcy,
                skonfigurowaniu backendowego adaptera oraz bezpiecznym
                ustawieniu klucza w zmiennej środowiskowej
                <code>Ai__ApiKey</code>.
            </p>
            <div className="ai-safety-note">
                Aplikacja nie wysyła obecnie treści stron do żadnej usługi AI
                i działa normalnie bez klucza.
            </div>
        </section>
    );
}
