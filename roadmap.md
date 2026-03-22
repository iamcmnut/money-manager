# EV Charging Feature Roadmap

> Last updated: 2026-03-22
>
> Based on competitive research of Thai EV charging apps: EA Anywhere, EV Station PluZ (PTT), PEA Volta, MEA EV, EleXA (EGAT), Sharge, EVolt, Saifah, ALTERVIM

## Market Position

**Our unique advantage:** No Thai app helps users understand and optimize charging costs **across networks**. Every competitor is tied to a single network operator. Users currently need 5-10 apps and can't compare prices.

## Competitive Landscape

| App | Focus | Stations | Key Strength |
|-----|-------|----------|-------------|
| EA Anywhere | Largest network | 550+ | Voice assistant, flat ฿7.29/kWh |
| EV Station PluZ (PTT) | 30% market share | 650+ | Queue tracking, on/off-peak pricing |
| PEA Volta | Intercity coverage | 420+ | AUTOCHARGE, Smart Charge Scheduler, cheapest off-peak ฿4.5/kWh |
| MEA EV | Bangkok metro | - | Cross-network station display |
| EleXA (EGAT) | Government-backed | - | Station data roaming, trip planner, Green Charging |
| Sharge | Lifestyle/premium | - | Central The 1 loyalty, Grab partnership |
| Saifah | Aggregator | 5,300+ | AI route planner, Android Auto |
| EVolt | BMW partnership | 400+ | Per-charger status. Note: user complaints about price hikes |
| ALTERVIM | Retail locations | - | Strong Lotus's presence, Altervim Wallet |

## Pricing Reference (THB/kWh)

### DC Fast Charging

