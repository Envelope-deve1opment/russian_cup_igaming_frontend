const ACCENTS = [
    {accent: "#ff9a62", accentSoft: "rgba(255,154,98,0.22)"},
    {accent: "#66d4ff", accentSoft: "rgba(102,212,255,0.22)"},
    {accent: "#ffd36b", accentSoft: "rgba(255,211,107,0.22)"},
    {accent: "#cb8cff", accentSoft: "rgba(203,140,255,0.22)"},
    {accent: "#73e1ac", accentSoft: "rgba(115,225,172,0.22)"},
    {accent: "#ff7fa8", accentSoft: "rgba(255,127,168,0.22)"},
    {accent: "#92a5ff", accentSoft: "rgba(146,165,255,0.22)"},
    {accent: "#7cf1e6", accentSoft: "rgba(124,241,230,0.22)"},
    {accent: "#ffb56f", accentSoft: "rgba(255,181,111,0.22)"},
    {accent: "#d2ff7d", accentSoft: "rgba(210,255,125,0.2)"}
] as const;

export function getRoomGameAccent(index: number): {accent: string; accentSoft: string} {
    return ACCENTS[index % ACCENTS.length];
}
