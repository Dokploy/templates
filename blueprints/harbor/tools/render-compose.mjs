import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const repository = fileURLToPath(new URL('../', import.meta.url));
const env = (name, fallback = '') => '$' + '{' + name + ':-' + fallback + '}';
const required = name => '$' + '{' + name + ':?Set ' + name + ' in Dokploy Environment}';
const mount = (source, target, subpath, readOnly = false) => ({
  type: 'volume', source, target, read_only: readOnly,
  volume: { nocopy: true, ...(subpath ? { subpath } : {}) },
});
const runtimeConfigs = {
  core: ['core', '/etc/core', 'harbor-core'],
  postgresql: ['db', '/run/harbor-config', 'harbor-db'],
  redis: ['redis', '/run/harbor-config', 'valkey-photon'],
  registry: ['registry', '/etc/registry', 'registry-photon'],
  registryctl: ['registryctl', '/etc/registryctl', 'harbor-registryctl'],
  jobservice: ['jobservice', '/etc/jobservice', 'harbor-jobservice'],
  portal: ['portal', '/run/harbor-config', 'harbor-portal'],
  proxy: ['nginx', '/etc/nginx', 'nginx-photon'],
  'trivy-adapter': ['trivy-adapter', '/run/harbor-config', 'trivy-adapter-photon'],
  exporter: ['exporter', '/run/harbor-config', 'harbor-exporter'],
};
const memory = {core:'1g', postgresql:'1536m',redis:'256m',registry:'768m',registryctl:'128m',jobservice:'512m',portal:'128m',proxy:'256m','trivy-adapter':'1536m',exporter:'128m'};
export function buildCompose(lock, buildSource) {
  const image = name => { const item = lock.images[name]; return item.repository + ':' + item.tag + '@' + item.digest; };
  const labels = role => ({ 'io.harbor-dokploy.instance': required('HARBOR_INSTANCE_ID'), 'io.harbor-dokploy.role': role, 'traefik.enable':'false' });
  const logging = { driver:'local', options:{'max-size':env('DOCKER_LOG_MAX_SIZE','20m'),'max-file':env('DOCKER_LOG_MAX_FILES','5')} };
  const settingsEnv = { HARBOR_INSTANCE_ID:required('HARBOR_INSTANCE_ID'), HARBOR_HOSTNAME:required('HARBOR_HOSTNAME') };
  const configDefaults = { DB_MAX_IDLE_CONNS:'10', DB_MAX_OPEN_CONNS:'100',POSTGRES_MAX_CONNECTIONS:'256',JOB_MAX_WORKERS:'5',HARBOR_LOG_LEVEL:'info',CACHE_ENABLED:'true',
    ALLOW_PRIVATE_NETWORK_ACCESS:'false',TRIVY_GITHUB_TOKEN:'',TRIVY_DB_REPOSITORY:'ghcr.io/aquasecurity/trivy-db',
    TRIVY_JAVA_DB_REPOSITORY:'ghcr.io/aquasecurity/trivy-java-db',HARBOR_HTTP_PROXY:'',HARBOR_HTTPS_PROXY:'',HARBOR_NO_PROXY:'',PROJECT_QUOTA_GIB:'20' };
  const configEnv = { HARBOR_ADMIN_PASSWORD:required('HARBOR_ADMIN_PASSWORD'),HARBOR_DB_PASSWORD:required('HARBOR_DB_PASSWORD'),
    ...Object.fromEntries(Object.entries(configDefaults).map(([k,v])=>[k,env(k,v)])) };
  const volumes = Object.fromEntries(['data','database','registry','redis','jobs','config','trivy-cache','trivy-reports','control'].map(name=>[name,{name:required('HARBOR_INSTANCE_ID')+'-'+name}]));
  const initMounts = [mount('config','/config'),mount('data','/data'),mount('database','/data/database'),mount('registry','/data/registry'),
    mount('redis','/data/redis'),mount('jobs','/data/job_logs'),mount('trivy-cache','/data/trivy-adapter/trivy'),
    mount('trivy-reports','/data/trivy-adapter/reports'),mount('control','/control')];
  const services = {
    'harbor-init': {
      build:{context:buildSource.repository+'#'+buildSource.revision+':blueprints/harbor',dockerfile:'Dockerfile',target:'runtime',args:{PREPARE_IMAGE:image('prepare')}},
      platform:lock.platform,restart:'no', labels:labels('init'),
      environment:{...settingsEnv,...configEnv},
      volumes:initMounts,
      cap_drop:['ALL'],cap_add:['CHOWN','DAC_OVERRIDE','FOWNER'],security_opt:['no-new-privileges:true'],
      mem_limit:env('INIT_MEMORY_LIMIT','768m'),logging,
    },
  };
  {
    for (const [name,[folder,target,imageName]] of Object.entries(runtimeConfigs)) {
      const variable = name.replaceAll('-','_').toUpperCase();
      services[name] = {
        image:image(imageName),platform:lock.platform,restart:'unless-stopped',labels:labels('workload'),
        entrypoint:['/bin/sh',target+'/launch.sh'],command:[],
        volumes:[mount('config',target,folder,true),mount('control','/run/harbor-control',undefined,true),
          mount('config','/harbor_cust_cert','shared/trust-certificates',true)],
        depends_on:{'harbor-init':{condition:'service_completed_successfully'}},
        cap_drop:['ALL'],cap_add:['CHOWN','SETGID','SETUID'],security_opt:['no-new-privileges:true'],
        mem_limit:env(variable+'_MEMORY_LIMIT',memory[name]),cpus:env(variable+'_CPU_LIMIT',name==='trivy-adapter'?'2.0':'1.0'),
        stop_grace_period:'120s',healthcheck:{interval:'15s',timeout:'10s',retries:10,start_period:name==='postgresql'?'120s':'60s'},logging,
      };
    }
    const add = (service, ...entries) => services[service].volumes.push(...entries);
    const depend = (service, names) => names.forEach(name=>services[service].depends_on[name]={condition:'service_healthy'});
    add('postgresql',mount('database','/var/lib/postgresql/data'));
    services.postgresql.cap_add.push('DAC_OVERRIDE');
    services.postgresql.shm_size='256m';
    services.postgresql.environment={POSTGRES_MAX_CONNECTIONS:env('POSTGRES_MAX_CONNECTIONS','256')};
    services.postgresql.healthcheck.test=['CMD','/bin/sh','/run/harbor-config/health.sh'];
    add('redis',mount('redis','/var/lib/redis'));
    add('registry',mount('registry','/storage'));
    depend('registry',['redis']);
    add('registryctl',mount('registry','/storage'),mount('config','/etc/registry','registry',true));
    depend('registryctl',['registry']);
    add('core',mount('data','/data'));
    depend('core',['postgresql','redis','registry']);
    add('jobservice',mount('jobs','/var/log/jobs'));
    depend('jobservice',['core','redis']);
    add('trivy-adapter',mount('trivy-cache','/home/scanner/.cache/trivy'),mount('trivy-reports','/home/scanner/.cache/reports'));
    depend('trivy-adapter',['redis']);
    depend('exporter',['core','postgresql','redis']);
    services.exporter.healthcheck.test=['CMD-SHELL','curl --fail -s http://localhost:8080/metrics >/dev/null'];
    services.proxy.expose=['8080'];
    services.proxy.labels['traefik.enable']='true';
    depend('proxy',['core','portal','registry','exporter']);
  }
  return {services,volumes};
}

export function yaml(value, indent=0) {
  const pad=' '.repeat(indent);
  if (Array.isArray(value)) return value.map(item => typeof item === 'object' && item !== null
    ? pad+'-\n'+yaml(item,indent+2) : pad+'- '+JSON.stringify(item)+'\n').join('');
  return Object.entries(value).map(([key,item])=> {
    if (item && typeof item==='object' && Object.keys(item).length) return pad+JSON.stringify(key)+':\n'+yaml(item,indent+2);
    return pad+JSON.stringify(key)+': '+JSON.stringify(item)+'\n';
  }).join('');
}
export async function render() {
  const lock=JSON.parse(await readFile(path.join(repository,'images.lock.json'),'utf8'));
  const buildSource=JSON.parse(await readFile(path.join(repository,'tools/build-source.json'),'utf8'));
  await writeFile(path.join(repository,'docker-compose.yml'),
    '# Generated by tools/render-compose.mjs from images.lock.json.\n'+yaml(buildCompose(lock,buildSource)));
}
if (typeof process !== 'undefined' && process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url) await render();
