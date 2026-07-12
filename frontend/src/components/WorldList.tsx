import type { World } from "../types/World";

interface Props {
    worlds: World[];
    selectedWorldId: string | null;
    onSelect: (world: World) => void;
}

export default function WorldList({
    worlds,
    selectedWorldId,
    onSelect,
}: Props) {
    return (
        <section>
            <h2 style={{ marginTop: 0 }}>Światy</h2>

            {worlds.length === 0 ? (
                <p style={{ color: "#666" }}>Brak światów.</p>
            ) : (
                <ul
                    style={{
                        listStyle: "none",
                        padding: 0,
                        margin: 0,
                    }}
                >
                    {worlds.map((world) => {
                        const isSelected = selectedWorldId === world.id;

                        return (
                            <li
                                key={world.id}
                                onClick={() => onSelect(world)}
                                style={{
                                    cursor: "pointer",
                                    padding: "12px 14px",
                                    marginBottom: "8px",
                                    border: isSelected
                                        ? "2px solid #646cff"
                                        : "1px solid #ccc",
                                    borderRadius: "8px",
                                    background: isSelected
                                        ? "#eef0ff"
                                        : "white",
                                    fontWeight: isSelected
                                        ? 700
                                        : 400,
                                }}
                            >
                                {world.name}
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
}