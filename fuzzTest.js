import axios from 'axios';

const baseURL = '';

const testCases = [
  { path: (id) => `/${id}/details`, description: 'photoDetails' },
  { path: (id) => `/user/${id}`, description: 'photosByUser' },
  { path: (id) => `/${id}/comments`, description: 'commentsByPhoto' }
];

const fuzzValues = [
  '', '123abc', 'DROP TABLE photos;', '!@#$%^&*()', '-1',
  'null', 'undefined', '9999999999999999', 
  Math.random().toString(36).substring(2),
  Math.random().toString(36).substring(2, 10),
];


async function fuzzTest() {
  for (const { path, description } of testCases) {
    console.log(`\n--- Fuzzing endpoint: ${description} ---`);

    for (const value of fuzzValues) {
      const url = `${baseURL}${path(value)}`;
      try {
        const res = await axios.get(url);
        console.log(`[${res.status}] ${url}`);
      } catch (err) {
        const status = err.response?.status || 'NO RESPONSE';
        console.log(`[ERROR ${status}] ${url}`);
      }
    }
  }
}

fuzzTest();
