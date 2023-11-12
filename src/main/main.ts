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
import { screen, imageResource, Region } from '@nut-tree/nut-js';
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

const findImage = async ({ image, event }) => {
  const TIMEOUT = 1000 * 60 * 10;
  try {
    await screen.waitFor(
      imageResource(`./assets/images/${image}`),
      TIMEOUT,
      0,
      { confidence: 0.97 },
    );
    const boardLocation = await screen.find(
      imageResource(`./assets/images/board.png`),
      { confidence: 0.98 },
    );

    const playerLocation = await screen.find(
      imageResource(`./assets/images/dot.png`),
      { confidence: 0.98 },
    );

    console.log(boardLocation);
    console.log(playerLocation);

    const leftdX = playerLocation.left - boardLocation.left;
    const topdX = playerLocation.top - boardLocation.top;

    console.log(
      `diff: ${leftdX}, ${topdX}`,
    );

    console.log(`${image} found!`);
    event.reply('takeScreenshot', image);

    if (leftdX > 35 && topdX > 90) {
      console.log('bottom right');
    } else if (leftdX > 35 && topdX > 60) {
      console.log('middle right');
    } else if (leftdX > 35 && topdX > 30) {
      console.log('top right');
    } else if (leftdX > 0 && topdX > 90) {
      console.log('bottom middle');
    } else if (leftdX > 0 && topdX > 60) {
      console.log('middle middle');
    } else if (leftdX > 0 && topdX > 30) {
      console.log('top middle');
    } else if (leftdX > -30 && topdX > 90) {
      console.log('bottom left');
    } else if (leftdX > -30 && topdX > 60) {
      console.log('middle left');
    } else if (leftdX > -30 && topdX > 30) {
      console.log('top left');
    }
  } catch (err) {
    console.log(err);
  }
};

ipcMain.on('takeScreenshot', async (event, arg) => {
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
    width: 400,
    height: 800,
    // resizable: true,
    frame: false,
    // autoHideMenuBar: true,
    transparent: true,
    alwaysOnTop: true,
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
    mainWindow.webContents.openDevTools();

    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

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
