// Vercel serverless entry point for every /api/* request (see vercel.json).
// The website itself (index.html, app.js, assets…) is served as static files by Vercel's CDN.
'use strict';

const { createHandler, getSharedStore } = require('../server');

let handlerPromise = null;

module.exports = async (req, res) => {
  if (!handlerPromise) {
    handlerPromise = getSharedStore()
      .then(store => createHandler(store, { serveFiles: false }))
      .catch(err => { handlerPromise = null; throw err; });
  }
  try {
    const handler = await handlerPromise;
    return handler(req, res);
  } catch (err) {
    console.error('[api] Could not start:', err);
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'Service is starting up — please try again in a moment.' }));
  }
};
