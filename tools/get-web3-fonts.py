from pathlib import Path
import subprocess
root=Path(__file__).resolve().parents[1]
target=root/'assets/web3/fonts';target.mkdir(parents=True,exist_ok=True)
for name in ['fonts.css']+[f'{family}-{n}.woff2' for family in ['cormorant-garamond','manrope'] for n in [1,2,3]]:
    data=subprocess.check_output(['git','show',f'HEAD:assets/web2/fonts/{name}'],cwd=root)
    (target/name).write_bytes(data)
print('Retrieved seven versioned font assets.')
