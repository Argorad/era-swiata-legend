import "./FantasyCityBackdrop.css";

const farBuildings = Array.from(
    { length: 12 },
    (_, index) => index,
);

const nearBuildings = Array.from(
    { length: 9 },
    (_, index) => index,
);

export default function FantasyCityBackdrop() {
    return (
        <div
            className="fantasy-backdrop"
            aria-hidden="true"
        >
            <div className="fantasy-backdrop__moon" />
            <div className="fantasy-backdrop__stars" />

            <div className="fantasy-city fantasy-city--far">
                {farBuildings.map((building) => (
                    <span
                        key={building}
                        className="fantasy-building"
                    />
                ))}
            </div>

            <div className="fantasy-mist fantasy-mist--high" />

            <div className="fantasy-city fantasy-city--near">
                {nearBuildings.map((building) => (
                    <span
                        key={building}
                        className="fantasy-building"
                    />
                ))}
            </div>

            <div className="fantasy-mist fantasy-mist--low" />

            <div className="fantasy-traveler fantasy-traveler--one">
                <span />
            </div>
            <div className="fantasy-traveler fantasy-traveler--two">
                <span />
            </div>
            <div className="fantasy-traveler fantasy-traveler--three">
                <span />
            </div>
            <div className="fantasy-traveler fantasy-traveler--four">
                <span />
            </div>
            <div className="fantasy-traveler fantasy-traveler--five">
                <span />
            </div>

            <div className="fantasy-backdrop__vignette" />
        </div>
    );
}
