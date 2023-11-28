/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import {
  screen,
  imageResource,
  Region,
  getActiveWindow,
} from '@nut-tree/nut-js';
import { OverlayController } from 'electron-overlay-window';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';

require('@nut-tree/template-matcher');

if (
  process.platform === 'win32' &&
  !process.env.OPENCV4NODEJS_DISABLE_AUTOBUILD
) {
  process.env.path += `;${
    require('../../release/app/node_modules/opencv4nodejs-prebuilt')
      .opencvBinDir
  }`;
}

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

screen.config.highlightDurationMs = 500;
screen.config.autoHighlight = true;
screen.config.resourceDirectory = './assets/images/';

let cachedBoardLocation: Region;

const findImage = async ({ image, event }) => {
  const TIMEOUT = 1000 * 60 * 10;
  try {
    const windowRef = await getActiveWindow();
    const currentWindowRegion = await windowRef.region;

    const halfScreenHeight = currentWindowRegion.height / 2;
    currentWindowRegion.height = halfScreenHeight;
    currentWindowRegion.top += halfScreenHeight;

    await screen.waitFor(imageResource(`${image}.png`), TIMEOUT, 0, {
      confidence: 0.98,
      searchRegion: currentWindowRegion,
    });

    if (!cachedBoardLocation) {
      cachedBoardLocation = await screen.find(imageResource(`board.png`), {
        confidence: 0.965,
      });
    }

    const playerLocation: any = await screen.find(imageResource(`dot.png`), {
      confidence: 0.97,
    });

    const leftdX = playerLocation.left - cachedBoardLocation.left;
    const topdX = playerLocation.top - cachedBoardLocation.top;

    console.log(leftdX, topdX);

    let location;
    if (leftdX > 30 && topdX > 85) {
      location = 'BOTTOM_RIGHT';
    } else if (leftdX > 30 && topdX > 55) {
      location = 'MIDDLE_RIGHT';
    } else if (leftdX > 30 && topdX > 0) {
      location = 'TOP_RIGHT';
    } else if (leftdX > -5 && topdX > 85) {
      location = 'BOTTOM_MIDDLE';
    } else if (leftdX > -5 && topdX > 55) {
      location = 'CENTER';
    } else if (leftdX > -5 && topdX > 0) {
      location = 'TOP_MIDDLE';
    } else if (leftdX > -35 && topdX > 85) {
      location = 'BOTTOM_LEFT';
    } else if (leftdX > -35 && topdX > 55) {
      location = 'MIDDLE_LEFT';
    } else if (leftdX > -35 && topdX > 0) {
      location = 'TOP_LEFT';
    }

    // console.log(`diff: ${leftdX}, ${topdX}`);
    console.log('cachedBoardPosition', cachedBoardLocation);
    console.log(`${image} found!`, location);
    event.reply('searchForImage', {
      imageFound: image,
      location,
    });
  } catch (err) {
    console.log(err);
  }
};

ipcMain.on('searchForImage', async (event, arg) => {
  findImage({ ...arg, event });
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: true,
    frame: false,
    skipTaskbar: true,
    transparent: true,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      nodeIntegration: true,
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    OverlayController.focusTarget();
    OverlayController.activateOverlay();

    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  OverlayController.attachByTitle(mainWindow, 'MapleStory');

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
