const { execSync } = require('child_process');
const fs = require('fs');

const args = process.argv.slice(2);
const skipDocker = args.includes('--skip-docker');
const onlyFrontend = args.includes('--only-frontend');
const showHelp = args.includes('--help');
const showVersion = args.includes('--version');
const verbose = args.includes('--verbose');

const dockerComposePath = 'docker/docker-compose.yml';
const version = '1.0.3';

if (showHelp) {
  console.log(`
🛠️ Gbit Build CLI - Ajuda

Uso:
  gbit-build [opções]

Opções disponíveis:
  --skip-docker      Ignora a etapa de build do Docker
  --only-frontend    Executa apenas o build do frontend
  --verbose          Exibe detalhes adicionais durante o processo
  --version          Exibe a versão atual do CLI
  --help             Exibe esta mensagem de ajuda

Exemplos:
  gbit-build
  gbit-build --skip-docker
  gbit-build --only-frontend
  gbit-build --verbose
`);
  process.exit(0);
}

if (showVersion) {
  console.log(`\n🧩 Gbit Build CLI - versão ${version}`);
  process.exit(0);
}

console.log('🚀 Iniciando build com Gbit Build...');

try {
  console.log('\n📦 Instalando dependências...');
  if (verbose) console.log('→ Executando: npm install');
  execSync('npm install', { stdio: 'inherit' });

  console.log('\n🛠️ Build do frontend...');
  if (verbose) console.log('→ Executando: cd frontend && npm install && npm run build');
  execSync('cd frontend && npm install && npm run build', { stdio: 'inherit' });

  if (!onlyFrontend) {
    console.log('\n🛠️ Preparando backend...');
    if (verbose) console.log('→ Executando: cd backend && npm install');
    execSync('cd backend && npm install', { stdio: 'inherit' });

    if (!skipDocker) {
      console.log('\n🐳 Gerando imagem Docker...');
      if (verbose) console.log(`→ Executando: docker-compose -f ${dockerComposePath} build`);
      try {
        execSync(`docker-compose -f ${dockerComposePath} build`, { stdio: 'inherit' });

        console.log('\n🔍 Verificando imagem Docker...');
        if (verbose) console.log('→ Executando: docker images | grep gbit');
        execSync('docker images | grep gbit', { stdio: 'inherit' });
        console.log('\n✅ Imagem Docker encontrada.');
      } catch (dockerError) {
        console.log('\n⚠️ Docker não está disponível ou falhou. Etapa ignorada.');
      }
    } else {
      console.log('\n⏩ Etapa Docker ignorada por argumento --skip-docker.');
    }
  } else {
    console.log('\n⏩ Etapas de backend e Docker ignoradas por argumento --only-frontend.');
  }

  console.log('\n✅ Projeto empacotado com sucesso!');
} catch (error) {
  console.error('\n❌ Erro durante o build:', error.message);
  process.exit(1);
}