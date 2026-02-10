import urllib.parse
import sys
import os
import json
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from pathlib import Path

# Try to load environment variables from .env
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    # Fallback: manually read .env if python-dotenv is not installed
    env_path = Path(__file__).parent / ".env"
    if env_path.exists():
        with open(env_path, "r") as f:
            for line in f:
                if "=" in line:
                    key, value = line.strip().split("=", 1)
                    os.environ[key] = value

# 1. THE CONTACT LIST
contacts = [
    # Winnipeg
    {
        "name": "Art Stannard", "email": "AStannard@winnipeg.ca", "role": "Deputy Chief", "org": "Winnipeg Police Service", "type": "COMMAND",
        "hook": "I’ve been following the Service's recent focus on modernization and the challenge of incorporating tech efficiently to solve staffing and scheduling issues.",
        "alignment": "operational efficiency and innovation"
    },
    {
        "name": "Brian Sauve", "email": "bsauve@npf-fpn.com", "role": "CEO", "org": "National Police Federation", "type": "UNION",
        "hook": "I’ve spoken to officers across Canada who are concerned about 'riding solo' without adequate backup during this national staffing shortage.",
        "alignment": "member safety and frontline support"
    },
    {
        "name": "Cory Wiles", "email": "cwiles@winnipeg.ca", "role": "President", "org": "Winnipeg Police Association", "type": "UNION",
        "hook": "I know the Association is tirelessly advocating for member safety in the face of current staffing crunches and the physical risks of solo response.",
        "alignment": "protecting the membership"
    },

    # Montreal PD (SPVM)
    {
        "name": "Fady Dagher", "email": "fady.dagher@spvm.qc.ca", "role": "Director", "org": "SPVM", "type": "COMMAND",
        "hook": "I’ve been inspired by your 'Prevention & Intervention' model and the recent 'Autsecours' project to improve interactions with vulnerable citizens via better 911/dispatch data.",
        "alignment": "emotionally intelligent policing and community safety"
    },
    {
        "name": "Yves Francoeur", "email": "yves.francoeur@spvm.qc.ca", "role": "President", "org": "Fraternité des policiers et policières de Montréal", "type": "UNION",
        "hook": "I know the Fraternité has been vocal about the extreme pressure on Montreal officers and the need for tools that actually reduce the burden on the ground.",
        "alignment": "reducing officer burnout and increasing safety"
    },

    # Vancouver PD (VPD)
    {
        "name": "Steve Rai", "email": "steve.rai@vpd.ca", "role": "Chief Constable", "org": "Vancouver Police Department", "type": "COMMAND",
        "hook": "I’ve been following your advocacy for provincial funding to address the mental health crisis and your work building the Employee Wellness Program.",
        "alignment": "officer wellness and crisis response innovation"
    },
    {
        "name": "Ralph Kaisers", "email": "ralph.kaisers@vpd.ca", "role": "President", "org": "Vancouver Police Union", "type": "UNION",
        "hook": "I’ve seen the Union’s work highlighting the strain of the opioid crisis on front-line members and the need for better support structures for those responding solo.",
        "alignment": "member protection and frontline safety"
    },

    # Edmonton PD (EPS)
    {
        "name": "Warren Driechel", "email": "warren.driechel@edmontonpolice.ca", "role": "Chief", "org": "Edmonton Police Service", "type": "COMMAND",
        "hook": "I was very moved by your cultural shift to 'it's okay not to be okay' and the early warning system you've implemented to protect at-risk officers.",
        "alignment": "pioneering officer safety and wellness"
    },
    {
        "name": "Curtis Hoople", "email": "curtis.hoople@edmontonpolice.ca", "role": "President", "org": "Edmonton Police Association", "type": "UNION",
        "hook": "I know the EPA is focused on the physical and psychological toll the current staffing gaps are taking on Edmonton’s front-line officers.",
        "alignment": "supporting the well-being of the membership"
    },

    # Sarnia PD
    {
        "name": "Derek Davis", "email": "ddavis@police.sarnia.on.ca", "role": "Chief", "org": "Sarnia Police Service", "type": "COMMAND",
        "hook": "I was interested to see Sarnia’s launch of the AI Hotline for homelessness to reduce non-emergency 911 pressure and your focus on 'long overdue' modernization.",
        "alignment": "driving technological modernization and efficiency"
    },
    {
        "name": "Gavin Armstrong", "email": "garmstrong@police.sarnia.on.ca", "role": "President", "org": "Sarnia Police Association", "type": "UNION",
        "hook": "I’ve been following the Association’s efforts to ensure fair support for the 230 members currently navigating Sarnia's modernization transition.",
        "alignment": "fairness and safety for the membership"
    },

    # Camrose PD
    {
        "name": "Dean LaGrange", "email": "dlagrange@camrosepolice.ca", "role": "Chief", "org": "Camrose Police Service", "type": "COMMAND",
        "hook": "I’ve been following your work with the PACT team and the transition to the Alberta First Responder Radio Communication System (AFRRCS) to bridge connectivity gaps.",
        "alignment": "cross-agency collaboration and safety tech"
    },

    # --- WAVE 2 EXPANSION ---
    # Calgary
    {
        "name": "Katie McLellan", "email": "KMcLellan@calgarypolice.ca", "role": "Chief Constable (Interim)", "org": "Calgary Police Service", "type": "COMMAND",
        "hook": "I’ve been following your interim leadership and your stated focus on refreshing the Service's focus on member needs and addressing critical understaffing.",
        "alignment": "operational stability and member support"
    },
    {
        "name": "John Orr", "email": "JOrr@calgarypolice.ca", "role": "President", "org": "Calgary Police Association", "type": "UNION",
        "hook": "I saw the Association's optimism regarding the leadership change and your commitment to ensuring the Service finally addresses the chronic understaffing issues.",
        "alignment": "member well-being and staffing solutions"
    },
    
    # Ottawa
    {
        "name": "Eric Stubbs", "email": "StubbsE@ottawapolice.ca", "role": "Chief", "org": "Ottawa Police Service", "type": "COMMAND",
        "hook": "I’ve been following your transition to Ottawa and your efforts to modernize the OPS while leveraging your extensive RCMP operational background.",
        "alignment": "modernization and strategic policing"
    },
    {
        "name": "Matthew Cox", "email": "mcox@ottawapa.ca", "role": "President", "org": "Ottawa Police Association", "type": "UNION",
        "hook": "I know the OPA is navigating heavy pressure on its 2100+ members, especially with the unique operational demands of the capital's core.",
        "alignment": " frontline safety and member advocacy"
    },

    # Peel
    {
        "name": "Nishan Duraiappah", "email": "nishan.duraiappah@peelpolice.ca", "role": "Chief", "org": "Peel Regional Police", "type": "COMMAND",
        "hook": "I’ve been inspired by your leadership at the OACP and your proactive approach to regional safety through technological integration in Peel.",
        "alignment": "innovation and regional safety standards"
    },
    {
        "name": "Adrian Woolley", "email": "awoolley@peelpa.on.ca", "role": "President", "org": "Peel Regional Police Association", "type": "UNION",
        "hook": "I know the PRPA is a strong advocate for the 3700+ members currently facing the evolving challenges of one of Canada's fastest-growing regions.",
        "alignment": "member protection and frontline support"
    },

    # York
    {
        "name": "Jim MacSween", "email": "775@yrp.ca", "role": "Chief", "org": "York Regional Police", "type": "COMMAND",
        "hook": "I’ve been following York's modernization roadmap and your focus on ensuring high operational standards across such a diverse regional footprint.",
        "alignment": "operational excellence and tech adoption"
    },
    {
        "name": "Sean Briard", "email": "sbriard@yrpa.ca", "role": "President", "org": "York Regional Police Association", "type": "UNION",
        "hook": "I’ve seen the YRPA’s focus on member wellness and ensuring that the physical safety of York's officers remains a top priority during this period of growth.",
        "alignment": "officer wellness and safety advocacy"
    },

    # Waterloo
    {
        "name": "Mark Crowell", "email": "mark.crowell@wrps.on.ca", "role": "Chief", "org": "Waterloo Regional Police Service", "type": "COMMAND",
        "hook": "I’ve been interested in the WRPS recent focus on corporate affairs and modernization to better align with the community's evolving safety needs.",
        "alignment": "community-aligned modernization"
    },
    {
        "name": "Mark Egers", "email": "megers@wrpa.org", "role": "President", "org": "Waterloo Regional Police Association", "type": "UNION",
        "hook": "I follow the WRPA’s work in advocating for the members in the Waterloo region, especially regarding the need for better support in high-stress solo responses.",
        "alignment": "member safety and frontline advocacy"
    },

    # Austin, TX
    {
        "name": "Lisa Davis", "email": "lisa.davis@austintexas.gov", "role": "Chief of Police", "org": "Austin Police Department", "type": "COMMAND",
        "hook": "I’ve been following your swearing-in as Austin's second female permanent chief and your innovative use of 'AI Virtual Investigators' to manage non-emergency volume.",
        "alignment": "AI-driven efficiency and leading transition"
    },
    {
        "name": "Michael Bullock", "email": "michael@austinpolice.com", "role": "President", "org": "Austin Police Association", "type": "UNION",
        "hook": "I was struck by your statement that the department is at a 'breaking point' with 50% patrol staffing, forcing reassignments just to maintain 911 response.",
        "alignment": "member safety and staffing stabilization"
    },

    # Phoenix, AZ
    {
        "name": "Matthew Giordano", "email": "matthew.giordano@phoenix.gov", "role": "Chief", "org": "Phoenix Police Department", "type": "COMMAND",
        "hook": "I’ve been following your focus on tech innovation, specifically the 'CallTriage' AI that reduced non-emergency calls by 17% and your new Real Time Operations Center.",
        "alignment": "technological leadership and innovation"
    },
    {
        "name": "Darrell Kriplean", "email": "dkriplean@azplea.com", "role": "President", "org": "Phoenix Law Enforcement Association", "type": "UNION",
        "hook": "I’ve seen PLEA’s advocacy for the 2200 members navigating the 600-officer shortage and it’s clear that 'CallTriage' tech is becoming an essential safety net.",
        "alignment": "member safety and workload reduction"
    },

    # Nashville, TN
    {
        "name": "John Drake", "email": "john.drake@nashville.gov", "role": "Chief", "org": "Nashville Police Department", "type": "COMMAND",
        "hook": "I’ve been following your 30x30 Initiative for female representation and the comprehensive Wellness Program you've built, including Toby the therapy dog.",
        "alignment": "officer wellness and diverse recruitment"
    },
    {
        "name": "Joel Cottrill", "email": "joel.cottrill@nashville.gov", "role": "President", "org": "Nashville FOP Lodge #5", "type": "UNION",
        "hook": "I know the FOP is heavily focused on member well-being and ensuring that Nashville's 2000 members have the support they need to manage current workloads safely.",
        "alignment": "wellness advocacy and member support"
    },

    # International/National
    {
        "name": "Wade Carpenter", "email": "carpenterw@theiacp.org", "role": "President", "org": "IACP", "type": "COMMAND",
        "hook": "I’ve been following IACP’s work on global standards for police technology and your focus on assisting smaller departments with staffing through innovation.",
        "alignment": "global safety standards and tech adoption"
    },
    {
        "name": "Danny Smyth", "email": "dsmyth@cacp.ca", "role": "President", "org": "CACP", "type": "COMMAND",
        "hook": "I know the CACP is tackling the national staffing crisis head-on, seeking force multipliers that can protect solo officers in both urban and rural detachments.",
        "alignment": "national policing policy and safety tech"
    },

    # Additional Targets (To hit 20+)
    {
        "name": "Cliff O'Brien", "email": "COBrien@calgarypolice.ca", "role": "Deputy Chief", "org": "Calgary Police Service", "type": "COMMAND",
        "hook": "I’ve been following your leadership of the Bureau of Community Policing and your focus on front-line operational efficiency in Calgary.",
        "alignment": "community policing and operational support"
    },
    {
        "name": "Nick Milinovich", "email": "nick.milinovich@peelpolice.ca", "role": "Deputy Chief", "org": "Peel Regional Police", "type": "COMMAND",
        "hook": "I’ve seen your work in Peel's operational modernization and the focus on reducing the burden on solo patrolling officers.",
        "alignment": "modernization and frontline safety"
    },
    {
        "name": "Patricia Ferguson", "email": "FergusonP@ottawapolice.ca", "role": "Deputy Chief", "org": "Ottawa Police Service", "type": "COMMAND",
        "hook": "I’ve been following your oversight of Investigations and Organized Crime, and the way tech is being used to leverage limited field resources.",
        "alignment": "investigative efficiency and safety tech"
    },
    {
        "name": "Dennis Orender", "email": "dennis.orender@phoenix.gov", "role": "Executive Assistant Chief", "org": "Phoenix Police Department", "type": "COMMAND",
        "hook": "I’ve been watching Phoenix's emergence as a tech leader in policing, specifically the integration of AI to support field operations during shortage cycles.",
        "alignment": "innovation and operational leadership"
    },

    # --- WAVE 2 DELEGATES (From OOO Replies) ---
    {
        "name": "S/Sgt. Schiavetta", "email": "mschiavetta@calgarypolice.ca", "role": "S/Sgt (Homicide)", "org": "Calgary Police Service", "type": "COMMAND",
        "hook": "I'm reaching out as I was told you'd be the best person to speak with regarding technology integration in investigative units like Homicide.",
        "alignment": "investigative efficiency and safety"
    },
    {
        "name": "Steven Bell", "email": "BellS@ottawapolice.ca", "role": "Acting Chief", "org": "Ottawa Police Service", "type": "COMMAND",
        "hook": "I'm reaching out as Chief Stubbs' office mentioned you're leading the department's operations while he's away.",
        "alignment": "modernization and strategic policing"
    },
    {
        "name": "Joe Brar", "email": "JBrar@calgarypolice.ca", "role": "A/Deputy Chief (Community Policing)", "org": "Calgary Police Service", "type": "COMMAND",
        "hook": "I'm reaching out as Deputy Chief O'Brien mentioned you're overseeing the Bureau of Community Policing and would be a great contact for field-safety tech.",
        "alignment": "community policing and operational support"
    },
    {
        "name": "A/DC Rheaume", "email": "Rheaumec@ottawapolice.ca", "role": "Acting Deputy Chief", "org": "Ottawa Police Service", "type": "COMMAND",
        "hook": "I'm reaching out as Deputy Chief Ferguson referred me to you for more immediate assistance regarding tech implementation.",
        "alignment": "tech implementation and operational safety"
    },

    # --- WAVE 3: US EXPANSION ---
    # Fort Worth, TX
    {
        "name": "Eddie Garcia", "email": "Eddie.Garcia@fortworthtexas.gov", "role": "Chief of Police", "org": "Fort Worth Police Department", "type": "COMMAND",
        "hook": "I've been following your move to Fort Worth and your plans for a $6M Real-Time Crime Center, plus your focus on tech integration ahead of the 2026 FIFA World Cup.",
        "alignment": "technological leadership and event preparedness"
    },

    # Chicago, IL
    {
        "name": "Larry Snelling", "email": "larry.snelling@chicagopolice.org", "role": "Superintendent", "org": "Chicago Police Department", "type": "COMMAND",
        "hook": "I've been following your 'Strategy for Organizational Excellence' and the department's efforts to address nearly 1,000 sworn officer vacancies while advancing technology and innovation.",
        "alignment": "workforce development and technological advancement"
    },

    # Denver, CO
    {
        "name": "Ron Thomas", "email": "ron.thomas@denvergov.org", "role": "Chief of Police", "org": "Denver Police Department", "type": "COMMAND",
        "hook": "I've been interested in Denver's 168-officer hiring goal and your comprehensive officer wellness initiatives, including the focus on physical and mental health.",
        "alignment": "officer wellness and recruitment"
    },

    # San Diego, CA
    {
        "name": "Scott Wahl", "email": "swahl@pd.sandiego.gov", "role": "Chief of Police", "org": "San Diego Police Department", "type": "COMMAND",
        "hook": "I've been following your efforts with the new Real-Time Operations Center and your focus on leveraging technology while addressing the 60-officer daily shortage.",
        "alignment": "technology and staffing efficiency"
    },

    # Las Vegas, NV
    {
        "name": "Kevin McMahill", "email": "sheriff@lvmpd.com", "role": "Sheriff", "org": "Las Vegas Metropolitan Police Department", "type": "COMMAND",
        "hook": "I've been inspired by LVMPD's push to become the most technologically advanced department in the country—including the Tesla Cybertrucks and Drone First Responder Unit—and the Wellness Bureau you launched.",
        "alignment": "technological innovation and officer wellness"
    },

    # Atlanta, GA
    {
        "name": "Darin Schierbaum", "email": "dcschierbaum@atlantaga.gov", "role": "Chief of Police", "org": "Atlanta Police Department", "type": "COMMAND",
        "hook": "I've been following Atlanta's 34% increase in hiring and your preparations for the 2026 World Cup, especially the Axon and camera expansion initiatives.",
        "alignment": "recruitment and event preparedness"
    },

    # Boston, MA
    {
        "name": "Michael Cox", "email": "michael.cox@pd.boston.gov", "role": "Commissioner", "org": "Boston Police Department", "type": "COMMAND",
        "hook": "I've been following your 'intelligence-led policing' approach and the new encrypted digital radios—plus your focus on improving officer wellness and evaluations.",
        "alignment": "modernization and officer support"
    },

    # Philadelphia, PA
    {
        "name": "Kevin Bethel", "email": "kevin.bethel@phila.gov", "role": "Commissioner", "org": "Philadelphia Police Department", "type": "COMMAND",
        "hook": "I've been following your 5-year Strategic Plan and the 1,200-officer shortage you're addressing. Your comments on drones being a 'game-changer' for remote observation really resonated.",
        "alignment": "strategic planning and technology"
    },

    # Miami, FL
    {
        "name": "Manny Morales", "email": "Manuel.Morales@miami-police.org", "role": "Chief of Police", "org": "Miami Police Department", "type": "COMMAND",
        "hook": "I was impressed by the $161M, 300-officer expansion plan and Miami Dade College's AI integration in police training—especially the body camera analysis tools.",
        "alignment": "AI-driven training and staffing growth"
    },

    # New York, NY
    {
        "name": "Jessica Tisch", "email": "commissioner@nypd.org", "role": "Commissioner", "org": "New York Police Department", "type": "COMMAND",
        "hook": "I've been following your work on the Domain Awareness System and the POST Act's push for AI transparency. Your focus on quality-of-life policing expansion is impressive.",
        "alignment": "technology transparency and community safety"
    },

    # Los Angeles, CA
    {
        "name": "Michel Moore", "email": "contact.lapdonline@lapd.online", "role": "Chief of Police", "org": "Los Angeles Police Department", "type": "COMMAND",
        "hook": "I've been following LAPD's challenges with the lowest staffing since 1995, and your joint AI research with universities to analyze body camera footage and officer interactions.",
        "alignment": "AI research and staffing solutions"
    },

    # Houston, TX
    {
        "name": "Larry Satterwhite", "email": "larry.satterwhite@houstonpolice.org", "role": "Acting Chief", "org": "Houston Police Department", "type": "COMMAND",
        "hook": "I've been following HPD's need for 2,000+ additional officers and the budget push for increased cadet pay to $57K. The staffing crunch is clearly a priority.",
        "alignment": "recruitment and operational capacity"
    },

    # LA Police Protective League (Union)
    {
        "name": "Craig Lally", "email": "info@lapd.com", "role": "President", "org": "Los Angeles Police Protective League", "type": "UNION",
        "hook": "I've been following the LAPPL's advocacy for staffing relief as LAPD faces its lowest numbers since 1995. The strain on solo officers is clearly a top concern.",
        "alignment": "member safety and staffing advocacy"
    },

    # Chicago FOP (Union)
    {
        "name": "John Catanzara", "email": "john.catanzarajr@chicagofop.org", "role": "President", "org": "Chicago FOP Lodge 7", "type": "UNION",
        "hook": "I've seen Lodge 7's advocacy for the nearly 1,000 officer vacancies and the strain on members. Your focus on wellness and workload reduction is critical right now.",
        "alignment": "member wellness and staffing relief"
    },

    # Denver PPA (Union)
    {
        "name": "Denver PPA", "email": "linda@dppa.com", "role": "Contact", "org": "Denver Police Protective Association", "type": "UNION",
        "hook": "I noticed the new CBA includes 5-6% salary increases through 2028 and the focus on recruitment. The DPPA's push for officer wellness programs is inspiring.",
        "alignment": "member compensation and wellness"
    },

    # San Diego POA (Union)
    {
        "name": "Jeremy Huff", "email": "jhuff@sdpoa.org", "role": "President", "org": "San Diego Police Officers Association", "type": "UNION",
        "hook": "I've been following the POA's concerns about the 60-officer daily shortage and the 22-minute-longer response times. Staffing and safety are clearly urgent priorities.",
        "alignment": "staffing advocacy and officer safety"
    },

    # Las Vegas PPA (Union)
    {
        "name": "Steve Grammas", "email": "sgrammas@lvppa.com", "role": "President", "org": "Las Vegas Police Protective Association", "type": "UNION",
        "hook": "I've seen the PPA's support for Sheriff McMahill's Wellness Bureau and de-escalation training initiatives. The reduced officer-involved shootings in 2025 speak volumes.",
        "alignment": "officer wellness and de-escalation"
    },

    # Atlanta IBPO (Union)
    {
        "name": "Ken Allen", "email": "info@ibpolocal623.org", "role": "President", "org": "IBPO Atlanta Local 623", "type": "UNION",
        "hook": "I know Local 623 is navigating the 2026 World Cup prep and the associated overtime demands. Ensuring member safety during high-profile events is no small task.",
        "alignment": "event safety and member support"
    },

    # Boston PPA (Union)
    {
        "name": "Larry Calderone", "email": "lcalderone@bppa.org", "role": "President", "org": "Boston Police Patrolmen's Association", "type": "UNION",
        "hook": "I noticed the new CBA's focus on officer evaluations and staff wellness. Your advocacy for expanding summer scheduling to reduce forced overtime is important work.",
        "alignment": "work-life balance and member advocacy"
    },

    # Philadelphia FOP (Union)
    {
        "name": "Roosevelt Poplar", "email": "rpoplar@fop5.org", "role": "President", "org": "FOP Lodge 5 Philadelphia", "type": "UNION",
        "hook": "I've been following Lodge 5's input on the Commissioner's 5-year Strategic Plan and the push for more officer recruitment. The 1,200-officer shortage is a major challenge.",
        "alignment": "strategic input and staffing advocacy"
    },

    # --- WAVE 4: US EXPANSION (Verified 2026 Leadership) ---
    # Detroit, MI
    {
        "name": "Todd Bettison", "email": "motonv701@detroitmi.gov", "role": "Chief of Police", "org": "Detroit Police Department", "type": "COMMAND",
        "hook": "I've been following your Community Safety Strategy in Detroit and the impressive push that led to 800+ new officer hires.",
        "alignment": "recruitment success and community safety"
    },

    # Milwaukee, WI
    {
        "name": "Jeffrey Norman", "email": "Jnorma@milwaukee.gov", "role": "Chief of Police", "org": "Milwaukee Police Department", "type": "COMMAND",
        "hook": "I've been following your focus on expanding the Real-Time Crime Center and the departmental push for facial recognition partnerships to generate investigative leads.",
        "alignment": "technological investigative leads and RTCC modernization"
    },

    # Memphis, TN
    {
        "name": "CJ Davis", "email": "CJ.Davis@memphistn.gov", "role": "Chief of Police", "org": "Memphis Police Department", "type": "COMMAND",
        "hook": "I've been following Operation Code Zero in Memphis and the recent stats showing a 13% reduction in overall crime under your leadership.",
        "alignment": "crime reduction and operational strategy"
    },

    # Columbus, OH
    {
        "name": "Elaine Bryant", "email": "Ebryant@columbuspolice.org", "role": "Chief of Police", "org": "Columbus Division of Police", "type": "COMMAND",
        "hook": "I've been following the Emergency Funds for Families program in Columbus and your continued focus on innovative youth mentorship initiatives.",
        "alignment": "community trust and welfare-focused policing"
    },

    # San Jose, CA
    {
        "name": "Paul Joseph", "email": "Chief.Sjpd@sanjoseca.gov", "role": "Chief of Police", "org": "San Jose Police Department", "type": "COMMAND",
        "hook": "I've been interested in SJPD's use of AI translation software for community messaging and the integration of video analytics in the Real-Time Intelligence Center.",
        "alignment": "AI-driven community trust and real-time intelligence"
    },

    # Kansas City, MO
    {
        "name": "Stacey Graves", "email": "stacey.graves@kcpd.org", "role": "Chief of Police", "org": "Kansas City Police Department", "type": "COMMAND",
        "hook": "I've been following the DICE strategy in Kansas City and your focus on recruiting and promoting women in leadership across the department.",
        "alignment": "data-informed mobilization and leadership diversity"
    },

    # Oklahoma City, OK
    {
        "name": "Ron Bacy", "email": "chiefofpolice@okc.gov", "role": "Chief of Police", "org": "Oklahoma City Police Department", "type": "COMMAND",
        "hook": "I've been following OKCPD's use of iPads for remote mental health consultations in the field and your commitment to compassionate policing.",
        "alignment": "mental health response and tech-enabled field support"
    },

    # Sacramento, CA
    {
        "name": "Katherine Lester", "email": "klester@pd.cityofsacramento.org", "role": "Chief of Police", "org": "Sacramento Police Department", "type": "COMMAND",
        "hook": "I've been interested in Sacramento's Focused Deterrence strategy to reduce gun violence and your commitment to the 30x30 female recruitment goal.",
        "alignment": "violence intervention and recruitment diversity"
    },

    # Albuquerque, NM
    {
        "name": "Cecily Barker", "email": "chiefofpolice@cabq.gov", "role": "Interim Chief", "org": "Albuquerque Police Department", "type": "COMMAND",
        "hook": "I've been following APD's milestone of reaching 99% compliance with the DOJ consent decree and your leadership during this critical sustainment phase.",
        "alignment": "reform success and operational accountability"
    },

    # Indianapolis, IN
    {
        "name": "Tanya Terry", "email": "impd.publicaffairs@indy.gov", "role": "Chief of Police", "org": "Indianapolis Metropolitan Police Department", "type": "COMMAND",
        "hook": "Congratulations on your recent appointment as Chief. I've been following your focus on community visibility and improving officer retention at IMPD.",
        "alignment": "leadership transition and staff retention"
    },

    # Fresno, CA
    {
        "name": "Mindy Casto", "email": "mindy.casto@fresno.gov", "role": "Chief of Police", "org": "Fresno Police Department", "type": "COMMAND",
        "hook": "I noticed your recent permanent appointment as Fresno's first woman police chief and your focus on departmental stability and recruitment.",
        "alignment": "organizational stability and recruitment excellence"
    },

    # Oakland, CA
    {
        "name": "James Beere", "email": "jbeere@oaklandca.gov", "role": "Interim Chief", "org": "Oakland Police Department", "type": "COMMAND",
        "hook": "I've been following your work to stabilize operations in Oakland and the continuing push for crucial departmental reform during this transition.",
        "alignment": "operational stability and reform continuity"
    },

    # Tulsa, OK
    {
        "name": "Dennis Larsen", "email": "TPDCommunications@cityoftulsa.org", "role": "Chief of Police", "org": "Tulsa Police Department", "type": "COMMAND",
        "hook": "I noticed your transition into the Chief role at TPD and your focus on enhancing major investigations while strengthening community-oriented policing.",
        "alignment": "investigative efficiency and community trust"
    },

    # Virginia Beach, VA
    {
        "name": "Paul Neudigate", "email": "VBPD@vbgov.com", "role": "Chief of Police", "org": "Virginia Beach Police Department", "type": "COMMAND",
        "hook": "I've been following your data-driven approach in Virginia Beach, which has consistently kept it among the safest large cities in the country.",
        "alignment": "data-driven safety and public trust"
    },

    # Newark, NJ
    {
        "name": "Emanuel Miranda", "email": "pio@ci.newark.nj.us", "role": "Director", "org": "Newark Department of Public Safety", "type": "COMMAND",
        "hook": "I've been following Newark's holistic approach to public safety and your focus on community-based violence intervention programs.",
        "alignment": "comprehensive community safety and violence prevention"
    },

    # Honolulu, HI
    {
        "name": "Rody Vanic", "email": "hpdchiefsoffice@honolulu.gov", "role": "Interim Chief", "org": "Honolulu Police Department", "type": "COMMAND",
        "hook": "I've been following your interim leadership at HPD and your focus on ensuring high operational standards across Oahu's diverse districts.",
        "alignment": "operational continuity and diverse community safety"
    },

    # Minneapolis, MN
    {
        "name": "Brian O'Hara", "email": "police@minneapolismn.gov", "role": "Chief of Police", "org": "Minneapolis Police Department", "type": "COMMAND",
        "hook": "I’ve been following the work you’ve put into MPD's transformation under the consent decree and your focus on rebuilding trust through accountability.",
        "alignment": "reform excellence and community accountability"
    },

    # New Orleans, LA
    {
        "name": "Anne Kirkpatrick", "email": "nopdpio@nola.gov", "role": "Superintendent", "org": "New Orleans Police Department", "type": "COMMAND",
        "hook": "I noticed NOPD's recent recruitment partnership with Brand Society and the deployment of the Power Watch program to optimize staffing.",
        "alignment": "recruitment innovation and staffing optimization"
    },

    # San Francisco, CA
    {
        "name": "Derrick Lew", "email": "SFPDChief@sfgov.org", "role": "Chief of Police", "org": "San Francisco Police Department", "type": "COMMAND",
        "hook": "Congratulations on your recent appointment. I've been interested in SFPD's implementation of Proposition E technology, including drones and ALPRs.",
        "alignment": "technological leadership and crime deterrence"
    },

    # Louisville, KY
    {
        "name": "Paul Humphrey", "email": "paul.humphrey@louisvilleky.gov", "role": "Chief of Police", "org": "Louisville Metro Police Department", "type": "COMMAND",
        "hook": "I've been following your leadership in Louisville and your focus on creating transparent, department-wide pathways for officer advancement.",
        "alignment": "transparency and career development"
    },

    # --- WAVE 5: US EXPANSION (Monday Dispatch) ---
    {
        "name": "Shon Barnes", "email": "shon.barnes@seattle.gov", "role": "Chief of Police", "org": "Seattle Police Department", "type": "COMMAND",
        "hook": "I've been following your PNRO program and the 30 for 30 initiative to better reflect the community.",
        "alignment": "community-focused recruitment and safety"
    },
    {
        "name": "Bob Day", "email": "ppbpio@police.portlandoregon.gov", "role": "Chief of Police (via PIO)", "org": "Portland Police Bureau", "type": "COMMAND",
        "hook": "I've been following your work to improve city livability while navigating the current 100+ officer shortage.",
        "alignment": "staffing stabilization and city safety"
    },
    {
        "name": "Daniel C. Comeaux", "email": "daniel.comeaux@dallaspolice.gov", "role": "Chief of Police", "org": "Dallas Police Department", "type": "COMMAND",
        "hook": "I've been following your violent crime reduction strategy and the recent push to target violent repeat offenders.",
        "alignment": "crime reduction and strategic field operations"
    },
    {
        "name": "Richard Worley", "email": "richard.worley@baltimorepolice.org", "role": "Commissioner", "org": "Baltimore Police Department", "type": "COMMAND",
        "hook": "I've been following your leadership through the DOJ Consent Decree and the new recruitment incentives.",
        "alignment": "reform success and recruitment excellence"
    },
    {
        "name": "Jeffery W. Carroll", "email": "jeffery.carroll@dc.gov", "role": "Interim Chief", "org": "Metropolitan Police Department", "type": "COMMAND",
        "hook": "I've been following the Safe Commercial Corridors initiative and your data-driven deployments.",
        "alignment": "community safety and data-driven policing"
    },
    {
        "name": "Estella Patterson", "email": "estella.patterson@cmpd.org", "role": "Chief of Police", "org": "Charlotte-Mecklenburg Police Department", "type": "COMMAND",
        "hook": "I've been following your comprehensive officer wellness programs and community-based safety solutions.",
        "alignment": "officer wellness and community trust"
    },
    {
        "name": "Rico Boyce", "email": "rico.boyce@raleighnc.gov", "role": "Chief of Police", "org": "Raleigh Police Department", "type": "COMMAND",
        "hook": "I've been following your 25-year tenure leading into the Chief role and your proactive safety focus.",
        "alignment": "leadership stability and proactive safety"
    },
    {
        "name": "Chad E. Kasmar", "email": "chad.kasmar@tucsonaz.gov", "role": "Chief of Police", "org": "Tucson Police Department", "type": "COMMAND",
        "hook": "I've been following the Tucson Sentinel program and the technological focus of your RTCC.",
        "alignment": "RTCC modernization and community overwatch"
    },
    {
        "name": "Dan Butler", "email": "police@mesaaz.gov", "role": "Chief of Police", "org": "Mesa Police Department", "type": "COMMAND",
        "hook": "I've been following the reduction in violent crime in 2025 and your capital projects for safety tech.",
        "alignment": "violent crime reduction and tech infrastructure"
    },
    {
        "name": "Todd Schmaderer", "email": "todd.schmaderer@cityofomaha.org", "role": "Chief of Police", "org": "Omaha Police Department", "type": "COMMAND",
        "hook": "I've been following your advocacy for juvenile justice reform and the optimization of the new RTCC.",
        "alignment": "juvenile justice and real-time intelligence"
    },
    {
        "name": "Adrian Vasquez", "email": "adrian.vasquez@coloradosprings.gov", "role": "Chief of Police", "org": "Colorado Springs Police Department", "type": "COMMAND",
        "hook": "I've been following your mental health response teams and the legacy of the Community Response Team.",
        "alignment": "mental health response and specialized patrolling"
    },
    {
        "name": "Wally Hebeish", "email": "wally.hebeish@longbeach.gov", "role": "Chief of Police", "org": "Long Beach Police Department", "type": "COMMAND",
        "hook": "I've been following your Quality of Life teams and the collaborative homeless response with LA County.",
        "alignment": "community wellness and multi-agency response"
    },
    {
        "name": "T.K. Waters", "email": "PIO@jaxsheriff.org", "role": "Sheriff (via PIO)", "org": "Jacksonville Sheriff's Office", "type": "COMMAND",
        "hook": "I've been following your transparency initiatives and the expansion of the Safe Schools security programs.",
        "alignment": "transparency and institutional safety"
    },
    {
        "name": "Lee Bercaw", "email": "Lee.Bercaw@tampa.gov", "role": "Chief of Police", "org": "Tampa Police Department", "type": "COMMAND",
        "hook": "I've been following the Combat Violent Crime dashboard and your tech-driven investigative leads.",
        "alignment": "investigative leads and crime deterrence"
    },
    {
        "name": "Eric D. Smith", "email": "opd@orlando.gov", "role": "Chief of Police", "org": "Orlando Police Department", "type": "COMMAND",
        "hook": "I've been following your comprehensive safety strategy for the entertainment district and staffing growth.",
        "alignment": "district safety and staffing growth"
    },
    {
        "name": "Joe Sullivan", "email": "joe.sullivan@wichita.gov", "role": "Chief of Police", "org": "Wichita Police Department", "type": "COMMAND",
        "hook": "I've been following your first year in the role and your focus on modernizing field technology.",
        "alignment": "modernization and field-level tech support"
    },
    {
        "name": "Dorothy A. Todd", "email": "dtodd@clevelandohio.gov", "role": "Chief of Police", "org": "Cleveland Division of Police", "type": "COMMAND",
        "hook": "I've been following your primary focus on juvenile crime and removing crime guns from the streets.",
        "alignment": "juvenile justice and gun violence reduction"
    },
    {
        "name": "Jason Lando", "email": "jason.lando@pittsburghpa.gov", "role": "Chief of Police", "org": "Pittsburgh Bureau of Police", "type": "COMMAND",
        "hook": "I've been following your 4-priority framework for 2026 and professionalizing the command staff.",
        "alignment": "leadership development and strategic policing"
    },
    {
        "name": "Peter Pacillas", "email": "pdpios@elpasotexas.gov", "role": "Chief of Police (via PIO)", "org": "El Paso Police Department", "type": "COMMAND",
        "hook": "I've been following your improvements to mental health crisis response and the expansion of the RTCC.",
        "alignment": "mental health response and RTCC expansion"
    },
    {
        "name": "William McManus", "email": "william.mcmanus@sanantonio.gov", "role": "Chief of Police", "org": "San Antonio Police Department", "type": "COMMAND",
        "hook": "I've been following your nearly two-decade legacy and the transition leading into your 2026 retirement.",
        "alignment": "leadership legacy and operational continuity"
    },
    # --- SD REFERRALS (from Jeremy Huff) ---
    {
        "name": "SD Police Ops Support", "email": "sdpdpolicechief@pd.sandiego.gov", "role": "Operational Support Unit", "org": "San Diego Police Department", "type": "COMMAND",
        "hook": "I was referred by Jeremy Huff of the San Diego POA regarding police technology solutions for operational support.",
        "alignment": "operational technology and field support"
    },
    {
        "name": "SD City Procurement", "email": "purchasing@sandiego.gov", "role": "Procurement Team", "org": "City of San Diego", "type": "COMMAND",
        "hook": "I was referred by Jeremy Huff of the San Diego POA regarding police technology procurement opportunities.",
        "alignment": "technology procurement and vendor relations"
    },
    # --- INVESTOR OUTREACH (Defense/GovTech) ---
    {
        "name": "Trae Stephens", "email": "trae.stephens@foundersfund.com", "role": "Partner", "org": "Founders Fund", "type": "INVESTOR",
        "hook": "I've been following your thesis on 'saving Western civilization' and the imperative for defense tech innovation.",
        "alignment": "defense technology"
    },
    {
        "name": "Josh Wolfe", "email": "josh.wolfe@luxcapital.com", "role": "Co-Founder", "org": "Lux Capital", "type": "INVESTOR",
        "hook": "I've been following your focus on hard science and the intersection of defense and AI.",
        "alignment": "hard tech and defense"
    },
    {
        "name": "Raj Shah", "email": "operations@shieldcap.com", "role": "Managing Partner", "org": "Shield Capital", "type": "INVESTOR",
        "hook": "I've been following Shield's focus on dual-use technology and the frontier of national security.",
        "alignment": "national security innovation"
    },
    {
        "name": "Jake Medwell", "email": "jake@8vc.com", "role": "Partner", "org": "8VC", "type": "INVESTOR",
        "hook": "I've been following your focus on fixing broken industries like logistics and government via smart enterprise software.",
        "alignment": "fixing broken government systems"
    },
    {
        "name": "Greg Sands", "email": "greg@costanoavc.com", "role": "Managing Partner", "org": "Costanoa Ventures", "type": "INVESTOR",
        "hook": "I've been following your focus on modernizing the 'unsexy' but critical work of government infrastructure.",
        "alignment": "modernizing critical infrastructure"
    },
    {
        "name": "Paul Kwan", "email": "pkwan@generalcatalyst.com", "role": "Managing Director", "org": "General Catalyst", "type": "INVESTOR",
        "hook": "I've been following GC's Global Resilience thesis and the push to modernize critical civic systems.",
        "alignment": "Global Resilience"
    },
    {
        "name": "Chris Morales", "email": "chris.morales@p72.vc", "role": "Partner", "org": "Point72 Ventures", "type": "INVESTOR",
        "hook": "I've been following your deep dives into defense tech and AI applications for national security.",
        "alignment": "Defense Tech"
    },
    {
        "name": "Jackson Moses", "email": "jackson@silentvc.com", "role": "Managing Partner", "org": "Silent Ventures", "type": "INVESTOR",
        "hook": "I've been following Silent's specialized focus on aerospace and defense technologies.",
        "alignment": "specialized defense tech"
    },
    {
        "name": "Kelly Perdew", "email": "kelly@moonshotscapital.com", "role": "Managing Partner", "org": "Moonshots Capital", "type": "INVESTOR",
        "hook": "I've been following your focus on veteran-led startups and the importance of leadership in high-stakes environments.",
        "alignment": "veteran-led innovation"
    },

    # --- WAVE 6: NEW INVESTOR TARGETS (Pre-Seed/Seed) ---
    {
        "name": "Responder Ventures", "email": "info@responderventures.com", "role": "General Contact", "org": "Responder Ventures LLC", "type": "INVESTOR",
        "hook": "I was inspired to learn that Responder Ventures was founded by career first responders to invest in mission-critical public safety technology.",
        "alignment": "public safety innovation by operators"
    },
    {
        "name": "Decisive Point", "email": "info@decisivepoint.com", "role": "General Contact", "org": "Decisive Point Ventures", "type": "INVESTOR",
        "hook": "I've been following your early-stage focus on technology for government, public safety, and defense.",
        "alignment": "government and public safety technology"
    },
    {
        "name": "Paige Craig", "email": "info@outlander.vc", "role": "Founder & GP", "org": "Outlander VC", "type": "INVESTOR",
        "hook": "I've been following your work backing dual-use defense and national security founders—especially as a fellow believer in operator-led innovation.",
        "alignment": "pre-seed dual-use defense tech"
    },
    {
        "name": "Ron Bouganim", "email": "ron@govtechfund.com", "role": "Managing Partner", "org": "Govtech Fund", "type": "INVESTOR",
        "hook": "I've been following your dedicated focus on startups building technology for the public sector.",
        "alignment": "public sector technology"
    },
    {
        "name": "Urban Innovation Fund", "email": "pitch@urbaninnovationfund.com", "role": "General Contact", "org": "Urban Innovation Fund", "type": "INVESTOR",
        "hook": "I've been following your seed investments in entrepreneurs shaping the future of cities and urban safety.",
        "alignment": "urban safety and city technology"
    },
    {
        "name": "LLR Partners", "email": "ir@llrpartners.com", "role": "Investor Relations", "org": "LLR Partners", "type": "INVESTOR",
        "hook": "I noticed LLR's active interest in technology platforms that modernize public safety operations and improve transparency.",
        "alignment": "public safety platform modernization"
    },
    {
        "name": "Alex Finkelstein", "email": "alex@sparkcapital.com", "role": "General Partner", "org": "Spark Capital", "type": "INVESTOR",
        "hook": "I've been following Spark's investments in public safety technology, including Flock Safety and Mark43.",
        "alignment": "public safety tech investment"
    },

    # --- WAVE 7: TOMORROW'S DISPATCH ---
    # Baltimore Referrals (from Richard Worley OOO)
    {
        "name": "Erin Murphy", "email": "Erin.Murphy@BaltimorePolice.org", "role": "Chief of Staff", "org": "Baltimore Police Department", "type": "COMMAND",
        "hook": "I was referred by Commissioner Worley's office regarding police technology solutions.",
        "alignment": "operational efficiency and technology adoption"
    },

    # New Police Departments
    {
        "name": "Kevin Hall", "email": "khall@spokanepolice.org", "role": "Chief of Police", "org": "Spokane Police Department", "type": "COMMAND",
        "hook": "I've been following your focus on community engagement and the integration of modern policing strategies in Spokane.",
        "alignment": "community-focused policing and technology"
    },
    {
        "name": "Brian Redd", "email": "askthechief@slc.gov", "role": "Chief of Police", "org": "Salt Lake City Police Department", "type": "COMMAND",
        "hook": "I've been following the department's commitment to transparency and community partnerships under your leadership.",
        "alignment": "transparency and community relations"
    },
    {
        "name": "TJ Morse", "email": "brpdinfo@brgov.com", "role": "Chief of Police", "org": "Baton Rouge Police Department", "type": "COMMAND",
        "hook": "I've been following your efforts to modernize the department and address community safety challenges in Baton Rouge.",
        "alignment": "modernization and community safety"
    },
    {
        "name": "Rochester PD Chief", "email": "Rpd.chief1@CityofRochester.gov", "role": "Chief of Police", "org": "Rochester Police Department", "type": "COMMAND",
        "hook": "I've been following the department's focus on community policing and technology-driven solutions in Rochester.",
        "alignment": "community policing and innovation"
    },
    {
        "name": "Lt. Jonathan Cunningham", "email": "Jonathan.Cunningham@Cincinnati-Oh.Gov", "role": "PIO Commander", "org": "Cincinnati Police Department", "type": "COMMAND",
        "hook": "I've been following CPD's focus on collaborative policing and community engagement.",
        "alignment": "collaborative policing and community trust"
    },
    {
        "name": "Robert Tracy", "email": "ContactPD@stlouiscountymo.gov", "role": "Commissioner", "org": "St. Louis Metropolitan Police", "type": "COMMAND",
        "hook": "I've been following your focus on reducing violent crime and officer safety in St. Louis.",
        "alignment": "crime reduction and officer safety"
    },
    {
        "name": "Stephanie Fryer", "email": "sfryer@cityofmadison.com", "role": "Public Information Officer", "org": "Madison Police Department", "type": "COMMAND",
        "hook": "I've been following Madison PD's emphasis on community policing and progressive law enforcement strategies.",
        "alignment": "progressive policing and community engagement"
    },
    {
        "name": "Mark Talbot", "email": "police@norfolk.gov", "role": "Chief of Police", "org": "Norfolk Police Department", "type": "COMMAND",
        "hook": "I've been following your focus on community partnerships and crime prevention in Norfolk.",
        "alignment": "community partnerships and safety"
    },
    {
        "name": "Rick Edwards", "email": "RPD.FOIA@rva.gov", "role": "Chief of Police (via FOIA)", "org": "Richmond Police Department", "type": "COMMAND",
        "hook": "I've been following your focus on transparency and community-oriented policing in Richmond.",
        "alignment": "transparency and community policing"
    },
    {
        "name": "Mark Rusin", "email": "media@syracusepolice.org", "role": "Chief of Police (via Media)", "org": "Syracuse Police Department", "type": "COMMAND",
        "hook": "I've been following your efforts to modernize the department and strengthen community relations in Syracuse.",
        "alignment": "modernization and community trust"
    },
    {
        "name": "RTX Ventures", "email": "corporatepr@rtx.com", "role": "Corporate Ventures", "org": "RTX (Raytheon) Ventures", "type": "INVESTOR",
        "hook": "I've been following RTX Ventures' early-stage investments in aerospace and defense technologies.",
        "alignment": "defense innovation and aerospace"
    },
    {
        "name": "Craig Macy", "email": "mediarequests@bpdny.org", "role": "Acting Commissioner (via Media)", "org": "Buffalo Police Department", "type": "COMMAND",
        "hook": "I've been following the department's focus on community safety and officer support in Buffalo.",
        "alignment": "community safety and officer support"
    },
    {
        "name": "Birmingham PD Suggestions", "email": "BPDSuggestions@birminghamal.gov", "role": "Suggestions/Feedback", "org": "Birmingham Police Department", "type": "COMMAND",
        "hook": "I've been following Birmingham PD's efforts to enhance public safety and community trust.",
        "alignment": "public safety and community engagement"
    },
    {
        "name": "Sean Case", "email": "apdchief@anchorageak.gov", "role": "Chief of Police", "org": "Anchorage Police Department", "type": "COMMAND",
        "hook": "I've been following the department's unique challenges and focus on community safety in Alaska's largest city.",
        "alignment": "community safety and unique policing challenges"
    },
    {
        "name": "Aurora PD PIO", "email": "apdpio@auroragov.org", "role": "Public Information Office", "org": "Aurora Police Department", "type": "COMMAND",
        "hook": "I've been following Aurora PD's focus on community policing and technology adoption in Colorado.",
        "alignment": "technology adoption and community policing"
    },
    {
        "name": "Riverside PD", "email": "police@riversideca.gov", "role": "Chief of Police", "org": "Riverside Police Department", "type": "COMMAND",
        "hook": "I've been following the department's commitment to community partnerships and crime prevention in Riverside.",
        "alignment": "community partnerships and crime prevention"
    },
    {
        "name": "Lexington PD", "email": "police@lexingtonky.gov", "role": "Chief of Police", "org": "Lexington Police Department", "type": "COMMAND",
        "hook": "I've been following your focus on community-oriented policing and public safety in Lexington.",
        "alignment": "community policing and public safety"
    },
    {
        "name": "Stockton PD", "email": "police@stocktonca.gov", "role": "Chief of Police", "org": "Stockton Police Department", "type": "COMMAND",
        "hook": "I've been following Stockton PD's efforts to reduce violence and strengthen community trust.",
        "alignment": "violence reduction and community trust"
    },
    {
        "name": "Newark PD NJ", "email": "police@ci.newark.nj.us", "role": "Chief of Police", "org": "Newark Police Division", "type": "COMMAND",
        "hook": "I've been following Newark's efforts in community policing and crime prevention.",
        "alignment": "community policing and crime prevention"
    },
    # New Investors (10)
    {
        "name": "Scout Ventures", "email": "ir@scout.vc", "role": "Investor Relations", "org": "Scout Ventures", "type": "INVESTOR",
        "hook": "I've been following Scout's focus on seed investments in aerospace, defense, and autonomy startups.",
        "alignment": "defense and aerospace innovation"
    },
    {
        "name": "Amplify Partners", "email": "info@amplifypartners.com", "role": "General Contact", "org": "Amplify Partners", "type": "INVESTOR",
        "hook": "I've been following Amplify's focus on early-stage investments in AI, cybersecurity, and dual-use technology.",
        "alignment": "AI and cybersecurity innovation"
    },
    {
        "name": "DCVC", "email": "press@dcvc.com", "role": "Press/Contact", "org": "DCVC (Data Collective)", "type": "INVESTOR",
        "hook": "I've been following DCVC's deep tech investments in companies solving hard problems with data science.",
        "alignment": "deep tech and data-driven solutions"
    },
    {
        "name": "Insight Partners", "email": "growth@insightpartners.com", "role": "Growth Team", "org": "Insight Partners", "type": "INVESTOR",
        "hook": "I've been following Insight's investments in software companies transforming public sector operations.",
        "alignment": "public sector software transformation"
    },
    {
        "name": "Amecloud Ventures", "email": "pr@amecloudventures.com", "role": "General Contact", "org": "Amecloud Ventures", "type": "INVESTOR",
        "hook": "I've been following Amecloud's focus on disruptive technology investments from Jerry Yang's team.",
        "alignment": "disruptive technology innovation"
    },
    {
        "name": "Northrop Grumman SBIR", "email": "SBIR@ngc.com", "role": "Tech Partnerships", "org": "Northrop Grumman", "type": "INVESTOR",
        "hook": "I've been following NGC's innovation partnerships and strategic investments in defense dual-use technologies.",
        "alignment": "defense innovation and strategic partnership"
    },
    {
        "name": "AEI HorizonX", "email": "info@aeroequity.com", "role": "Investment Team", "org": "AEI HorizonX (Boeing Partnership)", "type": "INVESTOR",
        "hook": "I've been following AEI HorizonX's investments in advanced manufacturing and autonomous systems (formerly Boeing HorizonX).",
        "alignment": "aerospace innovation and autonomy"
    },

    # --- WAVE 8: PRE-SEED/SEED INVESTORS (VERIFIED EMAILS ONLY) ---
    {
        "name": "IQT (In-Q-Tel)", "email": "info@iqt.org", "role": "Strategic Innovation", "org": "In-Q-Tel", "type": "INVESTOR",
        "hook": "I've been following IQT's mission to accelerate groundbreaking technologies from startups to the intelligence and defense communities.",
        "alignment": "national security and intelligence technology"
    },
    {
        "name": "Elron Ventures", "email": "info@elron.com", "role": "General Contact", "org": "Elron Ventures", "type": "INVESTOR",
        "hook": "I've been following Elron's investments in defense tech and deep tech startups, particularly your partnership with Rafael.",
        "alignment": "defense tech and deep technology"
    },
    {
        "name": "AllegisCyber Capital", "email": "vc@allegiscapital.com", "role": "General Contact", "org": "AllegisCyber Capital", "type": "INVESTOR",
        "hook": "I've been following AllegisCyber's early-stage investments in cybersecurity and defense technology.",
        "alignment": "cybersecurity and defense innovation"
    },
    {
        "name": "Form Ventures", "email": "info@formventures.vc", "role": "General Contact", "org": "Form Ventures", "type": "INVESTOR",
        "hook": "I've been following Form's focus on pre-seed investments in regulated markets and public policy-influenced technology.",
        "alignment": "regulated markets and govtech"
    },
    {
        "name": "Keen Venture Partners", "email": "info@keenventurepartners.com", "role": "General Contact", "org": "Keen Venture Partners", "type": "INVESTOR",
        "hook": "I've been following Keen's new €125M defense tech fund focusing on seed to Series B investments.",
        "alignment": "European defense innovation"
    },
    {
        "name": "Serent Capital", "email": "info@serentcapital.com", "role": "General Contact", "org": "Serent Capital", "type": "INVESTOR",
        "hook": "I've been following Serent's investments in technology platforms modernizing government and public sector operations.",
        "alignment": "govtech and public sector transformation"
    },
    {
        "name": "Mission Support Partners", "email": "info@missionsupportpartners.com", "role": "General Contact", "org": "Mission Support Partners", "type": "INVESTOR",
        "hook": "I've been following MSP's investments in aerospace, defense, and government services markets.",
        "alignment": "aerospace and defense services"
    },
    {
        "name": "Chessie Ventures", "email": "info@chessiecap.com", "role": "General Contact", "org": "Chessie Ventures", "type": "INVESTOR",
        "hook": "I've been following Chessie's investments in govtech and public sector-focused startups.",
        "alignment": "government technology and services"
    },
    {
        "name": "Razor's Edge Ventures", "email": "info@razorsvc.com", "role": "General Contact", "org": "Razor's Edge Ventures", "type": "INVESTOR",
        "hook": "I've been following Razor's Edge's investments in national security and defense technology startups.",
        "alignment": "national security innovation"
    },
    {
        "name": "NightDragon", "email": "info@nightdragon.com", "role": "General Contact", "org": "NightDragon", "type": "INVESTOR",
        "hook": "I've been following NightDragon's investments in cybersecurity and safety technology.",
        "alignment": "cybersecurity and safety innovation"
    },
    {
        "name": "Fontinalis Partners", "email": "pitch@fontinalis.com", "role": "Pitch Contact", "org": "Fontinalis Partners", "type": "INVESTOR",
        "hook": "I've been following Fontinalis's investments in next-generation mobility and smart cities technology.",
        "alignment": "mobility and smart cities"
    },
    {
        "name": "Squadra Ventures", "email": "info@squadra.vc", "role": "General Contact", "org": "Squadra Ventures", "type": "INVESTOR",
        "hook": "I've been following Squadra's investments in B2B software and enterprise technology.",
        "alignment": "B2B software and enterprise tech"
    },
    {
        "name": "Bessemer Venture Partners", "email": "crea@bvp.com", "role": "Public Safety AI Partner", "org": "Bessemer Venture Partners", "type": "INVESTOR",
        "hook": "I read your recent article on the public safety AI opportunity - Vantus addresses exactly the labor shortage challenges you highlighted.",
        "alignment": "public safety AI and govtech"
    },
    {
        "name": "Accel Partners", "email": "siliconvalley@accel.com", "role": "Silicon Valley Office", "org": "Accel", "type": "INVESTOR",
        "hook": "I've been following Accel's investments in enterprise software and AI-driven companies.",
        "alignment": "enterprise software and AI"
    },
    {
        "name": "Paladin Capital Group", "email": "dpo@paladincapgroup.com", "role": "General Contact", "org": "Paladin Capital Group", "type": "INVESTOR",
        "hook": "I've been following Paladin's investments in cybersecurity, critical infrastructure, and national security technology.",
        "alignment": "cybersecurity and national security"
    },

    # --- WAVE 9: VCSHEET DEFENSE/GOVTECH INVESTORS ---
    {
        "name": "Black Flag VC", "email": "crew@blackflag.vc", "role": "Accelerator", "org": "Black Flag (Harpoon)", "type": "INVESTOR",
        "hook": "I've been following Black Flag's focus on technologies critical to national security - Vantus aligns perfectly with your thesis.",
        "alignment": "national security and defense tech"
    },
    {
        "name": "Harpoon Ventures", "email": "info@harpoon.vc", "role": "General Contact", "org": "Harpoon Ventures", "type": "INVESTOR",
        "hook": "I've been following Harpoon's track record helping portfolio companies secure over $1B in government contracts.",
        "alignment": "dual-use technology and defense"
    },
    {
        "name": "First In", "email": "hello@wearefirstin.com", "role": "General Contact", "org": "First In", "type": "INVESTOR",
        "hook": "I've been following First In's investments in security tech - your team's military and intelligence background resonates with Vantus's mission.",
        "alignment": "security technology and defense"
    },
    {
        "name": "Commonweal Ventures", "email": "paul@commonwealventures.com", "role": "Paul - Partner", "org": "Commonweal Ventures", "type": "INVESTOR",
        "hook": "I've been following Commonweal's investments in companies partnering with government - Vantus is purpose-built for public safety agencies.",
        "alignment": "government partnerships and civic tech"
    },
    {
        "name": "Athenian Capital", "email": "info@athenian.capital", "role": "General Contact", "org": "Athenian Capital", "type": "INVESTOR",
        "hook": "I've been following Athenian's focus on dual-use technology startups - Vantus serves both commercial and government markets.",
        "alignment": "dual-use technology and defense"
    },
    {
        "name": "Anorak Ventures", "email": "charlie@anorak.vc", "role": "Charlie Leggate", "org": "Anorak Ventures", "type": "INVESTOR",
        "hook": "I've been following Anorak's seed investments in robotics, advanced manufacturing, and differentiated deeptech.",
        "alignment": "robotics and defense deeptech"
    },
    {
        "name": "AeroX Ventures", "email": "info@axv.vc", "role": "General Contact", "org": "AeroX Ventures", "type": "INVESTOR",
        "hook": "I've been following AeroX's early-stage investments in aerospace and defense technology.",
        "alignment": "aerospace and defense innovation"
    },

    # --- WAVE 10: NEW POLICE DEPARTMENT CONTACTS ---
    {
        "name": "Anthony Holloway", "email": "anthony.holloway@stpete.org", "role": "Chief of Police", "org": "St. Petersburg PD", "type": "POLICE",
        "hook": "I've been researching innovative approaches to public safety in St. Petersburg.",
        "alignment": "public safety technology"
    },
    {
        "name": "Patrice Andrews", "email": "PoliceChief@durhamnc.gov", "role": "Chief of Police", "org": "Durham PD", "type": "POLICE",
        "hook": "I've been following Durham's progressive approach to community policing.",
        "alignment": "community safety and officer wellness"
    },
    {
        "name": "Greg Terry", "email": "gterry@bakersfieldpd.us", "role": "Chief of Police", "org": "Bakersfield PD", "type": "POLICE",
        "hook": "I've been researching public safety challenges in California's Central Valley.",
        "alignment": "officer safety technology"
    },
    {
        "name": "Seth Herman", "email": "LPDChief@mylubbock.us", "role": "Chief of Police", "org": "Lubbock PD", "type": "POLICE",
        "hook": "I've been following Lubbock PD's modernization efforts.",
        "alignment": "law enforcement technology"
    },
    {
        "name": "PJ Smith", "email": "Paul.Smith@cityoffortwayne.org", "role": "Chief of Police", "org": "Fort Wayne PD", "type": "POLICE",
        "hook": "I've been researching public safety innovation in Fort Wayne.",
        "alignment": "officer safety and wellness"
    },
    {
        "name": "St. Paul PD", "email": "policeinfo@ci.stpaul.mn.us", "role": "Chief's Office", "org": "St. Paul PD", "type": "POLICE",
        "hook": "I've been following St. Paul's approach to modern policing under Chief Axel Henry.",
        "alignment": "public safety technology"
    },
    {
        "name": "Reno PD", "email": "askrpd@reno.gov", "role": "Chief's Office", "org": "Reno PD", "type": "POLICE",
        "hook": "I've been researching how Nevada departments are adopting new safety technologies.",
        "alignment": "officer safety innovation"
    },
    {
        "name": "Des Moines PD", "email": "communications@dmgov.org", "role": "Communications", "org": "Des Moines PD", "type": "POLICE",
        "hook": "I've been following Des Moines PD's community-focused policing strategies.",
        "alignment": "law enforcement technology"
    },
    {
        "name": "Paul Noel", "email": "chiefofpolice@knoxvilletn.gov", "role": "Chief of Police", "org": "Knoxville PD", "type": "POLICE",
        "hook": "I've been researching public safety innovation in Tennessee.",
        "alignment": "officer safety and technology"
    },
    {
        "name": "Boise PD", "email": "BPDMediaLine@cityofboise.org", "role": "Media/PIO", "org": "Boise PD", "type": "POLICE",
        "hook": "I've been following Boise's growth and its impact on public safety needs.",
        "alignment": "law enforcement technology"
    },
    {
        "name": "Heath Helton", "email": "LRPDChief@littlerock.gov", "role": "Chief of Police", "org": "Little Rock PD", "type": "POLICE",
        "hook": "I've been following Little Rock's efforts to modernize its police force.",
        "alignment": "officer safety technology"
    },
    {
        "name": "Tacoma PD", "email": "TPD-PIO@tacoma.gov", "role": "PIO", "org": "Tacoma PD", "type": "POLICE",
        "hook": "I've been researching public safety technology adoption in the Pacific Northwest.",
        "alignment": "public safety innovation"
    },
    {
        "name": "Providence PD", "email": "amcginn@providenceri.gov", "role": "Chief's Office", "org": "Providence PD", "type": "POLICE",
        "hook": "I've been following Providence PD's approach to officer safety and community policing.",
        "alignment": "officer safety and wellness"
    },
    {
        "name": "Eric Winstrom", "email": "ewinstrom@grcity.us", "role": "Chief of Police", "org": "Grand Rapids PD", "type": "POLICE",
        "hook": "I've been following Grand Rapids' progressive approach to policing and public safety.",
        "alignment": "law enforcement technology"
    },
    {
        "name": "Reggie Rader", "email": "COHPoliceChief@cityofhenderson.com", "role": "Chief of Police", "org": "Henderson PD", "type": "POLICE",
        "hook": "I've been following Henderson PD's growth and innovation in public safety.",
        "alignment": "officer safety technology"
    },
    {
        "name": "Lenny Gunther", "email": "LGunther@Savannahga.Gov", "role": "Chief of Police", "org": "Savannah PD", "type": "POLICE",
        "hook": "I've been following Savannah's approach to public safety under your leadership.",
        "alignment": "public safety innovation"
    },
    {
        "name": "Brian Harding", "email": "BHarding@akronohio.gov", "role": "Chief of Police", "org": "Akron PD", "type": "POLICE",
        "hook": "I've been researching how Ohio departments are modernizing their operations.",
        "alignment": "law enforcement technology"
    },
    {
        "name": "Kamran Afzal", "email": "kamran.afzal@daytonohio.gov", "role": "Chief of Police", "org": "Dayton PD", "type": "POLICE",
        "hook": "I've been following Dayton PD's modernization under your leadership.",
        "alignment": "officer safety and technology"
    },
    {
        "name": "Michael Troendle", "email": "michael.troendle@toledo.oh.gov", "role": "Chief of Police", "org": "Toledo PD", "type": "POLICE",
        "hook": "I've been researching public safety innovation in Toledo.",
        "alignment": "officer safety technology"
    },
    {
        "name": "Corpus Christi PD", "email": "pdpio@cctexas.com", "role": "PIO", "org": "Corpus Christi PD", "type": "POLICE",
        "hook": "I've been following how Texas departments are adopting new safety technologies.",
        "alignment": "law enforcement technology"
    }
]

