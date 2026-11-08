import { restoreFetch } from './fetch.js';
import { reinstall } from './http.js';

beforeEach(reinstall);

afterEach(() => {
  localStorage.clear();
  restoreFetch();
});
