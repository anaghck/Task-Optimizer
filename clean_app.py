import re
import os

file_path = r'c:\Users\Y039\Documents\Antigravity\Visual\ai-task-optimizer\src\App.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Patterns to remove
patterns = [
    r'\s+const \[teamListOpen, setTeamListOpen\] = useState\(true\);',
    r'\s+// Terminology replacements',
    r'\s+const systemName = "AXON OPS";',
    r'\s+const efficiencyIndexLabel = "Efficiency Index";',
    r'\s+const intelligenceLabel = "System Intelligence";',
    r'\s+const DATA_PRIORITY = "Data-Optimized Priority";', # If repeated
    r'\s+const EFFICIENCY_INDEX = "Efficiency Index";',
    r'\s+const SYSTEM_INTELLIGENCE = "System Intelligence";',
    r'\s+const SYSTEM_NAME = "AXON OPS";',
    r',\s+const \[teamListOpen, setTeamListOpen\] = useState\(true\);',
    r';\s+const \[teamListOpen, setTeamListOpen\] = useState\(true\);',
]

cleaned = content
for p in patterns:
    cleaned = re.sub(p, '', cleaned)

# Also handle the inline ones like "alarmAudio.pause(); const [teamListOpen..."
cleaned = re.sub(r';\s*const \[teamListOpen, setTeamListOpen\] = useState\(true\);', ';', cleaned)
cleaned = re.sub(r',\s*const \[teamListOpen, setTeamListOpen\] = useState\(true\);', ',', cleaned)

# Final cleanup: The very top ones should stay but I'll add them back manually in a clean way
# For now, let's just write the cleaned version and then fix the top.

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(cleaned)

print("Cleaned file saved.")
