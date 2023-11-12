import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import { useEffect, useState } from 'react';

const midnightChaser = [
  'bed.png',
  'cabinet.png',
  'chest.png',
  'clock.png',
  'couch.png',
  'mirror.png',
  'musicplayer.png',
  'piano.png',
  'statue.png',
];

function Hello() {
  const [midnightChaserData, setMidnightChaserData] = useState<any>({
    'bed.png': false,
    'cabinet.png': false,
    'chest.png': false,
    'clock.png': false,
    'couch.png': false,
    'mirror.png': false,
    'musicplayer.png': false,
    'piano.png': false,
    'statue.png': false,
  });
  const searchForImage = async (image: string) => {
    window.electron.ipcRenderer.sendMessage('takeScreenshot', { image });
    window.electron.ipcRenderer.on('takeScreenshot', (imageFound: any) => {
      if (imageFound) {
        const newData = midnightChaserData;
        newData[imageFound] = true;
        console.log(newData);
        setMidnightChaserData({ ...newData });
        console.log(`${imageFound} found!!`, midnightChaserData);
      } else {
        console.log(imageFound, 'not found!');
      }
    });
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
    <div>
      {midnightChaser.map((image) => {
        const imgsrc = require(`../../assets/images/${image}`);
        return (
          <div key={image} style={{ display: 'flex' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div>{image}</div>
              <img
                width="auto"
                height="50px"
                style={{ transform: 'scaleY(-1)' }}
                src={imgsrc}
              />
            </div>

            <h1 className={midnightChaserData[image] ? 'found' : 'notFound'}>
              {midnightChaserData[image] === true ? 'found' : 'not found'}
            </h1>
          </div>
        );
      })}
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
