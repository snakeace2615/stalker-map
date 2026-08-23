const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const webpack = require('webpack');

function hashFile(filePath) {
  return crypto.createHash('sha1').update(fs.readFileSync(filePath)).digest('hex').slice(0, 10);
}

function hocDataVersion() {
  const hash = crypto.createHash('sha1');
  const hocDir = path.resolve(__dirname, 'src/assets/data/hoc');
  const hocConfig = path.resolve(__dirname, 'src/assets/data/hoc_config.json');

  const walk = (current) => {
    for (const name of fs.readdirSync(current).sort()) {
      const full = path.join(current, name);
      if (fs.statSync(full).isDirectory()) {
        walk(full);
      } else {
        hash.update(name);
        hash.update(fs.readFileSync(full));
      }
    }
  };

  walk(hocDir);
  if (fs.existsSync(hocConfig)) {
    hash.update('hoc_config.json');
    hash.update(fs.readFileSync(hocConfig));
  }

  return hash.digest('hex').slice(0, 10);
}

module.exports = (config) => {
  const dataVersion = hocDataVersion();
  const iconVersion = hashFile(
    path.resolve(__dirname, 'src/assets/images/items/hoc_icon_equipment.webp')
  );

  console.log(`[assets] hoc-data=${dataVersion} hoc-icon=${iconVersion}`);

  config.plugins.push(
    new webpack.DefinePlugin({
      __HOC_DATA_VERSION__: JSON.stringify(dataVersion),
      __HOC_ICON_VERSION__: JSON.stringify(iconVersion),
    })
  );

  return config;
};
