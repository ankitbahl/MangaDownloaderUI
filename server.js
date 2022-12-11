import express from 'express';
import cors from 'cors';
import path from 'path';
import {fileURLToPath} from 'url';
import {mangaSearch, downloadManga} from "./src/utils/queryMangaDownloader.js";
import fs from "fs";
import { createClient } from 'redis';
import {authenticate, login} from "./src/utils/authHelper.js";
import {lookup} from "dns";

let options = {};

const jobStatus = {};

let isDocker = await new Promise(resolve =>
  lookup('host.docker.internal', (err, res) => {
    if (err) {
      resolve(false);
    } else if (res) {
      resolve(true);
    } else {
      resolve(false);
    }
  })
);

if (isDocker) {
  options = {socket: {host: 'host.docker.internal' }};
}
const redisClient = createClient(options);
redisClient.on('error', (err) => console.log('Redis Client Error', err));
await redisClient.connect();

const app = express();
const port = 5000;

app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  res.redirect('/login-page');
});

app.get('/manga-search', async (req, res) => {
  if (!await authenticate(req, res, redisClient)) {
    return;
  }
  const searchTerm = req.query.searchTerm;
  res.json(await mangaSearch(searchTerm));
});

app.get('/download-manga', async (req, res) => {
  if (!await authenticate(req, res, redisClient)) {
    return;
  }

  const mangaUrl = req.query.mangaUrl;
  const startChapter = req.query.startChapter;
  const endChapter = req.query.endChapter;
  const jobId = (Math.random() + 1).toString(36).substring(7);
  try {
    await downloadManga(mangaUrl, startChapter, endChapter, `./out/${jobId}.pdf`, (line) => {
      if (line.includes('Download progress:')) {
        jobStatus[jobId] = {status: 'downloading'}
      } else if (line.includes('Done downloading')) {
        jobStatus[jobId].status = 'compiling';
      } else if (line.includes('%')) {
        jobStatus[jobId].progress = parseInt(line.replace('%','').replaceAll('\b',''));
      }
    }, (code) => {
      if (code === 0) {
        jobStatus[jobId].status = 'done';
      } else {
        jobStatus[jobId] = {
          status: 'failed',
          errorCode: code
        };
      }
    });
    jobStatus[jobId] = {status: 'downloading'};
    res.json({ jobId });
  } catch (e) {
    console.error(e);
    res.statusMessage = e;
    res.sendStatus(400);
  }
});

app.get('/download-progress', async (req, res) => {
  if (!await authenticate(req, res, redisClient)) {
    return;
  }
  const jobId = req.query.jobId;
  if (jobStatus[jobId]) {
    res.json(jobStatus[jobId]);
  } else {
    res.sendStatus(404);
  }
});

app.get('/download-file', (req, res) => {
  const jobId = req.query.jobId;
  if (jobStatus[jobId]?.status === 'done') {
    res.download(`./out/${jobId}.pdf`, () => {
      fs.unlinkSync(`./out/${jobId}.pdf`);
    });
  } else {
    res.sendStatus(400);
  }
});

app.post('/login', async (req, res) => {
  const user = req.body.username;
  const pass = req.body.password;
  try {
    const {token, expiry} = await login(user, pass, redisClient);
    res.json({token, expiry});
  } catch (e) {
    console.error(e);
    res.sendStatus(403);
  }
});

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'build')
app.use(express.static(root));

app.use(express.static('temp'));

app.get('*', (req, res) => {
  res.sendFile('index.html', { root });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});
