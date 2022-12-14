import {useEffect, useState} from "react";
import axios from "axios";
import {getAuthCookie} from "../utils/cookieHelper.js";

export default function useMangaList() {
  const [mangaList, setMangaList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [jobProgress, setJobProgress] = useState();
  const [jobId, setJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState();

  useEffect(() => {
    if (jobId !== null) {
      mangaProgress(0);
    }
  }, [jobId]);

  const mangaSearch = (searchTerm, onResults) => {
    axios.get(`/manga-search?searchTerm=${encodeURI(searchTerm)}`, {headers: {auth: getAuthCookie()}})
      .then(res => {
        if (res.data.length === 0) {
          alert('No results!');
        }
        setMangaList(res.data);
        onResults();
      })
      .catch(e => {
        console.error(e);
        onResults();
      });
  }

  const mangaStart = (url, startChapter, endChapter) => {
    setLoading(true);
    axios.get(`/download-manga?mangaUrl=${url}&startChapter=${startChapter}&endChapter=${endChapter}`, {headers: {auth: getAuthCookie()}})
      .then(res => {
        if (res.data.jobId) {
          setJobId(res.data.jobId);
          setJobProgress(0);
          setJobStatus('server_downloading');
        }
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }

  const mangaProgress = (retries) => {
    axios.get(`/download-progress?jobId=${jobId}`, {headers: {auth: getAuthCookie()}})
      .then(res => {
        setJobStatus(res.data.status);
        if (res.data.progress) {
          setJobProgress(res.data.progress);
        }
        if (res.data.status !== 'done') {
          setTimeout(() => mangaProgress(retries), 100);
        }
      })
      .catch(e => {
        console.error(e);
        if (retries > 10) {
          console.error("Too many retries, failed");
        } else {
          setTimeout(() => mangaProgress(retries + 1), 100);
        }
      })
  }

  const downloadFile = (filename) => {
    const file = `${filename}.pdf`;
    if (!jobId) {
      console.error("no job id");
      return;
    }
    setJobStatus('client_downloading')
    axios.get(`/download-file?jobId=${jobId}`,
      {
        responseType: 'blob',
        headers: {auth: getAuthCookie()},
        onDownloadProgress: (progressEvent => {
          const downloadPercent = Math.round(100 * progressEvent.loaded / progressEvent.total);
          setJobProgress(downloadPercent);
        })
      })
      .then(res => {
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${file}`);
        document.body.appendChild(link);
        link.click();
        setJobId(null);
        setJobStatus(null);
        setJobProgress(null);
      })
      .catch(e => console.error(e));
  }

  return [
    { mangaList, loading, jobStatus, jobProgress },
    { mangaSearch, mangaStart, downloadFile }
  ];
}