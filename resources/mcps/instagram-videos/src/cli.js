import { collectVideos } from './collect.js';

const [conta, limit, ...extra] = process.argv.slice(2);
if (!conta || extra.length || (limit !== undefined && !/^\d+$/.test(limit))) {
  console.error('Uso: node src/cli.js <conta> [maxPaginas=0]');
  process.exitCode = 1;
} else {
  try {
    console.log(JSON.stringify(await collectVideos({ conta, maxPaginas: Number(limit ?? 0) }), null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
