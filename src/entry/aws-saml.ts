import extension from '../extension';

// listen for IDP SAML assertion page, collect roles, save user

if (extension.samlUrlRegex.test(window.location.href)) {
  extension.log('aws-saml:run');
  const samlB64 = (document.getElementsByName('SAMLResponse')[0] as HTMLInputElement).value
  const samlXMl = atob(samlB64)
  /*
  <saml2:Attribute Name="https://aws.amazon.com/SAML/Attributes/Role">
  <saml2:AttributeValue xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:type="xsd:string">
    arn:aws:iam::391785637824:role/ReadOnly,arn:aws:iam::391785637824:saml-provider/jumpcloud</saml2:AttributeValue>
  <saml2:AttributeValue xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:type="xsd:string">
    arn:aws:iam::391785637824:role/Admin,arn:aws:iam::391785637824:saml-provider/jumpcloud</saml2:AttributeValue>
</saml2:Attribute>
*/
  const xmlDoc = new DOMParser().parseFromString(samlXMl, 'text/xml');
  const node = xmlDoc.querySelectorAll('[Name="https://aws.amazon.com/SAML/Attributes/Role"]')[0];
  extension.log(node);
  const roles = Array.from(node.childNodes).map((n) => { 
    return { 
      role: n.textContent?.split(',')[0],
      idp: n.textContent?.split(',')[1]
    };
  });
  extension.log(roles);
}
