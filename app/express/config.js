import express from 'express';
import cors from 'cors';
import path from 'path';
import routerApi from './routes/api.js';

class AppExpress {
  constructor() {
    this.app = express();
    this.plugins();
    this.routes();
  }

  plugins() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(express.json());
    this.app.use('/cdn', express.static(path.join(__storagedir, 'public')));
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.set('Cache-Control', 'no-store');
      res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept'
      );
      res.header(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, DELETE, OPTIONS'
      );
      next();
    });
  }

  routes() {
    this.app.use('/api/v1', routerApi);
  }
}

export default AppExpress;
