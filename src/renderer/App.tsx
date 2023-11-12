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
]

const initialState: any = {};
for (const imageKey in midnightChaser) {
  initialState[midnightChaser[imageKey]] = false;
}

function Hello() {
  const [midnightChaserData, setMidnightChaserData] = useState<any>(initialState);
  const searchForImage = async (image: string) => {
    window.electron.ipcRenderer.sendMessage('takeScreenshot', { imageToFind: `./assets/images/${image}`});
    window.electron.ipcRenderer.on('takeScreenshot', (imageFound) => {
      if (imageFound) {
        console.log({...midnightChaserData, [image]: true});
        setMidnightChaserData({...midnightChaserData, [image]: true});
        console.log(`${image} found!!`, midnightChaserData);
      } else {
        console.log(image, 'not found!')
      }
    });
  }

  const findMidnightChaserImages = () => {
    midnightChaser.forEach(image => {
      searchForImage(image);
    })
  }

  useEffect(() => {
    findMidnightChaserImages();
  }, []);

  return (
    <div>
      {
        midnightChaser.map((image) => {
          const imgsrc = require(`../../assets/images/${image}`)
          return (
            <div key={image} style={{display:'flex'}}>
              <img width="auto" height="auto" src={imgsrc} />
              <h1>{midnightChaserData[image] ? 'found' : 'not found'}</h1>
            </div>
          )
        })
      }
      
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
