import launcher from './launcher.cjs';
launcher.launch(process.argv.slice(2)).catch(error => {
  console.error('DevFlow: ' + error.message);
  process.exitCode = 1;
});
