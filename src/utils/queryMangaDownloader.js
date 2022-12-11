import { exec, spawn } from 'child_process';
export async function mangaSearch(searchTerm) {
  return new Promise((res, rej) => {
    exec(`java -jar MangaDownloaderAPI/manga-downloader-0.1.0.jar -s "${searchTerm}"`, (err, stdout, stderr) => {
      if (err) {
        rej(err);
      } else {
        const results = stdout.split('\n')
          .filter(entry => {
            return entry.includes(';')
          })
          .map(entry => {
          const manga = entry.split(';');
          return {
            title: manga[0],
            url: manga[1]
          }
        });
        res(results);
      }
    });
  });
}

export async function downloadManga(url, startChapter, endChapter, outputPath, onStdOut, doneCallback) {
  const command = exec(`java -jar MangaDownloaderAPI/manga-downloader-0.1.0.jar -x ${url} ${startChapter},${endChapter} ${outputPath}`);
  const commandFailurePromise = new Promise((res, rej) => {
    command.stdout.on('data', onStdOut);
    // command.stderr.on('data', console.error);
    command.on('exit', (exitCode) => {
      if (exitCode === 0) {
        doneCallback(exitCode);
        res();
      } else {
        doneCallback(exitCode);
        rej();
      }
    });
  });
  const timeoutPromise = new Promise((res, rej) => setTimeout(() => {
    if (command.exitCode === 1) {
      doneCallback();
      rej();
    } else if (command.exitCode === 0) {
      doneCallback();
      res();
    } else {
      res();
    }
  }, 500));

  return Promise.race([commandFailurePromise, timeoutPromise])
}