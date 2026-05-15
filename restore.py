import re

with open('old_galerij.html', 'r', encoding='utf-8') as f:
    old_content = f.read()

nav_match = re.search(r'(<div class=\"gallery-nav\">.*?</div>)', old_content, re.DOTALL)
nav_html = nav_match.group(1) if nav_match else ''

leden_match = re.search(r'(<!-- Bomen van de Leden -->.*?</section>)', old_content, re.DOTALL)
leden_html = leden_match.group(1) if leden_match else ''

with open('galerij.html', 'r', encoding='utf-8') as f:
    current_content = f.read()

current_content = current_content.replace('<!-- Clubavonden -->', nav_html + '\n\n            <!-- Clubavonden -->')
current_content = current_content.replace('</section>\n\n\n\n        </div>\n    </main>', '</section>\n\n' + leden_html + '\n\n        </div>\n    </main>')

with open('galerij.html', 'w', encoding='utf-8') as f:
    f.write(current_content)
