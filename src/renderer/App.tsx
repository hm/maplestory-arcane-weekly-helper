import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import { useEffect, useState } from 'react';

const midnightChaser = [
  'bed',
  'cabinet',
  'chest',
  'clock',
  'couch',
  'mirror',
  'musicplayer',
  'piano',
  'statue',
];

function Hello() {
  const [boardPosition, setBoardPosition] = useState({ top: 0, left: 0 });
  const [midnightChaserData, setMidnightChaserData] = useState<any>({
    bed: false,
    cabinet: false,
    chest: false,
    clock: false,
    couch: false,
    mirror: false,
    musicplayer: false,
    piano: false,
    statue: false,
  });
  const searchForImage = async (image: string) => {
    window.electron.ipcRenderer.sendMessage('searchForImage', { image });
    window.electron.ipcRenderer.on(
      'searchForImage',
      ({ imageFound, boardLocation, playerLocation }: any) => {
        if (imageFound) {
          const newData = midnightChaserData;
          newData[imageFound] = true;
          setMidnightChaserData({ ...newData });
          setBoardPosition({
            top: boardLocation.top,
            left: boardLocation.left,
          });
          console.log(boardLocation);
          console.log(`${imageFound} found!!`, midnightChaserData);
        } else {
          console.log(imageFound, 'not found!');
        }
      },
    );
  };

  const findMidnightChaserImages = () => {
    midnightChaser.forEach((image) => {
      searchForImage(image);
    });
  };

  useEffect(() => {
    findMidnightChaserImages();
  }, []);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'row-reverse',
      }}
    >
      <div style={{ width: '145px', height: '180px', position: 'absolute' }} />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'rgba(255,255,255, 0.8)',
          gap: 2,
        }}
      >
        {midnightChaser.map((image) => {
          return (
            <div
              key={image}
              style={{
                display: 'flex',
                height: '20px',
                justifyContent: 'space-between',
              }}
            >
              <p>{image}</p>
              <p className={midnightChaserData[image] ? 'found' : 'notFound'}>
                {midnightChaserData[image] === true ? 'found' : 'not found'}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Hello />} />
      </Routes>
    </Router>
  );
}
