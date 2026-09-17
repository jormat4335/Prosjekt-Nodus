# Nodus Drift

Første versjon av en lesebasert driftsplattform for VVS/anlegg. Norsk grensesnitt, Supabase Auth og organisasjonsisolerte data. Ingen simulator, eksempelanlegg eller kontrollkommandoer.

## Funksjoner

- Innlogging med Supabase e-post/passord. Uinnlogget strukturvisning henter ingen private data.
- Oversikt over flere anlegg, statuskort, sensorverdier med tidsstempel og datakvalitet.
- Alarmer og hendelseslogg. Ingen målinger betyr ukjent status, aldri normal drift.
- Trendvisning med sensorvalg og 1 time / 1 døgn / 7 dager / 30 dager. Faktiske punkter; hull interpoleres ikke. Inntil 10 000 målinger per visning, tydelig merket ved grensen.
- Rapportoversikt og lesing av eksisterende rapporter. Automatisk rapportgenerering er ikke implementert.
- Datamodell for MQTT/WAGO/Belimo og fremtidige analyser. Ingen aktive drivere, broker eller AI-kall.

## Lokal utvikling

Krever Node 22 eller nyere. `npm ci`, kopier `.env.example` til `.env`, deretter `npm run dev`. `npm test` kontrollerer status- og sikkerhetslogikk. `npm run build` bygger webappen; `npm start` starter produksjonsserveren på `PORT` (standard 3000). `/health` er Railway-helsesjekken.

## Infrastruktur

Supabase: Prosjekt (`vcwvlsnlzayrcyjdufbt`). Railway: Nodus Drift. GitHub: jormat4335/Prosjekt-Nodus.

Sett `VITE_SUPABASE_URL` og `VITE_SUPABASE_PUBLISHABLE_KEY` som Railway servicevariabler. Disse er offentlige klientverdier og bygges inn i nettleserpakken. ALDRI legg service-role/secret-nøkler i `VITE_`-variabler. Dockerfile bygger og serverer appen som uprivilegert bruker. Railway leser railway.toml. Endring av klientvariabler krever ny bygging.

## Datamodell og tilgang

`organizations → organization_members → sites → integrations/sensors → readings/alarms/events/reports/analysis_runs`.

Alle ti tabeller har RLS. `authenticated` har bare SELECT, filtrert gjennom medlemskap som matcher `auth.uid()`. `anon` har ingen tilgang. Sammensatte fremmednøkler hindrer kobling av målepunkter på tvers av organisasjoner og anlegg. `latest_readings` bruker `security_invoker` og indeksoppslag per sensor. Rollefeltet er reservert; selv admin-medlemmer har kun lesetilgang fra nettleseren i denne versjonen.

`database/schema.sql` er et referanseeksemplar av den første migreringen som allerede er anvendt i Prosjekt. Ikke kjør på nytt mot samme prosjekt.

## Første bruker og anlegg

Opprett/inviter en bruker gjennom Supabase Authentication. Brukeren velger selv passord. En betrodd administrator oppretter en faktisk organisasjon og et medlemskap med denne brukerens UUID, deretter reelle anlegg og sensorer. Det finnes ingen offentlig selvbetjening som gir tilgang til andres data. Appen viser tomtilstand frem til disse er registrert. Prosjektinnlogging i Supabase er en separat konto fra innlogging til denne appen.

## Senere datainnsamling

En separat serverprosess skal abonnere på tillatte MQTT-topics og mappe kilde-ID til en forhåndsregistrert sensor. Deriver organisasjon/anlegg fra denne mappingen, ikke fra en vilkårlig MQTT-payload. Lagre UTC `observed_at`, mottakstid, tallverdi i sensorens enhet og quality. Primærnøkkelen `(sensor_id, observed_at)` gjør gjentatt levering idempotent. Valider klokke, enhet og verdi. Oppdater integration.last_seen_at etter mottak. Stale-grensen er per sensor. Mottaker-legitimasjon skal bare finnes i serverens secrets; denne appen bruker ingen slik nøkkel.

Alarmmotor og rapportgenerator kobles til senere som separate skriveprosesser. AI-resultater lagres i analysis_runs, skal være rådgivende og krever særskilt aktivering. Ingen tabeller eller endepunkter for ventil-/pumpestyring er laget.

For stor datamengde bør historikk få serverbasert tidsaggregering, lagringspolicy og partisjonering før produksjonsinnsamling skaleres.