# Tracking configuration
SENT_HISTORY_FILE = Path(__file__).parent / "sent_history.json"

def load_sent_history():
    if SENT_HISTORY_FILE.exists():
        try:
            with open(SENT_HISTORY_FILE, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"⚠️ Error loading sent history: {e}")
    return {}

def save_to_history(email):
    history = load_sent_history()
    history[email] = {
        "sent_at": datetime.now().isoformat(),
        "subject": "Police Tech"
    }
    try:
        with open(SENT_HISTORY_FILE, 'w') as f:
            json.dump(history, f, indent=2)
    except Exception as e:
        print(f"⚠️ Error saving to history: {e}")

# 2. THE CONTENT GENERATOR
def generate_email(contact, sender_name="Emily Fehr"):
    # Extract first name
    name_parts = contact['name'].strip().split()
    first_name = name_parts[0] if name_parts else "there"
    
    opening = f"Hi {first_name},"
    subject = "Police Tech"

    # Dynamic Hook & Alignment
    hook = contact.get('hook', "I’ve been following your department's work and the recent modernization initiatives you've been leading.")
    alignment = contact.get('alignment', "operational efficiency and safety")

    if contact['type'] == 'COMMAND':
        # Command Version (Human & Direct)
        body = f"""{opening}

{hook}

Law enforcement is a big part of my family life, which is why I've spent the last few months researching operational gaps, specifically around officer safety during solo responses.

I've been building Vantus, an automated "Virtual Partner" that integrates into existing gear (smartphone/bodycam) to handle hands-free dispatch and safety checks during high-stress calls. The goal is to act as a force multiplier when staffing is thin.

I’m not looking for a contract. I’d just love to share a few quick insights from our research that might align with your focus on {alignment}.

Are you open to a very brief chat sometime?

All the best,

{sender_name}"""
    elif contact['type'] == 'INVESTOR':
        # Investor-specific pitch (Data & Traction Focus)
        hook_section = f"{hook}\n\n" if hook else ""
        return "Vantus / Force Multiplier for Public Safety", f"""Hi {first_name},

{hook_section}82% of officers are now responding solo due to critical staffing shortages.

I'm building Vantus to solve this problem. It's an automated "Virtual Partner" that integrates into existing gear to handle hands-free dispatch and safety checks—acting as a force multiplier so no officer is truly alone.

Our Traction:
- In pilot talks with 2 Canadian-based departments.
- Endless conversations with current and former officers, professors, analysts, and more.

Given your focus on {alignment}, are you open to a brief intro chat?

All the best,

{sender_name}"""

    else:
        # Union Version (Human & Direct)
        body = f"""{opening}

{hook}

Law enforcement is a big part of my family life, and hearing about the realities of the job first-hand led me to research frontline safety gaps.

I've been building Vantus, a "Virtual Partner" built specifically to support solo officers. Instead of just another reporting tool, it lives inside existing gear (watch/phone/bodycam) to act as an automated safety net with hands-free dispatch and biometric distress signals.

The goal is simple: ensure no member is ever truly alone on a call, especially during current staffing crunches.

I’d love to share what we’ve learned about improving field safety and member wellness without adding to the paperwork burden.

Is this something your board would be interested in seeing?

All the best,

{sender_name}"""
    
    return subject, body

