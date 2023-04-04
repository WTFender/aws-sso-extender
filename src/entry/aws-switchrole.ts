import extension from '../extension';

/* submit switchrole form */

function parseQuery(queryString): object {
  const query = {};
  const pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i].split('=');
    query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
  }
  return query;
}

function switchRole(query): Boolean {
  const form = (document.getElementById('switchrole_form') as HTMLFormElement);
  const account = (document.getElementById('account') as HTMLInputElement).value;
  const roleName = (document.getElementById('roleName') as HTMLInputElement).value;
  const colorBox = (document.getElementById('color0') as HTMLInputElement);
  const noColorBox = (document.getElementById('none') as HTMLInputElement);
  // if form elements are present
  if (account && roleName && colorBox && noColorBox) {
    // select color
    if (!('color' in query)) { noColorBox.click(); } else {
      colorBox.value = query.color;
      colorBox.click();
    }
    // switch role
    form!.submit();
    return true;
  }
  return false;
}

if (window.location.href.includes('signin.aws.amazon.com/switchrole')) {
  // parse query string
  const query = parseQuery(window.location.search);
  extension.log(query);
  // only switch role if it originated from this extension
  if (query[`${extension.config.name}`] === 'true') {
    extension.log('switchrole');
    // switch role, try again with delay
    if (!switchRole(query)) {
      setTimeout(() => {
        switchRole(query);
      }, extension.config.delay);
    }
  }
}
