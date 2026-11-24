import openpyxl, json, sys
wb = openpyxl.load_workbook(sys.argv[1])
ws = wb['Assessment Checklist']; dd = wb['Dropdown Options']
opts = [r for r in dd.iter_rows(min_row=2, values_only=True)]
fields = []
for i, r in enumerate(ws.iter_rows(min_row=2, values_only=True)):
    fid, cat, aspect = r[0], r[1], r[2]
    key, vals = opts[i]
    assert key == f'{cat} | {aspect}', (key, cat, aspect)
    fields.append({'id': fid, 'category': cat, 'aspect': aspect, 'options': [v.strip() for v in vals.split('|')]})
ins = [[r[0], r[1]] for r in wb['Instructions'].iter_rows(min_row=3, values_only=True) if r[0]]
det = [r[0] for r in wb['Seeker Details'].iter_rows(min_row=3, values_only=True) if r[0]]
data = {'title': 'Guruji Palmistry | Selectable Practitioner Assessment Checklist',
        'hands': ['Left', 'Right', 'Both', 'Not applicable'],
        'statuses': ['Observed', 'Not visible', 'Not assessed', 'Unclear'],
        'confidence': ['High', 'Medium', 'Low'],
        'defaultStatus': 'Not assessed', 'hint': 'Select the closest visible characteristic.',
        'instructions': ins, 'details': det, 'fields': fields}
out = ('// Guruji Palmistry practitioner assessment checklist.\n'
       '// Generated from Guruji_Palmistry_Selectable_Assessment_Checklist.xlsx by\n'
       '// scripts/build-assessment-data.py — edit the workbook and re-run, not this file.\n'
       'window.PALM_ASSESSMENT = ' + json.dumps(data, ensure_ascii=False, indent=1) + ';\n')
open(sys.argv[2], 'w').write(out)
print(len(fields), 'fields;', len(det), 'details')
