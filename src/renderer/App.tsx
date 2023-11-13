import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import { useEffect, useMemo, useState } from 'react';

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
  const initialFoundState: any = {};
  const initialBoardPositionState: any = {};

  midnightChaser.forEach((furniture) => {
    initialFoundState[furniture] = false;
    initialBoardPositionState[furniture] = { top: -1, left: -1 };
  });

  const [boardPosition, setBoardPosition] = useState(initialBoardPositionState);
  const [midnightChaserData, setMidnightChaserData] =
    useState<any>(initialFoundState);

  const searchForImage = async (image: string) => {
    window.electron.ipcRenderer.sendMessage('searchForImage', { image });
    window.electron.ipcRenderer.on(
      'searchForImage',
      ({ imageFound, playerLocation }: any) => {
        if (imageFound) {
          const newData = midnightChaserData;
          newData[imageFound] = true;
          setMidnightChaserData({ ...newData });

          const newBoardPosition = boardPosition;
          newBoardPosition[imageFound] = playerLocation;
          setBoardPosition({ ...newBoardPosition });

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

  const renderBoardPositionsOnOverlay = useMemo(() => {
    return midnightChaser.map((image) => {
      const imgsrc = require(`../../assets/images/thumbnail/${image}.png`);
      return (
        <img
          key={image}
          style={{
            display: boardPosition[image].top === -1 ? 'none' : 'flex',
            position: 'absolute',
            width: '30px',
            height: '30px',
            top: `${boardPosition[image].top - 155}px`,
            left: `${boardPosition[image].left - 205}px`,
          }}
          alt=""
          src={imgsrc}
        />
      );
    });
  }, [boardPosition]);

  const renderRightSideOverlay = useMemo(() => {
    return midnightChaser.map((image) => {
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
    });
  }, [midnightChaserData]);

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
      {renderBoardPositionsOnOverlay}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'rgba(255,255,255, 0.8)',
          gap: 2,
        }}
      >
        {renderRightSideOverlay}
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
