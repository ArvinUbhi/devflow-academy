"""Package the runtime-only download. Python is used by maintainers/CI, not users."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import json
root = Path(__file__).resolve().parent.parent
version = json.loads((root / 'package.json').read_text())['version']
output = root / 'downloads' / ('devflow-work-' + version + '.zip')
output.parent.mkdir(exist_ok=True)
with ZipFile(output, 'w', ZIP_DEFLATED) as archive:
    for name in ['devflow.jar', 'start.cjs', 'run.bat', 'run.sh', 'scripts/launcher.cjs', 'package.json', 'LICENSE']:
        archive.write(root / name, 'devflow/' + name)
    archive.writestr('devflow/START-HERE.txt', '''DevFlow - Java and typing practice

1. Extract this entire ZIP.
2. Open a terminal in the extracted devflow folder.
3. Run this one command:

   node start.cjs

DevFlow opens your default browser when the app is ready.
Java 8+ and Node 22+ must already be on PATH.
No npm install, Git, build tools, administrator access or internet required.
Keep the terminal open. Ctrl+C stops the app.
You can also double-click run.bat on Windows.

Your progress is saved in your user home folder under .devflow.
You can replace this downloaded folder for an update without losing progress.
If an older DevFlow is already running, close it before starting the update.
Export progress from Settings to move it between computers.

Optional: node start.cjs --port=8877
If your system cannot open a browser, use the local URL printed in the terminal.
''')
print(output)
