import os
import base64
import json

previews_dir = 'assets/previews'
templates_dir = 'assets/templates'

active_templates = [
    ('release_repairs', 'Release Form Repairs.pdf', ['release_repairs_page_1']),
    ('caresource_marketplace', 'Rep Form Caresource Marketplace.pdf', ['caresource_marketplace_page_1', 'caresource_marketplace_page_2']),
    ('caresource_medicaid', 'Rep Form Caresource Medicaid.pdf', ['caresource_medicaid_page_1', 'caresource_medicaid_page_2']),
    ('caresource_mycare', 'Rep Form Caresource MyCare.pdf', ['caresource_mycare_page_1', 'caresource_mycare_page_2']),
    ('rep_medicaid', 'Rep Form Medicaid.pdf', ['rep_medicaid_page_1', 'rep_medicaid_page_2', 'rep_medicaid_page_3']),
    ('medical_mutual', 'Rep Form Medical Mutual.pdf', ['medical_mutual_page_1', 'medical_mutual_page_2', 'medical_mutual_page_3']),
    ('abn_k0862', 'abn_k0862.pdf', ['abn_k0862_page_1']),
    ('abn_k0861', 'abn_k0861.pdf', ['abn_k0861_page_1']),
    ('abn_k0863', 'abn_k0863.pdf', ['abn_k0863_page_1']),
    ('abn_k0005', 'abn_k0005.pdf', ['abn_k0005_page_1']),
    ('abn_e1161', 'abn_e1161.pdf', ['abn_e1161_page_1'])
]

# 1. Generate previews-data.js
previews_data = {}
for key, tmpl_file, prev_list in active_templates:
    for prev_name in prev_list:
        webp_path = os.path.join(previews_dir, f'{prev_name}.webp')
        if not os.path.exists(webp_path):
            raise FileNotFoundError(f'Missing preview webp: {webp_path}')
        with open(webp_path, 'rb') as f:
            b64_img = base64.b64encode(f.read()).decode('ascii')
        previews_data[prev_name] = f'data:image/webp;base64,{b64_img}'

with open('js/previews-data.js', 'w', encoding='utf-8') as f:
    f.write('// Auto-generated high-res template preview images for 100% offline patient review\n')
    f.write('window.STRIDE_PREVIEWS_DATA = ' + json.dumps(previews_data) + ';\n')

prev_size = os.path.getsize('js/previews-data.js') / 1024
print(f'Wrote js/previews-data.js with {len(previews_data)} preview pages ({prev_size:.1f} KB)')

# 2. Generate embedded-templates.js
templates_data = {}
for key, tmpl_file, prev_list in active_templates:
    pdf_path = os.path.join(templates_dir, tmpl_file)
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f'Missing template PDF: {pdf_path}')
    with open(pdf_path, 'rb') as f:
        b64_pdf = base64.b64encode(f.read()).decode('ascii')
    templates_data[key] = b64_pdf

with open('js/embedded-templates.js', 'w', encoding='utf-8') as f:
    f.write('// Auto-generated embedded PDF templates for 100% offline & file:// support\n')
    f.write('window.STRIDE_TEMPLATES_DATA = ' + json.dumps(templates_data) + ';\n')

tmpl_size = os.path.getsize('js/embedded-templates.js') / 1024
print(f'Wrote js/embedded-templates.js with {len(templates_data)} templates ({tmpl_size:.1f} KB)')
