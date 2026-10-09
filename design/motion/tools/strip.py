import json,os,sys,glob
from PIL import Image,ImageDraw,ImageFont
# Usage: python3 strip.py   (needs: pip install pillow)
here=os.path.dirname(os.path.abspath(__file__))
src=os.path.join(here,'..','frames'); out=os.path.join(here,'..','filmstrips'); os.makedirs(out,exist_ok=True)

try: font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf',20)
except: font=ImageFont.load_default()
for d in sorted(os.listdir(src)):
    fr=sorted(glob.glob(f'{src}/{d}/t*.png')); t=json.load(open(f'{src}/{d}/times.json'))['planned']
    ims=[Image.open(f).convert('RGB') for f in fr]
    w,h=ims[0].size; s=0.5 if w<500 else 0.32
    tw,th=int(w*s),int(h*s); cols=min(len(ims),5 if w<500 else 3); rows=-(-len(ims)//cols)
    pad,lab=16,34
    sheet=Image.new('RGB',(cols*(tw+pad)+pad,rows*(th+lab+pad)+pad),'#E8E1D4'); dr=ImageDraw.Draw(sheet)
    for i,(im,ms) in enumerate(zip(ims,t)):
        x=pad+(i%cols)*(tw+pad); y=pad+(i//cols)*(th+lab+pad)
        dr.text((x,y+4),f'{i+1}  t={ms/1000:.2f}s',fill='#1C1A17',font=font)
        sheet.paste(im.resize((tw,th),Image.LANCZOS),(x,y+lab)); dr.rectangle([x-1,y+lab-1,x+tw,y+lab+th],outline='#C2B6A2')
    sheet.save(f'{out}/{d}.png',optimize=True); print(d,sheet.size)
