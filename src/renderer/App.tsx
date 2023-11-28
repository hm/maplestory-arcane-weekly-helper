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

enum BOARD_POSITION {
  BOTTOM_LEFT = 'BOTTOM_LEFT',
  BOTTOM_MIDDLE = 'BOTTOM_MIDDLE',
  BOTTOM_RIGHT = 'BOTTOM_RIGHT',

  MIDDLE_LEFT = 'MIDDLE_LEFT',
  CENTER = 'CENTER',
  MIDDLE_RIGHT = 'MIDDLE_RIGHT',

  TOP_LEFT = 'TOP_LEFT',
  TOP_MIDDLE = 'TOP_MIDDLE',
  TOP_RIGHT = 'TOP_RIGHT',
}

function Hello() {
  const initialFoundState: any = {};
  const initialBoardPositionState: any = {};

  midnightChaser.forEach((furniture) => {
    initialFoundState[furniture] = false;
    initialBoardPositionState[furniture] = { top: -1, left: -1 };
  });

  const [midnightChaserData, setMidnightChaserData] =
    useState<any>(initialFoundState);

  const searchForImage = async (image: string) => {
    window.electron.ipcRenderer.sendMessage('searchForImage', { image });
    window.electron.ipcRenderer.on(
      'searchForImage',
      ({ imageFound, location }: any) => {
        if (imageFound) {
          const newData = midnightChaserData;
          newData[imageFound] = location;
          setMidnightChaserData({ ...newData });
          console.log(`${imageFound} found!!`, location);
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
            display: 'flex',
            visibility: midnightChaserData[image] ? 'visible' : 'hidden',
            gridArea: midnightChaserData[image],
          }}
          alt=""
          src={imgsrc}
        />
      );
    });
  }, [midnightChaserData]);

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
            {midnightChaserData[image] ? 'found' : 'not found'}
          </p>
        </div>
      );
    });
  }, [midnightChaserData]);

  useEffect(() => {
    findMidnightChaserImages();
  }, []);

  useEffect(() => {
    const missingData: string[] = [];
    const boardPositions: string[] = Object.keys(BOARD_POSITION);
    Object.keys(midnightChaserData).forEach((key: string, index: number) => {
      if (!midnightChaserData[key]) {
        missingData.push(key);
      } else {
        boardPositions.splice(index, 1);
      }
    });
    console.log(missingData, boardPositions);
    if (missingData.length === 1) {
      const missingItem = missingData[0];
      const newData = midnightChaserData;
      // eslint-disable-next-line prefer-destructuring
      newData[missingItem] = boardPositions[0];
      setMidnightChaserData({ ...newData });
    }
  }, [midnightChaserData]);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'row-reverse',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'rgba(255,255,255, 0.8)',
          gap: 2,
        }}
      >
        {renderRightSideOverlay}
        <div
          style={{
            display: 'grid',
            width: '100%',
            gridTemplateAreas: `"${BOARD_POSITION.TOP_LEFT} ${BOARD_POSITION.TOP_MIDDLE} ${BOARD_POSITION.TOP_RIGHT}" "${BOARD_POSITION.MIDDLE_LEFT} ${BOARD_POSITION.CENTER} ${BOARD_POSITION.MIDDLE_RIGHT}" "${BOARD_POSITION.BOTTOM_LEFT} ${BOARD_POSITION.BOTTOM_MIDDLE} ${BOARD_POSITION.BOTTOM_RIGHT}"`,
          }}
        >
          {renderBoardPositionsOnOverlay}
        </div>
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
