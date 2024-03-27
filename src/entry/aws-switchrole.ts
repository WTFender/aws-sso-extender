import extension from '../extension';

/* submit iam switchrole form */

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

function switchRole(): Boolean {
  const form = (document.getElementsByTagName('form')[0] as HTMLFormElement);
  const account = (document.getElementById('accountId') as HTMLInputElement).value;
  const roleName = (document.getElementById('roleName') as HTMLInputElement).value;
  extension.log([form, account, roleName])
  // if form elements are present
  if (form && account && roleName) {
    setTimeout(() => {
      extension.log('switchRole:submit');
      // switch role
      form!.getElementsByTagName('button')[1].click();
    }, extension.config.delay);
    return true;
  }
  return false;
}

if (window.location.href.includes('signin.aws.amazon.com/switchrole')) {
  // parse query string
  const query = parseQuery(window.location.search);
  extension.log(query);
  // only switch role if it originated from this extension
  if (window.location.hash === `#${extension.config.name}`) {
    extension.log('switchrole');
    // switch role, try again with delay
    if (!switchRole()) {
      setTimeout(() => {
        switchRole();
      }, extension.config.delay);
    }
  }
}
