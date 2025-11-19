# NHL Team Colors - Complete Reference

## Overview
This document contains all team colors used in the post-game report generator. Colors are defined in hex format (`#RRGGBB`) for use in web applications and shot charts.

## Primary Method: `_get_team_color()`
Located in `pdf_report_generator.py` at line 2055. Returns hex color codes for all 32 NHL teams.

---

## Atlantic Division

### Boston Bruins (BOS)
- **Hex:** `#FFB81C`
- **Color Name:** Gold
- **RGB:** (255, 184, 28)

### Buffalo Sabres (BUF)
- **Hex:** `#002E62`
- **Color Name:** Navy Blue
- **RGB:** (0, 46, 98)

### Detroit Red Wings (DET)
- **Hex:** `#CE1126`
- **Color Name:** Red
- **RGB:** (206, 17, 38)

### Florida Panthers (FLA)
- **Hex:** `#041E42`
- **Color Name:** Navy Blue
- **RGB:** (4, 30, 66)

### Montreal Canadiens (MTL)
- **Hex:** `#AF1E2D`
- **Color Name:** Red
- **RGB:** (175, 30, 45)

### Ottawa Senators (OTT)
- **Hex:** `#E31837`
- **Color Name:** Red
- **RGB:** (227, 24, 55)

### Tampa Bay Lightning (TBL)
- **Hex:** `#002868`
- **Color Name:** Blue
- **RGB:** (0, 40, 104)

### Toronto Maple Leafs (TOR)
- **Hex:** `#003E7E`
- **Color Name:** Blue
- **RGB:** (0, 62, 126)

---

## Metropolitan Division

### Carolina Hurricanes (CAR)
- **Hex:** `#CC0000`
- **Color Name:** Red
- **RGB:** (204, 0, 0)

### Columbus Blue Jackets (CBJ)
- **Hex:** `#002654`
- **Color Name:** Blue
- **RGB:** (0, 38, 84)

### New Jersey Devils (NJD)
- **Hex:** `#CE1126`
- **Color Name:** Red
- **RGB:** (206, 17, 38)

### New York Islanders (NYI)
- **Hex:** `#F57D31`
- **Color Name:** Orange
- **RGB:** (245, 125, 49)

### New York Rangers (NYR)
- **Hex:** `#0038A8`
- **Color Name:** Blue
- **RGB:** (0, 56, 168)

### Philadelphia Flyers (PHI)
- **Hex:** `#F74902`
- **Color Name:** Orange
- **RGB:** (247, 73, 2)

### Pittsburgh Penguins (PIT)
- **Hex:** `#FFB81C`
- **Color Name:** Gold
- **RGB:** (255, 184, 28)

### Washington Capitals (WSH)
- **Hex:** `#C8102E`
- **Color Name:** Red
- **RGB:** (200, 16, 46)

---

## Central Division

### Arizona Coyotes (ARI)
- **Hex:** `#8C2633`
- **Color Name:** Red
- **RGB:** (140, 38, 51)

### Chicago Blackhawks (CHI)
- **Hex:** `#CF0A2C`
- **Color Name:** Red
- **RGB:** (207, 10, 44)

### Colorado Avalanche (COL)
- **Hex:** `#6F263D`
- **Color Name:** Burgundy
- **RGB:** (111, 38, 61)

### Dallas Stars (DAL)
- **Hex:** `#006847`
- **Color Name:** Green
- **RGB:** (0, 104, 71)

### Minnesota Wild (MIN)
- **Hex:** `#154734`
- **Color Name:** Green
- **RGB:** (21, 71, 52)

### Nashville Predators (NSH)
- **Hex:** `#FFB81C`
- **Color Name:** Gold
- **RGB:** (255, 184, 28)

### St. Louis Blues (STL)
- **Hex:** `#002F87`
- **Color Name:** Blue
- **RGB:** (0, 47, 135)

### Winnipeg Jets (WPG)
- **Hex:** `#041E42`
- **Color Name:** Navy Blue
- **RGB:** (4, 30, 66)

---

## Pacific Division

### Anaheim Ducks (ANA)
- **Hex:** `#B8860B`
- **Color Name:** Gold
- **RGB:** (184, 134, 11)

### Calgary Flames (CGY)
- **Hex:** `#C8102E`
- **Color Name:** Red
- **RGB:** (200, 16, 46)

### Edmonton Oilers (EDM)
- **Hex:** `#FF4C00`
- **Color Name:** Orange
- **RGB:** (255, 76, 0)

### Los Angeles Kings (LAK)
- **Hex:** `#111111`
- **Color Name:** Black
- **RGB:** (17, 17, 17)

### San Jose Sharks (SJS)
- **Hex:** `#006D75`
- **Color Name:** Teal
- **RGB:** (0, 109, 117)

### Seattle Kraken (SEA)
- **Hex:** `#001628`
- **Color Name:** Navy Blue
- **RGB:** (0, 22, 40)

### Utah Hockey Club (UTA)
- **Hex:** `#69B3E7`
- **Color Name:** Mountain Blue
- **RGB:** (105, 179, 231)

### Vancouver Canucks (VAN)
- **Hex:** `#001F5C`
- **Color Name:** Blue
- **RGB:** (0, 31, 92)

### Vegas Golden Knights (VGK)
- **Hex:** `#B4975A`
- **Color Name:** Gold
- **RGB:** (180, 151, 90)

---

## Default Color
- **Hex:** `#666666`
- **Color Name:** Gray
- **RGB:** (102, 102, 102)
- **Usage:** Used when team abbreviation is not found