def send_email(to_email, subject, body):
    user = os.environ.get("GMAIL_USER")
    password = os.environ.get("GMAIL_APP_PASSWORD")
    
    if not user or not password:
        print("❌ Error: GMAIL_USER or GMAIL_APP_PASSWORD not found in environment.")
        return False

    msg = MIMEMultipart()
    msg["From"] = f"Emily Fehr <{user}>"
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain"))

    context = ssl.create_default_context()
    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=context) as server:
            server.login(user, password)
            server.sendmail(user, to_email, msg.as_string())
        return True
    except Exception as e:
        print(f"❌ Failed to send email to {to_email}: {e}")
        return False

# 3. EXECUTION LOGIC
def main():
    import argparse
    parser = argparse.ArgumentParser(description="Vantus Outreach Email Automator")
    parser.add_argument("--send", action="store_true", help="Actually send the emails (not a dry run)")
    parser.add_argument("--test-drive", nargs='?', const="8emilyfehr@gmail.com", help="Send one of each template version to your own email for testing")
    parser.add_argument("--investors-only", action="store_true", help="Send ONLY to Investor contacts")
    args = parser.parse_args()

    if args.test_drive:
        test_email = args.test_drive
        print(f"🚀 Running Test Drive! Sending samples to {test_email}...\n")
        
        # 1. Command Sample
        cmd_contact = contacts[0] # Art Stannard
        subject_cmd, body_cmd = generate_email(cmd_contact)
        print(f"  📤 Sending Command Version (Sample: {cmd_contact['org']})...")
        if send_email(test_email, f"[TEST COMMAND] {subject_cmd}", body_cmd):
            print("  ✅ Sent!")
        
        # 2. Union Sample
        union_contact = contacts[1] # Brian Sauve
        subject_union, body_union = generate_email(union_contact)
        print(f"  📤 Sending Union Version (Sample: {union_contact['org']})...")
        if send_email(test_email, f"[TEST UNION] {subject_union}", body_union):
            print("  ✅ Sent!")

        # 3. Investor Sample
        investor_contacts = [c for c in contacts if c['type'] == 'INVESTOR']
        if investor_contacts:
            inv_contact = investor_contacts[0] # Trae Stephens
            subject_inv, body_inv = generate_email(inv_contact)
            print(f"  📤 Sending Investor Version (Sample: {inv_contact['org']})...")
            if send_email(test_email, f"[TEST INVESTOR] {subject_inv}", body_inv):
                print("  ✅ Sent!")
            
        print("\n✅ Test Drive complete. Please check your inbox.")
        return

    # Filter for investors if requested
    contacts_to_process = contacts
    if args.investors_only:
        print("💰 FILTER ACTIVE: Processing INVESTOR contacts only.")
        contacts_to_process = [c for c in contacts if c['type'] == 'INVESTOR']
        if not contacts_to_process:
            print("❌ No investor contacts found.")
            return

    print(f"🚀 Starting Vantus Outreach to {len(contacts_to_process)} contacts...")
    if not args.send:
        print("ℹ️  DRY RUN MODE. Use --send to actually send emails.\n")

    history = load_sent_history()
    
    to_process = []
    for contact in contacts_to_process:
        if contact['email'] in history:
            print(f"⏭️  Already sent to: {contact['name']} ({contact['email']})")
        else:
            to_process.append(contact)

    if not to_process:
        print("\n✅ All contacts in the list have already been contacted. Nothing to do.")
        return

    print(f"\n🚀 Ready to contact {len(to_process)} new people.")
    
    if args.send:
        confirm = input(f"Are you sure you want to SEND {len(to_process)} emails now? (yes/no): ")
        if confirm.lower() != 'yes':
            print("Aborted.")
            return

    for contact in to_process:
        subject, body = generate_email(contact)
        print(f"\nProcessing: {contact['name']} <{contact['email']}>")
        
        if args.send:
            print(f"  📤 Sending email...")
            if send_email(contact['email'], subject, body):
                print(f"  ✅ Sent!")
                save_to_history(contact['email'])
            else:
                print(f"  ❌ Failed.")
        else:
            # Dry run display
            print(f"  Subject: {subject}")
            print(f"  Body Preview: {body[:100].replace('\n', ' ')}...")
            print(f"  [DRY RUN] Would send mailto: {contact['email']}?subject=Police%20Tech")

    if not args.send:
        print("\n💡 Run with --send to actually dispatch these emails.")
    else:
        print("\n✅ Done. History updated.")

if __name__ == "__main__":
    main()
