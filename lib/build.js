const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const args = process.argv.slice(2);
const skipDocker = args.includes('--skip-docker');
const onlyFrontend = args.includes('--only-frontend');
const showHelp = args.includes('--help');
const showVersion = args.includes('--version');
const verbose = args.includes('--verbose');
const dryRun = args.includes('--dry-run');

const dockerComposePath = path.join(process.cwd(), 'docker', 'docker-compose.yml');
const version = '1.0.3';

if (showHelp) {
  console.log(`
${chalk.bold('🛠️ Gbit Build CLI - Ajuda')}

Uso:
  gbit-build [opções]

Opções disponíveis:
  --skip-docker      Ignora a etapa de build do Docker
  --only-frontend    Executa apenas o build do frontend
  --verbose          Exibe detalhes adicionais durante o processo
  --dry-run          Simula o processo sem executar comandos
  --version          Exibe a versão atual do CLI
  --help             Exibe esta mensagem de ajuda

Exemplos:
  gbit-build
  gbit-build --skip-docker
  gbit-build --only-frontend
  gbit-build --verbose
  gbit-build --dry-run
`);
  process.exit(0);
}

if (showVersion) {
  console.log(`\n🧩 Gbit Build CLI - versão ${version}`);
  process.exit(0);
}

console.log(chalk.cyan.bold('\n🚀 Iniciando build com Gbit Build...\n'));

function runCommand(command, label, cwd = process.cwd()) {
  if (dryRun) {
    console.log(chalk.gray(`[dry-run] ${label}: ${command}`));
    return;
  }
  if (verbose) console.log(chalk.blue(`→ Executando: ${command}`));
  execSync(command, { cwd, stdio: 'inherit' });
}

try {
  const frontendPath = path.join(process.cwd(), 'frontend');
  if (fs.existsSync(frontendPath)) {
    console.log(chalk.yellow('\n🛠️ Build do frontend...'));
    runCommand('npm install', 'Instalação frontend', frontendPath);
    runCommand('npm run build', 'Build frontend', frontendPath);
  } else {
    console.log(chalk.gray('\n⚠️ Pasta frontend não encontrada. Etapa ignorada.'));
  }

  if (!onlyFrontend) {
    const backendPath = path.join(process.cwd(), 'backend');
    if (fs.existsSync(backendPath)) {
      console.log(chalk.yellow('\n🛠️ Preparando backend...'));
      runCommand('npm install', 'Instalação backend', backendPath);
    } else {
      console.log(chalk.gray('\n⚠️ Pasta backend não encontrada. Etapa ignorada.'));
    }

    if (!skipDocker) {
      if (fs.existsSync(dockerComposePath)) {
        console.log(chalk.yellow('\n🐳 Gerando imagem Docker...'));
        try {
          runCommand(`docker-compose -f ${dockerComposePath} build`, 'Docker build');
          console.log(chalk.yellow('\n🔍 Verificando imagem Docker...'));
          runCommand('docker images | grep gbit', 'Verificação Docker');
          console.log(chalk.green('\n✅ Imagem Docker encontrada.'));
        } catch (dockerError) {
          console.log(chalk.red('\n⚠️ Docker falhou ou não está disponível. Etapa ignorada.'));
        }
      } else {
        console.log(chalk.gray('\n⚠️ Arquivo docker-compose.yml não encontrado. Etapa ignorada.'));
      }
    } else {
      console.log(chalk.gray('\n⏩ Etapa Docker ignorada por argumento --skip-docker.'));
    }
  } else {
    console.log(chalk.gray('\n⏩ Etapas de backend e Docker ignoradas por argumento --only-frontend.'));
  }

  console.log(chalk.green.bold('\n✅ Projeto empacotado com sucesso!\n'));
} catch (error) {
  console.error(chalk.red('\n❌ Erro durante o build:'), error.message);
  process.exit(1);
}
