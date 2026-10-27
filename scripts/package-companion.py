from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED, ZipInfo
root=Path(__file__).resolve().parent.parent
out=root/'public/downloads/easy-wedding-companion.zip'
out.parent.mkdir(parents=True,exist_ok=True)
with ZipFile(out,'w',ZIP_DEFLATED) as z:
 for p in sorted((root/'extension').iterdir()):
  if p.is_file():
   i=ZipInfo('easy-wedding-companion/'+p.name,date_time=(2026,9,23,0,0,0));i.compress_type=ZIP_DEFLATED;z.writestr(i,p.read_bytes())
print('Companion ZIP packaged from checked-in source.')
