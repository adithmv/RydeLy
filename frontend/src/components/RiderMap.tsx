export default function RiderMap({
  town,
  pickup,
  destination,
  progress,
  zoom,
  showRoute,
}: {
  town: string;
  pickup: string;
  destination: string;
  progress: number;
  zoom: number;
  showRoute: boolean;
}) {
  return (
    <svg
      className="rider-map"
      viewBox="0 0 1000 900"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={`Illustrative map of ${town}${showRoute ? ` with route from ${pickup} to ${destination}` : " with nearby autos"}`}
    >
      <defs>
        <pattern
          id="city-blocks"
          width="130"
          height="105"
          patternTransform="rotate(-16)"
          patternUnits="userSpaceOnUse"
        >
          <rect width="130" height="105" fill="#eeece5" />
          <rect x="10" y="10" width="45" height="35" rx="4" fill="#e4e1d8" />
          <rect x="66" y="10" width="52" height="35" rx="3" fill="#e6e3db" />
          <rect x="10" y="55" width="107" height="38" rx="4" fill="#e6e3db" />
          <path
            d="M0 0H130V105"
            fill="none"
            stroke="#faf9f5"
            strokeWidth="10"
          />
        </pattern>
        <filter id="map-shadow">
          <feDropShadow dx="0" dy="3" stdDeviation="5" floodOpacity=".13" />
        </filter>
      </defs>
      <rect width="1000" height="900" fill="#eeece5" />
      <g
        transform={`translate(500 450) scale(${zoom}) translate(-500 -450)`}
        style={{ transition: "transform 250ms ease" }}
      >
        <rect width="1000" height="900" fill="url(#city-blocks)" />
        <path
          d="M0 0H120Q215 160 156 300T185 620Q220 790 160 900H0Z"
          fill="#c9e0de"
        />
        <path
          d="M120 0Q215 160 156 300T185 620Q220 790 160 900"
          fill="none"
          stroke="#e1d8be"
          strokeWidth="15"
        />
        <path
          d="M230 140L365 100 403 215 270 250Z M680 570L845 530 900 670 732 716Z M450 690L565 670 604 780 478 820Z"
          fill="#cbd8bd"
          stroke="#dce5d2"
          strokeWidth="9"
        />
        <g fill="none" stroke="#d7d2c7" strokeWidth="23">
          <path d="M140 980L430 380 320 -50" />
          <path d="M170 550L1050 285" />
          <path d="M300 760L980 510" />
          <path d="M680 -50L575 370 840 960" />
        </g>
        <g fill="none" stroke="#fffdf8" strokeWidth="17">
          <path d="M140 980L430 380 320 -50" />
          <path d="M170 550L1050 285" />
          <path d="M300 760L980 510" />
          <path d="M680 -50L575 370 840 960" />
        </g>
        <path
          d="M240 900L470 410 960 245"
          fill="none"
          stroke="#c6c4be"
          strokeWidth="4"
          strokeDasharray="3 7"
        />
        <g fontFamily="Arial,sans-serif" textAnchor="middle" fill="#7e8177">
          <text
            x="81"
            y="430"
            fill="#729b9c"
            fontSize="17"
            transform="rotate(-90 81 430)"
            letterSpacing="5"
          >
            ARABIAN SEA
          </text>
          <text x="500" y="290" fontSize="29" fill="#66716a" letterSpacing="6">
            {town.toUpperCase()}
          </text>
          <text x="320" y="180" fontSize="12">
            Town park
          </text>
          <text x="796" y="625" fontSize="13">
            Green gardens
          </text>
          <text x="350" y="635" fontSize="12" transform="rotate(-18 350 635)">
            Station Road
          </text>
          <text x="775" y="339" fontSize="12" transform="rotate(-18 775 339)">
            Market Road
          </text>
          <text x="525" y="747" fontSize="12">
            Playground
          </text>
          <text x="700" y="165" fontSize="13" letterSpacing="2">
            NORTH QUARTER
          </text>
          <text x="371" y="845" fontSize="13" letterSpacing="2">
            SOUTH BAZAAR
          </text>
        </g>
        {showRoute && (
          <>
            <path
              d="M380 600L448 447 683 375"
              fill="none"
              stroke="white"
              strokeWidth="12"
              strokeLinejoin="round"
            />
            <path
              d="M380 600L448 447 683 375"
              fill="none"
              stroke="#243c32"
              strokeWidth="7"
              strokeLinejoin="round"
            />
            <rect
              x="673"
              y="365"
              width="20"
              height="20"
              rx="3"
              stroke="white"
              strokeWidth="5"
              fill="#ed7b35"
            />
            <g transform="translate(605 309)" filter="url(#map-shadow)">
              <rect width="170" height="39" rx="9" fill="#fffefb" />
              <text
                x="85"
                y="24"
                textAnchor="middle"
                fontSize="12"
                fill="#2c352e"
              >
                Your destination
              </text>
            </g>
          </>
        )}
        <circle cx="380" cy="600" r="35" fill="#ed7b35" opacity=".12" />
        <circle
          cx="380"
          cy="600"
          r="12"
          stroke="white"
          strokeWidth="5"
          fill="#253d32"
        />
        <g transform="translate(296 629)" filter="url(#map-shadow)">
          <rect width="170" height="40" rx="9" fill="#253d32" />
          <text x="85" y="25" textAnchor="middle" fill="white" fontSize="12">
            {pickup ? "Your pickup point" : "Choose your pickup"}
          </text>
        </g>
        {[
          [480 - progress * 100, 500 + progress * 100, 18],
          [740, 455, -20],
          [330, 320, 16],
          [608, 706, -22],
        ].map(([x, y, r], i) => (
          <g
            key={i}
            transform={`translate(${x} ${y}) rotate(${r})`}
            style={{ transition: "transform 250ms linear" }}
            filter="url(#map-shadow)"
          >
            <rect
              x="-11"
              y="-18"
              width="22"
              height="36"
              rx="7"
              fill={i === 0 ? "#efae43" : "#faf8ee"}
              stroke="#5f685e"
              strokeWidth="1.5"
            />
            <rect x="-7" y="-9" width="14" height="10" rx="3" fill="#52635c" />
            <path d="M-7 7H7" stroke="#5f685e" strokeWidth="2" />
          </g>
        ))}
      </g>
    </svg>
  );
}
