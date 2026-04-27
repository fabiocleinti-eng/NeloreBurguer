const crypto = require('crypto');

const token = crypto.randomBytes(12).toString('hex');
console.log('\nCopie isto para o ficheiro .env na raiz do projeto:\n');
console.log(`VITE_PREVIEW_TOKEN=${token}`);
console.log('\nOpcional (horas de sessão no browser): VITE_PREVIEW_HOURS=8\n');
console.log(
  'Link para partilhar (troque o host pelo IP na rede, se for telemóvel):\n'
);
console.log(`http://localhost:5173/preview?t=${token}\n`);