| Provider | AC (kWh) | DC On-Peak (kWh) | DC Off-Peak (kWh) | Membership / Notes | Reference |
|----------|----------|-------------------|--------------------|--------------------|-----------|
| PEA Volta | 5.30 | 6.50-8.80 | 4.50-5.50 | AUTOCHARGE auto-billing; cheapest off-peak in market | [peavoltaev.pea.co.th](https://peavoltaev.pea.co.th) |
| EV Station PluZ (PTT) | 6.50 | 7.50 | 5.50 | PTT Blue Card points; on/off-peak split at 22:00-09:00 | [evstationpluz.pttor.com](https://evstationpluz.pttor.com) |
| EA Anywhere | 6.50 | 7.29 | 7.29 | Flat rate (no on/off-peak); EA Anywhere Wallet top-up | [eaanywhere.com](https://www.eaanywhere.com) |
| MEA EV | — | 7.50 | 7.50 | Flat rate; Bangkok metro only | [mea.or.th/minisite/mea-ev](https://www.mea.or.th/minisite/mea-ev) |
| EleXA (EGAT) | 6.00-7.00 | 7.50 | 7.50 | Flat rate; Green Charging carbon offset option | [elexaev.com](https://elexaev.com) |
| EVolt | — | 8.00-10.00 | 8.00-10.00 | Varies by location; user complaints about price hikes | [evolt.co.th](https://evolt.co.th) |
| Sharge | — | 7.00-8.50 | 7.00-8.50 | Central The 1 loyalty points; Grab partnership discounts | [sharge.co.th](https://sharge.co.th) |
| ALTERVIM | — | 7.50-9.00 | 7.50-9.00 | Altervim Wallet; strong Lotus's/retail location coverage | [altervim.com](https://altervim.com) |
| Saifah | — | varies | varies | Aggregator — price depends on underlying network operator | [saifahev.com](https://saifahev.com) |

### Home Charging

| Meter Type | On-Peak (kWh) | Off-Peak (kWh) | Notes | Reference |
|------------|---------------|----------------|-------|-----------|
| TOU meter | ~4.20 | ~2.60 | Off-peak: 22:00-09:00 weekdays, all day weekends | [MEA TOU rate](https://www.mea.or.th/en/profile/109/114) / [PEA TOU rate](https://www.pea.co.th/en/electricity-expenses/electricity-tariff) |
| Normal meter | ~3.80-4.20 | ~3.80-4.20 | Progressive tier rate; no time-of-use discount | [ERC tariff](https://www.erc.or.th) |

> **Note:** Prices as of early 2026. Networks may adjust rates without notice — this is a known pain point (see Phase 2: Price Alerts). AC columns marked "—" means the network does not operate AC chargers or AC pricing is not publicly listed. Always verify current rates on the provider's app or website via the reference links above.

---

## What We Already Have

- [x] Cross-network price comparison (avg ฿/kWh per network)
- [x] Per-network daily price trend chart (inside expanded network cards)
- [x] Charging session tracking (kWh, cost, mileage, notes)
- [x] Charging stats summary (total sessions, energy, cost, avg ฿/kWh, ฿/km)
- [x] CSV import for bulk data entry
- [x] Thai + English i18n
- [x] Dark/light mode

---

## Phase 1 — Strengthen the Core (Price Intelligence)

> Goal: Make cost data more actionable. No competitor quantifies savings.

- [ ] **Off-peak savings calculator**
  - Show exact ฿ saved by charging off-peak vs. on-peak
  - Compare user's actual charging times against off-peak windows
  - "You could save ฿X/month by shifting 3 sessions to off-peak"
  - _Gap: PEA Volta has a scheduler but no savings visualization_

- [ ] **Home vs. public cost comparison**
  - Help users understand when home TOU charging (฿2.6-4.2/kWh) beats public stations (฿4.5-10/kWh)
  - Factor in home electricity tier, TOU meter availability
  - _Gap: No competitor does this_

- [ ] **Cost-per-km trend**
  - Surface ฿/km trends over time (we already collect mileage data)
  - Compare against petrol equivalent cost
  - _Gap: No competitor tracks this_

- [ ] **Monthly cost summary & export**
  - Monthly/yearly breakdown with PDF or CSV export
  - Useful for expense reporting or personal budgeting
  - _Gap: Competitors have basic history but no export_

---

## Phase 2 — Smart Recommendations

> Goal: Proactively help users save money. Cross-network intelligence is our moat.

- [ ] **"Cheapest nearby" recommendation**
  - Given user location, show cheapest charging option across all networks
  - Factor in on-peak/off-peak timing
  - _Gap: No app does cross-network price comparison by location_

- [ ] **Price alerts**
  - Notify when a network changes prices (up or down)
  - Users have complained about surprise price increases (EVolt especially)
  - _Gap: Nobody does this_

- [ ] **Charging cost estimator**
  - "I need 30 kWh — what will it cost at each network?"
  - Quick calculator before heading out to charge
  - _Gap: No competitor offers this_

- [ ] **Subscription ROI calculator**
  - As Thai networks introduce subscription/membership tiers, help users evaluate if worth it based on their usage
  - _Gap: Not yet relevant in Thailand but trending globally (Electrify America Pass+, EVgo Plus)_

---

## Phase 3 — Community & Trust

> Goal: Build engagement and crowdsourced data. Top global trend (PlugShare model) with zero Thai adoption.

- [ ] **Station reliability scores**
  - Crowdsource uptime/quality ratings per station
  - ML-based reliability scoring from user data
  - _Gap: Zero Thai apps have this_

- [ ] **User reviews & photos**
  - Community-contributed station feedback, photos, tips
  - _Gap: Not present in any Thai app_

- [ ] **Carbon savings tracker**
  - Show CO2 saved vs. gasoline equivalent
  - Feel-good metric that reinforces EV value
  - _Gap: EleXA has "Green Charging" option but no personal tracking_

---

## Phase 4 — Power User Features

> Goal: Deepen engagement for heavy users and road trippers.

- [ ] **Trip cost planner**
  - Plan a route, estimate total charging cost across multiple stops
  - Factor in each network's pricing along the route
  - _Gap: Saifah/EleXA have route planning but no cost estimation_

- [ ] **Charging curve visualization**
  - Show kW delivery over time per session (power delivery graph)
  - _Gap: Global trend (Electrify America), zero Thai apps_

- [ ] **Multi-vehicle support**
  - Track costs for different cars separately
  - Useful for families or small fleets
  - _Gap: No competitor_

---

## Common User Pain Points in Thai Market

These are recurring complaints from Thai EV users that inform our priorities:

1. **App fragmentation** — Must install 5-10 apps for different networks
2. **No unified price comparison** — Can't easily compare costs across providers
3. **Surprise price changes** — No visibility into pricing trends or alerts
4. **Inconsistent English support** — Many apps are Thai-only or poorly translated
5. **Station downtime** — No reliable way to know if a charger actually works
6. **Complex verification** — Onboarding friction in operator apps

## Global Trends to Watch

| Trend | Description | Relevance |
|-------|-------------|-----------|
| Plug & Charge (ISO 15118) | Auto-authentication without app/card | PEA Volta AUTOCHARGE is early version |
| OCPI roaming | One account across all networks | Thailand beginning adoption |
| Vehicle telematics API | Direct car integration for SoC, battery health | Smartcar, Tesla API |
| Gamification | Points for eco-driving, off-peak charging | Sharge has loyalty via The 1 |
| AI optimization | Smart charge timing based on grid load + pricing | ev.energy model |
