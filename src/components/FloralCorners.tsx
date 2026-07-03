// Soft, old-school floral corner ornaments — a curling vine with a few
// blossoms and leaves, tucked into each corner of the viewport behind the
// app content. Purely decorative, so it's aria-hidden and never intercepts
// clicks (pointer-events: none is set on the wrapper in index.css).

function FloralSpray() {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Curling stem */}
      <path
        d="M4 4C40 8 58 26 54 56C51 80 66 92 92 88C118 84 128 100 118 118"
        stroke="#8ba57f"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M20 10C34 22 34 40 20 46"
        stroke="#8ba57f"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Leaves */}
      <ellipse cx="14" cy="26" rx="10" ry="5" transform="rotate(-35 14 26)" fill="#9db98f" opacity="0.85" />
      <ellipse cx="46" cy="14" rx="9" ry="4.5" transform="rotate(30 46 14)" fill="#9db98f" opacity="0.85" />
      <ellipse cx="70" cy="70" rx="9" ry="4.5" transform="rotate(-20 70 70)" fill="#a9c19c" opacity="0.8" />
      <ellipse cx="100" cy="104" rx="8" ry="4" transform="rotate(40 100 104)" fill="#a9c19c" opacity="0.8" />

      {/* Blossom 1 (rose) at the tip of the stem */}
      <g transform="translate(8,8)">
        <circle cx="0" cy="-9" r="7" fill="#d99bab" />
        <circle cx="8" cy="-3" r="7" fill="#d99bab" />
        <circle cx="5" cy="7" r="7" fill="#d99bab" />
        <circle cx="-5" cy="7" r="7" fill="#d99bab" />
        <circle cx="-8" cy="-3" r="7" fill="#d99bab" />
        <circle cx="0" cy="0" r="5" fill="#e8b8ac" />
      </g>

      {/* Blossom 2 (smaller, gold) mid-vine */}
      <g transform="translate(56,55)">
        <circle cx="0" cy="-6" r="5" fill="#d9b877" />
        <circle cx="5.5" cy="-2" r="5" fill="#d9b877" />
        <circle cx="3.5" cy="5" r="5" fill="#d9b877" />
        <circle cx="-3.5" cy="5" r="5" fill="#d9b877" />
        <circle cx="-5.5" cy="-2" r="5" fill="#d9b877" />
        <circle cx="0" cy="0" r="3.4" fill="#eccf9a" />
      </g>

      {/* Blossom 3 (small bud, rose) toward the far end */}
      <g transform="translate(94,86)">
        <circle cx="0" cy="-5" r="4.2" fill="#dba4b3" />
        <circle cx="4.6" cy="-1.5" r="4.2" fill="#dba4b3" />
        <circle cx="3" cy="4.4" r="4.2" fill="#dba4b3" />
        <circle cx="-3" cy="4.4" r="4.2" fill="#dba4b3" />
        <circle cx="-4.6" cy="-1.5" r="4.2" fill="#dba4b3" />
        <circle cx="0" cy="0" r="2.8" fill="#ecc7cf" />
      </g>

      {/* Tiny dots / sprigs for texture */}
      <circle cx="34" cy="34" r="2" fill="#c9a15a" opacity="0.7" />
      <circle cx="80" cy="46" r="1.6" fill="#c47a8c" opacity="0.6" />
      <circle cx="112" cy="104" r="1.8" fill="#c9a15a" opacity="0.6" />
    </svg>
  );
}

export function FloralCorners() {
  return (
    <div className="floral-corners" aria-hidden="true">
      <div className="floral-corner tl">
        <FloralSpray />
      </div>
      <div className="floral-corner tr">
        <FloralSpray />
      </div>
      <div className="floral-corner bl">
        <FloralSpray />
      </div>
      <div className="floral-corner br">
        <FloralSpray />
      </div>
    </div>
  );
}
