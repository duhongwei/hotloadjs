const Koa = require('koa');
const serve = require('koa-static');

function run({ webRoot }) {
  const staticServer = serve(webRoot);
  const app = new Koa();
  app.use(staticServer);
  app.listen(3000);
  console.log('web server run at http://localhost:3000');
}
module.exports = {
  run
};