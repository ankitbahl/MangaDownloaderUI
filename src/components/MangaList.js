import useMangaList from "../hooks/useMangaList.js";
import { useState } from "react";
import styled from 'styled-components';
import {Navigate} from "react-router-dom";
const List = styled.div`
  &> div:first-child {
    font-weight: bold;
  }
  
  &> div:nth-child(even) {
    background: lightgray;
  }
  
  width: 70em;
  display: flex;
  flex-direction: column;
`;

const ListItem = styled.div`
  &> div:nth-child(1) {
    width: 24%;
  }
  &> div:nth-child(2) {
    width: 15%;
  }
  &> div:nth-child(3) {
    width: 15%;
  }
  &> div:nth-child(4) {
    width: 10%;
  }
  &> div:nth-child(5) {
    width: 12%;
    padding: 0 10px;
  }

  &> div:nth-child(6) {
    width: 12%;
    padding: 0 10px;
  }

  &> div:nth-child(7) {
    width: 12%;
    padding: 0 10px;
  }

  font-weight: normal;
  padding: 10px;
  justify-content: space-between;
  display: flex;
  flex-direction: row;
`;

const MangaList = () => {
  const [{ mangaList, loading, jobStatus, jobProgress },
         { mangaSearch, mangaStart, downloadFile }] = useMangaList();
  const [searchText, setSearchText] = useState('');
  const [startedJobIndex, setStartedJobIndex] = useState(-1);

  if (!localStorage.getItem('loginUser') || !localStorage.getItem('loginPass')) {
    return <Navigate to='/login-page' />;
  }

  const downloadColumn = (index, title, url) => {
    if (loading && startedJobIndex === index) {
      return <div>Loading</div>;
    } else if (jobStatus === 'downloading' && startedJobIndex === index) {
      return <div>{`${jobProgress}% Downloaded`}</div>;
    } else if (jobStatus === 'compiling' && startedJobIndex === index) {
      return <div>Compiling</div>;
    } else if (jobStatus === 'done' && startedJobIndex === index) {
      return <div><button onClick={() => downloadClick(index, title)}>Download File</button></div>
    } else {
      return (<div><button disabled={startedJobIndex !== -1} onClick={() => startDownloadClick(index, url)}>Start Download</button></div>);
    }
  }

  const startDownloadClick = (index, url) => {
    const startIndex = parseInt(document.getElementById(`startChapter-${index}`).value);
    const endIndex = parseInt(document.getElementById(`endChapter-${index}`).value);
    if (isNaN(startIndex) || isNaN(endIndex)) {
      alert("Enter a valid first and last chapter");
    }
    mangaStart(url, startIndex, endIndex);
    setStartedJobIndex(index);
  }

  const downloadClick = (index, title) => {
    setStartedJobIndex(-1);
    downloadFile(`${title}.pdf`);
  }

  return (<div>
    <input placeholder="Enter search term" onInput={e => setSearchText(e.target.value)}/>
    <button onClick={() => mangaSearch(searchText)}>Get Manga List</button>
      <List>
        <ListItem>
          <div>Title</div>
          <div>First Chapter</div>
          <div>Last Chapter</div>
          <div>Download</div>
        </ListItem>
        {mangaList.map(({title, url}, index) => {
          return (<ListItem key={title + ';' + url}>
            <div>{title}</div>
            <div><input id={`startChapter-${index}`}/></div>
            <div><input id={`endChapter-${index}`}/></div>
            {downloadColumn(index, title, url)}
          </ListItem>);
        })}
      </List>
    </div>);
}

export default MangaList;