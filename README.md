# FF Redditch Website v3

## What this build includes
- Strong black / red / white / yellow FF Redditch branding
- Static hero using the supplied FF Redditch branding image
- Google Form buttons throughout the site
- Homepage community stats
- Player progress leaderboard with Total Lost / % Lost / This Month tabs
- Player Spotlight
- TNF section and dedicated TNF page
- Community page
- FF Redditch 11s page
- Top scorers / assists areas
- Responsive mobile layout

## 1. Add your Google Form
Open:
assets/config.js

Replace:
PASTE_GOOGLE_FORM_LINK_HERE

with your actual Google Form URL.

Every Join button on the website will then open that form.

## 2. Update data now
Until Google Sheets is connected, you can edit:
data/community.json
data/progress.json
data/eleven.json
data/fixtures.json

## 3. Connect Google Sheets later
The website is prepared for Google Sheets CSV URLs in assets/config.js.

Suggested tabs:

### Progress sheet headers
name,totalLostKg,percentLost,monthlyLostKg,sessions,spotlight

### 11s stats sheet headers
name,apps,goals,assists,motm

### Fixtures sheet headers
date,opponent,homeAway,competition,ffScore,oppScore,status

To use a Google Sheet:
1. Create the sheet/tab.
2. Publish that tab to the web as CSV.
3. Paste the published CSV URL into assets/config.js.
4. The website will use the Sheet instead of the local sample JSON.

## 4. Hosting
This site is suitable for free GitHub Pages hosting.
You only need to pay for your chosen domain.

## Important privacy note
If player weights or progress are displayed publicly, make participation opt-in and only publish data players are comfortable sharing.
