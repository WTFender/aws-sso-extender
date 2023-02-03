function buildAppProfileRows(data: ExtensionData) {
    // TODO clear rows
    const rows = [];
    data.apps.forEach((app) => {
    app.profiles.forEach((appProfile) => {
        rows.push(appProfile);
    });
  });
}

function showMenu(data: ExtensionData) {
  // eslint-disable-next-line no-console
  console.log(data);
  (document.getElementById('json') as HTMLInputElement).value = JSON.stringify(data, null, 4);
  document.getElementById('config').style.display = 'block';
  buildAppProfileRows(data);
}

const dataKey = 'aws-sso-qs';
chrome.storage.sync.get(dataKey, (data) => {
  const extData = JSON.parse(data[dataKey]) as ExtensionData;
  showMenu(extData);
});
