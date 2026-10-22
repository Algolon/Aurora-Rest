"""Environment fingerprint for reproducibility tier 2 (byte-identical regeneration in a declared environment)."""
import json,os,platform,subprocess,sys

def fingerprint():
 import numpy,scipy,shapely
 def run(*cmd):
  try:return subprocess.run(cmd,capture_output=True,text=True,timeout=20).stdout.strip()
  except Exception as e:return f'unavailable: {e}'
 cpu=''
 try:
  with open('/proc/cpuinfo') as f:cpu=next((l.split(':',1)[1].strip() for l in f if l.startswith('model name')),'')
 except OSError:cpu=run('sysctl','-n','machdep.cpu.brand_string')
 blas=numpy.show_config(mode='dicts').get('Build Dependencies',{}).get('blas',{}) if hasattr(numpy,'show_config') else {}
 return {'os':platform.platform(),'machine':platform.machine(),'cpu':cpu,'cpuCount':os.cpu_count(),'python':sys.version.split()[0],
  'numpy':numpy.__version__,'numpyBlas':{k:blas.get(k) for k in ('name','version')},'scipy':scipy.__version__,'shapely':shapely.__version__,
  'geos':shapely.geos_version_string,'node':run('node','--version'),
  'threadEnv':{k:os.environ.get(k) for k in ('OMP_NUM_THREADS','OPENBLAS_NUM_THREADS','MKL_NUM_THREADS')}}

if __name__=='__main__':print(json.dumps(fingerprint(),indent=1))
