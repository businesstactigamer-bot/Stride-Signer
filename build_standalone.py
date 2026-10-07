import os
import base64

def build_all():
    # Read base template from index_modular.html
    with open('index_modular.html', 'r', encoding='utf-8') as f:
        html = f.read()

    # Read CSS
    with open('css/app.css', 'r', encoding='utf-8') as f:
        app_css = f.read()
    with open('css/signature.css', 'r', encoding='utf-8') as f:
        sig_css = f.read()

    # Read Logo
    with open('assets/logo.png', 'rb') as f:
        logo_b64 = base64.b64encode(f.read()).decode('ascii')
    logo_data_uri = f'data:image/png;base64,{logo_b64}'

    # Replace stylesheets with inline <style>
    html = html.replace('<link rel="stylesheet" href="css/app.css">', '')
    html = html.replace('<link rel="stylesheet" href="css/signature.css">', f'<style>\n{app_css}\n{sig_css}\n</style>')

    # Replace logo src
    html = html.replace('src="assets/logo.png"', f'src="{logo_data_uri}"')
    html = html.replace('href="assets/logo.png"', f'href="{logo_data_uri}"')

    # Read JS files in order
    js_files = [
        'js/previews-data.js',
        'js/embedded-templates.js',
        'js/vendor/pdf-lib.min.js',
        'js/templates.js',
        'js/signature.js',
        'js/pdf-generator.js',
        'js/share-email.js',
        'js/app.js'
    ]

    combined_js = []
    for js_path in js_files:
        with open(js_path, 'r', encoding='utf-8') as f:
            combined_js.append(f'/* --- {js_path} --- */\n' + f.read())

    all_js_content = '\n\n'.join(combined_js)

    # Replace script tags with single inline <script>
    script_tags_to_remove = [
        '<script src="js/previews-data.js"></script>',
        '<script src="js/embedded-templates.js"></script>',
        '<script src="js/vendor/pdf-lib.min.js"></script>',
        '<script src="js/templates.js"></script>',
        '<script src="js/signature.js"></script>',
        '<script src="js/pdf-generator.js"></script>',
        '<script src="js/share-email.js"></script>',
        '<script src="js/app.js"></script>'
    ]

    for tag in script_tags_to_remove:
        html = html.replace(tag, '')

    html = html.replace('</body>', f'<script>\n{all_js_content}\n</script>\n</body>')

    # Save to index.html (the primary bundle)
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)

    # Also save as stride-sign-standalone.html
    with open('stride-sign-standalone.html', 'w', encoding='utf-8') as f:
        f.write(html)

    size_mb = os.path.getsize('index.html') / (1024 * 1024)
    print(f'Successfully built self-contained index.html: {size_mb:.2f} MB')

if __name__ == '__main__':
    build_all()
