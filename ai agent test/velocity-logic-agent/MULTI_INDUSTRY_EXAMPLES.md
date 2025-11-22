# Multi-Industry Pricing Examples

## Each client uploads their own CSV with this format:
Service Name,Keywords,Unit Price,Unit,Description

## Example 1: Electrical Contractor
```csv
Service Name,Keywords,Unit Price,Unit,Description
200-Amp Panel Upgrade,"panel,upgrade,electrical panel,200 amp,service upgrade",2500.00,Each,Complete 200-amp electrical panel upgrade
Outlet Installation,"outlet,receptacle,plug,socket,install",75.00,Each,Standard outlet installation
GFCI Outlet,"gfci,ground fault,bathroom outlet,outdoor outlet",95.00,Each,GFCI outlet installation
Light Fixture Install,"light,fixture,chandelier,ceiling light",150.00,Each,Light fixture installation and wiring
Ceiling Fan Install,"ceiling fan,fan install",200.00,Each,Ceiling fan installation with wiring
Electrical Inspection,"inspection,safety check,diagnostic",125.00,Each,Electrical system inspection
Emergency Service,"emergency,after hours,urgent",300.00,Each,Emergency electrical service
```

## Example 2: Home Builder / Contractor
```csv
Service Name,Keywords,Unit Price,Unit,Description
Framing Labor,"framing,frame,carpentry,2x4,2x6,lumber",45.00,Per Hour,Framing labor rate
Drywall Installation,"drywall,sheetrock,wallboard",2.50,Per Sq Ft,Drywall installation
Roofing,"roofing,shingles,roof install",8.00,Per Sq Ft,Roofing installation
Foundation Pour,"foundation,concrete,slab",12.00,Per Sq Ft,Concrete foundation
Deck Building,"deck,patio,outdoor deck",35.00,Per Sq Ft,Custom deck construction
Window Installation,"window,replace window,new window",450.00,Each,Window installation
Door Installation,"door,entry door,exterior door",600.00,Each,Exterior door installation
```

## Example 3: Auto Parts Distributor
```csv
Service Name,Keywords,Unit Price,Unit,Description
Brake Pads (Front),"brake pads,front brakes,brake replacement",85.00,Per Set,Front brake pad set
Oil Filter,"oil filter,filter replacement",12.00,Each,Standard oil filter
Air Filter,"air filter,engine filter",18.00,Each,Engine air filter
Battery,"battery,car battery,12v battery",125.00,Each,12V car battery
Alternator,"alternator,charging system",350.00,Each,Replacement alternator
Starter Motor,"starter,starter motor",280.00,Each,Replacement starter motor
Windshield Wipers,"wipers,windshield wipers,wiper blades",22.00,Per Pair,Windshield wiper blades
Spark Plugs,"spark plugs,plugs,ignition",45.00,Per Set,Spark plug set (4-pack)
```

## Example 4: Plumbing Company
```csv
Service Name,Keywords,Unit Price,Unit,Description
Water Heater Install,"water heater,hot water,tank install",1200.00,Each,Standard 40-gal water heater installation
Drain Cleaning,"drain,clog,snake,unclog,drain cleaning",150.00,Each,Drain cleaning service
Toilet Install,"toilet,commode,install toilet",350.00,Each,Toilet installation
Faucet Replace,"faucet,sink,tap,replace faucet",180.00,Each,Faucet replacement
Pipe Repair,"pipe,leak,pipe repair,fix leak",200.00,Per Hour,Pipe repair labor
Emergency Plumbing,"emergency,urgent,after hours",350.00,Each,Emergency plumbing service
Sewer Line,"sewer,main line,sewer line",3500.00,Each,Sewer line replacement
```

## Example 5: Landscaping Company
```csv
Service Name,Keywords,Unit Price,Unit,Description
Lawn Mowing,"mow,mowing,lawn care,cut grass",50.00,Per Visit,Standard lawn mowing service
Mulch Installation,"mulch,mulching,bark,wood chips",65.00,Per Cubic Yard,Mulch delivery and installation
Tree Trimming,"tree,trim,prune,tree service",300.00,Each,Tree trimming/pruning
Sod Installation,"sod,grass,lawn install,turf",1.50,Per Sq Ft,Sod installation
Sprinkler System,"sprinkler,irrigation,watering system",2800.00,Each,Sprinkler system installation
Paver Patio,"paver,patio,pavers,hardscape",18.00,Per Sq Ft,Paver patio installation
Retaining Wall,"retaining wall,wall,landscaping wall",35.00,Per Linear Ft,Retaining wall construction
```

## How It Works:
1. Each CLIENT gets their own company profile
2. CLIENT uploads their pricing CSV via Settings
3. AI extracts customer request (industry-agnostic)
4. System fuzzy-matches to CLIENT's pricing CSV
5. PDF quote generated with CLIENT's logo and branding
6. CLIENT approves before sending

This makes the agent work for ANY blue-collar industry!
