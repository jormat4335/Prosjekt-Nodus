const paths={
 overview:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
 sites:'<path d="M4 21V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v16M17 10h3v11M2 21h20M8 7h1m3 0h1M8 11h1m3 0h1M8 15h1m3 0h1M9 21v-3h3v3"/>',
 alarms:'<path d="m10.3 4.2-8 14A1.9 1.9 0 0 0 4 21h16a1.9 1.9 0 0 0 1.7-2.8l-8-14a2 2 0 0 0-3.4 0ZM12 9v4m0 4h.01"/>',
 trends:'<path d="M3 3v18h18M6 15l4-5 4 3 6-8"/>',
 reports:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8ZM14 2v6h6M8 13h8M8 17h6"/>',
 analysis:'<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5ZM20 2v4m-2-2h4"/>',
 integrations:'<path d="M7 3v5m10-5v5M5 8h14v3a7 7 0 0 1-7 7v4M5 8v3a7 7 0 0 0 7 7"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 arrow:'<path d="M5 17 19 3M8 3h11v11"/>',
 refresh:'<path d="M20 7v5h-5M4 17v-5h5M6.1 5.8A8 8 0 0 1 20 12M4 12a8 8 0 0 0 13.9 6.2"/>',
 lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/>'
};
const aliases={'◫':'overview','▥':'sites','△':'alarms','⌁':'trends','▤':'reports','✧':'analysis','⊞':'integrations','◷':'clock','↗':'arrow'};
export function icon(name){return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[aliases[name]||name]||paths.overview}</svg>`;}
export const brandMark='<svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M7 7h19M7 16h15M7 25h19M7 7v18" stroke="currentColor" stroke-width="3.5"/><path d="m25 13-3 3 3 3" stroke="currentColor" stroke-width="2"/></svg>';