---

## Code Implementation

### Python Dictionary Format (Hex)
```python
team_colors = {
    # Atlantic Division
    'BOS': '#FFB81C',  # Boston Bruins - Gold
    'BUF': '#002E62',  # Buffalo Sabres - Navy Blue
    'DET': '#CE1126',  # Detroit Red Wings - Red
    'FLA': '#041E42',  # Florida Panthers - Navy Blue
    'MTL': '#AF1E2D',  # Montreal Canadiens - Red
    'OTT': '#E31837',  # Ottawa Senators - Red
    'TBL': '#002868',  # Tampa Bay Lightning - Blue
    'TOR': '#003E7E',  # Toronto Maple Leafs - Blue
    
    # Metropolitan Division
    'CAR': '#CC0000',  # Carolina Hurricanes - Red
    'CBJ': '#002654',  # Columbus Blue Jackets - Blue
    'NJD': '#CE1126',  # New Jersey Devils - Red
    'NYI': '#F57D31',  # New York Islanders - Orange
    'NYR': '#0038A8',  # New York Rangers - Blue
    'PHI': '#F74902',  # Philadelphia Flyers - Orange
    'PIT': '#FFB81C',  # Pittsburgh Penguins - Gold
    'WSH': '#C8102E',  # Washington Capitals - Red
    
    # Central Division
    'ARI': '#8C2633',  # Arizona Coyotes - Red
    'CHI': '#CF0A2C',  # Chicago Blackhawks - Red
    'COL': '#6F263D',  # Colorado Avalanche - Burgundy
    'DAL': '#006847',  # Dallas Stars - Green
    'MIN': '#154734',  # Minnesota Wild - Green
    'NSH': '#FFB81C',  # Nashville Predators - Gold
    'STL': '#002F87',  # St. Louis Blues - Blue
    'WPG': '#041E42',  # Winnipeg Jets - Navy Blue
    
    # Pacific Division
    'ANA': '#B8860B',  # Anaheim Ducks - Gold
    'CGY': '#C8102E',  # Calgary Flames - Red
    'EDM': '#FF4C00',  # Edmonton Oilers - Orange
    'LAK': '#111111',  # Los Angeles Kings - Black
    'SJS': '#006D75',  # San Jose Sharks - Teal
    'SEA': '#001628',  # Seattle Kraken - Navy Blue
    'UTA': '#69B3E7',  # Utah Hockey Club - Mountain Blue
    'VAN': '#001F5C',  # Vancouver Canucks - Blue
    'VGK': '#B4975A'   # Vegas Golden Knights - Gold
}
```

### Usage Example
```python
def _get_team_color(self, team_abbrev):
    """Get the primary team color based on team abbreviation"""
    team_colors = {
        # ... (colors dictionary as above)
    }
    return team_colors.get(team_abbrev.upper(), '#666666')  # Default gray if team not found
```

---

## JSON Format (for API/Web Use)
```json
{
  "BOS": "#FFB81C",
  "BUF": "#002E62",
  "DET": "#CE1126",
  "FLA": "#041E42",
  "MTL": "#AF1E2D",
  "OTT": "#E31837",
  "TBL": "#002868",
  "TOR": "#003E7E",
  "CAR": "#CC0000",
  "CBJ": "#002654",
  "NJD": "#CE1126",
  "NYI": "#F57D31",
  "NYR": "#0038A8",
  "PHI": "#F74902",
  "PIT": "#FFB81C",
  "WSH": "#C8102E",
  "ARI": "#8C2633",
  "CHI": "#CF0A2C",
  "COL": "#6F263D",
  "DAL": "#006847",
  "MIN": "#154734",
  "NSH": "#FFB81C",
  "STL": "#002F87",
  "WPG": "#041E42",
  "ANA": "#B8860B",
  "CGY": "#C8102E",
  "EDM": "#FF4C00",
  "LAK": "#111111",
  "SJS": "#006D75",
  "SEA": "#001628",
  "UTA": "#69B3E7",
  "VAN": "#001F5C",
  "VGK": "#B4975A"
}
```

---

## Usage in Post-Game Reports

### Shot Charts
Team colors are used to plot goals and shots on the rink diagram:
- Away team goals/shots: Left side (negative X coordinates)
- Home team goals/shots: Right side (positive X coordinates)
- Each team's shots and goals are plotted in their primary color

### Table Headers
Team colors are used for:
- Period-by-period table headers (home team color)
- Team logo rows (respective team colors)
- Advanced metrics table headers

### Visualizations
- Goal markers on shot charts use team colors
- Team-specific sections use team colors for visual distinction

---

## Notes

1. **Color Variations:** Some teams have multiple color definitions in different parts of the code (using ReportLab Color objects with RGB values). The hex values in `_get_team_color()` are the primary colors used for web/API purposes.

2. **Default Color:** If a team abbreviation is not found, the system defaults to `#666666` (gray).

3. **Case Insensitive:** The `_get_team_color()` method converts team abbreviations to uppercase before lookup.

4. **Live Predictions:** These same colors are used in the live in-game predictions dashboard for shot charts and visualizations.

---

## File Location
- **Primary Method:** `pdf_report_generator.py`, line 2055
- **Method Name:** `_get_team_color(team_abbrev)`
- **Return Type:** String (hex color code)

---

## Related Files
- `prediction_dashboard.py` - Uses team colors for live game shot charts
- `templates/prediction_dashboard.html` - JavaScript uses team colors for visualization

