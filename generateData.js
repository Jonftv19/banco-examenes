const fs = require('fs');
const path = require('path');

const BASE_DIR = path.join(__dirname, 'public');

const cursos = fs.readdirSync(BASE_DIR).filter(file =>
  fs.statSync(path.join(BASE_DIR, file)).isDirectory()
);

const data = {};

for (const curso of cursos) {
  const cursoPath = path.join(BASE_DIR, curso);
  data[curso] = {};

  const tipos = fs.readdirSync(cursoPath).filter(file =>
    fs.statSync(path.join(cursoPath, file)).isDirectory()
  );

  for (const tipo of tipos) {
    const tipoPath = path.join(cursoPath, tipo);

    if (tipo === 'pd') {
      // PDs organizadas por ciclo (ej: 2024.2, 2023.1, etc.)
      const ciclos = fs.readdirSync(tipoPath).filter(file =>
        fs.statSync(path.join(tipoPath, file)).isDirectory()
      );

      data[curso][tipo] = {};

      for (const ciclo of ciclos) {
        const cicloPath = path.join(tipoPath, ciclo);
        const archivos = fs.readdirSync(cicloPath).filter(f => f.endsWith('.pdf'));
        data[curso][tipo][ciclo] = archivos.map(
          a => `public/${curso}/${tipo}/${ciclo}/${a}`
        );
      }

    } else {
      // PC y EX, organizadas por PC1, PC2, EX1, etc.
      const subtipos = fs.readdirSync(tipoPath).filter(file =>
        fs.statSync(path.join(tipoPath, file)).isDirectory()
      );

      data[curso][tipo] = {};

      for (const sub of subtipos) {
        const subPath = path.join(tipoPath, sub);
        const archivos = fs.readdirSync(subPath).filter(f => f.endsWith('.pdf'));
        data[curso][tipo][sub.toUpperCase()] = archivos.map(
          a => `public/${curso}/${tipo}/${sub}/${a}`
        );
      }
    }
  }
}

const output = `const examenes = ${JSON.stringify(data, null, 2)};`;

fs.writeFileSync('js/data.js', output);
console.log('✅ Archivo js/data.js generado con carpetas de PD por ciclo');
